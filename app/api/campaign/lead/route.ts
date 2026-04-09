import { NextRequest, NextResponse } from "next/server";

interface Lead {
  email: string;
  message: string;
  source: string;
  timestamp: string;
  receivedAt: number;
}

const leads: Lead[] = [];

export async function POST(req: NextRequest) {
  try {
    const { email, message, source, timestamp } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const lead: Lead = {
      email,
      message: message || "",
      source: source || "x-campaign",
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: Date.now(),
    };

    leads.push(lead);
    console.log(`[LEAD] New lead captured:`, JSON.stringify(lead));
    console.log(`[LEAD] Total leads: ${leads.length}`);

    return NextResponse.json({ success: true, message: "Signal received" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ count: leads.length, leads });
}
