# GEMCLAW.CLICK — Project Briefing

## What It Is

GemClaw is a cross-model Mixture of Experts (MoE) deep research engine that orchestrates autonomous research dialogues between Anthropic Claude (Sonnet 4) and Google Gemini (2.5 Flash). It is a live product deployed at https://gemclaw.click, built on Next.js 15 and hosted on Vercel.

The domain cost $1.50. The entire product was built and deployed in a single session.

## How It Works

The MoE engine runs a 4-stage research protocol:

1. **DECOMPOSE** — Claude Sonnet 4 receives a research topic and breaks it into N focused sub-questions (3 for quick, 5 for standard, 8 for deep). This creates a structured research plan optimized for parallel extraction.

2. **EXTRACT** — Gemini 2.5 Flash takes each sub-question and independently gathers data, evidence, and reasoning. Gemini goes first in every round because it functions as the broad-spectrum data gatherer.

3. **SYNTHESIZE** — Claude reviews Gemini's output, identifies gaps, surfaces contradictions, adds missing context, and produces a critique. Then Claude merges both perspectives into a single synthesized answer per sub-question.

4. **CONVERGE** — After all rounds complete, Claude produces a final research report that integrates all sub-question findings into a coherent narrative with an executive summary, key themes, and open questions.

Each round involves 3 API calls: one to Gemini, two to Claude (review + synthesis). A 5-question standard session makes 16 total API calls (1 decomposition + 15 round calls). Sessions are stored in-memory on the server.

## Architecture

- **Framework**: Next.js 15 App Router, React 19, TypeScript strict mode
- **Hosting**: Vercel (120s maxDuration on API routes)
- **Models**: Claude Sonnet 4 via Anthropic Messages API, Gemini 2.5 Flash via Google Generative Language API
- **No SDK dependencies**: Both model integrations use raw fetch() to the REST APIs
- **State**: In-memory Map<string, ResearchSession> — sessions persist within a single serverless function lifecycle

## Site Structure

| Route | Purpose |
|---|---|
| `/` | Brand landing page — vantablack velvet rope with animated SVG claw crushing a gemstone, glitch text, scanlines, then reveals product hero + manifesto + architecture grid |
| `/campaign` | Lead capture funnel for X/Twitter traffic — hero, explainer cards, proof stats, email form (POSTs to /api/campaign/lead), Loom video placeholder |
| `/research` | The actual MoE research engine UI — topic input, depth selector, round-by-round execution with Gemini (blue) and Claude (orange) output cards, synthesize button, final report |
| `/api/research` | POST to start session, GET to list/fetch sessions |
| `/api/research/rounds` | POST to execute next round |
| `/api/research/synthesize` | POST to generate final cross-round synthesis |
| `/api/campaign/lead` | POST to capture leads (email, message, source, timestamp) |

## Brand Identity

- **Name**: GemClaw — "The gem is the value; the claw is how we take it"
- **Tagline**: "Secure the human signal"
- **Parent company**: ACRA Insight LLC
- **Color system**: #000000 vantablack background, #E5E4E2 raw platinum text, #FF0800 arterial red accent
- **Fonts**: Bebas Neue (display), Space Mono (body)
- **Tone**: Aggressive, minimalist, anti-soft. "We don't nudge. We don't suggest. We extract."
- **Adjacent projects**: Context Jamming (Substack), SignalGraph, FounderFile

## Business Model Considerations

- The research engine currently runs on API credits (Anthropic + Google). Cost per deep research session is roughly $0.15-0.40 depending on depth and topic complexity.
- The campaign page at /campaign is designed to capture leads from X/Twitter with email + research interest.
- The product demonstrates a novel interaction pattern: cross-model MoE where models with different training data and reasoning styles are pitted against each other to produce higher-quality output than either alone.
- The in-memory session store means sessions don't persist across deploys or cold starts — this is the first thing to upgrade for production (database, Redis, or Vercel KV).
- Domain: gemclaw.click — registered, pointed at Vercel, SSL provisioned.

## Key Metrics to Model

- **+33% information gain**: Cross-model synthesis produces measurably richer output than single-model queries on the same topic
- **2x models**: Two frontier models in autonomous dialogue per session
- **142s average session**: Typical deep research session runtime
- **$1.50 domain cost**: Total infrastructure investment for the domain
- **16 API calls per standard session**: 1 decomposition + 5 rounds × 3 calls each

## What I Need From You

Build a business plan for GemClaw as a product. Consider pricing tiers, go-to-market strategy, competitive positioning against Perplexity/ChatGPT deep research/Google Deep Research, infrastructure scaling, and revenue projections. The core differentiator is the cross-model MoE architecture — no other product on the market uses adversarial cross-model dialogue as a research methodology.
