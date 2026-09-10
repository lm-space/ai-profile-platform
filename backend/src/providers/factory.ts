/**
 * AI Provider Factory
 * Reads active config from D1 and returns the correct provider instance
 */

import type { AIProvider, ProviderConfig } from './types';
import { CloudflareAIProvider } from './cloudflare-ai';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';

/** Model used when no row exists in ai_provider_config. */
export const DEFAULT_CHAT_MODEL = 'claude-opus-5';
// NOTE: kept at bge-small (384-dim) because the existing kb_chunks embeddings
// were indexed with it. Switching to bge-m3 (1024-dim) requires a full reindex
// (backend/scripts/index-kb-tiered.sh) or retrieval silently returns garbage.
export const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5';

/**
 * Get the active provider configuration from D1
 */
export async function getActiveProviderConfig(db: D1Database): Promise<ProviderConfig> {
  const row = await db.prepare(
    'SELECT provider, model_chat, model_diagram, model_embedding, config FROM ai_provider_config WHERE is_active = 1 LIMIT 1'
  ).first() as any;

  if (!row) {
    // Default to Claude — diagrams come back inline via tool call, so the
    // keyword detector and the second diagram round trip are never used.
    return {
      provider: 'anthropic',
      model_chat: DEFAULT_CHAT_MODEL,
      model_diagram: DEFAULT_CHAT_MODEL,
      model_embedding: DEFAULT_EMBEDDING_MODEL,
      config: {
        chat_temperature: 0.7,
        chat_max_tokens: 2048,
        diagram_temperature: 0.3,
        diagram_max_tokens: 2000
      }
    };
  }

  return {
    provider: row.provider,
    model_chat: row.model_chat,
    model_diagram: row.model_diagram,
    model_embedding: row.model_embedding,
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config
  };
}

/**
 * Create the appropriate AI provider based on config
 * For OpenAI: fetches API key from api_keys_config table
 */
/** Look up a service key from api_keys_config, falling back to the env binding. */
async function resolveApiKey(
  service: string,
  envKey: string | undefined,
  db?: D1Database
): Promise<string | undefined> {
  if (db) {
    const row = await db.prepare(
      'SELECT api_key FROM api_keys_config WHERE service = ? AND is_enabled = 1 LIMIT 1'
    ).bind(service).first() as any;
    if (row?.api_key) return row.api_key;
  }
  return envKey;
}

export async function createProvider(
  config: ProviderConfig,
  env: { AI: Ai; OPENAI_API_KEY?: string; ANTHROPIC_API_KEY?: string },
  db?: D1Database
): Promise<{ chatProvider: AIProvider; diagramProvider: AIProvider; embeddingProvider: AIProvider }> {
  switch (config.provider) {
    case 'anthropic': {
      const apiKey = await resolveApiKey('anthropic', env.ANTHROPIC_API_KEY, db);
      if (!apiKey) {
        throw new Error('Anthropic API key is not configured. Add it in Admin > API Keys.');
      }

      // Anthropic has no embeddings endpoint — Workers AI handles those.
      const embeddingProvider = new CloudflareAIProvider(
        env.AI, config.model_embedding, config.model_embedding
      );
      const chatProvider = new AnthropicProvider(apiKey, config.model_chat, embeddingProvider);
      const diagramProvider = new AnthropicProvider(apiKey, config.model_diagram, embeddingProvider);

      return { chatProvider, diagramProvider, embeddingProvider };
    }

    case 'openai': {
      // Try to get API key from api_keys_config table first, then fallback to env
      let apiKey = env.OPENAI_API_KEY;

      if (db) {
        const keyConfig = await db.prepare(
          'SELECT api_key FROM api_keys_config WHERE service = ? AND is_enabled = 1 LIMIT 1'
        ).bind('openai').first() as any;

        if (keyConfig?.api_key) {
          apiKey = keyConfig.api_key;
        }
      }

      if (!apiKey) {
        throw new Error('OpenAI API key is not configured. Please add it in Admin > API Keys');
      }

      const chatProvider = new OpenAIProvider(apiKey, config.model_chat, config.model_embedding);
      const diagramProvider = new OpenAIProvider(apiKey, config.model_diagram, config.model_embedding);
      const embeddingProvider = new OpenAIProvider(apiKey, config.model_chat, config.model_embedding);
      return { chatProvider, diagramProvider, embeddingProvider };
    }

    case 'cloudflare':
    default: {
      const chatProvider = new CloudflareAIProvider(env.AI, config.model_chat, config.model_embedding);
      const diagramProvider = new CloudflareAIProvider(env.AI, config.model_diagram, config.model_embedding);
      // embeddingProvider uses embedding model for both chat and embedding
      const embeddingProvider = new CloudflareAIProvider(env.AI, config.model_embedding, config.model_embedding);
      return { chatProvider, diagramProvider, embeddingProvider };
    }
  }
}
