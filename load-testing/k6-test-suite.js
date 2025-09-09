/**
 * K6 Load Testing Suite for Pre-Wedding AI Studio
 * Comprehensive performance testing for 1k+ concurrent users
 * Covers all critical user flows and API endpoints
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const gameJoinSuccessRate = new Rate('game_join_success_rate');
const gameJoinDuration = new Trend('game_join_duration');
const imageGenerationDuration = new Trend('image_generation_duration');
const websocketConnections = new Counter('websocket_connections');
const rateLimitErrors = new Counter('rate_limit_errors');
const apiErrors = new Counter('api_errors');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'https://pre-wedding-look-92fb42tfd-chatgptnotes-6366s-projects.vercel.app';
const API_BASE = __ENV.API_BASE || 'https://your-supabase-project.supabase.co/functions/v1';
const WS_URL = __ENV.WS_URL || 'wss://your-supabase-project.supabase.co/realtime/v1/websocket';

// Test scenarios configuration
export const options = {
  scenarios: {
    // Scenario 1: Normal user traffic
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Ramp up to 100 users
        { duration: '5m', target: 100 },   // Stay at 100 users
        { duration: '2m', target: 200 },   // Ramp up to 200 users
        { duration: '10m', target: 200 },  // Stay at 200 users
        { duration: '2m', target: 0 },     // Ramp down
      ],
      gracefulRampDown: '30s',
    },
    
    // Scenario 2: Peak load simulation
    peak_load: {
      executor: 'ramping-vus',
      startTime: '10m',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },   // Quick ramp to 500
        { duration: '3m', target: 1000 },  // Ramp to 1000 users
        { duration: '5m', target: 1000 },  // Peak load
        { duration: '2m', target: 500 },   // Scale down
        { duration: '2m', target: 0 },     // Ramp down
      ],
      gracefulRampDown: '30s',
    },
    
    // Scenario 3: Spike testing
    spike_test: {
      executor: 'ramping-vus',
      startTime: '20m',
      startVUs: 100,
      stages: [
        { duration: '30s', target: 1500 }, // Sudden spike
        { duration: '1m', target: 1500 },  // Hold spike
        { duration: '30s', target: 100 },  // Return to normal
      ],
      gracefulRampDown: '15s',
    },
    
    // Scenario 4: Game-specific load testing
    game_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '15m',
      startTime: '2m',
      exec: 'gameScenario',
    },
    
    // Scenario 5: API stress testing
    api_stress: {
      executor: 'constant-arrival-rate',
      rate: 200, // 200 requests per second
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 50,
      maxVUs: 200,
      startTime: '5m',
      exec: 'apiStressTest',
    }
  },
  
  thresholds: {
    // Performance thresholds
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
    
    // Custom metric thresholds
    game_join_success_rate: ['rate>0.95'], // 95% success rate for game joins
    game_join_duration: ['p(95)<3000'],     // Game joins under 3s
    image_generation_duration: ['p(95)<15000'], // Image generation under 15s
    
    // WebSocket thresholds
    websocket_connections: ['count>100'], // At least 100 WS connections
    
    // Error thresholds
    rate_limit_errors: ['count<100'],  // Less than 100 rate limit errors
    api_errors: ['count<50'],          // Less than 50 API errors
  },
  
  // Global test settings
  userAgent: 'K6-LoadTest/1.0 (PreWedding-AI-Studio)',
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)', 'count'],
};

// Test data
const TEST_USERS = Array.from({ length: 1000 }, (_, i) => ({
  id: `test_user_${i + 1}`,
  email: `testuser${i + 1}@loadtest.com`,
  avatar: `Test User ${i + 1}`,
}));

const STYLE_OPTIONS = {
  attire: [
    { type: 'lehenga', color: 'red' },
    { type: 'saree', color: 'pink' },
    { type: 'sherwani', color: 'cream' },
    { type: 'suit', color: 'blue' }
  ],
  hair: [
    { style: 'updo', accessories: 'flowers' },
    { style: 'curls', length: 'long' },
    { style: 'bun', type: 'traditional' }
  ],
  location: [
    { location: 'taj_mahal', mood: 'romantic' },
    { location: 'beach', mood: 'romantic' },
    { location: 'palace', mood: 'royal' }
  ]
};

// Default test scenario - mixed user journey
export default function() {
  const user = randomItem(TEST_USERS);
  
  group('User Authentication', () => {
    authenticateUser(user);
  });
  
  group('Browse Application', () => {
    browseApplication(user);
  });
  
  // 30% of users join games
  if (Math.random() < 0.3) {
    group('Game Flow', () => {
      joinGameFlow(user);
    });
  }
  
  // 50% of users generate images
  if (Math.random() < 0.5) {
    group('Image Generation', () => {
      generateImageFlow(user);
    });
  }
  
  // 20% of users check leaderboards
  if (Math.random() < 0.2) {
    group('Social Features', () => {
      checkLeaderboard(user);
    });
  }
  
  sleep(randomIntBetween(1, 5));
}

// Game-specific scenario
export function gameScenario() {
  const user = randomItem(TEST_USERS);
  
  authenticateUser(user);
  
  group('Full Game Journey', () => {
    const sessionId = joinBlindDateGame(user);
    if (sessionId) {
      playGameRounds(user, sessionId);
      viewResults(user, sessionId);
    }
  });
  
  sleep(randomIntBetween(2, 8));
}

// API stress test scenario
export function apiStressTest() {
  const user = randomItem(TEST_USERS);
  const endpoint = randomItem([
    '/api/health',
    '/api/leaderboard',
    '/api/game/status',
    '/api/styles/options'
  ]);
  
  const response = http.get(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${user.id}`,
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  });
  
  check(response, {
    'API response successful': (r) => r.status < 400,
    'API response time OK': (r) => r.timings.duration < 2000,
  }) || apiErrors.add(1);
  
  if (response.status === 429) {
    rateLimitErrors.add(1);
  }
}

/**
 * Authentication flow
 */
