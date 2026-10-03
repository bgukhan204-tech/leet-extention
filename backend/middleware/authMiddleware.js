const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');

/**
 * Middleware to verify JWT session token and attach authenticated user to request.
 * Enforces strict user isolation.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'GitHub account is not connected. Please connect your GitHub account.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Your GitHub authorization has expired. Please reconnect your GitHub account.'
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session token. Please reconnect your GitHub account.'
      });
    }

    // Retrieve user from MongoDB by userId (only if database connection is active)
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.userId);
      } catch (dbErr) {
        console.warn('[Auth Middleware] Database lookup error:', dbErr.message);
      }
    }

    // In-memory fallback support for testing environments if database is offline
    if (!user && req.app.locals.mockUsers && req.app.locals.mockUsers[decoded.userId]) {
      user = req.app.locals.mockUsers[decoded.userId];
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please connect your GitHub account.'
      });
    }

    if (!user.githubAccessToken) {
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
