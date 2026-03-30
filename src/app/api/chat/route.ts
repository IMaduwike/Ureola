import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'openai/gpt-oss-120b'
const SUMMARY_THRESHOLD = 10
const RECENT_KEEP = 4

const SYSTEM_PROMPT = `You are Ureola, a calm and intelligent AI.

Your personality:
- Thoughtful. You consider before responding.
- Direct and honest. You don't pad answers with filler.
- Warm but not overly cheerful. No "Great question!" or "Certainly!".
- You admit when you don't know something.
- You're a thinking partner, not a people pleaser.
- Keep responses appropriately concise — detailed when needed, brief when not.`

const SUMMARY_PROMPT = `Summarize this conversation into concise bullet points.
Focus on: key topics discussed, decisions made, important context, user preferences shown.
Max 8 bullets. Start each with "•".
Return ONLY the bullet points, nothing else.`

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

// Extended Groq params not yet in their TypeScript types
interface GroqExtendedParams {
  model: string
  messages: ChatMessage[]
  temperature: number
  max_completion_tokens: number
  top_p?: number
  stream: boolean
  reasoning_effort?: string
  tools?: Array<{ type: string }>
}

async function groqStream(messages: ChatMessage[], systemPrompt: string) {
  const params: GroqExtendedParams = {
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.7,
    max_completion_tokens: 8192,
    top_p: 1,
    stream: true,
    reasoning_effort: 'medium',
    tools: [
      { type: 'browser_search' },
      { type: 'code_interpreter' },
    ],
  }
  // Cast needed because Groq SDK types don't expose extended params
  return (groq.chat.completions.create as (p: GroqExtendedParams) => Promise<AsyncIterable<{
    choices: Array<{ delta: Record<string, unknown> }>
  }>>)(params)
}

async function groqCallNonStream(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  // Non-streaming call for internal summarization — do NOT pass stream:true here
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages] as Parameters<typeof groq.chat.completions.create>[0]['messages'],
    temperature: 0.7,
    max_tokens: 2048,
    stream: false,
  })
  return res.choices[0].message.content ?? ''
}

async function summarize(messages: ChatMessage[], existingSummary: string | null): Promise<string> {
  const formatted = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Ureola'}: ${m.content}`)
    .join('\n\n')

  const input = existingSummary
    ? `Previous summary:\n${existingSummary}\n\nNew messages to merge:\n${formatted}`
    : formatted

  return groqCallNonStream([{ role: 'user', content: input }], SUMMARY_PROMPT)
}

export async function POST(req: NextRequest) {
  try {
    const { messages, summary } = await req.json()

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    let contextMessages: ChatMessage[] = messages
    let newSummary: string | null = summary || null
    let didSummarize = false

    // Memory compression
    if (messages.length >= SUMMARY_THRESHOLD) {
      const toSummarize = messages.slice(0, messages.length - RECENT_KEEP)
      const recent = messages.slice(messages.length - RECENT_KEEP)
      newSummary = await summarize(toSummarize, summary)
      didSummarize = true
      contextMessages = [
        { role: 'user', content: `[Conversation context]\n${newSummary}\n[End of context]` },
        { role: 'assistant', content: 'Understood, I have context from our conversation.' },
        ...recent,
      ]
    } else if (summary) {
      contextMessages = [
        { role: 'user', content: `[Conversation context]\n${summary}\n[End of context]` },
        { role: 'assistant', content: 'Understood, I have context from our conversation.' },
        ...messages,
      ]
    }

    // Stream — collect reasoning + content separately
    const stream = await groqStream(contextMessages, SYSTEM_PROMPT)

    let thinking = ''
    let reply = ''

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (typeof delta?.reasoning === 'string') thinking += delta.reasoning
      if (typeof delta?.content === 'string') reply += delta.content
    }

    return NextResponse.json({
      reply,
      thinking: thinking.trim() || null,
      summary: newSummary,
      didSummarize,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
