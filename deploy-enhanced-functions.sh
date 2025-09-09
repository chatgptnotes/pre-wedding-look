#!/bin/bash

# Deploy Enhanced Blind Date Style-Off Edge Functions
# This script deploys all the enhanced edge functions for the improved matchmaking system

echo "🚀 Deploying Enhanced Blind Date Style-Off Edge Functions..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Set project reference (replace with your actual project ref)
PROJECT_REF="opchrnceamwydfszzzco"

echo "📡 Linking to project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF

echo "🔧 Deploying enhanced matchmaking function..."
supabase functions deploy blinddate-matchmaking-enhanced --no-verify-jwt

echo "🧹 Deploying cleanup function..."
supabase functions deploy blinddate-cleanup --no-verify-jwt

echo "🔄 Redeploying existing game function..."
supabase functions deploy blinddate-game --no-verify-jwt

echo "✅ All functions deployed successfully!"

echo ""
echo "📋 Deployed Functions:"
echo "   • blinddate-matchmaking-enhanced: Enhanced matchmaking with timeout handling"
echo "   • blinddate-cleanup: Automated cleanup and maintenance"
echo "   • blinddate-game: Game session management (updated)"

echo ""
echo "🎯 Function URLs:"
echo "   • Matchmaking: https://$PROJECT_REF.supabase.co/functions/v1/blinddate-matchmaking-enhanced"
echo "   • Cleanup: https://$PROJECT_REF.supabase.co/functions/v1/blinddate-cleanup"
echo "   • Game: https://$PROJECT_REF.supabase.co/functions/v1/blinddate-game"

echo ""
echo "⚙️  Next Steps:"
echo "   1. Update frontend to use 'blinddate-matchmaking-enhanced' instead of 'blinddate-matchmaking'"
echo "   2. Set up cron job for cleanup function (every 10 minutes recommended)"
echo "   3. Test the enhanced timeout and bot demo functionality"

echo ""
echo "🔮 Cron Setup (Optional):"
echo "   Run this in your Supabase SQL editor to set up automatic cleanup:"
echo "   SELECT cron.schedule('blinddate-cleanup', '*/10 * * * *', 'SELECT net.http_post(url:=''https://$PROJECT_REF.supabase.co/functions/v1/blinddate-cleanup'', headers:=''{\"Authorization\": \"Bearer YOUR_ANON_KEY\"}''::jsonb);');"

echo ""
echo "🎉 Enhanced Blind Date Style-Off is ready for testing!"