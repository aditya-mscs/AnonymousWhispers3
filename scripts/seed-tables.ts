import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { createHash } from "crypto"
import dotenv from "dotenv"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

// Load environment variables
dotenv.config()

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: awsEnv.region,
  credentials: getAwsCredentials(),
})

// Create a document client for easier interaction with DynamoDB
const docClient = DynamoDBDocumentClient.from(client)

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
  {
    content:
      "I've been stealing small amounts of money from my workplace for years. It started as a one-time thing when I was desperate, but now I can't stop.",
    darkness: 8,
    username: "ObscureRiddle55",
    ipHash: hashIp("192.168.1.4"),
    createdAt: randomDate(15),
    views: 175,
    shares: 8,
  },
  {
    content: `I pretend to be happy on social media, but I cry myself to sleep almost every night. No one knows how broken I really am. 
    
    I've been struggling with depression for years but I'm too afraid to seek help. I'm worried that if people knew the real me, they'd leave. So I keep posting happy photos and inspirational quotes while feeling empty inside. 
    
    Sometimes I wonder if anyone would notice if I just disappeared. The contrast between my online persona and my real life is getting harder to maintain every day.`,
    darkness: 7,
    username: "FurtiveApparition11",
    ipHash: hashIp("192.168.1.5"),
    createdAt: randomDate(20),
    views: 320,
    shares: 25,
  },
  {
    content: `I've been faking my academic credentials for years. My entire career is built on a lie, and I live in constant fear of being exposed. 
    
    It started when I couldn't afford to finish my degree. I was one semester short but desperately needed a job. I modified my resume slightly, claiming I had graduated. That small lie snowballed as I moved up in my career. Now I'm in a senior position where my "qualifications" are a key part of my credibility.
    
    Every time there's a background check or when I meet someone from my supposed alma mater, I panic. I've created elaborate stories and even fake documents to maintain this facade. The guilt is overwhelming, but I'm in too deep to come clean now. My family depends on my income, and revealing the truth would destroy everything I've built.
    
    The worst part is that I'm actually good at my job. I've learned everything through experience and self-study, probably more than I would have in that final semester. But that doesn't change the fact that my entire professional identity is fraudulent.`,
    darkness: 9,
    username: "EnigmaticWraith66",
    ipHash: hashIp("192.168.1.6"),
    createdAt: randomDate(25),
    views: 150,
    shares: 7,
  },
  {
    content: `THE SHADOW IN THE CORNER - A True Story

    I've never told anyone this story before. When I was eight years old, I started seeing a shadow figure in the corner of my bedroom. At first, I thought it was just my imagination or a trick of the light. But as weeks passed, it became more defined, more present.
    
    My parents dismissed it as nightmares or an overactive imagination. "There's nothing there," they'd say after checking my room. But I knew better. The shadow was always in the same corner, watching, waiting.
    
    One night, I woke up at exactly 3:33 AM to find the shadow had moved to the foot of my bed. I was paralyzed with fear as it slowly leaned forward. I could make out no features, just a darker patch against the darkness of my room. Then it spoke—not out loud, but directly into my mind: "I've been waiting for you to notice me."
    
    After that night, things in our house began to change. Objects would move on their own. My parents would argue about things they couldn't remember saying to each other. My dog refused to enter my room.
    
    The most terrifying part was that I started losing time. I'd be doing homework, then suddenly it would be hours later with no memory of what happened in between. My grades dropped, and my personality changed. My parents took me to doctors, who found nothing wrong.
    
    On my tenth birthday, I woke up in the middle of the night to find my entire family standing around my bed, staring at me with blank expressions. When I screamed, they all snapped out of it, confused about why they were in my room.
    
    That was the night we moved out. My parents never explained why we left so suddenly, leaving most of our belongings behind. We never spoke about the strange events again.
    
    Years later, I found out that three children had died in that house in the 1940s under mysterious circumstances. Their bodies were found in what had been my bedroom.
    
    I'm 35 now, and I've never experienced anything paranormal since. But sometimes, when I'm falling asleep, I still feel like there's something watching me from the corner of the room. And occasionally, I still wake up at exactly 3:33 AM, feeling like someone just whispered my name.
    
    The worst part? Last week, my six-year-old daughter told me she's made a new friend who lives in the shadow in her bedroom corner.`,
    darkness: 10,
    username: "VeiledWhisper99",
    ipHash: hashIp("192.168.1.7"),
    createdAt: randomDate(30),
    views: 450,
    shares: 35,
  },
]

