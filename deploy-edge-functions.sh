#!/bin/bash

echo "🚀 Deploying Blind Date Edge Functions to Supabase..."
echo

# Set the access token from environment
export SUPABASE_ACCESS_TOKEN=sbp_3269a302003d3e4fabe62fde0466f3b747f4398b

echo "📦 Deploying blinddate-matchmaking function..."
npx supabase functions deploy blinddate-matchmaking --no-verify-jwt --project-ref opchrnceamwydfszzzco
echo

echo "📦 Deploying blinddate-game function..."  
npx supabase functions deploy blinddate-game --no-verify-jwt --project-ref opchrnceamwydfszzzco
echo

echo "✅ Edge functions deployment complete!"
echo
echo "🧪 Testing deployments..."

echo "Testing blinddate-matchmaking function..."
curl -X POST 'https://opchrnceamwydfszzzco.supabase.co/functions/v1/blinddate-matchmaking' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2hybmNlYW13eWRmc3p6emNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDU3NDksImV4cCI6MjA3MjkyMTc0OX0.cYHBq8XqEjg_YGKLBxXn-zsWb43onXumbMo4ZRrHwMg" \
  -H "Content-Type: application/json" \
  -d '{"action": "create_private"}' \
  --max-time 10

echo
echo "Testing blinddate-game function..."
curl -X POST 'https://opchrnceamwydfszzzco.supabase.co/functions/v1/blinddate-game' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2hybmNlYW13eWRmc3p6emNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDU3NDksImV4cCI6MjA3MjkyMTc0OX0.cYHBq8XqEjg_YGKLBxXn-zsWb43onXumbMo4ZRrHwMg" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_session", "session_id": "test"}' \
  --max-time 10

echo
echo "🎯 Deployment and testing complete!"