/**
 * Central Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Server Error]:', err.stack || err.message);
  }

  const statusCode = err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}

module.exports = errorHandler;
