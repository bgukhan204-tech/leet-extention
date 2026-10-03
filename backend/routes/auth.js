const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Public GitHub OAuth routes with rate limiting
router.get('/github', authLimiter, authController.initiateGithubOAuth);
router.get('/github/callback', authLimiter, authController.handleGithubCallback);

// Protected routes (require valid JWT)
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
