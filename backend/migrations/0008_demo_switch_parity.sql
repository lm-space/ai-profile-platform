-- Give the non-Anthropic providers the same output budget so side-by-side
-- demos compare models, not truncation limits. The original rows were capped
-- at 512 chat tokens, which cuts answers off mid-paragraph.

UPDATE ai_provider_config
SET config = '{"chat_temperature":0.7,"chat_max_tokens":2048,"diagram_temperature":0.3,"diagram_max_tokens":2000}',
    updated_at = datetime('now')
WHERE provider IN ('openai', 'cloudflare');
