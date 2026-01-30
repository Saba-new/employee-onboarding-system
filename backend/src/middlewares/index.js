/**
 * Middleware Index
 * 
 * Central export point for all middleware functions.
 * Makes importing easier in route files.
 */

const { verifyAuth, optionalAuth } = require('./auth.middleware');
const { requireAdmin, requireEmployee, requireAuth, checkOwnership } = require('./role.middleware');
const { 
  validateOnboardingRequest, 
  validateUUIDParam, 
  validateDocumentUpload,
  validateStatusUpdate 
} = require('./validator.middleware');
const {
  validateLoginRequest,
  validateRegisterRequest,
  validateRejectRequest
} = require('./validation.middleware');

module.exports = {
  // Authentication
  verifyAuth,
  optionalAuth,
  
  // Authorization (Roles)
  requireAdmin,
  requireEmployee,
  requireAuth,
  checkOwnership,
  
  // Validation
  validateOnboardingRequest,
  validateUUIDParam,
  validateDocumentUpload,
  validateStatusUpdate,
  validateLoginRequest,
  validateRegisterRequest,
  validateRejectRequest
};
