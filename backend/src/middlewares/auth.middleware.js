/**
 * Authentication Middleware
 * 
 * Verifies user authentication using Supabase JWT tokens.
 * Extracts user information and attaches it to the request object.
 */

const supabase = require('../config/supabase');
const { AppError } = require('../utils/errorHandler');

/**
 * Verify Authentication Middleware
 * 
 * Checks if the request has a valid Bearer token.
 * Verifies the token with Supabase and extracts user data.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function verifyAuth(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }

    // Get the token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Fetch employee details from database
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', user.id)
      .single();

    if (employeeError || !employee) {
      throw new AppError('Employee record not found', 404);
    }

    // Attach user information to request object
    req.user = {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      firstName: employee.first_name,
      lastName: employee.last_name
    };

    // Continue to next middleware
    next();

  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
}

/**
 * Optional Authentication Middleware
 * 
 * Similar to verifyAuth but doesn't fail if token is missing.
 * Useful for routes that work differently for authenticated vs anonymous users.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, but that's okay for optional auth
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      req.user = null;
      return next();
    }

    // Fetch employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', user.id)
      .single();

    if (employeeError || !employee) {
      req.user = null;
      return next();
    }

    // Attach user information
    req.user = {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      firstName: employee.first_name,
      lastName: employee.last_name
    };

    next();

  } catch (error) {
    // For optional auth, errors don't stop the request
    req.user = null;
    next();
  }
}

module.exports = {
  verifyAuth,
  optionalAuth
};
