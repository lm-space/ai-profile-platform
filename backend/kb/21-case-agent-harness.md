---
title: Case Study - Six-Protocol Agent Harness (Field Agent)
slug: case-agent-harness
category: case-study
tier: 3
---

# Case Study: Agent Protocol Harness — Six Protocols End to End

## What it is
A deployable proof-of-concept implementing **all six major agent protocols** in one working system, wrapped around a general-purpose field operations agent. Someone in the field asks about inventory, procedures, pricing, compliance, or logistics — and can place an order — through a single agent with a real-time streaming UI.

## Why build it
The agent protocol space fragmented fast. MCP for tools, A2A for agent-to-agent, UCP for commerce, AP2 for payments, A2UI and AG-UI for interface. Every vendor claims their layer is the important one. Reading specs tells you what they claim; implementing all six against one real workflow tells you what they actually do.

## What each protocol does here

| Protocol | Implementation | What it's genuinely for |
|---|---|---|
| **MCP** | 3 tool servers (Inventory, Knowledge, Supplier) with discovery | Giving an agent typed access to systems |
| **A2A** | 3 specialist agents (Pricing, Compliance, Logistics) with Agent Cards | Delegation across agents that don't share a process |
| **UCP** | Commerce adapter — catalog, checkout, order tracking | Structured commerce beyond generic tool calls |
| **AP2** | Payment mandates, authorization, signed receipts, guardrails | Letting an agent spend money without letting it spend freely |
| **A2UI** | React renderer, 18 UI primitives | Agent returns structured UI, not a wall of prose |
| **AG-UI** | SSE gateway emitting typed events per protocol step | Streaming *what the agent is doing*, not just tokens |

## Architecture
Docker Compose stack: React + Vite frontend against a FastAPI orchestrator that emits AG-UI SSE. The orchestrator fans out to three MCP tool servers and three A2A specialist agents. Redis holds conversation memory and handles context injection. A connector service bridges to a real Go commerce backend — deliberately, because protocol demos against mock data hide the integration problems that matter.

## Design decisions worth stealing

**Dual LLM providers with graceful degradation.** Gemini and Kimi, and when both are unavailable or rate-limited it falls back to keyword-based intent classification. Degraded is better than down. Most agent demos have exactly one failure mode: the API key stops working and the whole thing dies.

**AG-UI is what makes it feel real.** Emitting a typed event at every protocol step means the user sees "checking inventory → asking pricing agent → validating compliance" rather than a spinner. It's also the observability layer for free — the same event stream that drives the UI is the trace you debug from.

**Guardrails at the payment boundary.** AP2 mandates and signed receipts mean spending authority is explicit and bounded, checked at the protocol layer rather than hoped for in a system prompt. Any agent action with real-world consequences needs its constraint enforced in code.

**Memory as a service, not a variable.** Redis-backed sessions with explicit context injection keeps memory inspectable and swappable.

## What I concluded
- **MCP and A2A are the two that matter most** — tools and delegation are the real primitives. The others are conveniences at varying maturity.
- **The protocols solve the plumbing, not the hard part.** They standardize how agents talk. Deciding *when* to delegate, what to put in context, and how to recover from a specialist returning nonsense is all still your engineering problem.
- **Streaming the reasoning steps changes user trust more than answer quality does.** People forgive a slow agent whose work they can see; they don't trust a fast one that's opaque.

## Related
Same period, same theme: a Claude-powered SDLC agent driving requirements → stories → acceptance criteria → tests → docs → traceability, integrating Docmost, Jira, and Azure DevOps purely as MCP clients — with Jira and ADO read-only by policy and writes requiring explicit per-action confirmation. Deciding what an agent is *not* allowed to do is as much of the design as its capabilities.
