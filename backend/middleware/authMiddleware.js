const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const config = require('../config/config');

/**
 * Middleware to verify JWT session token and attach authenticated user to request.
 * Enforces strict user isolation.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (config.nodeEnv !== 'test') {
        console.warn('[Auth Middleware] Request missing Bearer authorization header');
      }
      return res.status(401).json({
        success: false,
        message: 'GitHub account is not connected. Please connect your GitHub account.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      if (config.nodeEnv !== 'test') {
        console.warn('[Auth Middleware] Bearer token is empty or invalid string');
      }
      return res.status(401).json({
        success: false,
        message: 'GitHub account is not connected. Please connect your GitHub account.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (config.nodeEnv !== 'test') {
        console.warn(`[Auth Middleware] JWT verification failed: ${err.message}`);
      }
      return res.status(401).json({
        success: false,
        message: 'Your GitHub authorization has expired. Please reconnect your GitHub account.'
      });
    }

    if (!decoded || (!decoded.userId && !decoded.githubId && !decoded.githubUsername)) {
      console.warn('[Auth Middleware] Decoded JWT missing user identifier');
      return res.status(401).json({
        success: false,
        message: 'Invalid session token. Please reconnect your GitHub account.'
      });
    }

    // Retrieve user via userService (supports MongoDB ObjectId, githubId, username, and in-memory cache)
    const user = await userService.findUser(
      decoded.userId || decoded.githubId,
      decoded.githubUsername,
      req.app ? req.app.locals : null
    );

    if (!user) {
      console.warn(`[Auth Middleware] User account not found for ID: ${decoded.userId || decoded.githubId || 'unknown'}`);
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please connect your GitHub account.'
      });
    }

    if (!user.githubAccessToken) {
      console.warn(`[Auth Middleware] Missing GitHub access token for user: @${user.githubUsername}`);
      return res.status(401).json({
        success: false,
        message: 'GitHub account is not connected or token is missing. Please reconnect.'
      });
    }

    // Attach authenticated user document to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication service encountered an internal error.'
    });
  }
}

module.exports = authMiddleware;
