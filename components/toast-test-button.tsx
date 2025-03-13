"use client"

import { useState, useEffect } from "react"
import { showTestToast } from "./super-toast"

export function ToastTestButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Show a test toast after 2 seconds
    const timer = setTimeout(() => {
      console.log("Auto-showing test toast")
      showTestToast()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return null

  return (
    <button
      onClick={() => {
        console.log("Test toast button clicked")
        showTestToast()
      }}
      className="fixed bottom-4 right-4 z-[9998] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg"
    >
      Show Test Toast
    </button>
  )
}

