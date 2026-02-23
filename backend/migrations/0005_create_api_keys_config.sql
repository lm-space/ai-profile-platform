-- API Keys Configuration: Store API keys for external services
CREATE TABLE IF NOT EXISTS api_keys_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL UNIQUE,          -- 'openai', 'anthropic', etc.
    api_key TEXT,                          -- Encrypted or stored as-is (should be encrypted in production)
    is_enabled INTEGER NOT NULL DEFAULT 0, -- Whether this service is enabled
    config TEXT,                           -- JSON config specific to service
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert OpenAI placeholder
INSERT OR IGNORE INTO api_keys_config (service, api_key, is_enabled, config)
VALUES (
    'openai',
    NULL,
    0,
    '{"model_chat":"gpt-4o-mini","model_diagram":"gpt-4o-mini","model_embedding":"text-embedding-3-small"}'
);

CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys_config(service);
