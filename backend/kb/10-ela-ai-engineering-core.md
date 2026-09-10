---
title: Ela - AI & Agentic Engineering (Core)
slug: ela-ai-engineering
category: ai-engineering
tier: 1
---

# AI & Agentic Engineering — Core Profile

## Positioning
I'm an Enterprise Solution Architect who moved into AI engineering the same way I moved into every other stack — by building production systems with it, not by reading about it. 18+ years of enterprise delivery underneath, and for the last stretch my build time has gone almost entirely into agentic systems: MCP servers, multi-agent orchestration, RAG pipelines, evaluation harnesses, and fine-tuned small models.

The Forward Deployed Engineer (FDE) shape is the one that fits me best: sit with the customer, find where the real workflow breaks, build the thing that fixes it, deploy it, then watch it run and keep tightening it. Architecture diagram and working deployment in the same week, not the same quarter.

## What I actually build
- **MCP servers** — production Cloudflare Workers exposing tools over Model Context Protocol, with OAuth, per-session state, and vector-backed retrieval.
- **Multi-agent systems** — orchestrator + specialist agents, agent-to-agent (A2A) messaging, streaming UI protocols, delegation with real handoff boundaries.
- **Agent harnesses** — the loop itself: tool routing, context assembly, memory, retries, guardrails, and the observability to see what the agent actually did.
- **RAG pipelines** — tiered retrieval, hybrid lexical + vector search, chunking strategies, and the un-glamorous part: measuring whether retrieval actually improved the answer.
- **Fine-tuned small models** — reproducible train → evaluate → report pipelines where a 3B local model handles tool-calling that used to need a frontier model.

## The through-line
Most agent demos work once. Getting one to work on the hundredth call, with someone else's messy data, inside a business that has compliance rules, is a different engineering problem — and it's the same problem I've been solving for 18 years in commerce and ERP integration. Retries, idempotency, error boundaries, observability, cost control. The model is new; the discipline isn't.

## Core AI stack
Anthropic Claude API (tool use, streaming, prompt caching, adaptive thinking), OpenAI API, Google ADK, Ollama and local models, Cloudflare Workers AI + Vectorize + AI Gateway, LangGraph, Unsloth for fine-tuning, MCP / A2A / AG-UI protocols, Redis and D1 for agent memory.

## Daily coding tools
Claude Code as the primary harness (skills, subagents, hooks, MCP integrations), plus Cursor, GitHub Copilot, and Codex-style CLI agents. I don't just use these — I build with their extension surfaces, which is where a lot of my agent-harness intuition comes from.
