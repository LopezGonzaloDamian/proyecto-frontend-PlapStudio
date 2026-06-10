import { API_URL } from '../config/api'
import { ChatMessage, ChatbotRequest, ChatbotResponse } from './chatbotTypes'

export async function sendChatbotMessage(
  messages: ChatMessage[],
  authenticated: boolean,
  userRole: string | null
): Promise<ChatbotResponse> {
  const requestBody: ChatbotRequest = {
    authenticated,
    userRole,
    messages,
  }

  const response = await fetch(`${API_URL}/chatbot/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error('No pude conectarme con el asistente de Agendify.')
  }

  return (await response.json()) as ChatbotResponse
}
