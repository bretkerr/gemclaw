import { NextRequest, NextResponse } from "next/server";
import { synthesizeSession } from "@/lib/moe-engine";

// POST /api/research/synthesize — run final synthesis across all rounds
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await synthesizeSession(sessionId);
    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
