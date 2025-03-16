export function extractIdFromUrl(url: string | URL, position = -1): string {
  const urlObj = typeof url === "string" ? new URL(url) : url
  const pathParts = urlObj.pathname.split("/").filter(Boolean)

  // If position is negative, count from the end
  const index = position < 0 ? pathParts.length + position : position

  return pathParts[index] || ""
}

/**
 * Extracts the last segment of a URL path (typically the ID)
 * @param url The full URL of the request
 * @returns The last segment of the path
 */
export function extractLastSegment(url: string | URL): string {
  return extractIdFromUrl(url, -1)
}

/**
 * Extracts the second-to-last segment of a URL path
 * Useful for nested routes like /api/secrets/[id]/report
 * @param url The full URL of the request
 * @returns The second-to-last segment of the path
 */
export function extractSecondToLastSegment(url: string | URL): string {
  return extractIdFromUrl(url, -2)
}

