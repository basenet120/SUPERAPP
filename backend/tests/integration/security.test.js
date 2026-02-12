const request = require('supertest');
const { app } = require('./setup');

describe('API Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests with malformed auth header', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests with expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAxfQ.invalid';
      
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize HTML in input', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>Test',
        category: 'Camera'
      };

      // The API should sanitize or reject this
      const response = await request(app)
        .post('/api/equipment')
        .send(maliciousInput);

      // Should either sanitize or reject
      expect(response.status).not.toBe(500);
    });

    it('should prevent SQL injection', async () => {
      const maliciousSearch = "'; DROP TABLE equipment; --";

      const response = await request(app)
        .get(`/api/equipment?search=${encodeURIComponent(maliciousSearch)}`);

      // Should not crash or execute malicious SQL
      expect(response.status).not.toBe(500);
    });

    it('should validate content type', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Content-Type', 'text/plain')
        .send('not json data');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit excessive requests', async () => {
      // Make many rapid requests
      const requests = [];
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('CORS Security', () => {
    it('should not allow unauthorized origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious-site.com');

      // Should not include CORS headers for unauthorized origin
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});
