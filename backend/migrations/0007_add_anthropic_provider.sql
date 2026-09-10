-- Add Anthropic (Claude) as a provider and make it the active one.
--
-- Claude emits diagrams inline via the render_diagram tool, so the keyword
-- detector and the separate diagram-generation call are bypassed entirely
-- when this provider is active.
--
-- model_embedding stays on Workers AI bge-small: Anthropic has no embeddings
-- endpoint, and the existing kb_chunks vectors are 384-dim bge-small. Changing
-- it requires a full reindex (scripts/index-kb-tiered.sh).

INSERT INTO ai_provider_config (provider, model_chat, model_diagram, model_embedding, is_active, config)
VALUES (
    'anthropic',
    'claude-opus-5',
    'claude-opus-5',
    '@cf/baai/bge-small-en-v1.5',
    0,
    '{"chat_temperature":0.7,"chat_max_tokens":2048,"diagram_temperature":0.3,"diagram_max_tokens":2000}'
);

-- Make Anthropic the only active provider.
UPDATE ai_provider_config SET is_active = 0;
UPDATE ai_provider_config SET is_active = 1 WHERE provider = 'anthropic';

-- Placeholder key row so the admin panel shows an Anthropic entry to fill in.
-- Set the real key via Admin > API Keys, or as a Worker secret (ANTHROPIC_API_KEY).
INSERT OR IGNORE INTO api_keys_config (service, api_key, is_enabled, config)
VALUES (
    'anthropic',
    NULL,
    0,
    '{"model_chat":"claude-opus-5","model_diagram":"claude-opus-5"}'
);
