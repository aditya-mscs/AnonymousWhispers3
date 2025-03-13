import { NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

export async function GET() {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    // Create a document client for easier interaction with DynamoDB
    const docClient = DynamoDBDocumentClient.from(client)

    // Scan all secrets
    const secretsResult = await docClient.send(
      new ScanCommand({
        TableName: awsEnv.secretsTable,
        Limit: 100,
      }),
    )

    // Scan all comments
    const commentsResult = await docClient.send(
      new ScanCommand({
        TableName: awsEnv.commentsTable,
        Limit: 100,
      }),
    )

    return NextResponse.json({
      status: "success",
      environment: process.env.NODE_ENV,
      awsRegion: awsEnv.region,
      tables: {
        secrets: {
          name: awsEnv.secretsTable,
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
          name: awsEnv.commentsTable,
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

