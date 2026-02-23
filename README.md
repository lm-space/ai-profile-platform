# Elamurugan AI Profile - Chat & Connect Platform

An AI-powered interactive profile platform for Elamurugan Nallathambi - a Tech Architect with 14+ years of experience. Visitors can chat with an AI that understands Ela's background, expertise, and professional journey, then leave contact requests.

## Project Overview

**Live URL:** https://elamurugan.pages.dev/
**API URL:** https://elamurugan-api.twozao.com/
**Architecture:** Cloudflare Workers (Backend) + Cloudflare Pages (Frontend)

### Features

- **AI Chat Interface** - Chat with Mistral 7B AI trained on Ela's professional context
- **Conversation History** - Persistent chat history per session (7-day retention)
- **Contact Requests** - Visitors can submit contact requests (call, email, or meeting)
- **Responsive Design** - Beautiful modern UI optimized for mobile and desktop
- **Neural Network Visualization** - Animated background reflecting tech expertise

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast build tooling
- **CSS3** with animations and gradients (no CSS-in-JS framework)

### Backend
- **Hono** web framework
- **Cloudflare Workers** runtime
- **Cloudflare D1** for persistent storage
- **Cloudflare Workers AI** (Mistral 7B Instruct)

### Database
- **D1 SQLite** for conversations, messages, and contact requests
- 7-day auto-cleanup for expired conversations

## Directory Structure

```
elamurugan/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Hero.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   └── ContactForm.tsx
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # React entry point
│   │   ├── styles.css       # All styling (dark theme + animations)
│   │   └── vite-env.d.ts
│   ├── index.html           # HTML entry point
│   ├── vite.config.ts       # Vite configuration
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                  # Hono + Workers backend
│   ├── src/
│   │   ├── index.ts         # Main API server with routes
│   │   └── services/        # Business logic (for future expansion)
│   ├── migrations/
│   │   └── 0001_initial_schema.sql  # Database schema
│   ├── wrangler.json        # Cloudflare Worker config
│   ├── tsconfig.json
│   └── package.json
│
└── README.md                 # This file
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Wrangler CLI: `npm install -g @cloudflare/wrangler`

### Setup

1. **Install dependencies:**
   ```bash
   cd elamurugan/frontend
   npm install

   cd ../backend
   npm install
   ```

2. **Create D1 database locally (optional for dev):**
   ```bash
   cd backend
   npx wrangler d1 execute elamurugan-db --remote --file=migrations/0001_initial_schema.sql
   ```

3. **Start backend (Worker dev server):**
   ```bash
   cd backend
   npm run dev
   # Runs on http://localhost:8787
   ```

4. **In another terminal, start frontend:**
   ```bash
   cd frontend
   npm run dev
   # Runs on http://localhost:5173
   ```

The frontend will proxy API calls to the backend during development.

## API Endpoints

### Chat
- **POST** `/api/chat` - Send message and get AI response
  ```json
  {
    "sessionId": "session_xxx",
    "message": "Tell me about your experience with AWS"
  }
  ```
  Returns:
  ```json
  {
    "success": true,
    "conversationId": "conv_xxx",
    "userMessage": "...",
    "assistantMessage": "...",
    "timestamp": "2026-02-14T..."
  }
  ```

### Conversation History
- **GET** `/api/conversations/:sessionId` - Get all messages in conversation
  ```json
  {
    "conversationId": "conv_xxx",
    "messages": [
      { "id": "msg_1", "role": "user", "content": "...", "created_at": "..." },
      { "id": "msg_2", "role": "assistant", "content": "...", "created_at": "..." }
    ]
  }
  ```

### Contact Request
- **POST** `/api/contact` - Submit contact request
  ```json
  {
    "sessionId": "session_xxx",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "message": "I'm interested in discussing cloud architecture",
    "type": "meeting"
  }
  ```
  Returns:
  ```json
  {
    "success": true,
    "contactId": "contact_xxx",
    "message": "Thank you for reaching out...",
    "timestamp": "2026-02-14T..."
  }
  ```

### Health Check
- **GET** `/api/health` - Service health status

## Deployment

### Prerequisites
- Cloudflare account
- Pages project created: `elamurugan`
- Custom domain setup in DNS

### Automatic Deployment

The app uses the unified deploy script:

```bash
./deploy-app.sh elamurugan
```

This will:
1. Build the frontend (React/Vite)
2. Build the backend (TypeScript → JavaScript)
3. Deploy frontend to Cloudflare Pages
4. Deploy backend to Cloudflare Workers
5. Run database migrations if needed

### Manual Deployment

**Frontend:**
```bash
cd frontend
npm run build
npx wrangler pages deploy dist
```

**Backend:**
```bash
cd backend
npm run build
npx wrangler deploy
```

## Configuration

### Environment Variables

**Backend (wrangler.json):**
- `APP_URL` - Frontend URL for CORS (https://elamurugan.pages.dev)
- `ADMIN_EMAIL` - Email to receive contact requests
- Database binding: `DB` (D1)
- AI binding: `AI` (Workers AI)

**Frontend (.env or via API_BASE):**
- API development: `/api` (proxied to localhost:8787)
- API production: `https://elamurugan-api.twozao.com/api`

