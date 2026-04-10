import { NextRequest, NextResponse } from "next/server";
import {
  consolidateRound,
  getSleepCycle,
  getSleepMetrics,
} from "@/lib/sleep";

// GET /api/research/sleep?sessionId=xxx
// Returns chart-friendly sleep metrics for the given session.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId query parameter is required" },
      { status: 400 }
    );
  }

  const metrics = getSleepMetrics(sessionId);

  if (!metrics) {
    return NextResponse.json(
      { error: "No sleep cycle found for this session" },
      { status: 404 }
    );
  }

  return NextResponse.json(metrics);
}

// POST /api/research/sleep
// Body: { sessionId: string, roundIndex: number, roundResult: string }
// Triggers consolidateRound for a specific round and returns the SleepMemory.
export async function POST(req: NextRequest) {
  let body: { sessionId?: string; roundIndex?: number; roundResult?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { sessionId, roundResult } = body;

  if (!sessionId || typeof roundResult !== "string") {
    return NextResponse.json(
      {
        error:
          "Request body must include sessionId (string) and roundResult (string)",
      },
      { status: 400 }
    );
  }

  // Gather prior memories from the existing cycle (if any)
  const cycle = getSleepCycle(sessionId);
  const priorMemories = cycle?.memories ?? [];

  try {
    const memory = await consolidateRound(sessionId, roundResult, priorMemories);
    return NextResponse.json(memory);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during consolidation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
