/**
 * Onboarding Controller
 * 
 * Handles HTTP requests for onboarding operations.
 * Employee-facing onboarding request management.
 */

const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const onboardingService = require('../services/onboarding.service');

/**
 * Create Onboarding Request
 * POST /api/onboarding
 */
const createOnboardingRequest = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const requestData = req.body;
  
  const onboarding = await onboardingService.createRequest(employeeId, requestData);
  
  res.status(201).json(successResponse(
    onboarding,
    'Onboarding request created successfully',
    201
  ));
});

/**
 * Get Onboarding Request by ID
 * GET /api/onboarding/:id
 */
const getOnboardingRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  
  const onboarding = await onboardingService.getRequestById(requestId);
  
  res.status(200).json(successResponse(
    onboarding,
    'Onboarding request retrieved successfully'
  ));
});

/**
 * Get Employee's Onboarding Requests
 * GET /api/onboarding/my-requests
 */
const getMyRequests = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  
  const requests = await onboardingService.getRequestsByEmployee(employeeId);
  
  res.status(200).json(successResponse(
    requests,
    'Your onboarding requests retrieved successfully'
  ));
});

/**
 * Update Onboarding Request
 * PUT /api/onboarding/:id
 */
const updateOnboardingRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const employeeId = req.user.id;
  const updates = req.body;
  
  const onboarding = await onboardingService.updateRequest(
    requestId,
    employeeId,
    updates
  );
  
  res.status(200).json(successResponse(
    onboarding,
    'Onboarding request updated successfully'
  ));
});

/**
 * Get Onboarding Request with Documents
 * GET /api/onboarding/:id/details
 */
const getRequestWithDocuments = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  
  const details = await onboardingService.getRequestWithDocuments(requestId);
  
  res.status(200).json(successResponse(
    details,
    'Onboarding request details retrieved successfully'
  ));
});

/**
 * Get Complete Onboarding Details
 * GET /api/onboarding/:id/complete
 */
const getCompleteDetails = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  
  const details = await onboardingService.getCompleteDetails(requestId);
  
  res.status(200).json(successResponse(
    details,
    'Complete onboarding details retrieved successfully'
  ));
});

/**
 * Check if Can Submit New Request
 * GET /api/onboarding/can-submit
 */
const checkCanSubmit = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  
  const result = await onboardingService.canSubmitNewRequest(employeeId);
  
  res.status(200).json(successResponse(
    result,
    result.canSubmit ? 'You can submit a new request' : 'Cannot submit new request'
  ));
});

/**
 * Delete Onboarding Request
 * DELETE /api/onboarding/:id
 */
const deleteOnboardingRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const employeeId = req.user.id;
  
  const result = await onboardingService.deleteRequest(requestId, employeeId);
  
  res.status(200).json(successResponse(
    result,
    'Onboarding request deleted successfully'
  ));
});

module.exports = {
  createOnboardingRequest,
  getOnboardingRequest,
  getMyRequests,
  updateOnboardingRequest,
  getRequestWithDocuments,
  getCompleteDetails,
  checkCanSubmit,
  deleteOnboardingRequest
};
