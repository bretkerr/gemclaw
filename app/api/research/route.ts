import { NextRequest, NextResponse } from "next/server";
import { startResearch, getAllSessions, getSession } from "@/lib/moe-engine";

// POST /api/research — start a new research session
export async function POST(req: NextRequest) {
  try {
    const { topic, depth, numQuestions } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const validDepths = ["quick", "standard", "deep"] as const;
    const d = validDepths.includes(depth) ? depth : "standard";

    const session = await startResearch(topic, d, numQuestions);
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/research?id=xxx — get a session, or list all
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const session = getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  }

  return NextResponse.json(getAllSessions());
}
