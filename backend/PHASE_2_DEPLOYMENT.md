# Phase 2: Flow Diagram Generation - Deployment Guide

## Status: ✅ Backend Complete & Ready for Deployment

This document outlines the Phase 2 implementation and deployment process.

---

## What Was Implemented (Step 1: Backend Integration)

### 📦 New Files Created
1. **Database Migration**: `migrations/0002_create_diagrams_table.sql`
   - Stores generated diagrams with metadata
   - Links diagrams to conversations and messages
   - Includes performance indexes

2. **Test Suite**: `scripts/test-diagram-integration.ts`
   - Integration tests for full flow
   - Verifies detector → generator → validator pipeline

### 🔧 Modules Updated
1. **src/index.ts** (`/api/chat` endpoint):
   - Added diagram module imports
   - Integrated diagram detection after AI response
   - Non-blocking diagram generation (doesn't delay chat)
   - Graceful error handling (diagram failures don't affect chat)
   - Response now includes optional `diagram` field

2. **src/diagram/detector.ts**:
   - Enhanced "design" keyword detection for architecture
   - Improved confidence scoring for design patterns
   - Now detects: "How would you design a payment system?" correctly

### ✅ Dependencies Added
- `tsx` (dev) - For running TypeScript tests
- `@types/node` (dev) - Node.js type definitions

---

## Test Results

### Detector Module ✅
- ✅ Architecture questions
- ✅ Flow/process questions
- ✅ Sequence/interaction questions
- ✅ Generic questions (correctly skipped)
- ✅ Short messages (correctly skipped)
- ✅ Design patterns (now working!)

### Prompt Generation ✅
- ✅ Type-specific prompts generated correctly
- ✅ Title generation works

### Mermaid Syntax Extraction ✅
- ✅ Plain syntax extraction
- ✅ Markdown-wrapped syntax
- ✅ Explanation-prefixed syntax

### Valid Diagrams ✅
- ✅ Flowcharts validate correctly
- ✅ Architecture diagrams validate correctly
- ✅ Sequence diagrams validate correctly

### Integration Test ✅
- ✅ Full flow: detection → generation → validation
- ✅ Graceful degradation when validation fails

---

## Deployment Steps

### Prerequisites
```bash
# Current directory
cd /Users/mozhi/projects/ai/cloudflare/elamurugan/backend

# Ensure all dependencies installed
npm install

# Verify TypeScript builds without errors
npm run build
```

### Step 1: Deploy Backend to Staging
```bash
# From parent directory
cd /Users/mozhi/projects/ai/cloudflare

# Deploy backend only (skips frontend)
./deploy-app.sh elamurugan --skip-frontend
```

### Step 2: Verify Database Migration
The migration will auto-apply on first chat API call. To verify:
```bash
# Check if diagrams table exists (after making a test API call)
curl https://elamurugan-api.pages.dev/api/health

# Make a test chat request
curl -X POST https://elamurugan-api.pages.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "message": "How would you build a microservices architecture?"
  }'

# Should return chat response with empty diagram field
# (diagram generation requires Mistral 7B call, might take 2-3s)
```

### Step 3: Monitor First Requests
After deployment, check backend logs for:
```
✅ Diagram detected: architecture (confidence: X%)
✅ Diagram generated and stored: Architecture: ...
```

Or warnings:
```
⚠️  Diagram validation failed: ...
[Non-blocking - chat still works normally]
```

---

## API Response Format (Updated)

### Chat Response Now Includes Diagram Field
```json
{
  "success": true,
  "conversationId": "abc123...",
  "userMessage": "How would you build an ecommerce platform?",
  "assistantMessage": "...",
  "intro": null,
  "sources": [...],
  "diagram": {
    "type": "architecture",
    "syntax": "graph TB\n  Client[\"Client\"]\n  ...",
    "title": "Architecture: ecommerce platform"
  },
  "timestamp": "2026-02-14T..."
}
```

**Note**: `diagram` field is `null` when:
- Message doesn't match diagram triggers
- Diagram generation fails (non-blocking)
- Diagram validation fails
- Confidence score below threshold (40%)

---

## What's Next (Step 2: Frontend)

After backend is deployed and working, implement frontend components:

1. **DiagramViewer.tsx** - Render Mermaid diagrams
2. **DiagramExporter.tsx** - SVG export functionality
3. **MessageRenderer.tsx** - Wrap messages with optional diagram
4. **Add mermaid.js** - Frontend library

See PHASE_2_IMPLEMENTATION.md for detailed frontend requirements.

---

## Key Design Principles (Maintained)

✅ **Text First**: Chat response always returns immediately with text
✅ **Diagrams Are Optional**: Generated in parallel, never block chat
✅ **Graceful Degradation**: If diagram fails, chat still works perfectly
✅ **No External APIs**: Uses Cloudflare AI (Mistral 7B) natively
✅ **Performance**: Diagram detection < 50ms, generation < 3s (async)
✅ **Safety**: Max 50 nodes per diagram, syntax validation, error logging

---

## Troubleshooting

### Issue: "Unknown file extension .ts" error
**Solution**: Already fixed - added `@types/node` and updated `tsconfig.json`

### Issue: Diagram not generating after deployment
**Check**:
1. Backend deployed successfully (npm run build passed)
2. AI binding configured in wrangler.json
3. Database migration applied (make a test chat call to trigger)
4. Check backend logs for errors

### Issue: Diagrams not showing in frontend
**After frontend is deployed**:
1. Verify `diagram` field in API response (use curl/DevTools)
2. Check browser console for Mermaid.js errors
3. Verify DiagramViewer component renders correctly

---

## Rollback Plan

If Phase 2 needs to be rolled back:

### Backend
```bash
# Revert imports and diagram generation code in src/index.ts
# Delete src/diagram/* modules
# Redeploy: ./deploy-app.sh elamurugan --skip-frontend
```

### Frontend
```bash
# Simply don't deploy DiagramViewer components
# Or remove diagram rendering if already deployed
```

**Result**: Chat works normally without diagrams

---

## Performance Metrics

After deployment, monitor:

| Metric | Target | Notes |
|--------|--------|-------|
| Chat response time | < 2s | Should not increase |
| Diagram detection | < 50ms | Non-blocking |
| Diagram generation | < 3s | Async, parallel |
| Diagram validation | < 100ms | After generation |
| Database query | < 500ms | Storing diagram metadata |

---

## Success Criteria

✅ Backend deployed and working
✅ Chat endpoint returns diagram field
✅ Diagrams detected correctly
✅ No regression in existing chat functionality
✅ All logs show non-blocking behavior
✅ Frontend ready for Step 2 implementation

