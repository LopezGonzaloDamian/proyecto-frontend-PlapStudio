import React from 'react'
import { ToastMessage } from '../../customHooks/useToast'

interface ToastProps {
  toast: ToastMessage | null
}

const typeClasses: Record<ToastMessage['type'], string> = {
  success: 'bg-green-600 border-green-600',
  error:   'bg-red-700 border-red-700',
  warning: 'bg-orange-500 border-orange-500',
  info:    'bg-blue-700 border-blue-700',
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null

  return (
    <div
      data-testid="toast"
      className={`
        fixed top-5 right-5 z-[9999] max-w-[350px]
        min-h-[50px] px-4 py-3 mb-2 rounded-lg
        shadow-[0_4px_12px_rgba(0,0,0,0.15)]
        text-white text-xl font-normal
        flex items-center justify-center text-center
        border border-transparent
        animate-slide-in
        max-sm:left-2.5 max-sm:right-2.5 max-sm:top-auto max-sm:bottom-2.5 max-sm:max-w-none
        ${typeClasses[toast.type]}
      `}
    >
      {toast.message}
    </div>
  )
}