import { NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// Create a document client for easier interaction with DynamoDB
const docClient = DynamoDBDocumentClient.from(client)

// Table names
const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets"
const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "anonymous-dark-secrets-comments"

export async function GET() {
  try {
    // Scan all secrets
    const secretsResult = await docClient.send(
      new ScanCommand({
        TableName: SECRETS_TABLE,
        Limit: 100,
      }),
    )

    // Scan all comments
    const commentsResult = await docClient.send(
      new ScanCommand({
        TableName: COMMENTS_TABLE,
        Limit: 100,
      }),
    )

    return NextResponse.json({
      status: "success",
      environment: process.env.NODE_ENV,
      awsRegion: process.env.AWS_REGION,
      tables: {
        secrets: {
          name: SECRETS_TABLE,
          count: secretsResult.Items?.length || 0,
          items: secretsResult.Items?.map((item) => ({
            id: item.id,
            username: item.username,
            darkness: item.darkness,
            createdAt: item.createdAt,
            contentPreview: item.content?.substring(0, 50) + "...",
          })),
        },
        comments: {
          name: COMMENTS_TABLE,
          count: commentsResult.Items?.length || 0,
          items: commentsResult.Items?.map((item) => ({
            id: item.id,
            secretId: item.secretId,
            username: item.username,
            createdAt: item.createdAt,
            contentPreview: item.content?.substring(0, 50) + "...",
          })),
        },
      },
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

