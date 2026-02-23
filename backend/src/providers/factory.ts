/**
 * AI Provider Factory
 * Reads active config from D1 and returns the correct provider instance
 */

import type { AIProvider, ProviderConfig } from './types';
import { CloudflareAIProvider } from './cloudflare-ai';
import { OpenAIProvider } from './openai';

/**
 * Get the active provider configuration from D1
 */
export async function getActiveProviderConfig(db: D1Database): Promise<ProviderConfig> {
  const row = await db.prepare(
    'SELECT provider, model_chat, model_diagram, model_embedding, config FROM ai_provider_config WHERE is_active = 1 LIMIT 1'
  ).first() as any;

  if (!row) {
    // Fallback to Cloudflare defaults
    return {
      provider: 'cloudflare',
      model_chat: '@cf/mistral/mistral-7b-instruct-v0.1',
      model_diagram: '@cf/mistral/mistral-7b-instruct-v0.1',
      model_embedding: '@cf/baai/bge-small-en-v1.5',
      config: {
        chat_temperature: 0.7,
        chat_max_tokens: 1024,
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
export async function createProvider(
  config: ProviderConfig,
  env: { AI: Ai; OPENAI_API_KEY?: string },
  db?: D1Database
): Promise<{ chatProvider: AIProvider; diagramProvider: AIProvider; embeddingProvider: AIProvider }> {
  switch (config.provider) {
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
