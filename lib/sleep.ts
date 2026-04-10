// lib/sleep.ts
// "Sleep consolidation" protocol inspired by Demis Hassabis's thesis that
// LLMs need a "sleep" mechanism to bind lessons learned across rounds.
// In the GemClaw MoE each round involves Gemini extracting data and Claude
// reviewing/synthesizing. This module adds a consolidation step between rounds.

import { callClaude } from "./moe-engine";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SleepMemory {
  round: number;
  keyFindings: string[];        // extracted key facts from the round
  contradictions: string[];     // contradictions detected vs prior rounds
  gaps: string[];               // knowledge gaps identified
  consolidatedInsight: string;  // compressed insight after "sleep"
  coherenceScore: number;       // 0-1 how well findings bind together
  noveltyScore: number;         // 0-1 how much new info this round added
  entropyDelta: number;         // change in information entropy
}

export interface SleepCycle {
  sessionId: string;
  memories: SleepMemory[];
  totalCoherence: number;
  totalNovelty: number;
  bindingStrength: number;      // how well rounds connect to each other
}

// ─── In-memory store ────────────────────────────────────────────────────────

const sleepCycles = new Map<string, SleepCycle>();

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Simple entropy heuristic: unique-word ratio of a text.
 * Returns a value between 0 and 1 where 1 = every word is unique.
 */
function uniqueWordRatio(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) ?? [];
  if (words.length === 0) return 0;
  const unique = new Set(words);
  return unique.size / words.length;
}

/**
 * Compute binding strength: average pairwise overlap of key findings across
 * all memories in a cycle.  Higher means rounds reinforce each other.
 */
function computeBindingStrength(memories: SleepMemory[]): number {
  if (memories.length < 2) return 0;

  let pairCount = 0;
  let totalOverlap = 0;

  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const setA = new Set(
        memories[i].keyFindings.map((f) => f.toLowerCase())
      );
      const wordsB = memories[j].keyFindings.map((f) => f.toLowerCase());
      const shared = wordsB.filter((w) => {
        for (const a of setA) {
          if (a.includes(w) || w.includes(a)) return true;
        }
        return false;
      }).length;
      const maxLen = Math.max(setA.size, wordsB.length, 1);
      totalOverlap += shared / maxLen;
      pairCount++;
    }
  }

  return pairCount > 0 ? totalOverlap / pairCount : 0;
}

// ─── Core functions ─────────────────────────────────────────────────────────

/**
 * Consolidate a single round's output into a SleepMemory.
 *
 * Calls Claude to:
 *   1. Extract key findings from the round's synthesis
 *   2. Identify contradictions with prior round findings
 *   3. Identify remaining knowledge gaps
 *   4. Produce a compressed "consolidated insight" (the "dreaming" output)
 *   5. Score coherence (0-1), novelty (0-1)
 *
 * Entropy delta is computed locally as the difference in unique-word ratio
 * between this round's text and the concatenation of prior rounds.
 */
export async function consolidateRound(
  sessionId: string,
  roundResult: string,
  priorMemories: SleepMemory[] = []
): Promise<SleepMemory> {
  const roundIndex = priorMemories.length + 1;

  // Build context from prior memories
  const priorContext =
    priorMemories.length > 0
      ? priorMemories
          .map(
            (m) =>
              `Round ${m.round}: ${m.consolidatedInsight}\nKey findings: ${m.keyFindings.join("; ")}`
          )
          .join("\n\n")
      : "No prior rounds.";

  const systemPrompt =
    "You are a memory consolidation engine. Your role is to analyze research " +
    "round output and produce a sleep consolidation report that binds new " +
    "findings with prior knowledge, identifies contradictions, and highlights " +
    "remaining gaps. Respond ONLY with valid JSON — no markdown fences, no " +
    "commentary outside the JSON object.";

  const userPrompt = `Analyze the following research round output and produce a sleep consolidation report.

## Prior round summaries
${priorContext}

## Current round output (Round ${roundIndex})
${roundResult}

Return a JSON object with exactly these fields:
{
  "keyFindings": ["..."],        // 3-5 key facts extracted from this round
  "contradictions": ["..."],     // contradictions with prior rounds (empty array if none)
  "gaps": ["..."],               // knowledge gaps still remaining
  "consolidatedInsight": "...",  // one concise paragraph compressing this round's contribution
  "coherenceScore": 0.0,        // 0-1: how well this round's findings cohere with prior rounds
  "noveltyScore": 0.0           // 0-1: how much genuinely new information this round added
}`;

  const raw = await callClaude(userPrompt, systemPrompt);

  // Parse JSON from Claude's response — strip markdown fences if present
  let parsed: {
    keyFindings: string[];
    contradictions: string[];
    gaps: string[];
    consolidatedInsight: string;
    coherenceScore: number;
    noveltyScore: number;
  };

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in response");
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    // Fallback: build a minimal memory so the pipeline doesn't break
    parsed = {
      keyFindings: ["Unable to parse consolidation output"],
      contradictions: [],
      gaps: ["Consolidation parsing failed — manual review needed"],
      consolidatedInsight: raw.slice(0, 500),
      coherenceScore: 0.5,
      noveltyScore: 0.5,
    };
  }

  // Compute entropy delta locally
  const priorText = priorMemories.map((m) => m.consolidatedInsight).join(" ");
  const priorEntropy = uniqueWordRatio(priorText);
  const currentEntropy = uniqueWordRatio(roundResult);
  const entropyDelta = currentEntropy - priorEntropy;

  const memory: SleepMemory = {
    round: roundIndex,
    keyFindings: parsed.keyFindings,
    contradictions: parsed.contradictions,
    gaps: parsed.gaps,
    consolidatedInsight: parsed.consolidatedInsight,
    coherenceScore: Math.max(0, Math.min(1, parsed.coherenceScore)),
    noveltyScore: Math.max(0, Math.min(1, parsed.noveltyScore)),
    entropyDelta: parseFloat(entropyDelta.toFixed(4)),
  };

  // Upsert the sleep cycle
  const existing = sleepCycles.get(sessionId);
  if (existing) {
    existing.memories.push(memory);
    existing.totalCoherence =
      existing.memories.reduce((s, m) => s + m.coherenceScore, 0) /
      existing.memories.length;
    existing.totalNovelty =
      existing.memories.reduce((s, m) => s + m.noveltyScore, 0) /
      existing.memories.length;
    existing.bindingStrength = computeBindingStrength(existing.memories);
  } else {
    sleepCycles.set(sessionId, {
      sessionId,
      memories: [memory],
      totalCoherence: memory.coherenceScore,
      totalNovelty: memory.noveltyScore,
      bindingStrength: 0,
    });
  }

  return memory;
}

/**
 * Return the full SleepCycle for a session, or null if none exists.
 */
export function getSleepCycle(sessionId: string): SleepCycle | null {
  return sleepCycles.get(sessionId) ?? null;
}

/**
 * Return chart-friendly metrics for the sleep cycle.
 */
export function getSleepMetrics(sessionId: string): {
  rounds: number[];
  coherence: number[];
  novelty: number[];
  entropy: number[];
  bindingStrength: number;
} | null {
  const cycle = sleepCycles.get(sessionId);
  if (!cycle) return null;

  return {
    rounds: cycle.memories.map((m) => m.round),
    coherence: cycle.memories.map((m) => m.coherenceScore),
    novelty: cycle.memories.map((m) => m.noveltyScore),
    entropy: cycle.memories.map((m) => m.entropyDelta),
    bindingStrength: cycle.bindingStrength,
  };
}
