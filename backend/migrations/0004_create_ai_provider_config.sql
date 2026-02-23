-- AI Provider Configuration: Manage which AI provider and model to use
CREATE TABLE IF NOT EXISTS ai_provider_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,          -- 'cloudflare' or 'openai'
    model_chat TEXT NOT NULL,        -- Model for chat completions
    model_diagram TEXT NOT NULL,     -- Model for diagram generation
    model_embedding TEXT NOT NULL,   -- Model for embeddings
    is_active INTEGER NOT NULL DEFAULT 0, -- Only one row should be active
    config TEXT,                     -- JSON config (temperature, max_tokens, etc.)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default Cloudflare provider (active)
INSERT INTO ai_provider_config (provider, model_chat, model_diagram, model_embedding, is_active, config)
VALUES (
    'cloudflare',
    '@cf/mistral/mistral-7b-instruct-v0.1',
    '@cf/mistral/mistral-7b-instruct-v0.1',
    '@cf/baai/bge-small-en-v1.5',
    1,
    '{"chat_temperature":0.7,"chat_max_tokens":512,"diagram_temperature":0.3,"diagram_max_tokens":800}'
);

-- Insert OpenAI provider (inactive by default)
INSERT INTO ai_provider_config (provider, model_chat, model_diagram, model_embedding, is_active, config)
VALUES (
    'openai',
    'gpt-4o-mini',
    'gpt-4o-mini',
    'text-embedding-3-small',
    0,
    '{"chat_temperature":0.7,"chat_max_tokens":512,"diagram_temperature":0.3,"diagram_max_tokens":800}'
);
