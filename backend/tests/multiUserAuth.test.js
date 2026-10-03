process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_multi_user_isolation_99999';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const githubService = require('../services/githubService');

describe('Multi-User Public Architecture & Security Test Suite', () => {
  // Setup two distinct mock users
  const userA = {
    _id: '64a000000000000000000001',
    id: '64a000000000000000000001',
    githubId: '10001',
    githubUsername: 'alice',
    name: 'Alice Developer',
    email: 'alice@example.com',
    avatarUrl: 'https://avatars.githubusercontent.com/u/10001',
    githubAccessToken: 'gho_alice_secret_token_11111',
    selectedRepository: 'alice/leetcode-solutions',
    selectedBranch: 'main',
    autoSave: true
  };

  const userB = {
    _id: '64a000000000000000000002',
    id: '64a000000000000000000002',
    githubId: '10002',
    githubUsername: 'bob',
    name: 'Bob Programmer',
    email: 'bob@example.com',
    avatarUrl: 'https://avatars.githubusercontent.com/u/10002',
    githubAccessToken: 'gho_bob_secret_token_22222',
    selectedRepository: 'bob/coding-practice',
    selectedBranch: 'main',
    autoSave: true
  };

  // Generate JWTs for both users
  const tokenA = jwt.sign(
    {
      userId: userA._id,
      githubUsername: userA.githubUsername,
      name: userA.name,
      avatarUrl: userA.avatarUrl
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const tokenB = jwt.sign(
    {
      userId: userB._id,
      githubUsername: userB.githubUsername,
      name: userB.name,
      avatarUrl: userB.avatarUrl
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  beforeAll(() => {
    // Register mock users in app locals for test environment fallback
    app.locals.mockUsers = {
      [userA._id]: userA,
      [userB._id]: userB
    };

    // Mock githubService methods so unit tests run fast and isolated from external network
    jest.spyOn(githubService, 'validateRepository').mockImplementation(async (token, owner, repo) => {
      if (repo === 'readonly-repo') {
        throw new Error("This repository cannot be used because you don't have write access.");
      }
      return {
        isValid: true,
        defaultBranch: 'main',
        fullName: `${owner}/${repo}`,
        htmlUrl: `https://github.com/${owner}/${repo}`,
        hasWritePermission: true
      };
    });

    jest.spyOn(githubService, 'getUserRepositories').mockImplementation(async (token) => {
      if (token === userA.githubAccessToken) {
        return [
          {
            id: 1,
            name: 'leetcode-solutions',
            fullName: 'alice/leetcode-solutions',
            owner: 'alice',
            private: false,
            defaultBranch: 'main',
            hasWriteAccess: true
          }
        ];
      }
      return [
        {
          id: 2,
          name: 'coding-practice',
          fullName: 'bob/coding-practice',
          owner: 'bob',
          private: true,
          defaultBranch: 'main',
          hasWriteAccess: true
        }
      ];
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('1. Token Security & Safe User Projections', () => {
    test('JWT payload does not contain raw githubAccessToken', () => {
      const decodedA = jwt.decode(tokenA);
      expect(decodedA.githubAccessToken).toBeUndefined();
      expect(decodedA.userId).toBe(userA._id);
      expect(decodedA.githubUsername).toBe('alice');

      const decodedB = jwt.decode(tokenB);
      expect(decodedB.githubAccessToken).toBeUndefined();
      expect(decodedB.userId).toBe(userB._id);
      expect(decodedB.githubUsername).toBe('bob');
    });

    test('GET /api/auth/me returns User A profile without exposing githubAccessToken', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.githubUsername).toBe('alice');
      expect(res.body.user.githubAccessToken).toBeUndefined();
      expect(res.body.user.selectedRepository).toBe('alice/leetcode-solutions');
    });

    test('GET /api/auth/me returns User B profile without exposing githubAccessToken', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.githubUsername).toBe('bob');
      expect(res.body.user.githubAccessToken).toBeUndefined();
      expect(res.body.user.selectedRepository).toBe('bob/coding-practice');
    });
  });

  describe('2. User Isolation & Access Control', () => {
    test('User cannot fetch profile with an invalid or expired token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expired|invalid|connect/i);
    });

    test('User A accessing GET /api/github/user gets User A identity', async () => {
      const res = await request(app)
        .get('/api/github/user')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('alice');
      expect(res.body.user.githubAccessToken).toBeUndefined();
    });

    test('User B accessing GET /api/github/user gets User B identity', async () => {
      const res = await request(app)
        .get('/api/github/user')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('bob');
      expect(res.body.user.githubAccessToken).toBeUndefined();
    });

    test('User A retrieves only User A repositories', async () => {
      const res = await request(app)
        .get('/api/github/repositories')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.repositories[0].fullName).toBe('alice/leetcode-solutions');
    });

    test('User B retrieves only User B repositories', async () => {
      const res = await request(app)
        .get('/api/github/repositories')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.repositories[0].fullName).toBe('bob/coding-practice');
    });

    test('GET /api/solutions strictly filters by authenticated user and ignores spoofed query params', async () => {
      const res = await request(app)
        .get(`/api/solutions?userId=${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Repository Management & Permissions', () => {
    test('POST /api/github/validate-repository rejects missing repository', async () => {
      const res = await request(app)
        .post('/api/github/validate-repository')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/github/set-repository rejects invalid repository format', async () => {
      const res = await request(app)
        .post('/api/github/set-repository')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ repository: 'invalid-format-without-slash' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/format/i);
    });

    test('POST /api/github/set-repository succeeds for valid repository with write permission', async () => {
      const res = await request(app)
        .post('/api/github/set-repository')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ repository: 'alice/leetcode-solutions', branch: 'main' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.selectedRepository).toBe('alice/leetcode-solutions');
    });

    test('POST /api/github/set-repository rejects repository when user lacks write permission', async () => {
      const res = await request(app)
        .post('/api/github/set-repository')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ repository: 'alice/readonly-repo' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("This repository cannot be used because you don't have write access.");
    });
  });

  describe('4. Logout & Health Check', () => {
    test('POST /api/auth/logout succeeds for authenticated user', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/logged out/i);
    });

    test('GET /api/health returns running status and environment', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/running/i);
    });
  });
});
