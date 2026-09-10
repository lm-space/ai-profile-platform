---
title: Ela - Forward Deployed Engineer Approach
slug: ela-fde-approach
category: approach
tier: 2
---

# How I Work as a Forward Deployed Engineer

## What FDE means in practice
A forward deployed engineer sits on the customer's side of the wall. Not "gathering requirements and coming back in six weeks" — actually in their environment, with their data, watching the workflow break in real time, and shipping against it. The deliverable isn't a document. It's something running in their stack that someone uses on Monday.

That's how I've worked for most of my career even when nobody called it FDE. Running a 22-person shop for six years means you talk to the client in the morning and deploy the fix in the afternoon, because there's nobody to hand it to.

## The loop I run
**1. Find the actual break, not the stated one.** The stated problem is usually a symptom. "We need a chatbot" often means "our ops team answers the same forty questions and nobody wrote them down." Sit with the person doing the work. Watch where they alt-tab.

**2. Build the thinnest thing that proves it.** Working code beats a proposal. I'd rather show a rough agent that answers eight of those forty questions than present slides about answering all forty.

**3. Deploy into their reality, early.** Their auth, their network policy, their data quality, their compliance constraints. A demo on clean synthetic data proves nothing — the value shows up exactly where the messy parts are.

**4. Instrument before scaling.** Log every request, every tool call, every retrieval, every token. You cannot improve an agent you can't see. This is the step teams skip and then wonder why quality is unpredictable.

**5. Tighten against real traffic.** Real users ask things you never anticipated. The eval set should be built from actual failed conversations, not from imagination.

## What I bring that's less common
- **Enterprise integration scars.** SAP IDocs, EDI X12, ERP middleware, payment compliance. When an agent has to touch a real business system, that system is rarely friendly. I've spent years on the unfriendly side.
- **I own the whole vertical.** Model and prompt layer, the harness, the API, the data store, the infra, the CI/CD, the dashboard. No handoff gaps, which matters enormously when the team is one or two people deep.
- **Cost and latency as first-class constraints.** A pilot that's technically brilliant and economically absurd doesn't survive contact with procurement. Tiered retrieval, prompt caching, effort tuning, and small local models where a frontier model is overkill.
- **I write the docs.** Every project I ship has a README that lets someone else run it, and a deployment record of what's actually live. Handover is part of the build.

## What I'm direct about
Agentic systems fail in ways traditional software doesn't — non-determinism, hallucination, silent degradation when a prompt or a model changes underneath you. I'd rather set that expectation on day one and build the evaluation harness early than promise determinism I can't deliver. The teams that get burned are the ones who treated an LLM like a library call.
