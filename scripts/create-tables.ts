import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb"
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

async function createTables() {
  try {
    console.log("Checking existing tables...")
    const { TableNames } = await client.send(new ListTablesCommand({}))
    console.log("Existing tables:", TableNames || [])

    // Create Secrets table if it doesn't exist
    if (!TableNames || !TableNames.includes(awsEnv.secretsTable)) {
      console.log(`Creating table: ${awsEnv.secretsTable}`)

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

      console.log(`Table created: ${awsEnv.secretsTable}`)
    } else {
      console.log(`Table already exists: ${awsEnv.secretsTable}`)
    }

    // Create Comments table if it doesn't exist
    if (!TableNames || !TableNames.includes(awsEnv.commentsTable)) {
      console.log(`Creating table: ${awsEnv.commentsTable}`)

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

      console.log(`Table created: ${awsEnv.commentsTable}`)
    } else {
      console.log(`Table already exists: ${awsEnv.commentsTable}`)
    }

    console.log("Table setup complete!")
  } catch (error) {
    console.error("Error creating tables:", error)
    throw error
  }
}

// Run the function
createTables()
  .then(() => console.log("Done!"))
  .catch((err) => console.error("Failed:", err))

