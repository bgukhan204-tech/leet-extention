process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../server');

describe('API Endpoints Test Suite', () => {
  const mockUser = {
    _id: '64a000000000000000000001',
    id: '64a000000000000000000001',
    githubId: '10001',
    githubUsername: 'alice',
    githubAccessToken: 'gho_mock_token_for_api_tests'
  };

  beforeAll(() => {
    app.locals.mockUsers = {
      [mockUser._id]: mockUser
    };
  });

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

  test('Protected endpoint GET /api/solutions/stats rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/solutions/stats');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Protected endpoint GET /api/solutions/stats returns 200 with stats structure when authenticated', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: '64a000000000000000000001', githubUsername: 'alice' },
      process.env.JWT_SECRET || 'test_jwt_secret',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/solutions/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.easy).toBe('number');
    expect(typeof res.body.medium).toBe('number');
    expect(typeof res.body.hard).toBe('number');
    expect(typeof res.body.currentStreak).toBe('number');
    expect(typeof res.body.longestStreak).toBe('number');
    expect(typeof res.body.thisWeek).toBe('number');
  });

  test('Protected endpoint GET /api/solutions returns 200 with solutions array when authenticated', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: '64a000000000000000000001', githubUsername: 'alice' },
      process.env.JWT_SECRET || 'test_jwt_secret',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/solutions?limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.solutions)).toBe(true);
    expect(res.body.limit).toBe(10);
  });

  test('Non-existent endpoint returns 404', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
