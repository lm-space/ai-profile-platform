---
title: Topic - Multi-Agent Systems, MCP & Tool Use
slug: topic-multiagent-mcp
category: ai-topic
tier: 3
---

# Multi-Agent Systems, MCP, Tool Use & Function Calling

## MCP — what it's actually for
Model Context Protocol standardizes how an agent reaches tools. Before it, every integration was bespoke glue between one model harness and one system. MCP makes the tool server reusable across any MCP-capable client — which matters far more than it sounds, because it turns integrations into infrastructure instead of per-project work.

I've built on both sides:
- **Server side** — a production Worker exposing 31 tools (memory, search, tasks, ingestion, finance, raw SQL) with OAuth and per-session Durable Object state, plus a separate B2B catalog server.
- **Client side** — the SDLC agent consumes Docmost, Jira, and Azure DevOps entirely as MCP clients, with nothing custom built for those integrations.

**"Stateless MCP"** is the property that makes edge deployment work: each tool call is self-contained, so any Worker instance can serve it and it scales horizontally for free. Real conversations still need continuity, so state lives deliberately outside the protocol — Durable Objects per session in my case. The discipline is keeping the protocol layer stateless and being explicit about where state actually lives, rather than letting it leak into the tool layer.

## Tool use & function calling — what makes it work
**The description is the interface.** The model sees names, descriptions, and schemas — never implementations. Most "the agent used the wrong tool" bugs are description bugs. Say precisely when to call it, and explicitly when *not* to.

**Be prescriptive about triggering.** "Gets weather data" is weak. "Call this when the user asks about current conditions or forecasts; do not call it for historical climate questions" is strong. Recent models are conservative about tool use, so trigger conditions in the description measurably lift the call rate.

**Constrain arguments in the schema.** Enums, required fields, `additionalProperties: false`. Every constraint expressed in the schema is one you don't validate defensively afterward. My evals consistently show argument accuracy failing before tool-name accuracy — the schema is where you fix that.

**Fewer, well-bounded tools beat many overlapping ones.** Two tools with fuzzy boundaries produce more errors than one clear tool. Past a couple dozen, use deferred loading or tool search rather than paying for every schema on every request.

**Return high-signal results.** Tool output goes straight into context. Dumping a 200-field JSON blob when the agent needs three fields wastes budget and buries the signal.

**A worked example:** in this portfolio agent, diagram generation used to be a keyword detector plus a second LLM call plus regex extraction. Replacing all of it with one well-described `render_diagram` tool — where the model decides and returns structured input — deleted more code than it added and improved results. Good tool design removes scaffolding.

## Multi-agent systems
**When multiple agents are genuinely right:** work that's actually independent and parallelizable, specialists needing genuinely different tools or system prompts, or organizational boundaries where separate teams own separate agents.

**When it's the wrong call:** anything one agent could finish in a handful of tool calls. Delegation has real overhead — each subagent re-establishes context, explores, reports back, then the parent re-reads the report. I've watched agents spawn subagents to read a single file. Cost and latency multiply for no gain.

**Patterns I've implemented:**
- **Orchestrator + specialists** — MedGuide: an ADK orchestrator delegating to pharmacist and scheduler agents over A2A. Clean because the specialists genuinely differ in domain and tools.
- **Protocol-mediated delegation** — three A2A specialists (pricing, compliance, logistics) with Agent Cards advertising capability, so the orchestrator routes on declared capability rather than hardcoded wiring.
- **Writer–verifier** — one agent produces, a second with fresh context checks. Fresh-context verification consistently outperforms asking the same agent to self-check, because self-review inherits the same blind spots.

**What actually goes wrong:**
- **Context doesn't transfer.** Subagents don't share conversation history. If the parent doesn't state it explicitly in the delegation, the child doesn't know it. Most multi-agent bugs are underspecified handoffs.
- **Agents overwrite each other.** Shared filesystem or state needs explicit ownership boundaries.
- **Debugging gets much harder.** Which agent made the bad call? Hence X-Request-Id correlation threaded through every hop — multi-agent systems are distributed systems and need distributed tracing.
- **Costs compound quietly.** Every hop is a full model call with its own context.

**My honest position:** start with one agent and good tools. Add agents when you can name the specific boundary that justifies the overhead. Most systems marketed as multi-agent would be better as a single agent with a well-designed tool surface — the complexity is real and the payoff is narrower than the discourse suggests.
