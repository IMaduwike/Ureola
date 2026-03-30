'use client'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Message } from '@/lib/types'

interface Props {
  message: Message
  onCopy: (text: string) => void
  onRegenerate?: () => void
  isLast?: boolean
  isStreaming?: boolean
}

const REMARK_PLUGINS = [remarkGfm, remarkMath]
const REHYPE_PLUGINS = [rehypeKatex]

/**
 * Normalise math delimiters so remark-math can parse them.
 * remark-math only understands $...$ and $$...$$ natively.
 *
 * Converts:
 *   \[ ... \]  →  $$...$$  (display / block math)
 *   \( ... \)  →  $...$    (inline math)
 *   [ ... ]    →  $$...$$  ONLY when content looks like LaTeX
 */
function normaliseMath(text: string): string {
  // \[ ... \] → $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${inner}$$`)
  // \( ... \) → $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner}$`)
  // [ ... ] → $$ ... $$ only when content has LaTeX commands/symbols
  text = text.replace(/\[([^\]]{2,})\]/g, (_m, inner) => {
    const looksLikeMath = /[\\^_{}]|\\(?:frac|cdot|times|sqrt|sum|int|alpha|beta|gamma|theta|pi|sigma|infty|partial|nabla|forall|exists|in|notin|subset|cup|cap|mathbb|mathrm|text|left|right|binom|pm|mp|leq|geq|neq|approx|sim|equiv|to|rightarrow|leftarrow|ldots|cdots)/.test(inner)
    return looksLikeMath ? `$$${inner}$$` : _m
  })
  return text
}

export default function MessageBubble({ message, onCopy, onRegenerate, isLast, isStreaming }: Props) {
  const [thinkOpen, setThinkOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const isUser = message.role === 'user'

  function handleCopy() {
    onCopy(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="anim-fade-up" style={{
      padding: '20px 0',
      borderBottom: '1px solid var(--border)',
      display: 'grid',
      gridTemplateColumns: '36px 1fr',
      gap: '0 16px',
      maxWidth: 760,
      margin: '0 auto',
      width: '100%',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
        background: isUser ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
        border: isUser ? '1px solid var(--border)' : 'none',
        fontSize: 12, fontWeight: 700,
        color: isUser ? 'var(--text-muted)' : '#fff',
        fontFamily: "'Clash Display', sans-serif",
      }}>
        {isUser ? 'Y' : 'U'}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
          textTransform: 'uppercase', marginBottom: 8,
          color: isUser ? 'var(--text-muted)' : 'var(--accent)',
          opacity: isUser ? 1 : 0.8,
        }}>
          {isUser ? 'You' : 'Ureola'}
        </div>

        {!isUser && message.thinking && (
          <div className="think-block">
            <div
              className={`think-toggle ${thinkOpen ? 'open' : ''}`}
              onClick={() => setThinkOpen(!thinkOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
              Thinking process
            </div>
            <div className={`think-content ${thinkOpen ? 'visible' : ''}`}>
              {message.thinking}
            </div>
          </div>
        )}

        {isUser ? (
          <div style={{
            fontSize: 15, lineHeight: 1.75,
            color: 'var(--text-sub)', whiteSpace: 'pre-wrap',
          }}>
            {message.content}
          </div>
        ) : (
          <div className="markdown">
            <ReactMarkdown
              remarkPlugins={REMARK_PLUGINS}
              rehypePlugins={REHYPE_PLUGINS}
            >
              {normaliseMath(message.content)}
            </ReactMarkdown>
            {isStreaming && (
              <span style={{
                display: 'inline-block',
                width: 2, height: '1em',
                background: 'var(--accent)',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'cursorBlink 0.9s step-end infinite',
              }} />
            )}
          </div>
        )}

        {!isUser && !isStreaming && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              marginTop: 12, opacity: 0.4, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
          >
            <ActionBtn onClick={handleCopy} title="Copy">
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              )}
            </ActionBtn>

            {isLast && onRegenerate && (
              <ActionBtn onClick={onRegenerate} title="Regenerate">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
                </svg>
              </ActionBtn>
            )}

            <ActionBtn onClick={() => setFeedback(feedback === 'up' ? null : 'up')} title="Good response" active={feedback === 'up'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
              </svg>
            </ActionBtn>

            <ActionBtn onClick={() => setFeedback(feedback === 'down' ? null : 'down')} title="Poor response" active={feedback === 'down'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
              </svg>
            </ActionBtn>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ children, onClick, title, active }: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '5px 7px', borderRadius: 6,
        color: active ? 'var(--accent)' : 'var(--text-sub)',
        display: 'flex', alignItems: 'center',
        transition: 'background 0.1s, color 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      {children}
    </button>
  )
}
