import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Enable default metrics collection (CPU, memory, etc.)
collectDefaultMetrics();

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code'] as const,
});

// HTTP request duration histogram
export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'] as const,
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// In-flight requests gauge
export const inflightRequests = new Gauge({
  name: 'inflight_requests',
  help: 'Number of requests currently being processed',
});

// Error counter
export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'code'] as const,
});

// Chaos mode gauge
export const chaosModeActive = new Gauge({
  name: 'chaos_mode_active',
  help: 'Whether chaos mode is active (0=off, 1=on, 2=slow)',
});

// Export the register for metrics endpoint
export { register }; 