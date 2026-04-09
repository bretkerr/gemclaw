// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubQuestion {
  id: number;
  question: string;
}

export interface RoundResult {
  round: number;
  subQuestionId: number;
  question: string;
  geminiAnswer: string;
  claudeReview: string;
  synthesized: string;
}

export interface ResearchSession {
  id: string;
  topic: string;
  depth: "quick" | "standard" | "deep";
  status: "decomposing" | "researching" | "complete";
  subQuestions: SubQuestion[];
  rounds: RoundResult[];
  currentRound: number;
  totalRounds: number;
  finalSynthesis: string | null;
  createdAt: number;
}

// ─── In-memory session store ─────────────────────────────────────────────────

const sessions = new Map<string, ResearchSession>();

export function getSession(id: string): ResearchSession | undefined {
  return sessions.get(id);
}

export function getAllSessions(): ResearchSession[] {
  return Array.from(sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
}

// ─── Model calls ─────────────────────────────────────────────────────────────

export async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");

  const messages: { role: string; content: string }[] = [
    { role: "user", content: prompt },
  ];

  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages,
  };
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
  return textBlock?.text ?? "";
}

export async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Engine: start research ──────────────────────────────────────────────────

export async function startResearch(
  topic: string,
  depth: "quick" | "standard" | "deep" = "standard",
  numQuestions?: number
): Promise<ResearchSession> {
  const count = numQuestions ?? (depth === "quick" ? 3 : depth === "standard" ? 5 : 8);

  const decompositionPrompt = `You are a research strategist. Decompose the following topic into exactly ${count} focused sub-questions that, when answered together, will provide a comprehensive understanding of the topic.

Topic: "${topic}"

Return ONLY a JSON array of strings — no markdown, no explanation. Example:
["Question 1?", "Question 2?"]`;

  const raw = await callClaude(decompositionPrompt, "You are a precise research decomposition engine. Return only valid JSON.");

  let questions: string[];
  try {
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    questions = JSON.parse(cleaned);
  } catch {
    questions = raw
      .split("\n")
      .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((l) => l.endsWith("?"));
    if (questions.length === 0) {
      questions = [`What are the key aspects of ${topic}?`];
    }
  }

  const subQuestions: SubQuestion[] = questions.map((q, i) => ({
    id: i + 1,
    question: q,
  }));

  const id = crypto.randomUUID();
  const session: ResearchSession = {
    id,
    topic,
    depth,
    status: "researching",
    subQuestions,
    rounds: [],
    currentRound: 0,
    totalRounds: subQuestions.length,
    finalSynthesis: null,
    createdAt: Date.now(),
  };

  sessions.set(id, session);
  return session;
}

// ─── Engine: run one round (Gemini first, then Claude reviews + synthesizes) ─

export async function runRound(sessionId: string): Promise<RoundResult> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  if (session.status === "complete") throw new Error("Session already complete");

  const idx = session.currentRound;
  if (idx >= session.subQuestions.length) {
    throw new Error("All rounds complete — call synthesize instead");
  }

  const sq = session.subQuestions[idx];

  // Prior context from previous rounds
  const priorContext =
    session.rounds.length > 0
      ? `\n\nPrevious findings:\n${session.rounds
          .map((r) => `Q${r.subQuestionId}: ${r.question}\nA: ${r.synthesized}`)
          .join("\n\n")}`
      : "";

  // Step 1: Gemini researches first
  const geminiPrompt = `You are a research expert. Answer the following question thoroughly with evidence, data, and reasoning.${priorContext}

Question: ${sq.question}

Provide a detailed, well-structured answer.`;

  const geminiAnswer = await callGemini(geminiPrompt);

  // Step 2: Claude reviews, critiques, and enhances
  const claudeReviewPrompt = `You are a senior research analyst reviewing another AI's research output. Your job is to:
1. Identify any gaps, inaccuracies, or unsupported claims
2. Add missing context or nuance
3. Provide a final enhanced answer

Original question: ${sq.question}
${priorContext}

Research output to review:
"""
${geminiAnswer}
"""

Provide your critique and enhanced answer.`;

  const claudeReview = await callClaude(
    claudeReviewPrompt,
    "You are a meticulous research reviewer. Be thorough but constructive."
  );

  // Step 3: Claude synthesizes both perspectives
  const synthesisPrompt = `Synthesize the following two perspectives into a single authoritative answer. Preserve the strongest evidence from each. Be concise but comprehensive.

Question: ${sq.question}

Perspective A (Gemini):
${geminiAnswer}

Perspective B (Claude Review):
${claudeReview}

Write the synthesized answer in clear, well-organized prose.`;

  const synthesized = await callClaude(
    synthesisPrompt,
    "You are a synthesis engine. Merge multiple perspectives into one authoritative answer."
  );

  const result: RoundResult = {
    round: idx + 1,
    subQuestionId: sq.id,
    question: sq.question,
    geminiAnswer,
    claudeReview,
    synthesized,
  };

  session.rounds.push(result);
  session.currentRound = idx + 1;

  sessions.set(sessionId, session);
  return result;
}

// ─── Final synthesis across all rounds ───────────────────────────────────────

export async function synthesizeSession(sessionId: string): Promise<ResearchSession> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  if (session.rounds.length === 0) throw new Error("No rounds completed yet");
  await finalizeSynthesis(session);
  sessions.set(sessionId, session);
  return session;
}

async function finalizeSynthesis(session: ResearchSession): Promise<void> {
  const allFindings = session.rounds
    .map((r) => `## ${r.question}\n${r.synthesized}`)
    .join("\n\n");

  const finalPrompt = `You are producing the final research report on: "${session.topic}"

Below are synthesized findings from ${session.rounds.length} sub-questions:

${allFindings}

Write a comprehensive, well-structured research report that:
1. Opens with an executive summary
2. Integrates all findings into a coherent narrative
3. Identifies key themes and connections between sub-topics
4. Concludes with implications and open questions

Use clear headings and professional prose.`;

  session.finalSynthesis = await callClaude(
    finalPrompt,
    "You are a world-class research writer producing publication-quality reports."
  );
  session.status = "complete";
}
