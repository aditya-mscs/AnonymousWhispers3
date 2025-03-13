import { Table, Entity } from "dynamodb-toolbox"
import { docClient, SECRETS_TABLE, COMMENTS_TABLE } from "./aws-config"

// Create the Secrets table
const SecretsTable = new Table({
  name: SECRETS_TABLE,
  partitionKey: "id",
  DocumentClient: docClient,
})

// Create the Comments table
const CommentsTable = new Table({
  name: COMMENTS_TABLE,
  partitionKey: "id",
  sortKey: "secretId",
  DocumentClient: docClient,
})

// Secret Entity
export const Secret = new Entity({
  name: "Secret",
  attributes: {
    id: { partitionKey: true },
    content: { type: "string", required: true },
    darkness: { type: "number", required: true },
    username: { type: "string", required: true },
    ipHash: { type: "string" },
    createdAt: { type: "string", required: true },
    views: { type: "number", default: 0 },
    shares: { type: "number", default: 0 },
  },
  table: SecretsTable,
})

// Comment Entity
export const Comment = new Entity({
  name: "Comment",
  attributes: {
    id: { partitionKey: true },
    secretId: { sortKey: true, required: true },
    content: { type: "string", required: true },
    username: { type: "string", required: true },
    ipHash: { type: "string" },
    createdAt: { type: "string", required: true },
  },
  table: CommentsTable,
})

// Helper function to create DynamoDB tables (for development)
export async function createTables() {
  // This would typically be done through AWS CloudFormation or the AWS Console
  // This is just for reference
  const createSecretsTableParams = {
    TableName: SECRETS_TABLE,
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    GlobalSecondaryIndexes: [
      {
        IndexName: "DarknessIndex",
        KeySchema: [{ AttributeName: "darkness", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: "CreatedAtIndex",
        KeySchema: [{ AttributeName: "createdAt", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  }

  const createCommentsTableParams = {
    TableName: COMMENTS_TABLE,
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" },
      { AttributeName: "secretId", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "secretId", AttributeType: "S" },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    GlobalSecondaryIndexes: [
      {
        IndexName: "SecretIdIndex",
        KeySchema: [{ AttributeName: "secretId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  }

  // Code to create tables would go here
  console.log("Table creation parameters:", createSecretsTableParams, createCommentsTableParams)
}

