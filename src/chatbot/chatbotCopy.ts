import { ChatMessage } from './chatbotTypes'

export const CHATBOT_STORAGE_KEY = 'agendify-chatbot-history'

export const QUICK_ACTIONS = [
  'Como crear una agenda',
  'Como agendar un turno',
  'Como buscar un profesional',
  'Como cancelar un turno',
  'Que puede hacer cada rol',
]

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: 'Hola, soy el chatbot de Agendify. En que puedo ayudarte?',
  },
]
