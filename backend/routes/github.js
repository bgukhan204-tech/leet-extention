const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const authMiddleware = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

// All GitHub endpoints require authenticated user & rate limiting
router.use(authMiddleware);
router.use(apiLimiter);

router.get('/user', githubController.getGithubUser);
router.get('/repositories', githubController.getRepositories);
router.post('/validate-repository', githubController.validateRepository);
router.post('/set-repository', githubController.setRepository);

module.exports = router;
