---
title: Ela - AI & Agentic Project Index
slug: ela-ai-project-index
category: projects
tier: 2
---

# AI & Agentic Systems I've Built

A working index. Each of these is real code I wrote and ran; several are deployed and live. Detailed case studies exist for the larger ones.

## Deployed / live

**Second Brain MCP server** — Production Model Context Protocol server on Cloudflare Workers. 31 tools covering memory CRUD, semantic search, supersede/archive, events, tasks, tags, relations, transcript and document ingestion, context summarization, memory consolidation, retrieval explanation, finance tracking, and raw SQL query. Backed by D1, R2 for attachments, a Queue for async work, Vectorize (768-dimension embeddings) with Workers AI, fronted by Cloudflare AI Gateway. OAuth 2.0 plus API-key auth, Durable Object per session.

**B2B catalog MCP server** — Separate Worker exposing a B2B product catalog as MCP tools for agent-driven commerce lookups.

**This portfolio agent** — The chatbot you're talking to. Tiered RAG over my own career corpus, Claude with tool-use for diagram generation, multi-provider abstraction, streaming SSE, full request logging. Described in its own case study.

## Agent platforms & harnesses

**Agent Protocol Harness (Field Agent)** — Proof-of-concept implementing six agent protocols end to end: MCP (3 tool servers), A2A (3 specialist agents with Agent Cards), UCP (commerce adapter), AP2 (payment mandates and signed receipts), A2UI (18 React UI primitives), and AG-UI (SSE gateway emitting typed events for every protocol step). Redis-backed conversation memory, dual LLM providers with graceful degradation to keyword intent classification when APIs are unavailable.

**MedGuide multi-agent system** — Orchestrator agent (Google ADK LlmAgent) delegating to pharmacist and scheduler specialist agents over A2A, with FastMCP tool servers, deployed across cloud profiles via Docker Compose, and workflow observability threaded through X-Request-Id correlation.

**SDLC Agent** — Claude-powered pipeline: requirements → user stories → acceptance criteria → test cases → test scripts → test data → documentation → traceability. Integrates Docmost, Jira, and Azure DevOps entirely as MCP clients. Jira and ADO are read-only by policy, enforced in the system prompt with per-action confirmation required for any write.

**Multi-agent pricing analysis** — Three specialist agents over local Ollama models with a FastAPI backend and Streamlit UI.

## Model training & evaluation

**CORTEX fine-tuning pipeline** — End-to-end reproducible pipeline: dataset generation → validation → training → evaluation → report, in one command, with every stage idempotent and resumable. Unsloth on Qwen2.5 (1.5B / 3B / 7B variants). Custom evaluation harness scoring tool-name accuracy, tool-argument accuracy, refusal accuracy, and — importantly — counting fabricated IDs and URLs as an explicit hallucination metric.

## Assistants & applied agents

**Personal assistant platform** — Multi-agent personal assistant (planning, fitness, bill negotiation over Twilio, email management) on Next.js with Cloudflare D1.

**Voice-driven commerce agent** — Turborepo monorepo with separate voice, orchestrator, flow-engine, MCP-agent, and scraper packages; real-time speech pipeline with STT correction and menu-cache tooling.

**Social content pipeline** — Message-in, multi-platform-out publishing agent on Workers with image and video generation.

**AI classroom** — LangGraph-driven interactive teaching system generating slides, quizzes, and simulations.

**Desktop automation agent** — Electron agent for local file, document, and browser automation.

## Range note
These span Cloudflare Workers, Python/FastAPI, Node/TypeScript, Go backends, Flutter, and Electron; Claude, OpenAI, Gemini, Kimi, and local Ollama models. The pattern-level lessons transfer across all of them — which is the actual point of building this many.