// Mock comments for seeding
const mockComments = [
  {
    secretIndex: 0,
    content: "I feel the same way. It's exhausting keeping up the act.",
    username: "VeiledWhisper99",
    ipHash: hashIp("192.168.1.8"),
    createdAt: randomDate(2),
  },
  {
    secretIndex: 2,
    content: "I understand this completely. Sometimes the online version feels more real than my actual life.",
    username: "HiddenSpecter456",
    ipHash: hashIp("192.168.1.9"),
    createdAt: randomDate(6),
  },
  {
    secretIndex: 2,
    content: "How do you keep the two lives separate? I'm always afraid of being discovered.",
    username: "CovertRevenant789",
    ipHash: hashIp("192.168.1.10"),
    createdAt: randomDate(3),
  },
  {
    secretIndex: 3,
    content: "You need to stop before you get caught. It's not worth ruining your life over.",
    username: "StealthyPuzzle321",
    ipHash: hashIp("192.168.1.11"),
    createdAt: randomDate(8),
  },
  {
    secretIndex: 4,
    content: "I see you. You're not alone in feeling this way. ❤️",
    username: "ClandestineSpirit88",
    ipHash: hashIp("192.168.1.12"),
    createdAt: randomDate(15),
  },
  {
    secretIndex: 4,
    content: "Social media is just a highlight reel. Most of us are struggling behind the scenes.",
    username: "SecretivePhantom44",
    ipHash: hashIp("192.168.1.13"),
    createdAt: randomDate(10),
  },
  {
    secretIndex: 5,
    content: "The imposter syndrome must be overwhelming. Have you considered coming clean?",
    username: "MaskedMystery222",
    ipHash: hashIp("192.168.1.14"),
    createdAt: randomDate(20),
  },
  {
    secretIndex: 6,
    content: "This is absolutely terrifying. Have you considered talking to a medium or paranormal investigator?",
    username: "ShadowyGhost42",
    ipHash: hashIp("192.168.1.1"),
    createdAt: randomDate(25),
  },
  {
    secretIndex: 6,
    content: "I had a similar experience as a child. These shadow beings are more common than people think.",
    username: "EnigmaticWraith66",
    ipHash: hashIp("192.168.1.6"),
    createdAt: randomDate(26),
  },
  {
    secretIndex: 6,
    content: "Please update us on what happens with your daughter. This is seriously concerning.",
    username: "CrypticShade23",
    ipHash: hashIp("192.168.1.3"),
    createdAt: randomDate(27),
  },
]

// Function to seed the database with mock data
async function seedDatabase() {
  try {
    console.log("Starting database seeding...")

    // Array to store created secret IDs
    const secretIds: string[] = []

    // Add secrets
    console.log(`Adding ${mockSecrets.length} secrets to ${awsEnv.secretsTable}...`)

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

      console.log(`Added secret: ${id}`)
    }

    // Add comments
    console.log(`Adding ${mockComments.length} comments to ${awsEnv.commentsTable}...`)

    for (const comment of mockComments) {
      const id = uuidv4()
      const secretId = secretIds[comment.secretIndex]

      await docClient.send(
        new PutCommand({
          TableName: awsEnv.commentsTable,
          Item: {
            id,
            secretId,
            content: comment.content,
            username: comment.username,
            ipHash: comment.ipHash,
            createdAt: comment.createdAt,
          },
        }),
      )

      console.log(`Added comment: ${id} for secret: ${secretId}`)
    }

    console.log("Database seeding completed successfully!")

    // Verify data was added
    console.log("Verifying data...")

    // Check a few secrets
    for (let i = 0; i < Math.min(3, secretIds.length); i++) {
      const secretId = secretIds[i]
      const result = await docClient.send(
        new QueryCommand({
          TableName: awsEnv.commentsTable,
          IndexName: "SecretIdIndex",
          KeyConditionExpression: "secretId = :secretId",
          ExpressionAttributeValues: {
            ":secretId": secretId,
          },
        }),
      )

      console.log(`Secret ${secretId} has ${result.Items?.length || 0} comments`)
    }
  } catch (error) {
    console.error("Error seeding database:", error)
    throw error
  }
}

// Run the function
seedDatabase()
  .then(() => console.log("Seeding completed!"))
  .catch((err) => console.error("Seeding failed:", err))

