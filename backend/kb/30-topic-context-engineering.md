---
title: Topic - Context Engineering & Agent Harness Design
slug: topic-context-engineering
category: ai-topic
tier: 3
---

# Context Engineering, Harness Design & Loop Engineering

## Why context engineering is the actual job
Prompt engineering was about phrasing. Context engineering is about **what's in the window at the moment the model decides** — and it's the larger lever by a wide margin. Same model, same question, different context: completely different answer quality.

Every agent I've built comes down to the same budget problem. The window is finite. Everything competing for it — system prompt, tool definitions, retrieved documents, conversation history, tool results — has a cost, and most of it is noise on any given turn. The engineering is deciding what earns its place.

## Principles I work to

**Stable content first, volatile content last.** Prompt caching is a prefix match: one changed byte early invalidates everything after it. Frozen system prompt at the front, per-request content at the back. Interpolating a timestamp into a system prompt silently destroys caching for the whole request — a mistake I've seen in plenty of codebases.

**Tier your context by certainty, not just similarity.** Some facts must always be present; retrieval should never get a vote. My tiered RAG design exists because pure top-K retrieval failed on identity questions — semantic search returned a case study when asked "who are you?"

**Retrieved ≠ relevant.** A similarity score above threshold means "vaguely related." Injecting five marginal chunks is often worse than injecting one good one, because the model weights everything you hand it as intentional.

**Tool definitions are context too.** They render before the system prompt and cost tokens on every request. Thirty always-loaded tool schemas is a real budget line. Past a couple dozen, deferred loading or tool search beats loading everything.

**Clear what's stale.** Long agent loops accumulate dead tool results. Old outputs from three steps ago compete for attention with current state. Pruning or compacting them measurably improves late-loop behavior.

## Loop engineering
The agent loop is where most quality lives, and it's mostly unglamorous:

- **Termination.** When does it stop? Iteration caps, budget caps, explicit done-conditions. Loops that can't terminate are the single most expensive bug in agent systems.
- **Error recovery.** What happens when a tool errors? My fine-tuning evals showed exactly this: models are fine on the happy path and start fabricating under error conditions. The loop has to handle failure explicitly, not hope the model does.
- **Parallelism.** Independent tool calls should run concurrently and return in one batch. Splitting parallel results across turns teaches the model to stop parallelizing.
- **Delegation boundaries.** Subagents cost real overhead — each re-establishes context, explores, reports back, and the parent re-reads the report. Worth it for genuinely independent, sizeable work; wasteful for something the parent could finish in a few calls.
- **Interception points.** The loop needs hooks for approval gates, logging, and result modification. Anything with real-world consequence gets a gate that's enforced in code, not requested in a prompt.

## Harness design
The harness — not the model — is the differentiator. Model quality is rising for everyone simultaneously; what distinguishes systems is the loop around it: context assembly, memory, tool routing, guardrails, retries, observability.

Concretely, a harness I'd consider production-ready has: deterministic context assembly, structured logging of every tool call and retrieval, explicit budget and iteration caps, graceful degradation when a provider fails, an eval set built from real failed conversations, and the ability to answer "why did it do that?" after the fact.

That last one is the test. If you can't reconstruct why an agent did something, you can't improve it — you can only re-roll and hope.

## Graph engineering
For workflows with real branching and state, a graph beats a free-running loop. Explicit nodes and edges make the flow inspectable, testable, and resumable, and they stop the model from re-deciding control flow it shouldn't own. I've used LangGraph for this and hand-rolled orchestrators where the graph was simple enough not to warrant a framework. The judgment call: a graph where the control flow is known, a loop where genuine open-ended exploration is the point. Reaching for a graph when you need exploration produces a rigid system; reaching for a loop when the flow is known produces an unpredictable one.
