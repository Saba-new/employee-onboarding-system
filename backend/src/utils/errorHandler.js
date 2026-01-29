/**
 * Custom Error Handler
 * 
 * Provides a custom error class and global error handling middleware
 * for consistent error responses across the application.
 */

/**
 * Custom Application Error Class
 * Extends the built-in Error class with HTTP status codes
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware
 * Catches all errors and sends consistent JSON responses
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function globalErrorHandler(err, req, res, next) {
  // Default to 500 if no status code is set
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error for debugging (in production, use proper logging service)
  console.error('❌ Error:', {
    message: err.message,
    statusCode: statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 * Eliminates the need for try-catch in every controller function
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function that catches errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  globalErrorHandler,
  asyncHandler
};
