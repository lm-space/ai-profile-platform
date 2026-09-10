# Provider Switching & AI Configuration

How the chat agent picks a model, how to flip providers mid-demo, and how the keys are wired.

## Providers

| Provider | Model | Diagrams | Notes |
|---|---|---|---|
| `anthropic` | `claude-opus-5` | Inline via `render_diagram` tool call | Default. Adaptive thinking, low effort, prompt caching on system+RAG context |
| `openai` | `gpt-4o-mini` | Legacy keyword detector + 2nd LLM call | Streaming supported |
| `cloudflare` | `@cf/mistral/mistral-7b-instruct-v0.1` | Legacy detector path | No streaming — single-event SSE fallback |

Only one row in `ai_provider_config` is active at a time. Embeddings always run on
Workers AI (`@cf/baai/bge-small-en-v1.5`) regardless of chat provider — Anthropic has
no embeddings endpoint, and the indexed vectors are 384-dim bge-small.

> **Changing the embedding model requires a full reindex.** bge-m3 is 1024-dim; mixing
> dimensions silently returns garbage rather than erroring.

## Secret switch URLs

Bookmarkable GETs for flipping provider during a live demo.

```
GET /api/switch/<TOKEN>/anthropic     → Claude Opus 5
GET /api/switch/<TOKEN>/openai        → gpt-4o-mini
GET /api/switch/<TOKEN>/cloudflare    → Mistral 7B
GET /api/switch/<TOKEN>               → show which provider is active
```

`<TOKEN>` is the `PROVIDER_SWITCH_TOKEN` Worker secret.

Behaviour:
- Takes effect on the **next message**; open conversations keep their history. Start a
  New Session before comparing models, or you're mixing two models' answers.
- Refuses to switch to a provider with no configured key, **before** switching — so a
  bad switch fails at the URL rather than on the next user message.
- Wrong token returns **404**, not 401 — it doesn't confirm the endpoint exists.
- Comparison is length-safe, so the token can't be probed a character at a time.

> These are GETs that mutate state, which is what makes them bookmarkable. Anyone
> holding the URL can flip the provider — treat the URL itself as the credential.
> Rotate with `wrangler secret put PROVIDER_SWITCH_TOKEN`.

## Keys

Three Worker secrets. Set with `wrangler secret put <NAME>` from `backend/`:

| Secret | Used for |
|---|---|
| `ANTHROPIC_API_KEY` | Claude chat + diagram tool calls |
| `OPENAI_API_KEY` | OpenAI chat |
| `PROVIDER_SWITCH_TOKEN` | The switch URLs above |

Resolution order is **`api_keys_config` table (where `is_enabled = 1`) → Worker secret**.
The table lets you rotate a key from the admin panel without a redeploy; the secret is
the fallback and the better default.

Verify what's set: `npx wrangler secret list` (names only, never values).

## Admin panel

`/admin.html` (needs `X-Admin-Key` = `ELA_ADMIN_API_KEY`) exposes the same switch via
**AI Providers**, plus per-request logs showing provider, model, tokens, latency, and
retrieval hits per conversation.

## How the diagram path differs by provider

`AIProvider.supportsDiagramTool` declares the capability:

- **true** (Anthropic) — the model gets a `render_diagram` tool and decides for itself.
  Prose and diagram arrive in one turn; syntax comes back as structured tool input.
  The keyword detector is bypassed entirely.
- **false** (OpenAI, Workers AI) — falls back to `detectDiagramRequest()` keyword
  scoring, then a second LLM call to generate Mermaid, then regex extraction.

Both paths converge on `finalizeDiagram()` for validation and best-effort repair, so
the frontend contract is identical either way.

## Adding a provider

1. Implement `AIProvider` in `src/providers/` (`chat`, `embed`, optionally `chatStream`
   and `supportsDiagramTool`).
2. Add a case to `createProvider()` in `src/providers/factory.ts`.
3. Add a row to `ai_provider_config` via a migration.
4. Add the name to `SWITCHABLE_PROVIDERS` in `src/index.ts`.
5. Add a label to `PROVIDER_LABELS` in `frontend/src/admin.tsx`.
