"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { createPortal } from "react-dom"

/**
 * Types of toast notifications
 */
export type ToastType = "success" | "error" | "info" | "warning"

/**
 * Props for creating a toast notification
 */
export interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

/**
 * Internal state for a toast notification
 */
export interface ToastState extends ToastProps {
  id: string
}

// Global state for toasts - simplified implementation
let toasts: ToastState[] = []
let listeners: Array<(toasts: ToastState[]) => void> = []

/**
 * Notifies all listeners of state changes
 */
function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]))
}

/**
 * Toast notification system
 * Provides methods to show, dismiss, and manage toast notifications
 */
export const SuperToast = {
  /**
   * Shows a toast notification
   * @param props Toast properties
   * @returns Toast ID
   */
  show: (props: ToastProps): string => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast = { ...props, id }
    toasts = [...toasts, toast]
    notifyListeners()

    // Auto-dismiss
    if (props.duration !== 0) {
      setTimeout(() => {
        SuperToast.dismiss(id)
      }, props.duration || 3000) // Default duration: 3 seconds
    }

    return id
  },

  /**
   * Dismisses a toast notification
   * @param id Toast ID to dismiss
   */
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    notifyListeners()
  },

  /**
   * Dismisses all toast notifications
   */
  dismissAll: () => {
    toasts = []
    notifyListeners()
  },
}

// Clean up the store periodically to prevent memory leaks
if (typeof window !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const toast of toasts) {
      if (toast.duration && Date.now() - Number.parseInt(toast.id, 36) > toast.duration + 1000) {
        SuperToast.dismiss(toast.id)
      }
    }
  }, 10000) // Check every 10 seconds
}

/**
 * Toast container component
 * Renders all active toast notifications
 */
export function ToastContainer() {
  const [mounted, setMounted] = useState(false)
  const [visibleToasts, setVisibleToasts] = useState<ToastState[]>([])

  useEffect(() => {
    setMounted(true)

    // Subscribe to toast changes
    const handleToastsChange = (newToasts: ToastState[]) => {
      setVisibleToasts(newToasts)
    }

    listeners.push(handleToastsChange)
    setVisibleToasts([...toasts])

    return () => {
      listeners = listeners.filter((l) => l !== handleToastsChange)
    }
  }, [])

  // Don't render on server
  if (!mounted) return null

  // Use portal to render at the top level of the DOM
  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
           pointer-events-auto rounded-md shadow-lg p-4 text-white 
           flex items-center justify-between
           animate-in slide-in-from-top-5 duration-300
           ${
             toast.type === "success"
               ? "bg-green-600"
               : toast.type === "error"
                 ? "bg-red-600"
                 : toast.type === "warning"
                   ? "bg-amber-600"
                   : "bg-blue-600"
           }
         `}
        >
          <p>{toast.message}</p>
          <button
            onClick={() => SuperToast.dismiss(toast.id)}
            className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}

/**
 * Shows a test toast notification
 * Useful for debugging
 */
export const showTestToast = () => {
  SuperToast.show({
    message: "This is a test toast!",
    type: "info",
    duration: 5000,
  })
}

