import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a random funny username
export function generateRandomUsername(): string {
  const adjectives = [
    "Mysterious",
    "Shadowy",
    "Cryptic",
    "Enigmatic",
    "Veiled",
    "Clandestine",
    "Covert",
    "Stealthy",
    "Anonymous",
    "Hidden",
    "Masked",
    "Concealed",
    "Obscure",
    "Secretive",
    "Furtive",
  ]

  const nouns = [
    "Whisper",
    "Shadow",
    "Ghost",
    "Phantom",
    "Specter",
    "Wraith",
    "Revenant",
    "Spirit",
    "Apparition",
    "Shade",
    "Enigma",
    "Mystery",
    "Secret",
    "Riddle",
    "Puzzle",
  ]

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  const randomNumber = Math.floor(Math.random() * 1000)

  return `${randomAdjective}${randomNoun}${randomNumber}`
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date)
}

// Get text color class based on darkness rating
export function getDarknessTextColor(rating: number): string {
  if (rating >= 8) return "text-red-500"
  if (rating >= 5) return "text-amber-500"
  if (rating > 0) return "text-green-500"
  return "text-primary"
}

// Get background color class based on darkness rating
export function getDarknessBackgroundColor(rating: number): string {
  if (rating >= 8) return "bg-red-500"
  if (rating >= 5) return "bg-amber-500"
  if (rating > 0) return "bg-green-500"
  return "bg-slate-400 dark:bg-slate-600"
}

