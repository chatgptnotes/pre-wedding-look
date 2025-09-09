import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 500 },   // Ramp up to 500 users  
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '2m', target: 1000 },  // Stay at 1000 users
    { duration: '1m', target: 500 },   // Ramp down to 500 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    errors: ['rate<0.05'], // Error rate < 5%
  },
};

const BASE_URL = 'https://your-api-url.supabase.co';
const API_KEY = 'your-anon-key';

// Test scenarios
export default function () {
  const userId = `user_${__VU}_${Date.now()}`;
  
  // Scenario 1: User Authentication
  const authRes = http.post(
    `${BASE_URL}/auth/v1/signup`,
    JSON.stringify({
      email: `test${userId}@example.com`,
      password: 'TestPassword123!'
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
    }
  );
  
  check(authRes, {
    'auth successful': (r) => r.status === 200,
    'auth response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(authRes.status !== 200);
  
  sleep(1);
  
  // Scenario 2: Create Matchmaking Session
  const sessionRes = http.post(
    `${BASE_URL}/rest/v1/rpc/create_matchmaking_session`,
    JSON.stringify({ user_id: userId }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${authRes.json('access_token')}`,
      },
    }
  );
  
  check(sessionRes, {
    'session created': (r) => r.status === 200,
    'session response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(sessionRes.status !== 200);
  
  sleep(2);
  
  // Scenario 3: Submit Design
  const designRes = http.post(
    `${BASE_URL}/rest/v1/blinddate_round_designs`,
    JSON.stringify({
      participant_id: userId,
      round_number: 1,
      prompt: 'Test design prompt',
      design_config: { test: true }
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${authRes.json('access_token')}`,
      },
    }
  );
  
  check(designRes, {
    'design submitted': (r) => r.status === 201,
    'design response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(designRes.status !== 201);
  
  sleep(1);
  
  // Scenario 4: Get Leaderboard (cached)
  const leaderboardRes = http.get(
    `${BASE_URL}/rest/v1/leaderboard_cache?limit=10`,
    {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${authRes.json('access_token')}`,
      },
    }
  );
  
  check(leaderboardRes, {
    'leaderboard loaded': (r) => r.status === 200,
    'leaderboard response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(leaderboardRes.status !== 200);
  
  sleep(0.5);
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
  console.log('======================');
  console.log('Performance Summary:');
  console.log(`- Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`- Request Rate: ${data.metrics.http_reqs.values.rate}/s`);
  console.log(`- Avg Response Time: ${data.metrics.http_req_duration.values.avg}ms`);
  console.log(`- P95 Response Time: ${data.metrics.http_req_duration.values['p(95)']}ms`);
  console.log(`- P99 Response Time: ${data.metrics.http_req_duration.values['p(99)']}ms`);
  console.log(`- Error Rate: ${data.metrics.errors.values.rate * 100}%`);
}