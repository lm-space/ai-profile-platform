---
title: Case Study - This Portfolio Agent (RAG + Tool Use)
slug: case-portfolio-agent
category: case-study
tier: 3
---

# Case Study: This Chatbot — Tiered RAG with Inline Diagram Generation

## Meta note
You're talking to it. Everything below describes the system answering you right now, which makes it the one project where the demo and the case study are the same artifact.

## The problem
A portfolio site tells everyone the same story. I wanted something that answers the question actually asked — a recruiter wants career shape, an architect wants integration detail, and neither should have to read the other's version. It has to answer *only* from documented experience, because a portfolio agent that embellishes is worse than no agent.

## Architecture
Cloudflare end to end: **Hono on Workers** (API), **D1** (conversations, knowledge base, request logs), **Workers AI** (embeddings), **Pages** (React + Vite frontend), **Claude** for chat and diagrams.

## Tiered retrieval — the core idea
Standard RAG embeds everything and retrieves top-K. That fails on identity questions: ask "who are you?" and semantic search returns whatever chunk happens to be closest, which might be an SAP case study. Some context should never be subject to a similarity roll.

So retrieval is **tiered**:
- **Tier 1 — always injected.** Identity, core skills, positioning. Never retrieved, never optional. Costs tokens on every request, so it's kept deliberately tight.
- **Tier 2 — topic match.** Project indexes, achievements, approach docs.
- **Tier 3 — semantic search only.** Deep case studies and topic deep-dives, retrieved when relevant.

Retrieval runs **hybrid**: SQLite FTS5 lexical pre-filter, then vector re-ranking by cosine similarity over the candidates, with Tier 1 merged in unconditionally and deduplicated. Lexical catches exact terms (`IDoc`, `DESADV`) that embeddings blur; vectors catch paraphrase. Neither alone is enough.

## Diagrams as a tool call
Ask about an architecture and a Mermaid diagram renders inline. The path there is the more interesting engineering.

**First version:** a keyword detector — 200+ lines of hand-tuned scoring (`score += 0.25` for "architecture", boosts for "how would you build") — decided whether a diagram was needed, then a *second* LLM call generated Mermaid, then regex extracted it from the prose. Three layers of heuristics compensating for a model that couldn't be trusted to decide for itself.

**Current version:** the model gets a `render_diagram` tool and decides. Prose and diagram come back in one turn, the syntax arrives as structured tool input instead of being regex-scraped out of text, and the detector is bypassed entirely. That deleted more code than it added.

The lesson generalizes: **a lot of "AI engineering" is scaffolding built to compensate for model limitations, and it should be deleted when the limitation lifts.** Teams carry that scaffolding for years without revisiting it.

## Other engineering worth noting
- **Provider abstraction** — Claude, OpenAI, and Workers AI behind one interface, switchable at runtime via secret URLs so I can demo the same question against three models live. Capability differences are declared (`supportsDiagramTool`), so the pipeline uses the tool path where available and falls back to the legacy detector where not.
- **Prompt caching** on the system prompt + retrieved context, which is stable within a session and expensive to re-send.
- **Session memory** — conversation history plus a topic summary, so follow-ups have continuity.
- **Full request logging** to D1: retrieval hits and scores, token counts, latency, provider, model. When an answer is wrong I can see whether retrieval missed or the model ignored what it was given. Those are different bugs with different fixes.
- **Confidentiality by construction** — client names never appear; projects are described by domain and scale ("Fortune 500 packaging manufacturer"). Enforced in the system prompt and reflected in how the corpus itself is written.

## Honest limitations
It only knows what's in its knowledge base. Ask about something undocumented and it should say so rather than improvise — that's the intended behavior, not a gap. Retrieval quality is capped by corpus quality, so most improvement work is writing better source documents, not tuning the retriever. And a fixed similarity threshold is a blunt instrument; a reranker model would do better.
