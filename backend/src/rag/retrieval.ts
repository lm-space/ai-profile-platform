/**
 * RAG Retrieval - Tiered hybrid search combining FTS and vector similarity
 *
 * TIER SYSTEM:
 *   Tier 1 (Always Include): Profile, core skills — injected as permanent context
 *   Tier 2 (Topic Match): Achievements, project list — included when topic overlaps
 *   Tier 3 (RAG Search): Detailed case studies — retrieved via semantic search
 *
 * SEARCH STRATEGY:
 *   Stage 1: Load tier-1 chunks (always present)
 *   Stage 2: FTS pre-filter on tier-2 and tier-3 chunks
 *   Stage 3: Vector re-ranking on FTS results
 *   Stage 4: Merge tier-1 (always) + top-K tier-2/3 results
 */

import type { AIProvider } from '../providers/types';
import { deserializeVector, cosineSimilarity, generateEmbedding } from './embeddings';

export interface SearchResult {
  chunk_id: number;
  document_id: number;
  content: string;
  heading: string;
  document_title: string;
  score: number;
  tier?: number;
}

/**
 * Score chunks by vector similarity and return top-K
 */
function scoreAndRankChunks(
  chunks: any[],
  queryEmbedding: number[],
  topK: number
): Array<{ chunk: any; score: number }> {
  return chunks
    .map((chunk: any) => {
      const embedding = deserializeVector(chunk.embedding);
      const score = cosineSimilarity(queryEmbedding, embedding);
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Batch-fetch document titles and tiers for scored chunks
 */
async function buildSearchResults(
  scoredChunks: Array<{ chunk: any; score: number }>,
  db: D1Database
): Promise<SearchResult[]> {
  if (scoredChunks.length === 0) return [];

  const docIds = [...new Set(scoredChunks.map(sc => sc.chunk.document_id))];
  const placeholders = docIds.map(() => '?').join(', ');
  const docsResult = await db.prepare(
    `SELECT id, title, tier FROM kb_documents WHERE id IN (${placeholders})`
  ).bind(...docIds).all();

  const docMap = new Map<number, { title: string; tier: number }>();
  for (const doc of (docsResult.results || []) as any[]) {
    docMap.set(doc.id, { title: doc.title, tier: doc.tier || 3 });
  }

  return scoredChunks.map(({ chunk, score }) => ({
    chunk_id: chunk.id,
    document_id: chunk.document_id,
    content: chunk.content,
    heading: chunk.heading,
    document_title: docMap.get(chunk.document_id)?.title || 'Unknown',
    score,
    tier: docMap.get(chunk.document_id)?.tier || 3
  }));
}

/**
 * Get all chunks from tier-1 documents (always-include context)
 */
export async function getTier1Context(db: D1Database): Promise<SearchResult[]> {
  try {
    const results = await db.prepare(`
      SELECT c.id, c.document_id, c.content, c.heading, d.title as document_title, d.tier
      FROM kb_chunks c
      JOIN kb_documents d ON c.document_id = d.id
      WHERE d.tier = 1
      ORDER BY d.id, c.chunk_index
    `).all();

    if (!results.results) return [];

    return (results.results as any[]).map(r => ({
      chunk_id: r.id,
      document_id: r.document_id,
      content: r.content,
      heading: r.heading,
      document_title: r.document_title,
      score: 1.0, // Always relevant
      tier: 1
    }));
  } catch (error) {
    console.error('Tier-1 context error:', error);
    return [];
  }
}

/**
 * Hybrid search: FTS pre-filter + vector re-ranking
 * Accepts either Cloudflare AI binding or AIProvider
 */
export async function searchKnowledgeBase(
  query: string,
  aiOrProvider: Ai | AIProvider,
  db: D1Database,
  topK: number = 5
): Promise<SearchResult[]> {
  try {
    const queryEmbedding = await generateEmbedding(query, aiOrProvider);

    const escapedQuery = query.replace(/"/g, '""');
    const ftsResults = await db.prepare(`
      SELECT id, document_id, content, heading, embedding
      FROM kb_chunks
      WHERE id IN (
        SELECT rowid FROM kb_chunks_fts WHERE kb_chunks_fts MATCH "${escapedQuery}"
      )
      LIMIT 50
    `).all();

    let chunks: any[];

    if (!ftsResults.results || ftsResults.results.length === 0) {
      const allChunks = await db.prepare(`
        SELECT id, document_id, content, heading, embedding
        FROM kb_chunks
        LIMIT 100
      `).all();

      if (!allChunks.results) return [];
      chunks = allChunks.results;
    } else {
      chunks = ftsResults.results;
    }

    const scoredChunks = scoreAndRankChunks(chunks, queryEmbedding, topK);
    return buildSearchResults(scoredChunks, db);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Tiered search: combines always-include tier-1 with RAG tier-2/3
 * Returns structured context with tiers separated
 */
export async function tieredSearch(
  query: string,
  aiOrProvider: Ai | AIProvider,
  db: D1Database,
  topK: number = 5
): Promise<{
  tier1: SearchResult[];
  searchResults: SearchResult[];
  allResults: SearchResult[];
}> {
  // Run tier-1 fetch and RAG search in parallel
  const [tier1Results, ragResults] = await Promise.all([
    getTier1Context(db),
    searchKnowledgeBase(query, aiOrProvider, db, topK)
  ]);

  // Deduplicate: remove any tier-1 chunks that also appear in RAG results
  const tier1ChunkIds = new Set(tier1Results.map(r => r.chunk_id));
  const filteredRag = ragResults.filter(r => !tier1ChunkIds.has(r.chunk_id));

  return {
    tier1: tier1Results,
    searchResults: filteredRag,
    allResults: [...tier1Results, ...filteredRag]
  };
}

/**
 * Format tiered results into structured RAG context string for LLM
 */
export function formatTieredContext(
  tier1: SearchResult[],
  searchResults: SearchResult[],
  scoreThreshold: number = 0.5
): string {
  const sections: string[] = [];

  // Tier 1: Always-include context (profile, core skills)
  if (tier1.length > 0) {
    const tier1Text = tier1
      .map(r => `${r.heading}\n${r.content}`)
      .join('\n\n');
    sections.push(`CORE PROFILE & SKILLS (always available):\n${tier1Text}`);
  }

  // Tier 2/3: Relevant search results
  const relevant = searchResults.filter(r => r.score > scoreThreshold);
  if (relevant.length > 0) {
    const searchText = relevant
      .map((r, i) => `[${i + 1}] ${r.heading}\n${r.content}\n(Source: ${r.document_title}, relevance: ${(r.score * 100).toFixed(0)}%)`)
      .join('\n\n');
    sections.push(`RELEVANT PROJECT & EXPERIENCE CONTEXT:\n${searchText}`);
  }

  return sections.join('\n\n---\n\n');
}

/**
 * Format search results into RAG context string for LLM (legacy)
 */
export function formatSearchResultsForContext(results: SearchResult[]): string {
  if (results.length === 0) return '';

  return results
    .map(
      (result, i) =>
        `[${i + 1}] ${result.heading}\n${result.content}\n(Source: ${result.document_title}, relevance: ${(result.score * 100).toFixed(0)}%)`
    )
    .join('\n\n');
}
