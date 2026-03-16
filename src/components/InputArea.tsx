'use client'
import { useRef, useEffect } from 'react'

interface InputAreaProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
}

export default function InputArea({ value, onChange, onSend, disabled }: InputAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + 'px'
    }
  }, [value])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const canSend = !disabled && value.trim().length > 0

  return (
    <div style={{
      padding: '12px 24px 20px',
      borderTop: '1px solid var(--border)',
      background: 'rgba(8,8,16,0.8)',
      backdropFilter: 'blur(20px)',
      flexShrink: 0,
    }}>
      <div className="glass" style={{
        maxWidth: 760, margin: '0 auto',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Message Ureola..."
          rows={1}
          style={{
            width: '100%', background: 'none', border: 'none', outline: 'none',
            padding: '14px 16px 4px',
            color: 'var(--text)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 15, lineHeight: 1.65,
            resize: 'none', minHeight: 52, maxHeight: 200,
          }}
        />
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px 10px',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button title="Attach file (coming soon)" style={{
              background: 'none', border: 'none', cursor: 'not-allowed',
              padding: '6px 8px', borderRadius: 7,
              color: 'var(--text-muted)', display: 'flex', opacity: 0.4,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <button title="Voice input (coming soon)" style={{
              background: 'none', border: 'none', cursor: 'not-allowed',
              padding: '6px 8px', borderRadius: 7,
              color: 'var(--text-muted)', display: 'flex', opacity: 0.4,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              shift+enter · new line
            </span>
            <button
              onClick={onSend}
              disabled={!canSend}
              style={{
                background: canSend ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : 'rgba(167,139,250,0.1)',
                border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
                padding: '7px 18px', borderRadius: 8,
                color: canSend ? '#fff' : 'var(--text-muted)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
              Send
            </button>
          </div>
        </div>
      </div>
      <p style={{
        textAlign: 'center', fontSize: 11,
        color: 'var(--text-muted)', marginTop: 10,
        letterSpacing: '0.02em', opacity: 0.6,
      }}>
        Ureola can make mistakes. Verify important information.
      </p>
    </div>
  )
}
