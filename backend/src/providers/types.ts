/**
 * AI Provider Abstraction Layer - Type Definitions
 * Allows switching between Cloudflare Workers AI, OpenAI, etc.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  /** Offer the render_diagram tool so the model can emit a diagram in the same turn. */
  diagramTool?: boolean;
}

export interface InlineDiagram {
  type: string;
  title: string;
  syntax: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  tokens_in?: number;
  tokens_out?: number;
  /** Present only when the provider supports the diagram tool and the model called it. */
  diagram?: InlineDiagram;
}

export interface EmbeddingRequest {
  texts: string[];
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: string;
  dimensions: number;
}

export interface ProviderConfig {
  provider: string;
  model_chat: string;
  model_diagram: string;
  model_embedding: string;
  config: {
    chat_temperature: number;
    chat_max_tokens: number;
    diagram_temperature: number;
    diagram_max_tokens: number;
  };
}

/**
 * Abstract AI Provider Interface
 * All providers must implement these methods
 */
export interface AIProvider {
  readonly name: string;

  /**
   * True when the provider can return a diagram inline via a tool call.
   * When set, the chat pipeline skips the keyword detector and the separate
   * diagram-generation round trip.
   */
  readonly supportsDiagramTool?: boolean;

  /** Generate a chat completion */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /** Generate embeddings for texts */
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /** Stream a chat completion (optional — falls back to chat if not implemented) */
  chatStream?(request: ChatRequest): Promise<ReadableStream<Uint8Array>>;
}
