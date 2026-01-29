/**
 * Onboarding Routes
 * 
 * Defines all onboarding request API endpoints.
 */

const express = require('express');
const router = express.Router();
const {
  verifyAuth,
  requireAuth,
  checkOwnership,
  validateUUIDParam,
  validateOnboardingRequest
} = require('../middlewares');
const {
  createOnboardingRequest,
  getOnboardingRequest,
  getMyRequests,
  updateOnboardingRequest,
  getRequestWithDocuments,
  getCompleteDetails,
  checkCanSubmit,
  deleteOnboardingRequest
} = require('../controllers/onboarding.controller');

/**
 * GET /api/onboarding/can-submit
 * Check if employee can submit new request
 */
router.get('/can-submit', verifyAuth, checkCanSubmit);

/**
 * GET /api/onboarding/my-requests
 * Get all requests for logged-in employee
 */
router.get('/my-requests', verifyAuth, getMyRequests);

/**
 * POST /api/onboarding
 * Create new onboarding request
 */
router.post(
  '/',
  verifyAuth,
  validateOnboardingRequest,
  createOnboardingRequest
);

/**
 * GET /api/onboarding/:id
 * Get onboarding request by ID
 */
router.get(
  '/:id',
  verifyAuth,
  validateUUIDParam('id'),
  getOnboardingRequest
);

/**
 * GET /api/onboarding/:id/details
 * Get onboarding request with documents
 */
router.get(
  '/:id/details',
  verifyAuth,
  validateUUIDParam('id'),
  getRequestWithDocuments
);

/**
 * GET /api/onboarding/:id/complete
 * Get complete onboarding details (with history)
 */
router.get(
  '/:id/complete',
  verifyAuth,
  validateUUIDParam('id'),
  getCompleteDetails
);

/**
 * PUT /api/onboarding/:id
 * Update onboarding request
 */
router.put(
  '/:id',
  verifyAuth,
  validateUUIDParam('id'),
  validateOnboardingRequest,
  updateOnboardingRequest
);

/**
 * DELETE /api/onboarding/:id
 * Delete onboarding request
 */
router.delete(
  '/:id',
  verifyAuth,
  validateUUIDParam('id'),
  deleteOnboardingRequest
);

module.exports = router;
