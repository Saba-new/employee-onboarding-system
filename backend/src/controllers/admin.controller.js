/**
 * Admin Controller
 * 
 * Handles HTTP requests for admin operations.
 * Admin-only access to manage onboarding requests.
 */

const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const adminService = require('../services/admin.service');

/**
 * Get Pending Onboarding Requests
 * GET /api/admin/onboarding/pending
 */
const getPendingRequests = asyncHandler(async (req, res) => {
  const options = {
    page: req.query.page,
    limit: req.query.limit
  };
  
  const result = await adminService.getPendingRequests(options);
  
  res.status(200).json({
    success: true,
    message: 'Pending requests retrieved successfully',
    data: result.requests,
    pagination: result.pagination
  });
});

/**
 * Get All Onboarding Requests
 * GET /api/admin/onboarding
 */
const getAllRequests = asyncHandler(async (req, res) => {
  const options = {
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status
  };
  
  const result = await adminService.getAllRequests(options);
  
  res.status(200).json({
    success: true,
    message: 'Onboarding requests retrieved successfully',
    data: result.requests,
    pagination: result.pagination
  });
});

/**
 * Approve Onboarding Request
 * PUT /api/admin/onboarding/:id/approve
 */
const approveRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const adminId = req.user.id;
  const { remarks } = req.body;
  
  const onboarding = await adminService.approveRequest(requestId, adminId, remarks);
  
  res.status(200).json(successResponse(
    onboarding,
    'Onboarding request approved successfully'
  ));
});

/**
 * Reject Onboarding Request
 * PUT /api/admin/onboarding/:id/reject
 */
const rejectRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const adminId = req.user.id;
  const { remarks } = req.body;
  
  const onboarding = await adminService.rejectRequest(requestId, adminId, remarks);
  
  res.status(200).json(successResponse(
    onboarding,
    'Onboarding request rejected'
  ));
});

/**
 * Get Dashboard Statistics
 * GET /api/admin/dashboard/stats
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  
  res.status(200).json(successResponse(
    stats,
    'Dashboard statistics retrieved successfully'
  ));
});

/**
 * Get Request Full Details
 * GET /api/admin/onboarding/:id/details
 */
const getRequestDetails = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  
  const details = await adminService.getRequestFullDetails(requestId);
  
  res.status(200).json(successResponse(
    details,
    'Request details retrieved successfully'
  ));
});

module.exports = {
  getPendingRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getDashboardStats,
  getRequestDetails
};
