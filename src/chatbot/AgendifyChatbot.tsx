import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { CHATBOT_STORAGE_KEY, INITIAL_MESSAGES, QUICK_ACTIONS } from './chatbotCopy'
import {
  IconChatBack,
  IconChatChevron,
  IconChatClose,
  IconChatMessage,
  IconChatRefresh,
  IconChatSend,
} from './ChatbotIcons'
import { sendChatbotMessage } from './chatbotService'
import { ChatMessage } from './chatbotTypes'
import { useSesion } from '../customHooks/useSesion'

function readStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') {
    return INITIAL_MESSAGES
  }

  const rawHistory = window.localStorage.getItem(CHATBOT_STORAGE_KEY)

  if (!rawHistory) {
    return INITIAL_MESSAGES
  }

  try {
    const parsed = JSON.parse(rawHistory) as ChatMessage[]
    return parsed.length > 0 ? parsed : INITIAL_MESSAGES
  } catch {
    return INITIAL_MESSAGES
  }
}

export default function AgendifyChatbot() {
  const { usuario } = useSesion()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredMessages())
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const userRole = usuario?.roles?.[0] ?? null
  const authenticated = usuario != null

  useEffect(() => {
    window.localStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (!open) {
      return
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 120)
    return () => window.clearTimeout(timeoutId)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, open, isLoading])

  const sendMessage = async (content: string) => {
    const trimmed = content.trim()

    if (!trimmed || isLoading) {
      return
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        role: 'user',
        content: trimmed,
      },
    ]

    setMessages(nextMessages)
    setDraft('')
    setError(null)
    setIsLoading(true)

    try {
      const response = await sendChatbotMessage(nextMessages, authenticated, userRole)
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: response.message,
        },
      ])
    } catch (caughtError) {
      const fallbackMessage =
        caughtError instanceof Error
          ? caughtError.message
          : 'No pude responder en este momento.'

      setError(fallbackMessage)
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content:
            'Ahora mismo no pude responder desde el backend de Agendify. Si queres, proba de nuevo en unos segundos.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await sendMessage(draft)
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()
    await sendMessage(draft)
  }

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES)
    setDraft('')
    setError(null)
    window.localStorage.removeItem(CHATBOT_STORAGE_KEY)
  }

  return (
    <>
      {open ? (
        <section className="chatbot-shell fixed bottom-20 right-4 z-[70] flex h-[min(710px,82vh)] w-[min(390px,calc(100vw-20px))] flex-col overflow-hidden rounded-[30px] border border-borde bg-white shadow-[0_30px_90px_rgba(21,34,66,0.18)] sm:bottom-22 sm:right-6">
          <header className="flex min-h-[76px] items-center justify-between border-b border-borde-suave px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-texto-secundario transition-colors hover:bg-fondo-violeta hover:text-texto-principal"
                aria-label="Minimizar chatbot"
              >
                <IconChatBack />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-9 items-center justify-center">
                  <img
                    src="/favicon.svg"
                    alt="Agendify"
                    className="h-8 w-8 object-contain"
                  />
                </div>

                <div className="flex min-h-10 items-center">
                  <strong className="block text-[18px] font-semibold leading-none text-texto-principal">Agendify Chatbot</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-texto-secundario">
              <button
                type="button"
                onClick={resetChat}
                className="rounded-full p-2 transition-colors hover:bg-fondo-violeta hover:text-texto-principal"
                aria-label="Reiniciar chat"
              >
                <IconChatRefresh />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-fondo-violeta hover:text-texto-principal"
                aria-label="Cerrar chatbot"
              >
                <IconChatClose />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="chatbot-scroll flex-1 overflow-y-auto bg-white px-4 py-5">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="mb-3 flex flex-col">
                <div className={message.role === 'assistant' ? 'self-start' : 'self-end'}>
                  <article
                    className={`max-w-[305px] rounded-[22px] px-4 py-3 text-[15px] leading-8 shadow-sm ${
                      message.role === 'assistant'
                        ? 'chatbot-assistant-bubble rounded-bl-md bg-fondo text-texto-principal'
                        : 'rounded-br-md bg-[#1877F2] text-white'
                    }`}
                  >
                    {message.content}
                  </article>

                  {message.role === 'assistant' ? (
                    <p className="mt-2 px-1 text-xs text-texto-secundario">
                      Agendify Chatbot · Guia de ayuda · Ahora
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="mb-3 flex justify-start">
                <div className="chatbot-assistant-bubble flex items-center gap-2 rounded-[22px] rounded-bl-md bg-fondo px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primario [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primario [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primario" />
                </div>
              </div>
            ) : null}

            {messages.length <= 1 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => void sendMessage(action)}
                    className="chatbot-chip rounded-full border border-borde bg-white px-3 py-2 text-xs font-medium text-texto-secundario transition-colors hover:border-primario hover:text-primario"
                  >
                    {action}
                  </button>
                ))}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-peligro-suave bg-peligro-suave/70 px-4 py-3 text-xs leading-6 text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="border-t border-borde-suave bg-white px-4 py-4">
            <form
              onSubmit={handleSubmit}
              className="chatbot-input-shell rounded-[22px] border-2 border-[#1570ff] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(21,112,255,0.08)]"
            >
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => void handleKeyDown(event)}
                  placeholder="Escribe un mensaje..."
                  className="w-full border-0 bg-transparent text-sm text-texto-principal outline-none placeholder:text-texto-suave"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ececef] text-white transition-all enabled:bg-[#56b6ff] enabled:hover:scale-[1.02] enabled:hover:bg-[#35a8ff] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Enviar mensaje"
                >
                  <IconChatSend className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="chatbot-trigger fixed bottom-5 right-5 z-[69] flex h-14 w-14 items-center justify-center rounded-full bg-[#1570ff] text-white shadow-[0_18px_42px_rgba(21,112,255,0.32)] transition-transform hover:scale-105 sm:right-6"
        aria-label="Abrir chatbot de Agendify"
      >
        {open ? <IconChatChevron className="h-5 w-5" /> : <IconChatMessage className="h-6 w-6" />}
      </button>
    </>
  )
}
