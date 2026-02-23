/**
 * Cloudflare Workers AI Provider
 * Uses the native AI binding available in Cloudflare Workers
 */

import type { AIProvider, ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse } from './types';

export class CloudflareAIProvider implements AIProvider {
  readonly name = 'cloudflare';
  private ai: Ai;
  private chatModel: string;
  private embeddingModel: string;

  constructor(ai: Ai, chatModel: string, embeddingModel: string) {
    this.ai = ai;
    this.chatModel = chatModel;
    this.embeddingModel = embeddingModel;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.ai.run(this.chatModel as any, {
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 512
    }) as any;

    return {
      content: response.response || '',
      model: this.chatModel,
      provider: this.name
      // Cloudflare AI doesn't return token counts in response
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const BATCH_SIZE = 50;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < request.texts.length; i += BATCH_SIZE) {
      const batch = request.texts.slice(i, i + BATCH_SIZE);
      const response = await this.ai.run(this.embeddingModel as any, {
        text: batch
      }) as any;

      const batchEmbeddings = response.data || [];
      allEmbeddings.push(...batchEmbeddings);
    }

    return {
      embeddings: allEmbeddings,
      model: this.embeddingModel,
      provider: this.name,
      dimensions: allEmbeddings[0]?.length || 384
    };
  }
}
