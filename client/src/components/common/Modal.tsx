import type { PropsWithChildren, ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClassNames: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
}

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  children,
}: PropsWithChildren<ModalProps>) => {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm transition md:items-center md:p-6"
      role="dialog"
    >
      <div aria-hidden="true" className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative w-full transform rounded-2xl bg-white shadow-xl transition-all ${sizeClassNames[size]}`}
        onClick={(event) => event.stopPropagation()}
        role="document"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            aria-label="关闭对话框"
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
