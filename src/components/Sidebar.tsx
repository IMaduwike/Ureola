'use client'
import { Conversation } from '@/lib/types'
import { formatTime } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  isLoggedIn: boolean
  conversations: Conversation[]
  activeId: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onClose: () => void
}

export default function Sidebar({
  isOpen, isLoggedIn, conversations, activeId,
  onNewChat, onSelectChat, onClose,
}: SidebarProps) {
  if (!isLoggedIn) return null

  return (
    <>
      {isOpen && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }} />
      )}
      <aside className="glass" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 'var(--sidebar-w)', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Head */}
        <div style={{
          padding: '22px 18px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px',
          }}>Ureola</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, display: 'flex', borderRadius: 6,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* New chat */}
        <div style={{ padding: '12px 12px 8px' }}>
          <button onClick={onNewChat} style={{
            width: '100%', padding: '10px 14px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 8, cursor: 'pointer',
            color: 'var(--accent)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New conversation
          </button>
        </div>

        {/* Label */}
        <div style={{ padding: '8px 16px 4px' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Recent
          </span>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {conversations.length === 0 && (
            <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No conversations yet
            </div>
          )}
          {conversations.map(c => (
            <button key={c.id} onClick={() => onSelectChat(c.id)} style={{
              width: '100%', padding: '9px 10px',
              background: activeId === c.id ? 'rgba(255,255,255,0.06)' : 'none',
              border: '1px solid', borderColor: activeId === c.id ? 'var(--border)' : 'transparent',
              borderRadius: 7, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
              transition: 'all 0.1s', marginBottom: 2,
            }}>
              <span style={{
                fontSize: 13, color: 'var(--text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                width: '100%', textAlign: 'left',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>{c.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(c.createdAt)}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SidebarBtn label="Settings" icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          } />
          <SidebarBtn label="Profile" icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          } />
        </div>
      </aside>
    </>
  )
}

function SidebarBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 10,
      color: 'var(--text-sub)', fontSize: 13, padding: '6px 4px',
      borderRadius: 6, width: '100%',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {icon}{label}
    </button>
  )
}
