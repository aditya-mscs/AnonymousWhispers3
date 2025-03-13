import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment } from "./aws-env"

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// In-memory storage for mock data
const mockDatabase = {
  [awsEnv.secretsTable]: new Map(),
  [awsEnv.commentsTable]: new Map(),
}

// Create a mock DynamoDB client that works in browser environments
class MockDynamoDBClient extends DynamoDBClient {
  constructor(config: any) {
    super(config)
  }

  // Override the send method to provide mock implementations
  async send(command: any) {
    console.log("Using mock AWS client:", command.constructor.name)

    if (command instanceof PutCommand) {
      return this.handlePut(command)
    } else if (command instanceof GetCommand) {
      return this.handleGet(command)
    } else if (command instanceof ScanCommand) {
      return this.handleScan(command)
    } else if (command instanceof QueryCommand) {
      return this.handleQuery(command)
    } else if (command instanceof UpdateCommand) {
      return this.handleUpdate(command)
    } else if (command instanceof DeleteCommand) {
      return this.handleDelete(command)
    }

    // Default fallback
    return { Items: [] }
  }

  private handlePut(command: PutCommand) {
    const { TableName, Item } = command.input
    if (!TableName || !Item) return {}

    const table = mockDatabase[TableName] || new Map()
    const id = Item.id
    table.set(id, Item)
    mockDatabase[TableName] = table

    return { Item }
  }

  private handleGet(command: GetCommand) {
    const { TableName, Key } = command.input
    if (!TableName || !Key) return { Item: null }

    const table = mockDatabase[TableName] || new Map()
    const id = Key.id
    const Item = table.get(id) || null

    return { Item }
  }

  private handleScan(command: ScanCommand) {
    const { TableName, FilterExpression, ExpressionAttributeValues, Select } = command.input
    if (!TableName) return { Items: [] }

    const table = mockDatabase[TableName] || new Map()
    let Items = Array.from(table.values())

    // Apply filter if provided
    if (FilterExpression && ExpressionAttributeValues) {
      // Simple implementation for common filters
      if (FilterExpression.includes("darkness >=")) {
        const minDarkness = ExpressionAttributeValues[":minDarkness"]
        Items = Items.filter((item) => item.darkness >= minDarkness)
      } else if (FilterExpression.includes("ipHash =")) {
        const ipHash = ExpressionAttributeValues[":ipHash"]
        Items = Items.filter((item) => item.ipHash === ipHash)
      } else if (FilterExpression.includes("secretId =")) {
        const secretId = ExpressionAttributeValues[":secretId"]
        Items = Items.filter((item) => item.secretId === secretId)
      }
    }

    // If COUNT is requested, return count only
    if (Select === "COUNT") {
      return { Count: Items.length }
    }

    return { Items, Count: Items.length }
  }

  private handleQuery(command: QueryCommand) {
    const { TableName, KeyConditionExpression, ExpressionAttributeValues } = command.input
    if (!TableName || !KeyConditionExpression || !ExpressionAttributeValues) return { Items: [] }

    const table = mockDatabase[TableName] || new Map()
    let Items = Array.from(table.values())

    // Simple implementation for secretId queries
    if (KeyConditionExpression.includes("secretId =")) {
      const secretId = ExpressionAttributeValues[":secretId"]
      Items = Items.filter((item) => item.secretId === secretId)
    }

    return { Items, Count: Items.length }
  }

  private handleUpdate(command: UpdateCommand) {
    const { TableName, Key, UpdateExpression, ExpressionAttributeValues } = command.input
    if (!TableName || !Key || !UpdateExpression) return {}

    const table = mockDatabase[TableName] || new Map()
    const id = Key.id
    const item = table.get(id)

    if (!item) return {}

    // Simple implementation for views and shares updates
    if (UpdateExpression.includes("views =") && ExpressionAttributeValues) {
      item.views = (item.views || 0) + 1
    } else if (UpdateExpression.includes("shares =") && ExpressionAttributeValues) {
      item.shares = (item.shares || 0) + 1
    }

    table.set(id, item)
    mockDatabase[TableName] = table

    return { Attributes: item }
  }

  private handleDelete(command: DeleteCommand) {
    const { TableName, Key } = command.input
    if (!TableName || !Key) return {}

    const table = mockDatabase[TableName] || new Map()
    const id = Key.id
    table.delete(id)
    mockDatabase[TableName] = table

    return {}
  }
}

// Create and export the mock client
export const createMockDynamoDBClient = () => {
  const client = new MockDynamoDBClient({
    region: awsEnv.region,
    credentials: {
      accessKeyId: "mock-access-key",
      secretAccessKey: "mock-secret-key",
    },
  })

  return DynamoDBDocumentClient.from(client)
}

