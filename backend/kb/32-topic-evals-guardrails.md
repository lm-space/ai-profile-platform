---
title: Topic - Evaluation Frameworks, Guardrails & Observability
slug: topic-evals-guardrails
category: ai-topic
tier: 3
---

# Evaluation, Guardrails & Observability

## Why this is the unglamorous half that decides whether you ship
Anyone can demo an agent. The gap between demo and production is entirely here: can you tell whether it's good, stop it doing damage, and see what it did?

## Evaluation frameworks

**Evaluate the dimensions that matter for agents**, not generic benchmarks. My fine-tuning eval harness scores:
- Tool-name accuracy — right tool?
- Tool-argument accuracy — right arguments? Much harder, and where models actually fail.
- Refusal accuracy — correctly *declined* when no tool call was warranted.
- Fabricated IDs and URLs — hallucination as a countable integer.

**Break results out by category.** This is the lesson I'd push hardest. A representative run scored 90% tool-argument accuracy overall — a number that sounds fine and tells you nothing. Split by category it was 18/18 perfect on grounded answers and 2/4 on error recovery, with every fabricated ID concentrated in error recovery. That's a specific, actionable finding: the training corpus had too few failure traces. The aggregate would have sent me tuning the wrong thing.

**Weight refusal equally with capability.** Roughly half my eval scenarios expect *no* action. A model that eagerly calls tools scores well on naive benchmarks and behaves badly in production. Over-triggering and under-triggering are both failures.

**Build the eval set from real failures.** Imagined test cases test your imagination. Actual failed conversations test the system. Every production agent should be feeding its failures back into the eval set.

**Version evals with the model.** Prompt, tool schema, and eval fixtures belong in the repo next to the training data. An eval you can't reproduce is an anecdote.

## Guardrails
Layered, because any single layer fails:

**Enforce in code what matters.** The strongest guardrail is one the model can't talk its way past. In my SDLC agent, Jira and Azure DevOps are read-only *by policy*, with writes requiring explicit per-action confirmation. In the field-agent harness, AP2 payment mandates and signed receipts bound spending authority at the protocol layer. A system prompt asking nicely is not a guardrail.

**Constrain the output shape.** Structured outputs and strict tool schemas eliminate an entire class of parse-and-pray failure. If the shape is guaranteed, you stop writing defensive regex.

**Scope credentials to the blast radius.** An agent can do anything its key allows. Over-scoped credentials turn a prompt-injection bug into an incident.

**Ground and cite.** Answer only from retrieved context, and say so when the context doesn't cover it. This portfolio agent is built to decline rather than improvise — a portfolio bot that embellishes is worse than none.

**Handle refusals as a real path.** Safety classifiers decline things; the code has to check for that before reading content, not crash on an empty response.

## Observability
**Log the whole chain, structured.** Every request in my systems records: retrieval hits with scores, the assembled prompt, tool calls and results, provider, model, token counts, latency. When an answer is wrong I need to distinguish "retrieval missed" from "model ignored good context" — different bugs, different fixes. Without that, you're re-rolling and hoping.

**Trace across service boundaries.** In the multi-agent MedGuide system, X-Request-Id correlation threads a single user request through orchestrator and specialist agents. Multi-agent systems are distributed systems; they need distributed tracing.

**Stream the steps.** The AG-UI layer in the harness emits a typed event per protocol step. That's both the UX and the trace — users see what's happening, and I get the debugging timeline from the same stream.

**Watch cost per outcome, not per token.** Token count is an input; what matters is cost per successfully completed task. A cheaper model that needs three attempts isn't cheaper.

**Alert on silent degradation.** The dangerous failure isn't a 500 — it's quality quietly dropping after a prompt tweak or a model version change. That only surfaces if you're running evals continuously against production traffic.

## The pattern
Evaluation tells you if it's good. Guardrails stop it doing harm while you find out. Observability tells you why. Skip any one and you're operating on faith — which is exactly how agent pilots stall out before production.
