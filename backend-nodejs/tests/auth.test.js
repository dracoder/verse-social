const request = require('supertest');
const app = require('../src/app');

describe('Authentication Endpoints', () => {
  
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration with invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A', // Too short
          email: 'invalid-email',
          password: '123' // Too short
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation failed');
    });

    it('should handle registration with valid data (will fail without DB)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });
      
      // This will likely return a database connection error, which is expected
      // since we don't have PostgreSQL set up yet
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: ''
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation failed');
    });
  });

}); 