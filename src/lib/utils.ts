import { Message } from './types'

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export function getTitleFromMessages(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user')
  if (!first) return 'New conversation'
  const text = first.content.trim()
  return text.length > 42 ? text.slice(0, 42) + '…' : text
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}
