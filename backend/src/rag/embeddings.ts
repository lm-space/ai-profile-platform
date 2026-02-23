/**
 * Embeddings module - Generate and manage vector embeddings
 * Supports both direct Cloudflare AI binding and abstract AIProvider
 */

import type { AIProvider } from '../providers/types';

/**
 * Generate embedding using AIProvider abstraction
 */
export async function generateEmbedding(
  text: string,
  aiOrProvider: Ai | AIProvider
): Promise<number[]> {
  try {
    // Check if it's an AIProvider (has 'embed' method)
    if ('embed' in aiOrProvider && typeof (aiOrProvider as any).embed === 'function') {
      const provider = aiOrProvider as AIProvider;
      const result = await provider.embed({ texts: [text] });
      return result.embeddings[0] || [];
    }

    // Legacy: Direct Cloudflare AI binding
    const ai = aiOrProvider as Ai;
    const response = (await ai.run('@cf/baai/bge-small-en-v1.5', {
      text: [text]
    })) as any;
    return response.data[0] || [];
  } catch (error) {
    console.error('Embedding error:', error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

/**
 * Batch generate embeddings
 * Supports both direct Cloudflare AI binding and abstract AIProvider
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  aiOrProvider: Ai | AIProvider
): Promise<number[][]> {
  try {
    // Check if it's an AIProvider
    if ('embed' in aiOrProvider && typeof (aiOrProvider as any).embed === 'function') {
      const provider = aiOrProvider as AIProvider;
      const result = await provider.embed({ texts });
      return result.embeddings;
    }

    // Legacy: Direct Cloudflare AI binding
    const ai = aiOrProvider as Ai;
    const BATCH_SIZE = 50;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const response = (await ai.run('@cf/baai/bge-small-en-v1.5', {
        text: batch
      })) as any;
      results.push(...response.data);
    }

    return results;
  } catch (error) {
    console.error('Batch embedding error:', error);
    throw error;
  }
}

/**
 * Serialize vector to Uint8Array for D1 BLOB storage
 */
export function serializeVector(vector: number[]): Uint8Array {
  const buffer = new Float32Array(vector);
  return new Uint8Array(buffer.buffer);
}

/**
 * Deserialize vector from D1 BLOB
 */
export function deserializeVector(blob: any): number[] {
  let buffer: any;

  if (blob instanceof ArrayBuffer || blob instanceof SharedArrayBuffer) {
    buffer = blob;
  } else if (blob instanceof Uint8Array) {
    buffer = blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength);
  } else if (typeof blob === 'string') {
    const binaryString = atob(blob);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    buffer = bytes.buffer;
  } else {
    const uint8 = new Uint8Array(blob);
    buffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
  }

  const float32 = new Float32Array(buffer as ArrayBuffer);
  return Array.from(float32);
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must have same length (${a.length} vs ${b.length})`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
