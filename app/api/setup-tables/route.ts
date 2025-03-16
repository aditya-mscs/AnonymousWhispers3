import { NextResponse } from "next/server"
import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

// Add this constant after the existing ones
const SOCIAL_CONFIG_TABLE = "anonymous-dark-secrets-config"

export async function GET() {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    // List all tables
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const allTables = listTablesResponse.TableNames || []

    // Update the results object in the GET function
    const results = {
      secretsTable: { name: awsEnv.secretsTable, created: false, existed: false },
      commentsTable: { name: awsEnv.commentsTable, created: false, existed: false },
      configTable: { name: SOCIAL_CONFIG_TABLE, created: false, existed: false },
    }

    // Create Secrets table if it doesn't exist
    if (!allTables.includes(awsEnv.secretsTable)) {
      await client.send(
        new CreateTableCommand({
          TableName: awsEnv.secretsTable,
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
    if (!allTables.includes(awsEnv.commentsTable)) {
      await client.send(
        new CreateTableCommand({
          TableName: awsEnv.commentsTable,
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

    // Add this code after the Comments table creation code
    // Create Config table if it doesn't exist
    if (!allTables.includes(SOCIAL_CONFIG_TABLE)) {
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

      results.configTable.created = true
    } else {
      results.configTable.existed = true
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

