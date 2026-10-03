/**
 * LeetCode2Git - Lightweight In-Memory Rate Limiter Middleware
 * Protects public and authenticated API endpoints against abuse without external dependencies.
 */

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default window
  const maxRequests = options.max || 100; // max requests per window
  const message = options.message || 'Too many requests from this IP, please try again later.';
  
  const hits = new Map();

  // Periodic cleanup only outside test environment
  if (process.env.NODE_ENV !== 'test') {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of hits.entries()) {
        if (now - data.startTime > windowMs) {
          hits.delete(ip);
        }
      }
    }, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
  }

  return function rateLimiter(req, res, next) {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let clientRecord = hits.get(clientIp);

    if (!clientRecord || now - clientRecord.startTime > windowMs) {
      clientRecord = {
        count: 1,
        startTime: now
      };
      hits.set(clientIp, clientRecord);
    } else {
      clientRecord.count += 1;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientRecord.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((clientRecord.startTime + windowMs) / 1000));

    if (clientRecord.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };
}

// Preset rate limiters
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30, // 30 auth requests / min
  message: 'Too many authentication attempts. Please wait a minute and try again.'
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120, // 120 API requests / min
  message: 'API rate limit exceeded. Please slow down your requests.'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter
};
