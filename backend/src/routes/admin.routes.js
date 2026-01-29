/**
 * Admin Routes
 * 
 * Defines all admin-specific API endpoints.
 * All routes require admin role.
 */

const express = require('express');
const router = express.Router();
const {
  verifyAuth,
  requireAdmin,
  validateUUIDParam,
  validateStatusUpdate
} = require('../middlewares');
const {
  getPendingRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getDashboardStats,
  getRequestDetails
} = require('../controllers/admin.controller');

/**
 * All routes require authentication and admin role
 */
router.use(verifyAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * GET /api/admin/onboarding/pending
 * Get all pending onboarding requests
 */
router.get('/onboarding/pending', getPendingRequests);

/**
 * GET /api/admin/onboarding
 * Get all onboarding requests (with filters)
 */
router.get('/onboarding', getAllRequests);

/**
 * GET /api/admin/onboarding/:id/details
 * Get complete details of an onboarding request
 */
router.get(
  '/onboarding/:id/details',
  validateUUIDParam('id'),
  getRequestDetails
);

/**
 * PUT /api/admin/onboarding/:id/approve
 * Approve onboarding request
 */
router.put(
  '/onboarding/:id/approve',
  validateUUIDParam('id'),
  validateStatusUpdate,
  approveRequest
);

/**
 * PUT /api/admin/onboarding/:id/reject
 * Reject onboarding request
 */
router.put(
  '/onboarding/:id/reject',
  validateUUIDParam('id'),
  validateStatusUpdate,
  rejectRequest
);

module.exports = router;
