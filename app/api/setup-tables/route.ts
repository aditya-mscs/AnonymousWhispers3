import { NextResponse } from "next/server"
import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb"

export async function GET() {
  try {
    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    })

    const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets"
    const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "anonymous-dark-secrets-comments"

    // List all tables
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const allTables = listTablesResponse.TableNames || []

    const results = {
      secretsTable: { name: SECRETS_TABLE, created: false, existed: false },
      commentsTable: { name: COMMENTS_TABLE, created: false, existed: false },
    }

    // Create Secrets table if it doesn't exist
    if (!allTables.includes(SECRETS_TABLE)) {
      await client.send(
        new CreateTableCommand({
          TableName: SECRETS_TABLE,
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        }),
      )

      results.secretsTable.created = true
    } else {
      results.secretsTable.existed = true
    }

    // Create Comments table if it doesn't exist
    if (!allTables.includes(COMMENTS_TABLE)) {
      await client.send(
        new CreateTableCommand({
          TableName: COMMENTS_TABLE,
          KeySchema: [
            { AttributeName: "id", KeyType: "HASH" },
            { AttributeName: "secretId", KeyType: "RANGE" },
          ],
          AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "secretId", AttributeType: "S" },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "SecretIdIndex",
              KeySchema: [{ AttributeName: "secretId", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
              },
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        }),
      )

      results.commentsTable.created = true
    } else {
      results.commentsTable.existed = true
    }

    return NextResponse.json({
      status: "success",
      message: "Table setup complete",
      results,
    })
  } catch (error) {
    console.error("Error creating tables:", error)
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

