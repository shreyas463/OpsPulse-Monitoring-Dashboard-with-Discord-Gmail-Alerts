import request from 'supertest';
import express from 'express';
import routes from '../routes';

const app = express();
app.use('/', routes);

describe('Routes', () => {
  describe('GET /', () => {
    it('should return application info', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'OpsPulse Monitoring Demo');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status when chaos mode is off', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
    });

    it('should return unhealthy status when chaos mode is on', async () => {
      // Enable chaos mode
      await request(app).get('/chaos/on');
      
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'unhealthy');
      expect(response.body).toHaveProperty('reason', 'Chaos mode is ON');
      
      // Disable chaos mode
      await request(app).get('/chaos/off');
    });
  });

  describe('GET /simulate-error', () => {
    it('should return 500 error', async () => {
      const response = await request(app).get('/simulate-error');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Simulated error for testing alerts');
    });
  });

  describe('GET /chaos/:mode', () => {
    it('should enable chaos mode', async () => {
      const response = await request(app).get('/chaos/on');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Chaos mode set to: on');
      
      // Clean up
      await request(app).get('/chaos/off');
    });

    it('should disable chaos mode', async () => {
      const response = await request(app).get('/chaos/off');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Chaos mode set to: off');
    });

    it('should enable slow mode', async () => {
      const response = await request(app).get('/chaos/slow');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Chaos mode set to: slow');
      
      // Clean up
      await request(app).get('/chaos/off');
    });

    it('should return 400 for invalid mode', async () => {
      const response = await request(app).get('/chaos/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid chaos mode. Use: on, off, or slow');
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app).get('/metrics');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('# HELP http_requests_total');
      expect(response.text).toContain('# TYPE http_requests_total counter');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
}); 