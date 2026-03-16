export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  summary: string | null
  createdAt: number
}
