import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: awsEnv.region,
  credentials: getAwsCredentials(),
})

const docClient = DynamoDBDocumentClient.from(client)

// Table name for storing social media credentials
const SOCIAL_CONFIG_TABLE = "anonymous-dark-secrets-config"

// GET handler to retrieve social media credentials
export async function GET(request: Request) {
  try {
    // Check admin session
    if (!(await checkAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get credentials from DynamoDB
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: SOCIAL_CONFIG_TABLE,
          Key: { configId: "social-media-credentials" },
        }),
      )

      // Return credentials (or empty object if not found)
      return NextResponse.json({
        credentials: result.Item?.credentials || {
          twitter: { apiKey: "", apiSecret: "", accessToken: "", accessSecret: "" },
          instagram: { accessToken: "" },
        },
      })
    } catch (error) {
      // If the table doesn't exist, return default empty credentials
      if (error instanceof Error && error.name === "ResourceNotFoundException") {
        console.log("Config table doesn't exist yet, returning default credentials")
        return NextResponse.json({
          credentials: {
            twitter: { apiKey: "", apiSecret: "", accessToken: "", accessSecret: "" },
            instagram: { accessToken: "" },
          },
        })
      }
      throw error
    }
  } catch (error) {
    console.error("Error fetching social media credentials:", error)
    return NextResponse.json({ error: "Failed to fetch social media credentials" }, { status: 500 })
  }
}

// POST handler to save social media credentials
export async function POST(request: Request) {
  try {
    // Check admin session
    if (!(await checkAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { platform, credentials } = body

    if (!platform || !credentials) {
      return NextResponse.json({ error: "Platform and credentials are required" }, { status: 400 })
    }

    // Default credentials structure
    const defaultCredentials = {
      twitter: { apiKey: "", apiSecret: "", accessToken: "", accessSecret: "" },
      instagram: { accessToken: "" },
    }

    // Try to get existing credentials, but handle case where table doesn't exist
    let existingCredentials = defaultCredentials
    try {
      const existingResult = await docClient.send(
        new GetCommand({
          TableName: SOCIAL_CONFIG_TABLE,
          Key: { configId: "social-media-credentials" },
        }),
      )
      existingCredentials = existingResult.Item?.credentials || defaultCredentials
    } catch (error) {
      // If table doesn't exist, we'll create it by proceeding with the default credentials
      if (error instanceof Error && error.name === "ResourceNotFoundException") {
        console.log("Config table doesn't exist yet, will attempt to create it")
        // Continue with default credentials
      } else {
        throw error
      }
    }

    // Update credentials for the specified platform
    const updatedCredentials = {
      ...existingCredentials,
      [platform]: credentials,
    }

    try {
      // Save to DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: SOCIAL_CONFIG_TABLE,
          Item: {
            configId: "social-media-credentials",
            credentials: updatedCredentials,
            updatedAt: new Date().toISOString(),
          },
        }),
      )
    } catch (error) {
      // If table doesn't exist, we need to create it first
      if (error instanceof Error && error.name === "ResourceNotFoundException") {
        console.error("Table doesn't exist, please create it first")
        return NextResponse.json(
          {
            error:
              "Configuration table doesn't exist. Please run the setup-tables API first to create all required tables.",
          },
          { status: 500 },
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} credentials saved successfully`,
    })
  } catch (error) {
    console.error("Error saving social media credentials:", error)
    return NextResponse.json({ error: "Failed to save social media credentials" }, { status: 500 })
  }
}

