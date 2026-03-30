'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import MessageBubble from '@/components/MessageBubble'
import InputArea from '@/components/InputArea'
import ThinkingDots from '@/components/ThinkingDots'
import { Message, Conversation } from '@/lib/types'
import { generateId, getTitleFromMessages } from '@/lib/utils'

const MOCK_LOGGED_IN = false

export default function Home() {
  const [messages, setMessages]                   = useState<Message[]>([])
  const [input, setInput]                         = useState('')
  const [isThinking, setIsThinking]               = useState(false)
  const [streamingContent, setStreamingContent]   = useState<string>('')
  const [streamingThinking, setStreamingThinking] = useState<string>('')
  const [summary, setSummary]                     = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen]             = useState(false)
  const [conversations, setConversations]         = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId]           = useState<string | null>(null)
  const isLoggedIn = MOCK_LOGGED_IN

  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking, streamingContent])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setSummary(null)
    setActiveConvId(null)
    setInput('')
    setSidebarOpen(false)
  }, [])

  const handleSelectChat = useCallback((id: string) => {
    const conv = conversations.find(c => c.id === id)
    if (!conv) return
    setMessages(conv.messages)
    setSummary(conv.summary)
    setActiveConvId(id)
    setSidebarOpen(false)
  }, [conversations])

  const saveConversation = useCallback((msgs: Message[], sum: string | null) => {
    if (!isLoggedIn || msgs.length === 0) return
    const id = activeConvId || generateId()
    if (!activeConvId) setActiveConvId(id)
    setConversations(prev => {
      const existing = prev.findIndex(c => c.id === id)
      const conv: Conversation = {
        id, title: getTitleFromMessages(msgs),
        messages: msgs, summary: sum,
        createdAt: existing >= 0 ? prev[existing].createdAt : Date.now(),
      }
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = conv
        return updated
      }
      return [conv, ...prev]
    })
  }, [isLoggedIn, activeConvId])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isThinking || streamingContent) return

    const userMsg: Message = {
      id: generateId(), role: 'user',
      content: text, timestamp: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsThinking(true)
    setStreamingContent('')
    setStreamingThinking('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          summary,
        }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json()
        throw new Error(err.error || 'Request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accContent = ''
      let accThinking = ''
      let firstContent = true

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let parsed: Record<string, unknown>
          try { parsed = JSON.parse(raw) } catch { continue }

          if (parsed.type === 'thinking' && typeof parsed.text === 'string') {
            accThinking += parsed.text
            setStreamingThinking(accThinking)
          }

          if (parsed.type === 'content' && typeof parsed.text === 'string') {
            if (firstContent) {
              setIsThinking(false)
              firstContent = false
            }
            accContent += parsed.text
            setStreamingContent(accContent)
          }

          if (parsed.type === 'done') {
            const assistantMsg: Message = {
              id: generateId(), role: 'assistant',
              content: accContent,
              thinking: accThinking.trim() || undefined,
              timestamp: Date.now(),
            }
            const finalMessages = [...newMessages, assistantMsg]
            setMessages(finalMessages)
            setStreamingContent('')
            setStreamingThinking('')

            const didSummarize = parsed.didSummarize as boolean
            const incomingSummary = parsed.summary as string | null
            if (didSummarize) {
              setSummary(incomingSummary)
              saveConversation(finalMessages.slice(-4), incomingSummary)
            } else {
              if (incomingSummary) setSummary(incomingSummary)
              saveConversation(finalMessages, incomingSummary || summary)
            }
          }

          if (parsed.type === 'error') {
            throw new Error(typeof parsed.message === 'string' ? parsed.message : 'Stream error')
          }
        }
      }

    } catch (err: unknown) {
      setMessages(prev => [...prev, {
        id: generateId(), role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong.',
        timestamp: Date.now(),
      }])
      setStreamingContent('')
      setStreamingThinking('')
    } finally {
      setIsThinking(false)
    }
  }

  const showWelcome = messages.length === 0 && !isThinking && !streamingContent

  const streamingMsg: Message | null = streamingContent
    ? {
        id: '__streaming__',
        role: 'assistant',
        content: streamingContent,
        thinking: streamingThinking || undefined,
        timestamp: Date.now(),
      }
    : null

  return (
    <div style={{ position: 'relative', zIndex: 1, height: '100vh', display: 'flex', overflow: 'hidden' }}>

      <Sidebar
        isOpen={sidebarOpen}
        isLoggedIn={isLoggedIn}
        conversations={conversations}
        activeId={activeConvId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onClose={() => setSidebarOpen(false)}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        <header style={{
          display: 'flex', alignItems: 'center',
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(8,8,16,0.7)',
          backdropFilter: 'blur(20px)',
          gap: 12, flexShrink: 0,
        }}>
          {isLoggedIn && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4, display: 'flex', borderRadius: 6,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            </button>
          )}
          <span style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px',
          }}>Ureola</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>
            gpt-oss-120b
          </span>
          {!isLoggedIn && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 8, padding: '6px 16px',
                color: 'var(--text-sub)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, cursor: 'pointer',
              }}>Log in</button>
              <button style={{
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                border: 'none', borderRadius: 8, padding: '6px 16px',
                color: '#fff',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}>Sign up</button>
            </div>
          )}
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>

          {showWelcome && (
            <div className="stagger" style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '70vh', textAlign: 'center', gap: 8,
            }}>
              <div className="anim-fade-up" style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: 'clamp(36px, 6vw, 58px)',
                fontWeight: 600, letterSpacing: '-2px',
                lineHeight: 1.05, color: 'var(--text)', marginBottom: 8,
              }}>Ureola</div>
              <div className="anim-fade-up" style={{
                fontSize: 18, color: 'var(--text-sub)',
                fontWeight: 300, letterSpacing: '-0.3px', marginBottom: 40,
              }}>
                What&apos;s on your mind?
              </div>
              <div className="anim-fade-up" style={{
                display: 'flex', flexWrap: 'wrap',
                gap: 8, justifyContent: 'center', maxWidth: 560,
              }}>
                {[
                  'Explain something complex simply',
                  'Help me think through a decision',
                  'Write something for me',
                  'What should I know about...',
                  'Give me your honest opinion',
                  'Help me solve a problem',
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="glass"
                    style={{
                      padding: '9px 16px', borderRadius: 20,
                      cursor: 'pointer', fontSize: 13,
                      color: 'var(--text-sub)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--text)'
                      e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--text-sub)'
                      e.currentTarget.style.borderColor = 'var(--glass-border)'
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onCopy={text => navigator.clipboard.writeText(text).catch(() => {})}
              isLast={i === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}

          {streamingMsg && (
            <MessageBubble
              key="__streaming__"
              message={streamingMsg}
              onCopy={text => navigator.clipboard.writeText(text).catch(() => {})}
              isStreaming
            />
          )}

          {isThinking && !streamingContent && <ThinkingDots />}
          <div ref={messagesEndRef} style={{ height: 20 }} />
        </div>

        <InputArea
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          disabled={isThinking || !!streamingContent}
        />
      </main>
    </div>
  )
}
