import { NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    })

    const docClient = DynamoDBDocumentClient.from(client)
    const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets"

    let result

    if (id) {
      // Get a specific secret
      result = await docClient.send(
        new GetCommand({
          TableName: SECRETS_TABLE,
          Key: { id },
        }),
      )

      return NextResponse.json({
        id,
        found: !!result.Item,
        item: result.Item || null,
        table: SECRETS_TABLE,
        region: process.env.AWS_REGION,
      })
    } else {
      // List first 10 secrets
      result = await docClient.send(
        new ScanCommand({
          TableName: SECRETS_TABLE,
          Limit: 10,
        }),
      )

      return NextResponse.json({
        count: result.Items?.length || 0,
        items: result.Items || [],
        table: SECRETS_TABLE,
        region: process.env.AWS_REGION,
      })
    }
  } catch (error) {
    console.error("DB Check Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

