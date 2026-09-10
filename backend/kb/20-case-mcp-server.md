---
title: Case Study - Production MCP Server (Second Brain)
slug: case-mcp-server
category: case-study
tier: 3
---

# Case Study: Production MCP Server on Cloudflare Workers

## What it is
A live Model Context Protocol server running as a Cloudflare Worker, exposing a personal knowledge and memory system as **31 tools** any MCP-capable agent can call. Not a demo — it's deployed, health-checked, and I use it daily.

**Scope note:** this server is a *memory and knowledge* system — notes, events, tasks, transcripts, documents, finance records. It is a separate project from the portfolio chat agent, which serves my career corpus over tiered RAG and is not an MCP server. Don't describe this one as exposing a resume or profile; that's the other project.

## The problem
LLM agents are stateless between sessions. Everything learned in one conversation evaporates. Standard fixes — dumping history into the context window, or a plain vector store — both break down: the first blows the token budget and buries the signal, the second retrieves semantically similar text with no notion of what superseded what.

I wanted a memory layer with real semantics: facts that can be updated, contradicted, archived, and explained.

## Architecture

**Edge runtime** — Cloudflare Worker. No servers, no cold-start tax at the edge, and it scales without me thinking about it.

**Storage split by access pattern** — this is the core design decision:
- **D1 (SQLite)** — structured records: memories, events, tasks, tags, categories, relations. Anything I need to query relationally or filter exactly.
- **Vectorize (768-dim)** — semantic index, embeddings from Workers AI.
- **R2** — attachments and larger documents.
- **Queue** — async work (ingestion, consolidation) so a slow operation never blocks a tool response.
- **Durable Objects** — per-session state, giving each client conversation a consistent home.

**Cloudflare AI Gateway** in front of model calls for caching, rate limiting, and usage visibility.

**Auth** — OAuth 2.0 plus API-key, because agents connect both interactively and headlessly.

## The 31 tools
The interesting ones aren't the CRUD:

- `supersede_memory` — new fact replaces old, keeping the chain. Memory that only appends becomes contradictory fast.
- `consolidate_memories` — merges fragments into coherent facts, addressing the slow accumulation of near-duplicates.
- `explain_retrieval` — asks the system *why* it returned what it returned. This is the debugging tool I reach for most; opaque retrieval is untestable retrieval.
- `extract_memory_candidates` — proposes what's worth remembering from a transcript, rather than storing everything.
- `summarize_context` — compresses a working set to fit a budget.
- `ingest_transcript` / `ingest_document` — the write path from real material.
- `sql_query` — deliberate escape hatch. No tool API anticipates every question; letting the agent query directly beats shipping a new tool every time.

## What I'd tell someone building one
**Tool descriptions are the real interface.** The model reads descriptions, not implementations. Most "the agent used the wrong tool" bugs are description bugs — say explicitly when to call it *and when not to*.

**Design the write path harder than the read path.** Retrieval quality is capped by what you chose to store. Most memory systems store too much and drown in it.

**Sessions need somewhere to live.** MCP itself is stateless per call. Durable Objects gave conversations continuity without turning the whole server stateful.

**Ship the escape hatch.** `sql_query` has answered more one-off questions than half the purpose-built tools.

## Outcome
Deployed and live, verified by health check. It's the memory layer behind several of my other agents, which is the real test — it's infrastructure I depend on, not a portfolio piece. A separate B2B catalog MCP server runs the same pattern for commerce lookups.
