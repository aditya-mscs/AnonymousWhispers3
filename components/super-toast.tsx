"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { createPortal } from "react-dom"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

export interface ToastState extends ToastProps {
  id: string
}

// Global state for toasts
let toasts: ToastState[] = []
let listeners: Array<(toasts: ToastState[]) => void> = []

// Function to notify all listeners of state changes
function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]))
}

// Toast management functions
export const SuperToast = {
  show: (props: ToastProps): string => {
    console.log("SuperToast.show called with:", props)
    const id = Math.random().toString(36).substring(2, 9)
    const toast = { ...props, id }
    toasts = [...toasts, toast]
    notifyListeners()

    // Auto-dismiss
    if (props.duration !== 0) {
      setTimeout(() => {
        SuperToast.dismiss(id)
      }, props.duration || 5000)
    }

    return id
  },

  dismiss: (id: string) => {
    console.log("SuperToast.dismiss called for:", id)
    toasts = toasts.filter((t) => t.id !== id)
    notifyListeners()
  },

  dismissAll: () => {
    toasts = []
    notifyListeners()
  },
}

// Test toast function
export const showTestToast = () => {
  SuperToast.show({
    message: "This is a test toast!",
    type: "info",
    duration: 3000,
  })
}

// Toast container component
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

    // Initial state
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

