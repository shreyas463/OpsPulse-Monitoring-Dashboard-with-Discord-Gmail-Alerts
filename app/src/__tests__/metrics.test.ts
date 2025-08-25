import { 
  httpRequestsTotal, 
  httpRequestDurationSeconds, 
  inflightRequests,
  httpErrorsTotal,
  chaosModeActive,
  register 
} from '../metrics';

describe('Metrics', () => {
  beforeEach(() => {
    register.clear();
  });

  describe('httpRequestsTotal', () => {
    it('should increment request counter', () => {
      httpRequestsTotal.inc({ method: 'GET', route: '/test', code: '200' });
      
      const metrics = register.metrics();
      expect(metrics).toContain('http_requests_total{method="GET",route="/test",code="200"} 1');
    });
  });

  describe('httpRequestDurationSeconds', () => {
    it('should observe request duration', () => {
      httpRequestDurationSeconds.observe({ method: 'GET', route: '/test' }, 0.5);
      
      const metrics = register.metrics();
      expect(metrics).toContain('http_request_duration_seconds_bucket{method="GET",route="/test",le="0.5"} 1');
    });
  });

  describe('inflightRequests', () => {
    it('should track in-flight requests', () => {
      inflightRequests.inc();
      inflightRequests.inc();
      inflightRequests.dec();
      
      const metrics = register.metrics();
      expect(metrics).toContain('inflight_requests 1');
    });
  });

  describe('httpErrorsTotal', () => {
    it('should increment error counter', () => {
      httpErrorsTotal.inc({ method: 'GET', route: '/test', code: '500' });
      
      const metrics = register.metrics();
      expect(metrics).toContain('http_errors_total{method="GET",route="/test",code="500"} 1');
    });
  });

  describe('chaosModeActive', () => {
    it('should set chaos mode status', () => {
      chaosModeActive.set(1);
      
      const metrics = register.metrics();
      expect(metrics).toContain('chaos_mode_active 1');
    });

    it('should handle different chaos mode values', () => {
      chaosModeActive.set(0); // off
      chaosModeActive.set(1); // on
      chaosModeActive.set(2); // slow
      
      const metrics = register.metrics();
      expect(metrics).toContain('chaos_mode_active 2');
    });
  });

  describe('register', () => {
    it('should include default metrics', async () => {
      const metrics = await register.metrics();
      
      // Check for default Node.js metrics
      expect(metrics).toContain('process_cpu_seconds_total');
      expect(metrics).toContain('process_resident_memory_bytes');
    });
  });
}); 