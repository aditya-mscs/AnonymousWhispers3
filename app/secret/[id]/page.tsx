import { notFound } from "next/navigation"
import { SecretDetail } from "@/components/secret-detail"
import { secretsApi } from "@/lib/api-client"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"

interface SecretPageProps {
  params: {
    id: string
  }
}

// Direct DB access function as a fallback
async function getSecretDirectlyFromDB(id: string) {
  try {
    console.log("Attempting direct DB access for secret:", id)

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
    const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "anonymous-dark-secrets-comments"

    // Get the secret
    const secretResult = await docClient.send(
      new GetCommand({
        TableName: SECRETS_TABLE,
        Key: { id },
      }),
    )

    if (!secretResult.Item) {
      console.log("Secret not found in direct DB access")
      return null
    }

    // Get comments for this secret
    const commentsResult = await docClient.send(
      new QueryCommand({
        TableName: COMMENTS_TABLE,
        IndexName: "SecretIdIndex",
        KeyConditionExpression: "secretId = :secretId",
        ExpressionAttributeValues: {
          ":secretId": id,
        },
      }),
    )

    const comments = (commentsResult.Items || []).map((item) => ({
      id: item.id,
      content: item.content,
      username: item.username,
      createdAt: item.createdAt,
    }))

    // Increment view count
    await docClient.send(
      new GetCommand({
        TableName: SECRETS_TABLE,
        Key: { id },
        UpdateExpression: "SET views = if_not_exists(views, :zero) + :one",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":one": 1,
        },
        ReturnValues: "NONE",
      }),
    )

    // Return the secret with comments
    return {
      id: secretResult.Item.id,
      content: secretResult.Item.content,
      darkness: secretResult.Item.darkness,
      username: secretResult.Item.username,
      createdAt: secretResult.Item.createdAt,
      comments,
      views: (secretResult.Item.views || 0) + 1,
      shares: secretResult.Item.shares || 0,
    }
  } catch (error) {
    console.error("Error in direct DB access:", error)
    return null
  }
}

export default async function SecretPage({ params }: SecretPageProps) {
  try {
    // In Next.js 15, params might be a Promise, so we need to await it
    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id
    console.log("Fetching secret with ID:", id)

    let secret

    try {
      // First try the API client
      console.log("About to call secretsApi.getSecretById")
      secret = await secretsApi.getSecretById(id)
      console.log("API response received")
    } catch (apiError) {
      console.error("API client error:", apiError)

      // If API client fails, try direct DB access
      console.log("Falling back to direct DB access")
      secret = await getSecretDirectlyFromDB(id)
    }

    if (!secret) {
      console.log("Secret not found, returning 404")
      notFound()
    }

    console.log("Secret found, rendering detail page")
    return <SecretDetail secret={secret} />
  } catch (error) {
    console.error("Error fetching secret:", error)
    // Instead of immediately returning notFound(), let's provide more context
    return (
      <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Error Loading Secret</h1>
        <p className="text-muted-foreground mb-4">
          We encountered an error while trying to load this secret. Please try again later.
        </p>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto">
          {error instanceof Error ? error.message : "Unknown error"}
        </pre>
      </div>
    )
  }
}

