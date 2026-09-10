---
title: Case Study - Fine-Tuning & Evaluation Pipeline (CORTEX)
slug: case-finetuning-evals
category: case-study
tier: 3
---

# Case Study: Fine-Tuning a Small Model for Tool Calling — With Real Evals

## The goal
Take a small open model and train it to reliably drive a tool-calling agent over a specific document corpus, well enough that it doesn't need a frontier model for every request. Cost and latency drop hard if a 3B model handles the routine calls.

## The pipeline
One command rebuilds the model from nothing: **dataset → validate → train → evaluate → report.** Every stage idempotent and independently resumable.

```
./run-pipeline.sh rjr                 # full run, 3B base
./run-pipeline.sh rjr --base 1.5B     # smaller/faster variant
./run-pipeline.sh rjr --stage eval    # resume from a stage
```

That reproducibility is the point, and it's written into the script's own comments: *a run that only exists as shell history cannot be reproduced, compared, or trusted.* Fine-tuning goes wrong when nobody can say what produced the checkpoint that's serving traffic.

**Stack** — Unsloth on Qwen2.5 Instruct, swappable across 1.5B / 3B / 7B so I can measure what capability actually costs. Training data generated from a real document corpus into JSONL, with the tool schema and system prompt versioned alongside it as fixtures.

## The evaluation harness — the part people skip
A custom evaluator scoring dimensions that matter for an *agent*, not generic language benchmarks:

- **Tool-name accuracy** — did it pick the right tool?
- **Tool-argument accuracy** — right tool, right arguments? Much harder, and where models actually fail.
- **Refusal accuracy** — when it should NOT have called a tool, did it correctly decline? Over-triggering is as damaging as under-triggering.
- **Fabricated IDs and URLs** — a direct, countable hallucination metric.

Scored per category: `task_ops`, `grounded_answer`, `error_recovery`, `refusal`.

## Results from a representative run
3B fine-tune, 40 scenarios / 101 turns:

- Tool-name accuracy: **100%**
- Tool-argument accuracy: **90%**
- Refusal accuracy: **100%**
- Fabricated IDs: 3 — all in `error_recovery`
- Fabricated URLs: 3

The failure pattern is the interesting result. `grounded_answer` was clean: 18/18 correct tool names *and* arguments, zero fabrications. Everything degraded in **`error_recovery`** — when a tool returned an error, argument accuracy fell to 2 of 4 and the model invented plausible-looking IDs to keep going.

## What that taught me
**Aggregate scores hide the failure mode.** "90% tool-argument accuracy" sounds fine and is useless as guidance. Broken out by category it says something specific and actionable: this model is solid on the happy path and unreliable under error conditions. That's a training-data gap — the corpus had far more successful traces than failed ones.

**Hallucination has to be counted, not vibed.** Making fabricated IDs and URLs an integer in a report changes the conversation. It turns "it sometimes makes things up" into a number that moves between runs.

**Refusal deserves equal weight to capability.** Half my eval scenarios expect *no* tool call. A model that calls tools eagerly scores well on naive benchmarks and behaves badly in production.

**Small models are genuinely viable for narrow, well-specified tool use** — with the eval harness to prove it on your workload. Without evals you're guessing, and the guess is usually optimistic.

## Where this fits
This is the counterweight to "just call a frontier model." For high-volume, narrow, well-defined tool routing, a fine-tuned 3B running locally is dramatically cheaper and faster — provided you can *measure* that it's good enough. The evaluation harness is what makes that decision defensible instead of a hunch.
