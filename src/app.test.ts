import request from 'supertest';
import app from './app';

describe('Express Server', () => {
  describe('GET /api/health', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });

    it('should return "We are alive" message', async () => {
      const response = await request(app).get('/api/health');
      expect(response.text).toBe('We are alive');
    });

    it('should have text/html content type', async () => {
      const response = await request(app).get('/api/health');
      expect(response.type).toBe('text/html');
    });
  });
});
