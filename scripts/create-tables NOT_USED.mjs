import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets";
const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "anonymous-dark-secrets-comments";

async function createTables() {
  try {
    console.log("Checking existing tables...");
    const { TableNames } = await client.send(new ListTablesCommand({}));
    console.log("Existing tables:", TableNames || []);

    // Create Secrets table if it doesn't exist
    if (!TableNames || !TableNames.includes(SECRETS_TABLE)) {
      console.log(`Creating table: ${SECRETS_TABLE}`);
      
      await client.send(new CreateTableCommand({
        TableName: SECRETS_TABLE,
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" }
        ],
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }));
      
      console.log(`Table created: ${SECRETS_TABLE}`);
    } else {
      console.log(`Table already exists: ${SECRETS_TABLE}`);
    }

    // Create Comments table if it doesn't exist
    if (!TableNames || !TableNames.includes(COMMENTS_TABLE)) {
      console.log(`Creating table: ${COMMENTS_TABLE}`);
      
      await client.send(new CreateTableCommand({
        TableName: COMMENTS_TABLE,
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" },
          { AttributeName: "secretId", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" },
          { AttributeName: "secretId", AttributeType: "S" }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "SecretIdIndex",
            KeySchema: [
              { AttributeName: "secretId", KeyType: "HASH" }
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }));
      
      console.log(`Table created: ${COMMENTS_TABLE}`);
    } else {
      console.log(`Table already exists: ${COMMENTS_TABLE}`);
    }

    console.log("Table setup complete!");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

// Run the function
createTables()
  .then(() => console.log("Done!"))
  .catch(err => console.error("Failed:", err));

