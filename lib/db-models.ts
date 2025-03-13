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
  indexes: {
    SecretIdIndex: { partitionKey: "secretId" },
  },
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

