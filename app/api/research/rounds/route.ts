import { NextRequest, NextResponse } from "next/server";
import { runRound, getSession } from "@/lib/moe-engine";

// POST /api/research/rounds — run the next round for a session
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const result = await runRound(sessionId);

    return NextResponse.json({
      result,
      session: getSession(sessionId),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
