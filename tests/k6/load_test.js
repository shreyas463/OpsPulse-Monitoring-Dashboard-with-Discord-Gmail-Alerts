import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const p95Latency = new Trend('p95_latency');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 VUs
    { duration: '2m', target: 100 },  // Ramp up to 100 VUs
    { duration: '2m', target: 500 },  // Ramp up to 500 VUs
    { duration: '3m', target: 500 },  // Stay at 500 VUs
    { duration: '1m', target: 0 },    // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'],             // Error rate should be below 10%
    'p95_latency': ['p(95)<500'],     // Custom p95 latency threshold
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Traffic distribution
const TRAFFIC_DISTRIBUTION = {
  normal: 0.80,      // 80% normal traffic
  error: 0.05,       // 5% error simulation
  chaos: 0.15,       // 15% chaos mode
};

export default function () {
  const random = Math.random();
  let url, expectedStatus;

  // Determine traffic type based on distribution
  if (random < TRAFFIC_DISTRIBUTION.error) {
    // Error simulation
    url = `${BASE_URL}/simulate-error`;
    expectedStatus = 500;
  } else if (random < TRAFFIC_DISTRIBUTION.error + TRAFFIC_DISTRIBUTION.chaos) {
    // Chaos mode (slow)
    url = `${BASE_URL}/chaos/slow`;
    expectedStatus = 200;
  } else {
    // Normal traffic
    url = `${BASE_URL}/`;
    expectedStatus = 200;
  }

  // Make request
  const response = http.get(url);
  
  // Check response
  const success = check(response, {
    'status is correct': (r) => r.status === expectedStatus,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Record custom metrics
  errorRate.add(!success);
  p95Latency.add(response.timings.duration);

  // Sleep between requests
  sleep(0.1);
}

// Setup function to enable chaos mode
export function setup() {
  console.log('🚀 Starting OpsPulse load test...');
  console.log(`📍 Target URL: ${BASE_URL}`);
  console.log(`📊 Traffic distribution: ${JSON.stringify(TRAFFIC_DISTRIBUTION)}`);
  
  // Enable chaos mode for testing
  const chaosResponse = http.get(`${BASE_URL}/chaos/slow`);
  if (chaosResponse.status === 200) {
    console.log('✅ Chaos mode enabled (slow)');
  } else {
    console.log('❌ Failed to enable chaos mode');
  }
  
  return { chaosEnabled: chaosResponse.status === 200 };
}

// Teardown function to disable chaos mode
export function teardown(data) {
  console.log('🧹 Cleaning up...');
  
  // Disable chaos mode
  const chaosResponse = http.get(`${BASE_URL}/chaos/off`);
  if (chaosResponse.status === 200) {
    console.log('✅ Chaos mode disabled');
  } else {
    console.log('❌ Failed to disable chaos mode');
  }
  
  console.log('📈 Load test completed!');
  console.log('💡 Check your monitoring dashboards for alerts and metrics');
}

// Handle summary
export function handleSummary(data) {
  console.log('📊 Test Summary:');
  console.log(`   Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`   Error rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);
  console.log(`   P95 latency: ${data.metrics.http_req_duration.values.p(95).toFixed(2)}ms`);
  console.log(`   Average RPS: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
} 