# Elamurugan AI Profile - Quick Start

## 30-Second Setup

```bash
# 1. Create database
cd elamurugan/backend
npx wrangler d1 create elamurugan-db

# 2. Copy database ID to wrangler.json

# 3. Update ADMIN_EMAIL in wrangler.json

# 4. Run migrations
npx wrangler d1 execute elamurugan-db --remote \
  --file=migrations/0001_initial_schema.sql

# 5. Deploy
cd ../..
./deploy-app.sh elamurugan
```

## Local Dev (2 Terminals)

```bash
# Terminal 1: Backend
cd elamurugan/backend
npm install && npm run dev

# Terminal 2: Frontend
cd elamurugan/frontend
npm install && npm run dev

# Visit http://localhost:5173
```

## Key Files to Update

| File | Change | Example |
|------|--------|---------|
| `backend/wrangler.json` | Database ID | `"database_id": "abc-123"` |
| `backend/wrangler.json` | Admin email | `"ADMIN_EMAIL": "you@example.com"` |
| `backend/src/index.ts` | AI context | Add more resume details to `SYSTEM_CONTEXT` |

## API Endpoints

```bash
# Send message
curl -X POST https://elamurugan-api.twozao.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","message":"Hello"}'

# Get history
curl https://elamurugan-api.twozao.com/api/conversations/test

# Submit contact
curl -X POST https://elamurugan-api.twozao.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","name":"John","email":"john@example.com","message":"Let\'s talk","type":"call"}'

# Health check
curl https://elamurugan-api.twozao.com/api/health
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| DB not found | Run `npx wrangler d1 list` |
| API 404 | Check `npx wrangler tail` logs |
| Frontend can't reach API | Verify CORS in `backend/src/index.ts` |
| No AI response | Check Workers AI is enabled |

## File Structure

```
frontend/                    Backend/
├── src/                    ├── src/index.ts (API)
│   ├── App.tsx            ├── migrations/ (Schema)
│   ├── styles.css         └── wrangler.json
│   └── components/
└── index.html
```

## Deploy Commands

```bash
# Full deployment
./deploy-app.sh elamurugan

# Or manually
cd backend && npm run build && npx wrangler deploy
cd ../frontend && npm run build && npx wrangler pages deploy dist
```

## Check Deployment

```bash
# Verify backend
curl https://elamurugan-api.twozao.com/api/health

# Verify frontend
open https://elamurugan.pages.dev
```

## Next: Email Integration

Add to `backend/src/index.ts` in `/api/contact` handler:

```typescript
// After storing contact request
const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
const authHeader = 'Basic ' + btoa(`api:${env.MAILGUN_API_KEY}`);

await fetch(mailgunUrl, {
  method: 'POST',
  headers: { 'Authorization': authHeader },
  body: new FormData({ ... })
});
```

Then: `npx wrangler secret put MAILGUN_API_KEY`

## Production Checklist

- [ ] D1 database created
- [ ] `ADMIN_EMAIL` set
- [ ] Migrations applied
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Health check passing
- [ ] Chat working end-to-end
- [ ] Contact form tested
- [ ] Email integration working (optional)

## Useful Links

- Cloudflare Dashboard: https://dash.cloudflare.com
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
- D1 Docs: https://developers.cloudflare.com/d1/
- Workers AI: https://developers.cloudflare.com/workers-ai/
- Full README: See `README.md` in this directory

---

**Total setup time: ~5 minutes | Total deploy time: ~2 minutes**
