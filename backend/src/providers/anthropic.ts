/**
 * Anthropic (Claude) Provider
 *
 * Uses the official @anthropic-ai/sdk, which runs in Cloudflare Workers.
 *
 * Unlike the other providers, this one can emit the diagram in the SAME turn as
 * the prose, via a `render_diagram` tool. That removes the need for the keyword
 * detector + a second LLM round trip.
 *
 * Anthropic has no embeddings endpoint — embedding calls delegate to a fallback
 * provider (Workers AI) supplied at construction time.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider, ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse
} from './types';

/** Tool the model calls when a visual would genuinely help the answer. */
const DIAGRAM_TOOL = {
  name: 'render_diagram',
  description:
    'Render a Mermaid diagram alongside your answer. Call this ONLY when a visual ' +
    'materially helps — an architecture, a multi-step flow, a sequence of calls ' +
    'between systems, or a data model. Do not call it for plain prose answers, ' +
    'career questions, or single-concept explanations. Never put Mermaid syntax ' +
    'in your text response; it belongs in this tool call only.',
  input_schema: {
    type: 'object' as const,
    properties: {
      type: {
        type: 'string',
        enum: ['flowchart', 'architecture', 'sequence', 'class'],
        description: 'Diagram kind. "architecture" renders as a Mermaid graph.'
      },
      title: {
        type: 'string',
        description: 'Short human title, e.g. "SAP Order Integration Flow".'
      },
      syntax: {
        type: 'string',
        description:
          'Complete, valid Mermaid source. Must start with its declaration ' +
          '(flowchart TD / graph TD / sequenceDiagram / classDiagram). ' +
          'Keep node labels short and free of parentheses and quotes. ' +
          '8-20 nodes is the sweet spot.'
      }
    },
    required: ['type', 'title', 'syntax'],
    additionalProperties: false
  },
  strict: true
};

export interface DiagramToolResult {
  type: string;
  title: string;
  syntax: string;
}

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  /** Signals to the chat pipeline that diagrams come back inline — skip the detector. */
  readonly supportsDiagramTool = true;

  private client: Anthropic;
  private chatModel: string;
  private embeddingFallback?: AIProvider;

  constructor(apiKey: string, chatModel: string, embeddingFallback?: AIProvider) {
    this.client = new Anthropic({ apiKey });
    this.chatModel = chatModel;
    this.embeddingFallback = embeddingFallback;
  }

  /**
   * Split our provider-neutral message list into Anthropic's shape:
   * system is a top-level param, not a message.
   */
  private splitMessages(request: ChatRequest) {
    const system = request.messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n');

    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    return { system, messages };
  }

  /**
   * The system prompt + RAG context is large and stable within a session,
   * so mark it cacheable — repeat turns read it at ~0.1x input cost.
   */
  private systemBlocks(system: string) {
    if (!system) return undefined;
    return [{
      type: 'text' as const,
      text: system,
      cache_control: { type: 'ephemeral' as const }
    }];
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { system, messages } = this.splitMessages(request);

    const response = await this.client.messages.create({
      model: this.chatModel,
      max_tokens: request.max_tokens ?? 2048,
      system: this.systemBlocks(system),
      messages,
      // Adaptive thinking at low effort: fast enough for chat, and keeps tool
      // calls arriving as real tool_use blocks rather than leaking into text.
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      ...(request.diagramTool ? { tools: [DIAGRAM_TOOL] } : {})
    } as any);

    // Safety classifiers can decline; check before reading content.
    if (response.stop_reason === 'refusal') {
      return {
        content: "That one's outside what I can get into here. Happy to talk through the architecture side of it though.",
        model: this.chatModel,
        provider: this.name
      };
    }

    let content = '';
    let diagram: DiagramToolResult | undefined;

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use' && block.name === 'render_diagram') {
        diagram = block.input as DiagramToolResult;
      }
    }

    return {
      content,
      model: this.chatModel,
      provider: this.name,
      tokens_in: response.usage?.input_tokens,
      tokens_out: response.usage?.output_tokens,
      diagram
    };
  }

  /**
   * Streams text deltas as they arrive, then emits the diagram (if the model
   * called the tool) on the final event.
   *
   * Wire format matches the OpenAI provider so index.ts needs no special-casing:
   *   data: {"text":"...","done":false}
   *   data: {"text":"","done":true,"model":"...","tokens_in":N,"tokens_out":N,"diagram":{...}}
   */
  async chatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array>> {
    const { system, messages } = this.splitMessages(request);
    const encoder = new TextEncoder();
    const model = this.chatModel;

    const stream = this.client.messages.stream({
      model,
      max_tokens: request.max_tokens ?? 2048,
      system: this.systemBlocks(system),
      messages,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      ...(request.diagramTool ? { tools: [DIAGRAM_TOOL] } : {})
    } as any);

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta' &&
              event.delta.text
            ) {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text, done: false })}\n\n`
              ));
            }
          }

          const final = await stream.finalMessage();

          let diagram: DiagramToolResult | undefined;
          for (const block of final.content) {
            if (block.type === 'tool_use' && block.name === 'render_diagram') {
              diagram = block.input as DiagramToolResult;
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            text: '',
            done: true,
            model,
            tokens_in: final.usage?.input_tokens,
            tokens_out: final.usage?.output_tokens,
            refused: final.stop_reason === 'refusal',
            diagram
          })}\n\n`));
          controller.close();
        } catch (err: any) {
          console.error('[ANTHROPIC-STREAM] Error:', err?.message || err);
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ text: '', done: true, model, error: err?.message })}\n\n`
          ));
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      }
    });
  }

  /**
   * Anthropic has no embeddings API — delegate to the configured fallback
   * (Workers AI bge). Keeps the KB index on one embedding model regardless of
   * which chat provider is active.
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.embeddingFallback) {
      throw new Error(
        'Anthropic has no embeddings endpoint. Configure an embedding fallback provider.'
      );
    }
    return this.embeddingFallback.embed(request);
  }
}
