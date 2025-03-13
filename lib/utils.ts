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

