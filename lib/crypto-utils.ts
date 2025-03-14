/**
 * Utility functions for cryptographic operations
 * This file is designed to work in both server and client environments
 */

// Hash a string using a simple algorithm that works in all environments
export function hashString(input: string, salt = ""): string {
  // Simple hash function that doesn't require crypto module
  // Not as secure as crypto.createHash but works everywhere
  const str = input + salt
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Convert to hex string and ensure positive
  return (hash >>> 0).toString(16).padStart(8, "0")
}

// Function to hash IP addresses for privacy
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "default-salt"
  return hashString(ip, salt)
}

