import { ChatMessage } from './chatbotTypes'

export const CHATBOT_STORAGE_KEY = 'agendify-chatbot-history'

export const QUICK_ACTIONS = [
  '¿Como reservo un turno?',
  '¿Como funciona la seña?',
  '¿Que puede hacer un profesional?',
  '¿Necesito iniciar sesion?',
]

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      'Hola, soy el asistente de Agendify. Puedo ayudarte con dudas generales sobre como usar la plataforma. ¿Que consulta deseas realizar?',
  },
]
