import { generateRandomUsername } from "@/lib/utils"

const USERNAME_KEY = "anonymous_dark_secrets_username"
const USER_RATINGS_KEY = "anonymous_dark_secrets_ratings"

// Get username from localStorage
export function getUsernameFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem(USERNAME_KEY)
}

// Save username to localStorage
export function saveUsernameToStorage(username: string): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(USERNAME_KEY, username)
}

// Get or create username
export function getOrCreateUsername(): string {
  if (typeof window === "undefined") {
    return generateRandomUsername()
  }

  let username = localStorage.getItem(USERNAME_KEY)

  if (!username) {
    username = generateRandomUsername()
    localStorage.setItem(USERNAME_KEY, username)
  }

  return username
}

// Get user rating for a secret
export function getUserRating(secretId: string): number {
  if (typeof window === "undefined") {
    return 0
  }

  const ratingsJson = localStorage.getItem(USER_RATINGS_KEY)
  if (!ratingsJson) {
    return 0
  }

  try {
    const ratings = JSON.parse(ratingsJson)
    return ratings[secretId] || 0
  } catch (error) {
    console.error("Error parsing user ratings:", error)
    return 0
  }
}

// Save user rating for a secret
export function saveUserRating(secretId: string, rating: number): void {
  if (typeof window === "undefined") {
    return
  }

  let ratings: Record<string, number> = {}

  const ratingsJson = localStorage.getItem(USER_RATINGS_KEY)
  if (ratingsJson) {
    try {
      ratings = JSON.parse(ratingsJson)
    } catch (error) {
      console.error("Error parsing user ratings:", error)
    }
  }

  ratings[secretId] = rating
  localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(ratings))
}

