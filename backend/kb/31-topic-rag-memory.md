---
title: Topic - RAG 2.0, Vector Databases & Memory Layers
slug: topic-rag-memory
category: ai-topic
tier: 3
---

# RAG 2.0, Vector Databases & Memory Layers

## What "RAG 2.0" actually means
Naive RAG is: chunk everything, embed it, retrieve top-K by cosine similarity, stuff it in the prompt. It demos well and disappoints in production. The failure modes are consistent — retrieves semantically similar but irrelevant text, misses exact terms, has no notion of authority or recency, and gives you no way to tell whether a bad answer came from bad retrieval or a bad generation.

What I build instead:

**Hybrid retrieval.** Lexical (FTS5/BM25) pre-filter plus vector re-ranking. Embeddings blur precise tokens — `IDoc ORDERS05`, `DESADV`, a part number — while lexical search nails them and misses paraphrase entirely. Running both and merging beats either. This is the single highest-return change to a naive pipeline.

**Tiered context.** Not everything should compete in the similarity ranking. Some facts are always true and always relevant, and retrieval shouldn't get a vote (see my tiered design: always-on / topic-match / search-only).

**Retrieval you can explain.** My MCP memory server has an `explain_retrieval` tool for exactly this. When an answer is wrong, the first question is always *did retrieval find the right thing?* Without an answer to that you're tuning blind.

**Chunking as a real decision.** Chunk boundaries determine what can ever be retrieved together. Split a procedure across two chunks and neither retrieves usefully. Heading-aware chunking with overlap beats fixed-size splitting on structured documents.

**Measure the retriever separately from the generator.** They're different components with different failure modes and different fixes. Aggregate answer quality tells you something is wrong; it doesn't tell you where.

## Vector databases — what I've used
- **Cloudflare Vectorize** (768-dim, with Workers AI embeddings) — production memory server. Edge-native, no infrastructure to run.
- **Pinecone, ChromaDB** — managed and local respectively.
- **SQLite/D1 with in-process cosine similarity** — deliberately, for small corpora. At a few hundred chunks the brute-force scan is fast and removes an entire dependency. Worth being honest that this doesn't scale — past a few thousand chunks it needs a real vector index.

The choice is mostly about corpus size, latency budget, and how much infrastructure you want to own. Reaching for a distributed vector DB for a 500-chunk corpus is a common and expensive mistake.

## Memory layers
Retrieval and memory get conflated; they're different. Retrieval answers "what do I know about X?" Memory answers "what happened, and what's still true?"

Layers I actually implement:

**Working memory** — the current conversation. Cheap, immediate, evaporates. Needs compaction as it grows or it eats the whole budget.

**Session memory** — durable within a session: topics covered, decisions made, user preferences. In this portfolio agent it's conversation history plus a topic summary. In the field-agent harness it was Redis-backed with explicit context injection.

**Long-term memory** — persists across sessions. This is where it gets hard, and where my MCP server does the real work:
- **Supersede, don't just append.** New facts replace old ones with the chain preserved. Append-only memory becomes self-contradictory quickly.
- **Consolidate.** Fragments merge into coherent facts, or you drown in near-duplicates.
- **Selective capture.** `extract_memory_candidates` proposes what's worth keeping rather than storing everything. Most memory systems store too much — the retrieval problem you create is worse than the forgetting problem you solved.
- **Archive.** Wrong or obsolete memories need removal, not just downranking.

**Structured vs semantic split.** Relational facts belong in a database you can query exactly (D1); fuzzy recall belongs in a vector index. Forcing everything into embeddings loses precision you already had.

## The thing I'd emphasize
Retrieval quality is capped by corpus quality. Most of the improvement work on any RAG system I've built has been **writing better source documents**, not tuning the retriever. A well-structured, well-scoped corpus with mediocre retrieval outperforms a sophisticated pipeline over sprawling, badly-organized text — every time.
