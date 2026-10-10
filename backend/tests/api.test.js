process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../server');

describe('API Endpoints Test Suite', () => {
  test('GET /api/health returns success and message', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('LeetCode2Git backend is running');
  });

  test('GET /api/auth/github route exists and responds', async () => {
    const res = await request(app).get('/api/auth/github');
    expect(res.status).toBe(200);
  });

  test('Public endpoint GET /privacy returns 200 and renders HTML Privacy Policy', async () => {
    const res = await request(app).get('/privacy');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Privacy Policy');
    expect(res.text).toContain('LeetCode2Git');
    expect(res.text).toContain('GitHub OAuth');
    expect(res.text).toContain('Data Security');
  });

  test('Public endpoint GET /api/privacy also returns 200 and renders HTML Privacy Policy', async () => {
    const res = await request(app).get('/api/privacy');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Privacy Policy');
  });

  test('Protected endpoint GET /api/github/user rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/github/user');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Protected endpoint GET /api/solutions rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/solutions');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Non-existent endpoint returns 404', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
