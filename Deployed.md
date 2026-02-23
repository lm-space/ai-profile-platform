# Elamurugan - AI Profile Platform

## Deployment Info

**Status:** ✅ Live
**Folder:** `/elamurugan`
**Theme:** Interactive AI-powered professional profile with chat

## URLs
- **Frontend:** https://elamurugan.pages.dev
- **API:** https://elamurugan-api.twozao.com
- **Admin Panel:** https://elamurugan.pages.dev/admin.html

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **AI:** Cloudflare Workers AI (Mistral 7B)
- **RAG:** Vector embeddings + FTS5 search
- **Diagrams:** Mermaid with LLM generation

## Cloudflare Resources
| Resource | Name | ID |
|----------|------|-----|
| Pages Project | `elamurugan` | - |
| Worker | `elamurugan-api` | - |
| D1 Database | `elamurugan-db` | - |

## Deploy
```bash
./deploy-app.sh elamurugan
```

## Key Features
- **AI Chat Interface** with Mistral 7B
- **Conversation History** (7-day retention)
- **Contact Requests** (call, email, meeting)
- **RAG System** for knowledge base integration
- **Admin Dashboard** with full logging
- **Multiple LLM Providers** (Cloudflare, OpenAI)
- **Diagram Generation** with Mermaid
- **Dark Theme** with responsive UI

## Admin Access
- **URL:** https://elamurugan.pages.dev/admin.html
- **Key:** `BScr@nc4$0128`

### Admin Features
- **API Logs** (paginated, searchable)
- **Contact Requests** management
- **Conversation History** viewing
- **AI Provider Configuration** (OpenAI API keys)
- **Chat Interface** for testing
- **System Analytics** and statistics

## For Complete Details
See: [../Deployed.md](../Deployed.md) and [../Ideas/docs/CLOUDFLARE_SETUP.md](../Ideas/docs/CLOUDFLARE_SETUP.md)
