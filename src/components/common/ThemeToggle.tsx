import { useEffect, useState } from 'react'

const THEME_KEY = 'agendify-theme'

function aplicarTema(oscuro: boolean) {
  document.documentElement.classList.toggle('theme-dark', oscuro)
}

export default function ThemeToggle() {
  const [oscuro, setOscuro] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(THEME_KEY) === 'dark'
  })

  useEffect(() => {
    aplicarTema(oscuro)
    localStorage.setItem(THEME_KEY, oscuro ? 'dark' : 'light')
  }, [oscuro])

  return (
    <button
      type="button"
      onClick={() => setOscuro((valor) => !valor)}
      className="fixed bottom-4 left-4 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-borde bg-white text-lg shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-primario-claro sm:bottom-5 sm:left-6 sm:h-12 sm:w-12 sm:text-xl"
      aria-label={oscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={oscuro ? 'Modo claro' : 'Modo oscuro'}
    >
      <span aria-hidden="true">{oscuro ? '☀' : '☾'}</span>
    </button>
  )
}