function authenticateUser(user) {
  const authPayload = {
    user_id: user.id,
    email: user.email,
    method: 'loadtest'
  };
  
  const response = http.post(`${BASE_URL}/api/auth/signin`, JSON.stringify(authPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  });
  
  check(response, {
    'Authentication successful': (r) => r.status === 200 || r.status === 201,
    'Auth response time OK': (r) => r.timings.duration < 3000,
  });
  
  return response.status < 400;
}

/**
 * Browse application pages
 */
function browseApplication(user) {
  const pages = [
    '/',
    '/classic',
    '/cinematic',
    '/magic',
    '/gallery',
    '/leaderboard'
  ];
  
  pages.forEach(page => {
    const response = http.get(`${BASE_URL}${page}`, {
      headers: {
        'Authorization': `Bearer ${user.id}`,
      },
      timeout: '15s',
    });
    
    check(response, {
      [`Page ${page} loads successfully`]: (r) => r.status === 200,
      [`Page ${page} loads quickly`]: (r) => r.timings.duration < 5000,
    });
    
    sleep(randomIntBetween(1, 3));
  });
}

/**
 * Join game flow
 */
function joinGameFlow(user) {
  const startTime = Date.now();
  
  const joinResponse = http.post(`${API_BASE}/blinddate-matchmaking-enhanced`, JSON.stringify({
    action: 'join',
    user_id: user.id,
    user_email: user.email
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.id}`,
    },
    timeout: '30s',
  });
  
  const joinDuration = Date.now() - startTime;
  gameJoinDuration.add(joinDuration);
  
  const joinSuccess = check(joinResponse, {
    'Game join successful': (r) => r.status === 200,
    'Game join response valid': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.sessionId && data.role;
      } catch {
        return false;
      }
    },
  });
  
  gameJoinSuccessRate.add(joinSuccess);
  
  if (joinSuccess) {
    const gameData = JSON.parse(joinResponse.body);
    
    // Simulate WebSocket connection for real-time updates
    establishWebSocketConnection(user, gameData.sessionId);
    
    return gameData.sessionId;
  }
  
  return null;
}

/**
 * Join blind date game specifically
 */
function joinBlindDateGame(user) {
  const response = http.post(`${API_BASE}/blinddate-matchmaking-enhanced`, JSON.stringify({
    action: 'join',
    user_id: user.id,
    user_email: user.email,
    requestBotDemo: Math.random() < 0.3 // 30% request bot demo
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.id}`,
    },
    timeout: '45s', // Longer timeout for matchmaking
  });
  
  const success = check(response, {
    'Blind date join successful': (r) => r.status === 200,
    'Valid game session created': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.sessionId && ['A', 'B'].includes(data.role);
      } catch {
        return false;
      }
    },
  });
  
  if (success) {
    const data = JSON.parse(response.body);
    console.log(`User ${user.id} joined game ${data.sessionId} as ${data.role}`);
    return data.sessionId;
  }
  
  return null;
}

/**
 * Play game rounds
 */
