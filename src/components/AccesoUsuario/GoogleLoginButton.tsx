import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void
        }
      }
    }
  }
}

type GoogleLoginButtonProps = {
  onCredential: (credential: string) => void
}

const SCRIPT_ID = 'google-identity-services'

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      if (window.google) resolve()
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity'))
    document.head.appendChild(script)
  })
}

export default function GoogleLoginButton({ onCredential }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  useEffect(() => {
    if (!clientId || !buttonRef.current) return

    let cancelled = false

    void loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) return
        buttonRef.current.innerHTML = ''
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (credential) onCredential(credential)
          },
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          text: 'signin_with',
          shape: 'pill',
          size: 'large',
          width: 320,
          locale: 'es',
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [clientId, onCredential])

  if (!clientId) {
    return (
      <div className="rounded-xl border border-dashed border-borde px-4 py-3 text-sm text-texto-secundario">
        Falta configurar Google Sign-In en el frontend.
      </div>
    )
  }

  return <div ref={buttonRef} className="flex justify-center" />
}