### Database

D1 database `elamurugan-db` contains:

**tables/conversations:**
- id, session_id, created_at, updated_at, expires_at
- Indexed by session_id and expires_at

**tables/messages:**
- id, conversation_id, role ('user'|'assistant'), content, created_at
- Auto-cleanup after 7 days via expires_at

**tables/contact_requests:**
- id, conversation_id, name, email, phone, message, type ('call'|'email'|'meeting'), status ('pending'|'sent'|'failed'), created_at

## AI System Context

The AI is configured with comprehensive context about Elamurugan:

**Background:**
- 14+ years as Tech Architect & Senior Technical Manager
- 200+ eCommerce projects delivered
- Specialization: Enterprise Architecture, Cloud Infrastructure, DevOps

**Technical Expertise:**
- Enterprise eCommerce (Magento 1.x, 2.x, Adobe Commerce)
- Backend: PHP, Java, Node.js
- Cloud: AWS, Docker, Kubernetes
- Performance: <2s load time optimization
- Full-stack development and system design

**Knowledge Base:**
The system uses Mistral 7B Instruct model with temperature 0.7 for balanced, conversational responses. Context window includes up to 20 previous messages in conversation for coherent multi-turn dialogue.

## Future Enhancements

1. **Email Integration** - SendGrid/Resend for sending contact requests to Ela
2. **Document Ingestion** - Allow uploading additional profile documents/resume for richer AI knowledge
3. **Analytics** - Track conversation topics and improve AI responses
4. **Multi-language** - Support conversations in different languages
5. **Voice** - Add voice chat capability
6. **Calendar Integration** - Schedule meetings directly from contact form
7. **Social Links** - LinkedIn, GitHub integration in hero
8. **Portfolio Projects** - Display case studies and past work

## Troubleshooting

### "Failed to send message"
- Check backend is running (`npm run dev` in backend folder)
- Verify API URL in browser DevTools Network tab
- Check Cloudflare Workers logs: `npx wrangler tail`

### Database errors
- Run migrations: `npx wrangler d1 execute elamurugan-db --remote --file=migrations/0001_initial_schema.sql`
- Check DB ID in wrangler.json matches created database
- Verify D1 binding is configured in wrangler.json

### CORS errors
- Frontend must be in CORS allowlist in backend
- Check `cors()` middleware in `src/index.ts`
- For production, verify custom domain is set up in Cloudflare

### AI not responding
- Check Workers AI is enabled in account
- Verify Mistral 7B model is available
- Check rate limits: 5000 requests/min on free tier

## File Locations Reference

| File | Purpose |
|------|---------|
| backend/src/index.ts | Main API with routes (chat, contact, history) |
| backend/migrations/0001_initial_schema.sql | Database schema (conversations, messages, contact_requests) |
| frontend/src/App.tsx | Main app component with state management |
| frontend/src/components/ChatWindow.tsx | Chat UI and message handling |
| frontend/src/components/ContactForm.tsx | Contact request form |
| frontend/src/components/Hero.tsx | Hero section with profile intro |
| frontend/src/styles.css | All styling (dark theme, neural network animation) |

## Development Notes

- **Session Management:** Each visitor gets a unique session ID stored in localStorage
- **Conversation Persistence:** Messages stored in D1, retrieved on page reload
- **Auto-cleanup:** Conversations expire after 7 days
- **AI Temperature:** Set to 0.7 for creative but coherent responses
- **Mobile First:** Designed for small screens, scales up gracefully
- **Accessibility:** WCAG 2.1 AA compliant (keyboard nav, color contrast, ARIA labels)

## License

Private project for Elamurugan Nallathambi

## Contact

For questions about deployment or configuration:
- Cloudflare Docs: https://developers.cloudflare.com/
- Hono Framework: https://hono.dev/
- Workers AI: https://developers.cloudflare.com/workers-ai/