function playGameRounds(user, sessionId) {
  const rounds = [
    { topic: 'attire', timeLimit: 180 },
    { topic: 'hair', timeLimit: 180 },
    { topic: 'location', timeLimit: 120 }
  ];
  
  rounds.forEach((round, index) => {
    const roundId = `round_${index + 1}_${sessionId}`;
    
    // Submit design for each role
    ['A', 'B'].forEach(targetRole => {
      const styleChoice = randomItem(STYLE_OPTIONS[round.topic]);
      
      const submitResponse = http.post(`${API_BASE}/blinddate-game`, JSON.stringify({
        action: 'submit_design',
        session_id: sessionId,
        round_id: roundId,
        design_data: {
          target_role: targetRole,
          prompt: [styleChoice],
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        timeout: '20s',
      });
      
      check(submitResponse, {
        'Design submission successful': (r) => r.status === 200,
        'Design submission fast': (r) => r.timings.duration < 5000,
      });
      
      sleep(randomIntBetween(5, 15)); // Simulate thinking time
    });
    
    // Simulate round completion wait
    sleep(randomIntBetween(30, 60));
  });
}

/**
 * View game results
 */
function viewResults(user, sessionId) {
  const revealResponse = http.post(`${API_BASE}/reveal-aggregation`, JSON.stringify({
    action: 'get_reveals',
    session_id: sessionId,
    include_analytics: true
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.id}`,
    },
    timeout: '15s',
  });
  
  check(revealResponse, {
    'Results retrieved successfully': (r) => r.status === 200,
    'Results contain game data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data && data.data.reveals;
      } catch {
        return false;
      }
    },
  });
}

/**
 * Generate image flow
 */
function generateImageFlow(user) {
  const startTime = Date.now();
  
  const imageRequest = {
    prompt: `Beautiful ${randomItem(['bride', 'groom'])} in ${randomItem(['traditional', 'modern', 'elegant'])} attire`,
    style: randomItem(['cinematic', 'dreamy', 'vibrant', 'vintage']),
    user_id: user.id
  };
  
  const response = http.post(`${BASE_URL}/api/generate-image`, JSON.stringify(imageRequest), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.id}`,
    },
    timeout: '60s', // Longer timeout for AI generation
  });
  
  const generationTime = Date.now() - startTime;
  imageGenerationDuration.add(generationTime);
  
  check(response, {
    'Image generation initiated': (r) => r.status === 200 || r.status === 202,
    'Generation response valid': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.image_url || data.job_id;
      } catch {
        return false;
      }
    },
  });
  
  // If async generation, poll for completion
  if (response.status === 202) {
    const data = JSON.parse(response.body);
    if (data.job_id) {
      pollImageGeneration(user, data.job_id);
    }
  }
}

/**
 * Poll for image generation completion
 */
function pollImageGeneration(user, jobId) {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    sleep(3); // Wait 3 seconds between polls
    
    const statusResponse = http.get(`${BASE_URL}/api/generate-image/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${user.id}`,
      },
      timeout: '10s',
    });
    
    if (statusResponse.status === 200) {
      const data = JSON.parse(statusResponse.body);
      if (data.status === 'completed') {
        check(statusResponse, {
          'Image generation completed': () => true,
          'Generated image URL present': () => !!data.image_url,
        });
        break;
      } else if (data.status === 'failed') {
        check(statusResponse, {
          'Image generation failed': () => false,
        });
        break;
      }
    }
    
    attempts++;
  }
}

/**
 * Check leaderboard
 */
function checkLeaderboard(user) {
  const response = http.get(`${BASE_URL}/api/leaderboard`, {
    headers: {
      'Authorization': `Bearer ${user.id}`,
    },
    timeout: '10s',
  });
  
  check(response, {
    'Leaderboard loads successfully': (r) => r.status === 200,
    'Leaderboard data present': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) && data.length > 0;
      } catch {
        return false;
      }
    },
  });
}

/**
 * Establish WebSocket connection for real-time features
 */
function establishWebSocketConnection(user, sessionId) {
  const url = `${WS_URL}?apikey=${__ENV.SUPABASE_ANON_KEY}&token=${user.id}`;
  
  const response = ws.connect(url, {
    timeout: '10s',
  }, function(socket) {
    websocketConnections.add(1);
    
    // Subscribe to session updates
    socket.send(JSON.stringify({
      event: 'phx_join',
      topic: `blinddate:session:${sessionId}`,
      payload: {},
      ref: 1,
    }));
    
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`WebSocket message: ${message.event}`);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });
    
    // Keep connection alive for a realistic duration
    socket.setTimeout(() => {
      socket.close();
    }, randomIntBetween(10000, 30000)); // 10-30 seconds
  });
  
  check(response, {
    'WebSocket connection established': (r) => r.status === 101,
  });
}

/**
 * Setup function - runs once before tests
 */
export function setup() {
  console.log('🚀 Starting K6 Load Test Suite for Pre-Wedding AI Studio');
  console.log(`📊 Testing against: ${BASE_URL}`);
  console.log(`🎯 Target: 1000+ concurrent users`);
  console.log(`⏱️  Total duration: ~25 minutes`);
  
  // Verify API endpoints are accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`, { timeout: '30s' });
  if (healthCheck.status !== 200) {
    throw new Error(`Health check failed: ${healthCheck.status}`);
  }
  
  console.log('✅ Health check passed, starting load test...');
  
  return {
    startTime: Date.now(),
    baseUrl: BASE_URL,
    apiBase: API_BASE,
  };
}

/**
 * Teardown function - runs once after all tests
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`🏁 Load test completed in ${duration.toFixed(2)} minutes`);
  
  // Generate summary report
  generateTestReport();
}

/**
 * Generate test report (would integrate with reporting service in production)
 */
function generateTestReport() {
  console.log('📈 Generating performance report...');
  console.log('📝 Report will be available in k6 output and custom metrics');
  
  // In production, you would send metrics to monitoring service
  // like Datadog, New Relic, or custom analytics platform
}