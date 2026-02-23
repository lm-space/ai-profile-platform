/**
 * OpenAI Provider
 * Uses fetch() directly (no SDK needed in Cloudflare Workers)
 * Supports streaming for faster perceived response times
 */

import type { AIProvider, ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse } from './types';

const OPENAI_BASE = 'https://api.openai.com/v1';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private apiKey: string;
  private chatModel: string;
  private embeddingModel: string;

  constructor(apiKey: string, chatModel: string, embeddingModel: string) {
    this.apiKey = apiKey;
    this.chatModel = chatModel;
    this.embeddingModel = embeddingModel;
  }

  private async fetchOpenAI(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${OPENAI_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const result = await this.fetchOpenAI('/chat/completions', {
      model: this.chatModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 512
    });

    const choice = result.choices?.[0];
    const usage = result.usage;

    return {
      content: choice?.message?.content || '',
      model: this.chatModel,
      provider: this.name,
      tokens_in: usage?.prompt_tokens,
      tokens_out: usage?.completion_tokens
    };
  }

  /**
   * Stream chat completion via OpenAI SSE.
   * Returns a ReadableStream of SSE-formatted chunks for direct piping to client.
   * Each chunk is: `data: {"text":"...","done":false}\n\n`
   * Final chunk:  `data: {"text":"","done":true,"model":"...","tokens_in":N,"tokens_out":N}\n\n`
   */
  async chatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.chatModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 512,
        stream: true,
        stream_options: { include_usage: true }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const model = this.chatModel;
    let buffer = '';

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '', done: true, model })}\n\n`));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(payload);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta, done: false })}\n\n`));
              }
              // Capture usage from the final chunk (stream_options: include_usage)
              if (parsed.usage) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  text: '', done: true, model,
                  tokens_in: parsed.usage.prompt_tokens,
                  tokens_out: parsed.usage.completion_tokens
                })}\n\n`));
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      },
      cancel() {
        reader.cancel();
      }
    });
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const result = await this.fetchOpenAI('/embeddings', {
      model: this.embeddingModel,
      input: request.texts
    });

    const embeddings = (result.data || [])
      .sort((a: any, b: any) => a.index - b.index)
      .map((item: any) => item.embedding);

    return {
      embeddings,
      model: this.embeddingModel,
      provider: this.name,
      dimensions: embeddings[0]?.length || 1536
    };
  }
}
