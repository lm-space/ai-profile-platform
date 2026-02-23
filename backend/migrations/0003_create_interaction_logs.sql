-- Interaction Logs: Track full lifecycle of every chat interaction
-- Each row = one step in the request pipeline (user_msg, rag_search, ai_request, ai_response, etc.)
CREATE TABLE IF NOT EXISTS interaction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    request_id TEXT NOT NULL,        -- Groups all steps of a single /api/chat call
    step TEXT NOT NULL,              -- e.g. 'user_message', 'rag_search', 'ai_request', 'ai_response', 'diagram_detect', 'final_response'
    step_order INTEGER NOT NULL,     -- Ordering within request
    payload TEXT,                    -- JSON blob with step-specific data
    duration_ms INTEGER,             -- How long this step took
    provider TEXT,                   -- AI provider used (cloudflare, openai, etc.)
    model TEXT,                      -- Model name used
    tokens_in INTEGER,               -- Input tokens (if applicable)
    tokens_out INTEGER,              -- Output tokens (if applicable)
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_session ON interaction_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_request ON interaction_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created ON interaction_logs(created_at);
