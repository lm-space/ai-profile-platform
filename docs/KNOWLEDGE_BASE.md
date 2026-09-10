# Knowledge Base — Authoring & Indexing

The agent answers **only** from this corpus. If it isn't in `backend/kb/`, the agent
shouldn't say it. Corpus quality is the ceiling on answer quality — most improvement
work here is writing better documents, not tuning the retriever.

## Layout

One markdown file per document in `backend/kb/`, with frontmatter:

```markdown
---
title: Case Study - Production MCP Server (Second Brain)
slug: case-mcp-server
category: case-study
tier: 3
---

# Body starts here
```

`slug` is the upsert key — re-indexing an existing slug **replaces** that document and
re-chunks it. Renaming a slug creates a second document and orphans the old one.

## Tiers — a retrieval contract, not a filing system

| Tier | Behaviour | Use for |
|---|---|---|
| **1** | Injected into **every** prompt, unconditionally | Identity, core skills, positioning |
| **2** | Retrieved on topic match | Indexes, summaries, approach docs |
| **3** | Semantic search only | Deep case studies, topic deep-dives |

**Tier 1 costs tokens on every single message** — the indexer prints the running total,
currently ~1,550 tokens/request. Keep it tight.

Tier 1 exists because pure top-K retrieval fails on identity questions: ask "who are
you?" and similarity search happily returns an SAP case study. Some context must not be
subject to a similarity roll.

Tier-1 chunks are **excluded** from the search query (they're already injected). Without
that exclusion they win the top-K on general questions and then get dropped by dedup,
starving tiers 2 and 3 entirely.

## Indexing

```bash
cd backend
node scripts/index-kb.mjs --dry-run     # validate + show tier budget, send nothing
node scripts/index-kb.mjs               # index to production
node scripts/index-kb.mjs http://localhost:8787
```

Validates frontmatter, rejects duplicate slugs and empty bodies, batches 4 docs per
request, and is idempotent — edit a file, re-run, done.

The older `scripts/index-kb-tiered.sh` held all prose inside a bash heredoc and is
superseded. Content in a heredoc can't be diffed, reviewed, or grown.

## Writing guidance

- **Specifics over adjectives.** "31 MCP tools on D1 + Vectorize with Durable Object
  sessions" retrieves and answers better than "extensive MCP experience."
- **Include numbers and failure modes.** The eval breakdown showing error-recovery
  fabrications is more credible and more useful than a headline accuracy figure.
- **Headings matter.** Chunking is heading-aware; each `##` section should stand alone,
  because that's the unit that gets retrieved.
- **Never name clients.** Use domain and scale — "Fortune 500 packaging manufacturer".
  Enforced in the system prompt and reflected in how the corpus is written.
- **Only claim what's real.** This corpus is stated publicly as fact about a real
  person. Ground every claim in an actual artifact.

## Verifying

```bash
curl $API/api/kb/stats
curl -X POST $API/api/kb/search -H 'Content-Type: application/json' \
  -d '{"query":"MCP server tools"}'
```

`kb/search` returns raw scores — the fastest way to tell whether a bad answer came from
bad retrieval or bad generation. Those are different bugs with different fixes.

## Orphaned documents

The indexer **upserts and never deletes**. Documents indexed previously but no longer
present in `backend/kb/` stay in the database and keep competing in retrieval.

Audit:

```bash
curl -s $API/api/admin/kb/documents -H "X-Admin-Key: $ADMIN_KEY"
```

Compare against the slugs in `backend/kb/`. Anything in the DB but not in the folder is
an orphan — either restore the source file or delete the document.

## Retrieval mechanics

1. **Tier 1** loaded unconditionally.
2. **FTS5 pre-filter** — the message is tokenised, stopwords dropped, terms individually
   quoted and OR-joined (`buildFtsQuery`). Quoting neutralises FTS operators and makes
   the expression injection-safe; it's passed as a bound parameter.
3. **Fallback** — if FTS matches nothing, vector-score the whole tier-2/3 corpus (capped
   at `FULL_SCAN_LIMIT`).
4. **Vector re-rank** — cosine similarity in-process, top-K.
5. **Merge + dedup** — tier 1 plus results scoring above 0.5.

Cosine runs in the Worker, which is fine at this corpus size and won't be past a few
thousand chunks — move to Vectorize then.
