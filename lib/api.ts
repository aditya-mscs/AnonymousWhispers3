import type { Secret } from "@/types/secret"

// Mock data for development
const mockSecrets: Secret[] = [
  {
    id: "1",
    content:
      "I've been pretending to like my job for 5 years. Everyone thinks I'm passionate about it, but I secretly hate every minute.",
    darkness: 7,
    username: "ShadowyGhost42",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    comments: [
      {
        id: "c1",
        content: "I feel the same way. It's exhausting keeping up the act.",
        username: "VeiledWhisper99",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
    ],
    views: 120,
    shares: 5,
  },
  {
    id: "2",
    content:
      "I sabotaged my best friend's job interview because I was jealous of their success. They still don't know it was me.",
    darkness: 9,
    username: "MysteriousEnigma77",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    comments: [],
    views: 85,
    shares: 2,
  },
  {
    id: "3",
    content:
      "I've been living a double life online for years. My family has no idea about my alter ego or the community I'm part of.",
    darkness: 6,
    username: "CrypticShade23",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    comments: [
      {
        id: "c2",
        content: "I understand this completely. Sometimes the online version feels more real than my actual life.",
        username: "HiddenSpecter456",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      },
      {
        id: "c3",
        content: "How do you keep the two lives separate? I'm always afraid of being discovered.",
        username: "CovertRevenant789",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      },
    ],
    views: 210,
    shares: 15,
  },
  {
    id: "4",
    content:
      "I've been stealing small amounts of money from my workplace for years. It started as a one-time thing when I was desperate, but now I can't stop.",
    darkness: 8,
    username: "ObscureRiddle55",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    comments: [
      {
        id: "c4",
        content: "You need to stop before you get caught. It's not worth ruining your life over.",
        username: "StealthyPuzzle321",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
      },
    ],
    views: 175,
    shares: 8,
  },
  {
    id: "5",
    content:
      "I pretend to be happy on social media, but I cry myself to sleep almost every night. No one knows how broken I really am.",
    darkness: 7,
    username: "FurtiveApparition11",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
    comments: [
      {
        id: "c5",
        content: "I see you. You're not alone in feeling this way. ❤️",
        username: "ClandestineSpirit88",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
      },
      {
        id: "c6",
        content: "Social media is just a highlight reel. Most of us are struggling behind the scenes.",
        username: "SecretivePhantom44",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      },
    ],
    views: 320,
    shares: 25,
  },
  {
    id: "6",
    content:
      "I've been faking my academic credentials for years. My entire career is built on a lie, and I live in constant fear of being exposed.",
    darkness: 9,
    username: "EnigmaticWraith66",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 48 hours ago
    comments: [
      {
        id: "c7",
        content: "The imposter syndrome must be overwhelming. Have you considered coming clean?",
        username: "MaskedMystery222",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
      },
    ],
    views: 150,
    shares: 7,
  },
]

// Function to get a secret by ID
export async function getSecretById(id: string): Promise<Secret | null> {
  // In production, this would fetch from your database
  // For now, we'll use mock data
  const secret = mockSecrets.find((s) => s.id === id)

  if (!secret) {
    return null
  }

  // In production, you'd update view count in the database
  // For mock data, we'll just increment it in memory
  secret.views = (secret.views || 0) + 1

  return secret
}

// Function to get secrets by type (recent, dark, trending)
export async function getSecrets(type = "recent", limit = 10, page = 1): Promise<Secret[]> {
  // In production, this would fetch from your database with proper pagination
  // For now, we'll use mock data

  const sortedSecrets = [...mockSecrets]

  switch (type) {
    case "dark":
      sortedSecrets.sort((a, b) => b.darkness - a.darkness)
      break
    case "trending":
      sortedSecrets.sort((a, b) => {
        // Calculate trending score: (views + shares*2 + comments*3) * (darkness/5)
        const aScore = ((a.views || 0) + (a.shares || 0) * 2 + (a.comments?.length || 0) * 3) * (a.darkness / 5)
        const bScore = ((b.views || 0) + (b.shares || 0) * 2 + (b.comments?.length || 0) * 3) * (b.darkness / 5)
        return bScore - aScore // Descending order
      })
      break
    default: // recent
      sortedSecrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Apply pagination
  const start = (page - 1) * limit
  const end = start + limit

  return sortedSecrets.slice(start, end)
}

