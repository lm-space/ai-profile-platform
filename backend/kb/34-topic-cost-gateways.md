---
title: Topic - AI Gateways, Cost Optimization & Model Selection
slug: topic-cost-gateways
category: ai-topic
tier: 3
---

# AI Gateways, Cost Optimization, Prompt Optimization & Model Selection

## Why cost is an architecture problem, not a billing problem
An agent that works beautifully and costs more per interaction than the outcome is worth doesn't reach production. I treat cost and latency as design constraints from the first sketch, the same way I treat page-load budgets in commerce work — where sub-2-second loads on high-traffic sites were never optional either.

## AI gateways
A gateway in front of model calls buys you caching, rate limiting, usage analytics, and a single control point for provider routing. I run Cloudflare AI Gateway in front of the memory server's model calls.

The bigger architectural win is a **provider abstraction** in your own code. In this portfolio agent, Claude, OpenAI, and Workers AI sit behind one interface, with capability differences declared explicitly rather than assumed — the pipeline checks whether a provider supports inline diagram tool calls and takes a different path when it doesn't. Runtime switching means I can put the same question to three models live and compare.

That abstraction pays for itself in three ways: no lock-in, graceful degradation when a provider is down or rate-limited, and the ability to route by task rather than by habit. The field-agent harness took this further — dual LLM providers falling back to keyword-based intent classification when both were unavailable. Degraded beats down.

## Concrete cost levers I use

**Prompt caching.** The system prompt plus retrieved context is large, stable within a session, and expensive to resend. Cached, it reads at a fraction of input cost. The trap is invalidation: caching is a prefix match, so a timestamp or per-request ID early in the prompt silently destroys it. Verify with cache-read token counts rather than assuming.

**Tiered retrieval.** Only always-on context rides every request; deep material is fetched when relevant. Directly reduces tokens per call without reducing answer quality — because the marginal chunks weren't helping anyway.

**Effort and thinking tuning.** Modern models expose reasoning-depth controls. Conversational turns don't need maximum reasoning; a hard architectural question might. Matching effort to task is one of the largest cost levers available and one of the least used.

**Right-sized models.** Frontier models for genuinely hard reasoning; small and local models for narrow, well-specified work. My fine-tuned 3B Qwen hit 100% tool-name accuracy and 100% refusal accuracy on its target workload — for high-volume routine tool routing that's dramatically cheaper than a frontier call. The requirement is an eval harness proving it's good enough; without measurement, "use a smaller model" is a guess.

**Fewer round trips.** Replacing the diagram detector plus second generation call with a single tool call removed an entire model round trip per diagram request — cheaper and faster, from a design change rather than a pricing change.

**Cap the loop.** Iteration limits and token budgets. Runaway agent loops are the most expensive failure mode there is, and they fail quietly until the invoice arrives.

**Trim tool surface.** Tool schemas render on every request. Thirty always-loaded tools is a standing tax; deferred loading past a couple dozen.

## Prompt optimization
Beyond phrasing:
- **Delete scaffolding written for older models.** Prompts accumulate workarounds — "think step by step", aggressive `CRITICAL: YOU MUST` emphasis, format-forcing hacks — that are unnecessary or actively harmful on current models. Emphasis written to overcome an old model's reluctance causes over-triggering on a compliant one. I audit for this rather than letting it pile up.
- **Positive instruction beats prohibition lists.** Describing the desired behavior outperforms enumerating failures, and long prohibition lists can anchor toward the very failure they name.
- **Structure for caching.** Stable content first, volatile last — a prompt-organization decision with a direct cost consequence.
- **Measure, don't vibe.** Prompt changes should move an eval number. "Feels better" is how prompts rot.

## Model selection in practice
Not brand loyalty — shape of task:
- **Complex reasoning, architecture, long-horizon agentic work** → frontier model, higher effort.
- **High-volume routine classification or routing** → small or fine-tuned local model, measured.
- **Latency-critical interactive** → smaller model or lower effort setting.
- **Anything touching sensitive data with residency constraints** → local model, full stop.

The meta-point: build so this decision is changeable. Providers, prices, and capabilities move fast. A system with a clean provider boundary can take advantage of that; one with a vendor SDK threaded through the business logic can't.
