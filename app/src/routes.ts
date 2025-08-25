import { Router, Request, Response } from 'express';
import { 
  httpRequestsTotal, 
  httpRequestDurationSeconds, 
  inflightRequests,
  httpErrorsTotal,
  chaosModeActive 
} from './metrics';

const router = Router();

// Chaos mode state
let chaosMode: 'off' | 'on' | 'slow' = 'off';

// Middleware to track metrics
const metricsMiddleware = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  
  // Increment in-flight requests
  inflightRequests.inc();
  
  // Track response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const { method, route } = req;
    const routePath = route || req.path;
    
    // Record metrics
    httpRequestsTotal.inc({ method, route: routePath, code: res.statusCode });
    httpRequestDurationSeconds.observe({ method, route: routePath }, duration);
    
    // Track errors
    if (res.statusCode >= 400) {
      httpErrorsTotal.inc({ method, route: routePath, code: res.statusCode });
    }
    
    // Decrement in-flight requests
    inflightRequests.dec();
  });
  
  next();
};

// Apply metrics middleware to all routes
router.use(metricsMiddleware);

// Main endpoint
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'OpsPulse Monitoring Demo',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    chaosMode,
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      simulateError: '/simulate-error',
      chaos: '/chaos/:mode (on|off|slow)'
    }
  });
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  if (chaosMode === 'on') {
    res.status(500).json({
      status: 'unhealthy',
      reason: 'Chaos mode is ON',
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      chaosMode
    });
  }
});

// Error simulation endpoint
router.get('/simulate-error', (req: Request, res: Response) => {
  res.status(500).json({
    error: 'Simulated error for testing alerts',
    timestamp: new Date().toISOString(),
    chaosMode
  });
});

// Chaos mode control
router.get('/chaos/:mode', (req: Request, res: Response) => {
  const mode = req.params.mode as 'on' | 'off' | 'slow';
  
  if (!['on', 'off', 'slow'].includes(mode)) {
    return res.status(400).json({
      error: 'Invalid chaos mode. Use: on, off, or slow',
      validModes: ['on', 'off', 'slow']
    });
  }
  
  chaosMode = mode;
  
  // Update chaos mode metric
  const modeValue = mode === 'off' ? 0 : mode === 'on' ? 1 : 2;
  chaosModeActive.set(modeValue);
  
  res.json({
    message: `Chaos mode set to: ${mode}`,
    previousMode: chaosMode,
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { register } = await import('./metrics');
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

export default router; 