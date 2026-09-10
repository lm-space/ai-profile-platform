---
title: Ela - R&D, POCs & What Genuinely Excites Me
slug: ela-research-poc
category: approach
tier: 2
---

# R&D and POCs — How I Learn, and What I Chase

## The honest version
I build things on weekends that nobody asked for. There are 40+ POCs sitting in my projects folder — most were built to answer a specific question I couldn't answer by reading, and a handful turned into things I actually run.

That's not a side habit; it's how I stay useful. Enterprise architecture rewards judgment, and judgment comes from having been wrong about something concrete. Reading a spec tells you what a technology claims. Building with it tells you what it costs.

## What actually excites me

**Protocol spelunking.** When a new agent protocol lands, I want to implement it against a real workflow rather than read the announcement. That's why I built a harness implementing six of them end to end — MCP, A2A, UCP, AP2, A2UI, AG-UI. The conclusion only came from building: MCP and A2A carry the real weight; the rest are conveniences at varying maturity. You don't get that from a blog post.

**Making expensive things cheap.** Taking something that needs a frontier model and getting a 3B local model to do it — with an eval harness proving it's good enough — is my favourite kind of problem. It's the same instinct as getting a Magento store under 2 seconds: the constraint is the interesting part.

**Agent-driven browser automation.** Letting an agent drive a real browser to verify its own work, read console errors, and check the deployed page. It closes the loop between "the code compiles" and "the thing actually works," which is where most of the remaining gap lives.

**Local-first and edge inference.** Ollama, local Whisper transcription, voice interfaces, running models on hardware I own. Partly cost, partly latency, mostly that data residency stops being a negotiation when nothing leaves the machine.

**Systems that remember.** Memory that supersedes and consolidates rather than just accumulating. Getting that right is more interesting than any single model capability, and it's largely unsolved.

## How I run a POC

**One question per POC.** Not "explore agents" — "can a fine-tuned 3B model call tools accurately enough to replace a frontier model on this workload?" A POC that isn't answering a specific question becomes a hobby project that never concludes.

**Working code beats a deck.** I'd rather show a rough thing running than present slides about a thing that might run. If it isn't in code, I don't actually know whether it works.

**Ship it somewhere.** Most of my POCs deploy — Workers, Fly, a container on a box. Deployment surfaces problems that localhost hides: cold starts, auth, network policy, timeouts.

**Write down the verdict.** Every POC gets a README with what it was for and what I concluded — including "this was a dead end, here's why." An experiment whose result you didn't record cost you the time and gave you nothing back.

**Kill it or promote it.** POCs that answer their question get archived. The few that keep earning their keep become real, get tests, and get documented properly.

## Range as a deliberate choice
The POC pile spans Cloudflare Workers, Python/FastAPI, Node/TypeScript, Go, Flutter, Electron; Claude, OpenAI, Gemini, Kimi, and local Ollama models; commerce, healthcare-shaped workflows, education data, personal productivity, voice, and vision.

That breadth is the point. Patterns transfer. Retry and idempotency logic I learned from EDI integrations is the same logic an agent loop needs when a tool call fails. The tiered retrieval idea came from thinking about cache hierarchies. Having built the same shape in six contexts is what lets me tell a client on day one which of the three obvious approaches is going to hurt them in month four.
