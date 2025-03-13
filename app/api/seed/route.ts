import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createHash } from "crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// Hash IP address for privacy
function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (awsEnv.ipHashSalt || "default-salt"))
    .digest("hex")
}

// Generate a random date within the last 30 days
function randomDate(daysBack = 30): string {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
  date.setHours(Math.floor(Math.random() * 24))
  date.setMinutes(Math.floor(Math.random() * 60))
  return date.toISOString()
}

// Generate a random username
function generateRandomUsername(): string {
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
  ]

  const nouns = ["Whisper", "Shadow", "Ghost", "Phantom", "Specter", "Wraith", "Spirit", "Enigma", "Mystery", "Secret"]

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  const randomNumber = Math.floor(Math.random() * 1000)

  return `${randomAdjective}${randomNoun}${randomNumber}`
}

// Mock data for seeding
const mockSecrets = [
  {
    content:
      "I've been pretending to like my job for 5 years. Everyone thinks I'm passionate about it, but I secretly hate every minute.",
    darkness: 7,
    username: "ShadowyGhost42",
    ipHash: hashIp("192.168.1.1"),
    createdAt: randomDate(5),
    views: 120,
    shares: 5,
  },
  {
    content:
      "I sabotaged my best friend's job interview because I was jealous of their success. They still don't know it was me.",
    darkness: 9,
    username: "MysteriousEnigma77",
    ipHash: hashIp("192.168.1.2"),
    createdAt: randomDate(10),
    views: 85,
    shares: 2,
  },
  {
    content:
      "I've been living a double life online for years. My family has no idea about my alter ego or the community I'm part of.",
    darkness: 6,
    username: "CrypticShade23",
    ipHash: hashIp("192.168.1.3"),
    createdAt: randomDate(12),
    views: 210,
    shares: 15,
  },
]

export async function GET(request: Request) {
  try {
    // Check for a secret key to prevent unauthorized seeding
    const url = new URL(request.url)
    const key = url.searchParams.get("key")

    if (key !== "seed-my-db-please") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    const docClient = DynamoDBDocumentClient.from(client)

    // Check if the table already has data
    const scanResponse = await docClient.send(
      new ScanCommand({
        TableName: awsEnv.secretsTable,
        Limit: 1,
      }),
    )

    if ((scanResponse.Count || 0) > 0) {
      return NextResponse.json({
        message: "Database already contains data. Seeding skipped.",
        count: scanResponse.Count,
      })
    }

    // Seed the database with mock data
    const secretIds = []

    for (const secret of mockSecrets) {
      const id = uuidv4()
      secretIds.push(id)

      await docClient.send(
        new PutCommand({
          TableName: awsEnv.secretsTable,
          Item: {
            id,
            content: secret.content,
            darkness: secret.darkness,
            username: secret.username,
            ipHash: secret.ipHash,
            createdAt: secret.createdAt,
            views: secret.views,
            shares: secret.shares,
          },
        }),
      )
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      secretIds,
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      {
        error: "Failed to seed database",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

