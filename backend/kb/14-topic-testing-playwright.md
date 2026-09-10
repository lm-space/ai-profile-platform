---
title: Topic - Test Automation & Quality Engineering (Playwright)
slug: topic-testing-playwright
category: testing
tier: 2
---

# Test Automation & Quality Engineering

## Where I've built this for real
The largest suite I own is a **Playwright** harness covering a multi-tenant school-management platform across QA and production environments — 29 spec files organised into 16 functional areas: smoke, API, auth, enrollment, students, attendance, assessments, library, communication, volunteers, competitions, settings, superadmin, bilingual, grade-skipping, and expenses.

## How the suite is structured

**Projects, not one flat run.** Playwright projects split the suite by concern — `setup-auth` (authenticates once and saves state), `smoke`, `api`, `auth-ui`, `enrollment`, and so on. Each project points at the right base URL: the public app for UI specs, the API host for API specs. That means one harness covers UI, API, and data checks instead of three separate tools that drift apart.

**Auth as a setup dependency.** A global auth setup project runs first and persists storage state. Every downstream spec starts logged in rather than replaying the login flow — which is both slow and a pointless source of flakiness.

**Tag-driven execution.** Specs are tagged and run by grep:
- `@READONLY` — safe against a live environment, no mutations. This is the regression suite that can point at production.
- `@DB` — data-parity checks that assert what the UI shows matches what's actually in the database.
- `@Integration` — the heavier flows that need real auth and cross-service state.

Tagging is what makes one suite usable in several contexts. The same specs serve a fast PR gate, a nightly regression, and a production smoke check — selected by tag rather than maintained as three divergent copies.

**Headless/headed parity.** A dedicated script runs the whole suite both ways into separate HTML reports. Tests that pass headless and fail headed (or vice versa) are almost always hiding a real timing or rendering bug, not a harness quirk.

**Parallel workers** tuned per run, plus screenshot automation that captures the app across QA and prod for visual review and documentation.

## What I actually believe about testing

**API + UI + DB in one harness beats three tools.** When a UI test fails, the first question is always "is the UI wrong, or is the data wrong?" Having API and DB assertions in the same framework, sharing auth and fixtures, answers that immediately.

**Flaky tests are worse than no tests.** A suite people don't trust gets ignored, then disabled. Explicit waits on state rather than sleeps, isolated data per test, and auth handled once.

**Tag before you branch.** The instinct to fork a "prod-safe" copy of a suite is how you end up maintaining two. Tags keep one source of truth.

**Read-only against production is underrated.** A tagged read-only regression pointed at prod catches real breakage — config drift, expired certs, broken integrations — that no staging environment reproduces.

## Agent-driven browser automation
Separately from the test suite, I use **Playwright MCP** as an agent tool — letting a coding agent drive a real browser to verify a change, capture screenshots, read console errors, and check a deployed page rather than assuming the deploy worked. It's the same instinct as the test suite: don't trust that it works, look.

Playwright also backs the scraper package in my voice-commerce agent, where a headless browser extracts structured catalog data that has no API behind it.

## Broader testing toolkit
Cypress and Robot Framework on older projects; JMeter, K6 and Gatling for load testing against the sub-2-second targets on high-traffic commerce sites; Blackfire for PHP profiling. The tool matters less than whether the suite is trusted and actually runs on every change.
