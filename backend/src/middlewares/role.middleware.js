/**
 * Role-Based Access Control Middleware
 * 
 * Checks if the authenticated user has the required role to access a route.
 * Must be used AFTER the verifyAuth middleware.
 */

const { AppError } = require('../utils/errorHandler');

/**
 * Require Admin Role
 * 
 * Ensures the authenticated user has 'admin' role.
 * Use this middleware on admin-only routes.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireAdmin(req, res, next) {
  try {
    // Check if user is authenticated (verifyAuth should run first)
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    // User is admin, continue
    next();

  } catch (error) {
    next(error);
  }
}

/**
 * Require Employee Role
 * 
 * Ensures the authenticated user has 'employee' role.
 * Use this middleware on employee-only routes.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireEmployee(req, res, next) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Check if user has employee role
    if (req.user.role !== 'employee') {
      throw new AppError('Access denied. Employee access only.', 403);
    }

    // User is employee, continue
    next();

  } catch (error) {
    next(error);
  }
}

/**
 * Require Any Authenticated User
 * 
 * Ensures user is authenticated (any role).
 * This is essentially an alias for verifyAuth but checks req.user.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireAuth(req, res, next) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // User is authenticated, continue
    next();

  } catch (error) {
    next(error);
  }
}

/**
 * Check Resource Ownership
 * 
 * Verifies that the user is either:
 * 1. The owner of the resource (employee_id matches user.id), OR
 * 2. An admin (can access all resources)
 * 
 * Useful for routes like "view my onboarding request"
 * where employees can only see their own data.
 * 
 * @param {string} paramName - Name of the route parameter to check (e.g., 'employeeId')
 * @returns {Function} - Middleware function
 */
function checkOwnership(paramName = 'id') {
  return async (req, res, next) => {
    try {
      // User must be authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Admins can access all resources
      if (req.user.role === 'admin') {
        return next();
      }

      // Get the resource ID from route parameters or body
      const resourceId = req.params[paramName] || req.body[paramName];

      if (!resourceId) {
        throw new AppError('Resource ID not provided', 400);
      }

      // Check if user owns the resource
      if (req.user.id !== resourceId) {
        throw new AppError('Access denied. You can only access your own resources.', 403);
      }

      // User owns the resource, continue
      next();

    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requireAdmin,
  requireEmployee,
  requireAuth,
  checkOwnership
};
