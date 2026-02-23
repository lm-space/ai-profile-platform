/**
 * RAG Chunker - Split markdown into semantic chunks for embeddings
 * Strategy: Split on ## headings, preserve context with heading metadata
 * Max chunk size: 500 tokens (~2000 chars)
 */

export interface Chunk {
  content: string;
  heading: string;
  token_count: number;
}

/**
 * Estimate token count (rough approximation)
 * Rule: ~4 characters = 1 token
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split markdown into semantic chunks preserving heading hierarchy
 */
export function chunkMarkdown(content: string, doc_title: string): Chunk[] {
  const chunks: Chunk[] = [];
  const MAX_TOKENS = 500;

  // Split by ## (h2) headings
  const sections = content.split(/^## /m).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    const heading = lines[0]?.trim() || 'Introduction';
    const body = lines.slice(1).join('\n').trim();

    if (!body) continue;

    // Split body into paragraphs
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim());

    let currentChunk = '';

    for (const para of paragraphs) {
      const combined = currentChunk ? `${currentChunk}\n\n${para}` : para;
      const tokens = estimateTokens(combined);

      // If combined exceeds max and we have content, save current chunk
      if (tokens > MAX_TOKENS && currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          heading: `${doc_title} > ${heading}`,
          token_count: estimateTokens(currentChunk)
        });
        currentChunk = para;
      } else {
        currentChunk = combined;
      }
    }

    // Save remaining content
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        heading: `${doc_title} > ${heading}`,
        token_count: estimateTokens(currentChunk)
      });
    }
  }

  return chunks;
}

/**
 * Batch chunk multiple documents
 */
export function chunkDocuments(
  documents: Array<{ title: string; content: string }>
): Array<Chunk & { document_title: string }> {
  const all_chunks: Array<Chunk & { document_title: string }> = [];

  for (const doc of documents) {
    const chunks = chunkMarkdown(doc.content, doc.title);
    all_chunks.push(
      ...chunks.map(c => ({
        ...c,
        document_title: doc.title
      }))
    );
  }

  return all_chunks;
}
