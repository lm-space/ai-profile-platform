---
title: Ela - AI Coding Tools & Development Workflow
slug: ela-ai-toolchain
category: tooling
tier: 2
---

# AI Coding Tools — How I Actually Use Them

## Claude Code (primary harness)
This is where most of my building happens. I use it well past the autocomplete level:

- **Skills** — packaged, reusable instruction sets for recurring workflows, so a complex procedure runs the same way every time instead of depending on how I phrase the prompt that day.
- **Subagents** — fanning work out to parallel agents for broad searches, multi-file reviews, and independent workstreams, then synthesizing the results.
- **Hooks** — deterministic automation on tool events. Code the harness should enforce belongs in a hook, not in a prompt asking the model to please remember.
- **MCP integrations** — wiring my own MCP servers and third-party ones into the coding loop, so the agent reaches real systems instead of guessing.
- **Persistent memory + project instructions** — CLAUDE.md conventions, so standards survive across sessions.

Building *on* these extension surfaces is where a lot of my agent-design intuition comes from. You learn what makes a good tool description by watching a model misuse a bad one.

## Cursor
Fast in-editor iteration — multi-file edits, inline refactors, tight feedback when I know exactly what I want changed. Strongest when the change is well-specified and local.

## Codex-style CLI agents & GitHub Copilot
Copilot for line-level completion in familiar code. CLI agents for scripted, headless, batch-style work — the kind you put in a pipeline rather than drive by hand.

## How I choose between them
Not brand loyalty — shape of the task:
- **Well-specified, local change** → in-editor (Cursor, Copilot). Lowest latency, no ceremony.
- **Open-ended, multi-file, needs exploration** → Claude Code with subagents. The planning and context management earn their cost.
- **Repeatable and scriptable** → CLI agent in a pipeline, no human in the loop.
- **Genuinely novel or high-stakes** → I write it myself and use the agent to review. Reviewing is where these tools are most reliably excellent.

## What I've learned that transfers to building agents
- **Context beats cleverness.** The single biggest quality lever is what's in the window, not how the request is phrased. That lesson drove the tiered retrieval design in my own RAG systems.
- **Tool descriptions are prompts.** A vague description means a misused tool, and no amount of system-prompt scolding fixes it. Say precisely when to call and when not to.
- **Deterministic work belongs in code.** If an outcome is fully determined by its inputs, don't spend a model call on it. Hooks, scripts, and validators are cheaper and never hallucinate.
- **Let it fail loudly.** Silent degradation is the enemy. Structured logging of every tool call and retrieval is what makes an agent debuggable.
- **The harness is the product.** Model quality is table stakes and rising for everyone. The differentiator is the loop around it: context assembly, memory, guardrails, retries, observability.

## Honest take on limits
These tools are exceptional at code that resembles code they've seen, and at reviewing. They're weakest on genuinely novel architecture, on subtle concurrency and state bugs, and on knowing when to stop. I treat generated code as a strong first draft from a fast colleague who has never seen the production incident I'm trying to avoid — reviewed, not trusted by default.
