import { NextResponse } from "next/server"
import { checkAwsConfig } from "@/lib/aws-config"

export async function GET() {
  try {
    const config = checkAwsConfig()

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      config: {
        region: config.region,
        hasCredentials: config.hasCredentials,
        secretsTable: config.secretsTable,
        commentsTable: config.commentsTable,
      },
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

