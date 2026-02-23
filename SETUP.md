# Elamurugan AI Profile - Setup Guide

This guide walks through setting up the elamurugan.pages.dev app from scratch.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed: `npm install -g @cloudflare/wrangler`
- Pages project "elamurugan" created (already done at https://elamurugan.pages.dev)
- Account ID and API token ready

## Step 1: Create D1 Database

```bash
cd elamurugan/backend

# Create the D1 database
npx wrangler d1 create elamurugan-db

# Output will show database ID, copy it
# Example: 78f31e44-5c45-42bd-a1be-cd1b29aadcbf

# Update wrangler.json with the database_id from output
```

Edit `backend/wrangler.json` and update:
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "elamurugan-db",
      "database_id": "PASTE_ID_HERE"
    }
  ]
}
```

## Step 2: Set Environment Variables

**IMPORTANT:** Update these in `wrangler.json` before deployment:

```json
{
  "vars": {
    "APP_URL": "https://elamurugan.pages.dev",
    "ADMIN_EMAIL": "YOUR_EMAIL_HERE"  // Where contact requests will be sent
  }
}
```

## Step 3: Run Database Migrations

```bash
cd backend

# Apply schema to remote database
npx wrangler d1 execute elamurugan-db --remote --file=migrations/0001_initial_schema.sql

# Verify tables were created
npx wrangler d1 execute elamurugan-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Step 4: Install Dependencies

```bash
# Backend
cd elamurugan/backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 5: Test Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Should print: ⚡ Wrangler is running on http://localhost:8787

# Terminal 2: Frontend
cd frontend
npm run dev
# Should print: ➜  Local:   http://localhost:5173/

# Visit http://localhost:5173 and test chat
```

## Step 6: Deploy

Using the unified deploy script:

```bash
./deploy-app.sh elamurugan
```

Or manually:

```bash
# Backend
cd backend
npm run build
npx wrangler deploy

# Frontend
cd frontend
npm run build
npx wrangler pages deploy dist
```

## Step 7: Configure Cloudflare Dashboard

1. **Add Custom Domain to Pages Project:**
   - Go to Cloudflare Dashboard → Workers & Pages → elamurugan (Pages project)
   - Custom domains tab → Add custom domain
   - Enter: `elamurugan.pages.dev`

2. **Update DNS (if using custom domain):**
   - Add CNAME record for `elamurugan` → `elamurugan.pages.dev`
   - Or point `elamurugan.pages.dev` to your domain

3. **Verify API Route:**
   - Go to Workers & Pages → elt-api (Worker)
   - Routes tab → Should show `elamurugan-api.twozao.com/*`

## Step 8: Verify Deployment

```bash
# Test health endpoint
curl https://elamurugan-api.twozao.com/api/health

# Should return:
# {"status":"ok"}

# Test chat endpoint (basic)
curl -X POST https://elamurugan-api.twozao.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","message":"Hello"}'

# Should return AI response
```

## Troubleshooting

### "D1 database not found"
```bash
# List all D1 databases
npx wrangler d1 list

# Use the correct database ID from list
```

### "API returning 404"
```bash
# Check Worker deployment status
npx wrangler tail

# Verify custom domain is configured
npx wrangler deployments list
```

### "Frontend can't reach API"
- Check `API_BASE` in `frontend/src/App.tsx`
- Verify CORS is enabled in backend `src/index.ts`
- Check browser console for specific error

### "AI model not found"
- Verify Workers AI is enabled on Cloudflare account
- Check Mistral 7B model availability in region

## Post-Deployment Tasks

### 1. Add More Profile Content

The AI system context is hardcoded in `backend/src/index.ts` in the `SYSTEM_CONTEXT` variable. To add more of Ela's professional details:

```typescript
const SYSTEM_CONTEXT = `...existing content...

Additional Skills:
- Kubernetes orchestration at scale
- Multi-cloud strategies
- ...more details...`;
```

Then redeploy backend.

### 2. Enable Contact Request Emails

Currently, contact requests are stored in DB but not emailed. To send emails, integrate with:

**Option A: Mailgun**
```typescript
// In backend/src/index.ts, after storing contact request
const mailgun = require('mailgun.js');
const client = mailgun.client({
  username: 'api',
  key: env.MAILGUN_API_KEY
});

await client.messages.create(MAILGUN_DOMAIN, {
  from: 'Contact Form <form@example.com>',
  to: env.ADMIN_EMAIL,
  subject: `New Contact Request: ${type}`,
  text: `${name} (${email}) wants to ${type}...`
});
```

**Option B: SendGrid**
```typescript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(env.SENDGRID_API_KEY);

await sgMail.send({
  to: env.ADMIN_EMAIL,
  from: 'noreply@example.com',
  subject: `New Contact Request: ${type}`,
  text: `${name} (${email}) wants to ${type}...`
});
```

Set the API key as a secret:
```bash
npx wrangler secret put MAILGUN_API_KEY
# or
npx wrangler secret put SENDGRID_API_KEY
```

### 3. Analytics

Add to `frontend/src/App.tsx` to track conversations:
```typescript
// Track conversation start
analytics.track('conversation_started', { sessionId });

// Track first message
analytics.track('first_message_sent', { sessionId, messageLength });

// Track contact submission
analytics.track('contact_request_submitted', { type, sessionId });
```

## Environment Checklist

Before production:

- [ ] D1 database created and migrated
- [ ] `ADMIN_EMAIL` set in wrangler.json
- [ ] Backend deployed to Workers
- [ ] Frontend deployed to Pages
- [ ] Custom domain configured
- [ ] CORS origins correct for production URL
- [ ] AI context updated with latest resume
- [ ] Email integration configured (if desired)
- [ ] Analytics configured (if desired)
- [ ] DNS records verified
- [ ] SSL certificate is valid

## Maintenance

### Weekly
- Check contact request queue
- Monitor conversation topics

### Monthly
- Review error logs in Workers
- Update AI context if needed
- Check D1 usage vs. free tier limits

### Quarterly
- Update Ela's profile/resume in AI context
- Review and improve suggested questions
- Optimize response times if needed

## Limits & Quotas (Free Tier)

- **Workers requests:** 100,000/day
- **D1 reads:** 5 million/day
- **D1 writes:** 100,000/day
- **D1 storage:** 5 GB total
- **Pages builds:** 500/month

Current expected usage:
- ~100-500 conversations/day (under limits)
- ~2-10 contact requests/day (under limits)

## Next Steps

1. ✅ Review this setup guide
2. ✅ Run `./deploy-app.sh elamurugan`
3. ✅ Verify all endpoints working
4. ✅ Add email integration for contact requests
5. ✅ Update CLOUDFLARE_SETUP.md with new app details
6. ✅ Monitor initial deployment for issues

## Support

For detailed Cloudflare documentation:
- Workers: https://developers.cloudflare.com/workers/
- Pages: https://developers.cloudflare.com/pages/
- D1: https://developers.cloudflare.com/d1/
- Workers AI: https://developers.cloudflare.com/workers-ai/
