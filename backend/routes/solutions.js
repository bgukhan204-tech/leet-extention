const express = require('express');
const router = express.Router();
const solutionController = require('../controllers/solutionController');
const authMiddleware = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

// All Solution endpoints require authenticated user & rate limiting
router.use(authMiddleware);
router.use(apiLimiter);

router.post('/check-duplicate', solutionController.checkDuplicateSolution);
router.post('/upload', solutionController.uploadSolution);
router.get('/', solutionController.getSolutions);
router.get('/stats', solutionController.getSolutionStats);
router.get('/:id', solutionController.getSolutionById);

module.exports = router;
