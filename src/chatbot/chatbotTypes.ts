export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatbotRequest {
  authenticated: boolean
  userRole: string | null
  messages: ChatMessage[]
}

export interface ChatbotResponse {
  message: string
  source: string
}
