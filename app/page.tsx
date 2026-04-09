"use client";

import { useState, useCallback } from "react";

interface SubQuestion {
  id: number;
  question: string;
}

interface RoundResult {
  round: number;
  subQuestionId: number;
  question: string;
  geminiAnswer: string;
  claudeReview: string;
  synthesized: string;
}

interface ResearchSession {
  id: string;
  topic: string;
  depth: string;
  status: string;
  subQuestions: SubQuestion[];
  rounds: RoundResult[];
  currentRound: number;
  totalRounds: number;
  finalSynthesis: string | null;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startResearch = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setLoadingMsg("Claude is decomposing your topic into sub-questions...");
    setSession(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, depth }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start research");
      }

      const newSession: ResearchSession = await res.json();
      setSession(newSession);

      // Auto-run all rounds sequentially
      for (let i = 0; i < newSession.totalRounds; i++) {
        setLoadingMsg(
          `Round ${i + 1}/${newSession.totalRounds}: Gemini researches, Claude reviews...`
        );

        const roundRes = await fetch("/api/research/rounds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: newSession.id }),
        });

        if (!roundRes.ok) {
          const err = await roundRes.json();
          throw new Error(err.error || "Round failed");
        }

        const { session: updatedSession } = await roundRes.json();
        setSession(updatedSession);
      }

      setLoadingMsg("");
    } catch (err) {
      setLoadingMsg(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }, [topic, depth]);

  return (
    <div className="container">
      <header>
        <h1>
          Deep Research <span className="claude">Claude</span> x{" "}
          <span className="gemini">Gemini</span>
        </h1>
        <p>Cross-model Mixture of Experts research engine</p>
      </header>

      <div className="research-form">
        <input
          type="text"
          placeholder="Enter a research topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && startResearch()}
          disabled={loading}
        />
        <div className="form-row">
          <select
            className="depth-select"
            value={depth}
            onChange={(e) =>
              setDepth(e.target.value as "quick" | "standard" | "deep")
            }
            disabled={loading}
          >
            <option value="quick">Quick (3 questions)</option>
            <option value="standard">Standard (5 questions)</option>
            <option value="deep">Deep (8 questions)</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={startResearch}
            disabled={loading || !topic.trim()}
          >
            {loading ? "Researching..." : "Start Research"}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <span className="spinner" />
          <span className="loading-text">{loadingMsg}</span>
        </div>
      )}

      {session && (
        <div className="session">
          <div className="session-header">
            <h2>{session.topic}</h2>
            <span
              className={`badge ${
                session.status === "complete"
                  ? "badge-complete"
                  : "badge-researching"
              }`}
            >
              {session.status}
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(session.currentRound / session.totalRounds) * 100}%`,
              }}
            />
          </div>

          <ul className="sub-questions">
            {session.subQuestions.map((sq, i) => {
              const isDone = i < session.currentRound;
              const isActive = i === session.currentRound && loading;
              return (
                <li
                  key={sq.id}
                  className={isDone ? "done" : isActive ? "active" : "pending"}
                >
                  {sq.question}
                </li>
              );
            })}
          </ul>

          {session.rounds.map((r) => (
            <div key={r.round} className="round-result">
              <h3>
                Round {r.round}: {r.question}
              </h3>

              <div className="model-output">
                <div className="model-label gemini">Gemini Research</div>
                <div
                  className={`model-text ${
                    expandedSections.has(`g-${r.round}`) ? "expanded" : ""
                  }`}
                >
                  {r.geminiAnswer}
                </div>
                <button
                  className="toggle-btn"
                  onClick={() => toggleExpand(`g-${r.round}`)}
                >
                  {expandedSections.has(`g-${r.round}`)
                    ? "Collapse"
                    : "Expand"}
                </button>
              </div>

              <div className="model-output">
                <div className="model-label claude">Claude Review</div>
                <div
                  className={`model-text ${
                    expandedSections.has(`c-${r.round}`) ? "expanded" : ""
                  }`}
                >
                  {r.claudeReview}
                </div>
                <button
                  className="toggle-btn"
                  onClick={() => toggleExpand(`c-${r.round}`)}
                >
                  {expandedSections.has(`c-${r.round}`)
                    ? "Collapse"
                    : "Expand"}
                </button>
              </div>

              <div className="model-output">
                <div className="model-label synth">Synthesized Answer</div>
                <div
                  className={`model-text expanded`}
                >
                  {r.synthesized}
                </div>
              </div>
            </div>
          ))}

          {session.finalSynthesis && (
            <div className="final-report">
              <h3>Final Research Report</h3>
              <div className="report-content">{session.finalSynthesis}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
