/**
 * Admin Service
 * 
 * Handles admin-specific business logic for managing onboarding requests.
 * Includes approval, rejection, and reporting functionality.
 */

const supabase = require('../config/supabase');
const { AppError } = require('../utils/errorHandler');
const { validateUUID } = require('../utils/validation');
const statusHistoryService = require('./statusHistory.service');

/**
 * Get All Pending Onboarding Requests
 * 
 * Retrieves all onboarding requests with pending status.
 * Used by admin dashboard.
 * 
 * @param {Object} options - Query options
 * @returns {Object} - Paginated pending requests
 */
async function getPendingRequests(options = {}) {
  try {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('onboarding_requests')
      .select(`
        *,
        employee:employees!employee_id (
          id,
          email,
          role
        )
      `, { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: true }) // Oldest first (FIFO)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching pending requests:', error);
      throw new AppError('Failed to fetch pending requests', 500);
    }

    return {
      requests: data || [],
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getPendingRequests:', error);
    throw new AppError('Failed to fetch pending requests', 500);
  }
}

/**
 * Get All Onboarding Requests
 * 
 * Retrieves all onboarding requests with filtering and pagination.
 * Admin-only operation.
 * 
 * @param {Object} options - Query options
 * @returns {Object} - Paginated requests
 */
async function getAllRequests(options = {}) {
  try {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('onboarding_requests')
      .select(`
        *,
        employee:employees!employee_id (
          id,
          email,
          first_name,
          last_name,
          role
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching all requests:', error);
      throw new AppError('Failed to fetch requests', 500);
    }

    return {
      requests: data || [],
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getAllRequests:', error);
    throw new AppError('Failed to fetch requests', 500);
  }
}

/**
 * Approve Onboarding Request
 * 
 * Business Rules:
 * - Only PENDING requests can be approved
 * - Admin information is recorded
 * - Status history is updated
 * 
 * @param {string} requestId - UUID of the onboarding request
 * @param {string} adminId - UUID of the admin
 * @param {string} remarks - Optional approval remarks
 * @returns {Object} - Updated onboarding request
 */
async function approveRequest(requestId, adminId, remarks = null) {
  try {
    validateUUID(requestId, 'Request ID');
    validateUUID(adminId, 'Admin ID');

    // Get onboarding request
    const { data: request, error: fetchError } = await supabase
      .from('onboarding_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new AppError('Onboarding request not found', 404);
    }

    // BUSINESS RULE: Can only approve pending requests
    if (request.status !== 'pending') {
      throw new AppError(
        `Cannot approve request with status: ${request.status}`,
        400
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('onboarding_requests')
      .update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving request:', updateError);
      throw new AppError('Failed to approve onboarding request', 500);
    }

    // BUSINESS LOGIC: Create status history entry
    await statusHistoryService.createHistoryEntry({
      onboarding_request_id: requestId,
      from_status: 'pending',
      to_status: 'approved',
      changed_by: adminId,
      remarks: remarks || 'Onboarding request approved by admin'
    });

    return updated;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in approveRequest:', error);
    throw new AppError('Failed to approve request', 500);
  }
}

/**
 * Reject Onboarding Request
 * 
 * Business Rules:
 * - Only PENDING requests can be rejected
 * - Remarks are REQUIRED for rejection
 * - Admin information is recorded
 * - Status history is updated
 * 
 * @param {string} requestId - UUID of the onboarding request
 * @param {string} adminId - UUID of the admin
 * @param {string} remarks - Rejection reason (required)
 * @returns {Object} - Updated onboarding request
 */
async function rejectRequest(requestId, adminId, remarks) {
  try {
    validateUUID(requestId, 'Request ID');
    validateUUID(adminId, 'Admin ID');

    // BUSINESS RULE: Remarks are required for rejection
    if (!remarks || remarks.trim() === '') {
      throw new AppError('Rejection remarks are required', 400);
    }

    // Get onboarding request
    const { data: request, error: fetchError } = await supabase
      .from('onboarding_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new AppError('Onboarding request not found', 404);
    }

    // BUSINESS RULE: Can only reject pending requests
    if (request.status !== 'pending') {
      throw new AppError(
        `Cannot reject request with status: ${request.status}`,
        400
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('onboarding_requests')
      .update({
        status: 'rejected',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting request:', updateError);
      throw new AppError('Failed to reject onboarding request', 500);
    }

    // BUSINESS LOGIC: Create status history entry
    await statusHistoryService.createHistoryEntry({
      onboarding_request_id: requestId,
      from_status: 'pending',
      to_status: 'rejected',
      changed_by: adminId,
      remarks: remarks
    });

    return updated;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in rejectRequest:', error);
    throw new AppError('Failed to reject request', 500);
  }
}

/**
 * Get Dashboard Statistics
 * 
 * Retrieves summary statistics for admin dashboard.
 * 
 * @returns {Object} - Dashboard statistics
 */
async function getDashboardStats() {
  try {
    // Get total counts by status
    const { data: requests, error } = await supabase
      .from('onboarding_requests')
      .select('status, created_at');

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new AppError('Failed to fetch dashboard statistics', 500);
    }

    // Calculate statistics
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    // Calculate recent requests (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = requests.filter(r => new Date(r.created_at) >= sevenDaysAgo).length;

    return {
      total,
      pending,
      approved,
      rejected,
      recentRequests: recent,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getDashboardStats:', error);
    throw new AppError('Failed to fetch dashboard statistics', 500);
  }
}

/**
 * Get Request with Full Details
 * 
 * Admin view of onboarding request with all related data.
 * 
 * @param {string} requestId - UUID of the onboarding request
 * @returns {Object} - Complete request details
 */
async function getRequestFullDetails(requestId) {
  try {
    validateUUID(requestId, 'Request ID');

    // Get request with employee info
    const { data: request, error: requestError } = await supabase
      .from('onboarding_requests')
      .select(`
        *,
        employee:employees!employee_id (
          id,
          email,
          first_name,
          last_name,
          role,
          created_at
        ),
        approved_by_user:employees!approved_by (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new AppError('Onboarding request not found', 404);
    }

    // Get documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('onboarding_request_id', requestId)
      .order('uploaded_at', { ascending: false });

    // Get status history
    const history = await statusHistoryService.getTimeline(requestId);

    return {
      ...request,
      documents: documents || [],
      statusHistory: history
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getRequestFullDetails:', error);
    throw new AppError('Failed to fetch request details', 500);
  }
}

module.exports = {
  getPendingRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getDashboardStats,
  getRequestFullDetails
};
