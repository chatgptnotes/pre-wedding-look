#!/bin/bash

# PreWedding AI Studio - Production Deployment Script
# This script handles deployment to Vercel with proper environment setup

set -e

echo "🚀 Starting deployment to Vercel..."

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Build the project first
echo -e "${BLUE}📦 Building project...${NC}"
npm run build

# Test the build
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist folder not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Deploy Supabase Edge Functions first
echo -e "${BLUE}🔧 Deploying Edge Functions...${NC}"

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "Deploying matchmaking function..."
    supabase functions deploy blinddate-matchmaking --no-verify-jwt || echo "⚠️  Matchmaking function deploy failed"
    
    echo "Deploying cleanup function..."
    supabase functions deploy blinddate-cleanup --no-verify-jwt || echo "⚠️  Cleanup function deploy failed"
    
    echo "Deploying image queue worker..."
    supabase functions deploy image-queue-worker --no-verify-jwt || echo "⚠️  Image queue worker deploy failed"
    
    echo -e "${GREEN}✅ Edge Functions deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found - skipping Edge Function deployment${NC}"
fi

# Set production environment variables
echo -e "${BLUE}🔑 Setting environment variables...${NC}"

# Deploy to Vercel
if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    echo -e "${BLUE}🌐 Deploying to production...${NC}"
    vercel --prod
else
    echo -e "${BLUE}🔍 Deploying to preview...${NC}"
    vercel
fi

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls prewedding-ai-studio --meta url | head -1)

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🔗 Deployment URL: ${DEPLOYMENT_URL}${NC}"

# Run post-deployment tests
echo -e "${BLUE}🧪 Running post-deployment tests...${NC}"

# Test the deployment
curl -f "${DEPLOYMENT_URL}/api/health" > /dev/null 2>&1 && echo -e "${GREEN}✅ Health check passed${NC}" || echo -e "${YELLOW}⚠️  Health check failed${NC}"

echo -e "${GREEN}🎉 Deployment process completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  1. Test the application: ${DEPLOYMENT_URL}"
echo -e "  2. Verify multiplayer functionality"
echo -e "  3. Check mobile responsiveness"
echo -e "  4. Test video generation features"
echo -e "  5. Monitor error logs in Vercel dashboard"
echo ""
echo -e "${BLUE}🔧 Production URLs:${NC}"
echo -e "  Main App: ${DEPLOYMENT_URL}"
echo -e "  API Health: ${DEPLOYMENT_URL}/api/health"
echo -e "  Cleanup Endpoint: ${DEPLOYMENT_URL}/api/cleanup"