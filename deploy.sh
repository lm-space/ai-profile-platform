#!/bin/bash
set -e

# =============================================================================
# Quick Deploy Script for elamurugan Portfolio Chat
# =============================================================================
# Deploys backend (Worker) + frontend (Pages) + runs D1 migration
# Requires: wrangler authenticated (run `wrangler login` if needed)
# =============================================================================

echo "🚀 Deploying elamurugan Portfolio Chat..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

# Step 1: Backend — Apply D1 migration
echo "📦 Step 1: Applying D1 migration (add KB tiers)..."
cd "${BACKEND_DIR}"
npx wrangler d1 migrations apply elamurugan-db --remote 2>&1 || {
    echo "⚠️  Migration may have already been applied. Continuing..."
}
echo ""

# Step 2: Backend — Deploy Worker
echo "🔧 Step 2: Deploying backend Worker..."
cd "${BACKEND_DIR}"
npx wrangler deploy
echo ""

# Step 3: Frontend — Build + Deploy Pages
echo "🎨 Step 3: Building frontend..."
cd "${FRONTEND_DIR}"
npx vite build
echo ""

echo "📤 Step 3b: Deploying frontend to Cloudflare Pages..."
npx wrangler pages deploy dist/ --project-name=elamurugan
echo ""

# Step 4: Index tiered KB
echo "📚 Step 4: Indexing tiered Knowledge Base..."
chmod +x "${BACKEND_DIR}/scripts/index-kb-tiered.sh"
"${BACKEND_DIR}/scripts/index-kb-tiered.sh" https://elamurugan-api.rugan.workers.dev
echo ""

echo "✅ Deployment complete!"
echo ""
echo "🔍 Test diagram generation:"
echo "   Visit: https://elamurugan.pages.dev"
echo '   Ask: "Can you create flow diagram of B2B Platform"'
echo ""
echo "📊 Check Worker logs:"
echo "   npx wrangler tail --format=pretty"
