import { NextResponse } from "next/server"
import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: awsEnv.region,
  credentials: getAwsCredentials(),
})

// Table name for storing social media credentials
const SOCIAL_CONFIG_TABLE = "anonymous-dark-secrets-config"

export async function GET() {
  try {
    // List all tables
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const allTables = listTablesResponse.TableNames || []

    // Check if the config table already exists
    const configTableExists = allTables.includes(SOCIAL_CONFIG_TABLE)

    if (configTableExists) {
      return NextResponse.json({
        status: "success",
        message: "Config table already exists",
        tableExists: true,
      })
    }

    // Create the config table
    await client.send(
      new CreateTableCommand({
        TableName: SOCIAL_CONFIG_TABLE,
        KeySchema: [{ AttributeName: "configId", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "configId", AttributeType: "S" }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      }),
    )

    return NextResponse.json({
      status: "success",
      message: "Config table created successfully",
      tableExists: false,
    })
  } catch (error) {
    console.error("Error creating config table:", error)
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

