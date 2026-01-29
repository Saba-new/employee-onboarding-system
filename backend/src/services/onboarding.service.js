/**
 * Onboarding Service
 * 
 * Handles all business logic for employee onboarding requests.
 * This is the core service of the application.
 */

const supabase = require('../config/supabase');
const { AppError } = require('../utils/errorHandler');
const { validateUUID, validateRequiredFields } = require('../utils/validation');
const statusHistoryService = require('./statusHistory.service');

/**
 * Create Onboarding Request
 * 
 * Business Rules:
 * - Employee can only have ONE pending request at a time
 * - Initial status is always 'pending'
 * - Status history is automatically created
 * 
 * @param {string} employeeId - UUID of the employee
 * @param {Object} requestData - Onboarding request data
 * @returns {Object} - Created onboarding request
 */
async function createRequest(employeeId, requestData) {
  try {
    validateUUID(employeeId, 'Employee ID');

    // Validate required fields
    validateRequiredFields(requestData, [
      'first_name',
      'last_name',
      'email',
      'phone',
      'address',
      'date_of_birth'
    ]);

    // BUSINESS RULE: Check if employee already has a pending request
    const { data: existingPending } = await supabase
      .from('onboarding_requests')
      .select('id, status')
      .eq('employee_id', employeeId)
      .eq('status', 'pending')
      .single();

    if (existingPending) {
      throw new AppError(
        'You already have a pending onboarding request. Please wait for admin review.',
        400
      );
    }

    // Prepare request data
    const onboardingData = {
      employee_id: employeeId,
      first_name: requestData.first_name.trim(),
      last_name: requestData.last_name.trim(),
      email: requestData.email.toLowerCase().trim(),
      phone: requestData.phone.trim(),
      address: requestData.address.trim(),
      date_of_birth: requestData.date_of_birth,
      status: 'pending', // BUSINESS RULE: Always start as pending
      created_at: new Date().toISOString()
    };

    // Create onboarding request
    const { data: onboarding, error } = await supabase
      .from('onboarding_requests')
      .insert(onboardingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating onboarding request:', error);
      throw new AppError('Failed to create onboarding request', 500);
    }

    // BUSINESS LOGIC: Create initial status history entry
    await statusHistoryService.createHistoryEntry({
      onboarding_request_id: onboarding.id,
      from_status: null,
      to_status: 'pending',
      changed_by: employeeId,
      remarks: 'Onboarding request submitted'
    });

    return onboarding;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in createRequest:', error);
    throw new AppError('Failed to create onboarding request', 500);
  }
}

/**
 * Get Onboarding Request by ID
 * 
 * Retrieves a single onboarding request with related data.
 * 
 * @param {string} requestId - UUID of the onboarding request
 * @returns {Object} - Onboarding request with employee details
 */
async function getRequestById(requestId) {
  try {
    validateUUID(requestId, 'Request ID');

    const { data, error } = await supabase
      .from('onboarding_requests')
      .select(`
        *,
        employee:employees!employee_id (
          id,
          email,
          role,
          created_at
        )
      `)
      .eq('id', requestId)
      .single();

    if (error || !data) {
      throw new AppError('Onboarding request not found', 404);
    }

    return data;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getRequestById:', error);
    throw new AppError('Failed to fetch onboarding request', 500);
  }
}

/**
 * Get Onboarding Requests by Employee
 * 
 * Retrieves all onboarding requests for a specific employee.
 * 
 * @param {string} employeeId - UUID of the employee
 * @returns {Array} - Array of onboarding requests
 */
async function getRequestsByEmployee(employeeId) {
  try {
    validateUUID(employeeId, 'Employee ID');

    const { data, error } = await supabase
      .from('onboarding_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employee requests:', error);
      throw new AppError('Failed to fetch onboarding requests', 500);
    }

    return data || [];

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getRequestsByEmployee:', error);
    throw new AppError('Failed to fetch onboarding requests', 500);
  }
}

/**
 * Update Onboarding Request
 * 
 * Business Rules:
 * - Only PENDING requests can be updated by employee
 * - Cannot change status via this method
 * - Approved/Rejected requests are immutable
 * 
 * @param {string} requestId - UUID of the request
 * @param {string} employeeId - UUID of the employee (for ownership check)
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated onboarding request
 */
async function updateRequest(requestId, employeeId, updates) {
  try {
    validateUUID(requestId, 'Request ID');
    validateUUID(employeeId, 'Employee ID');

    // Get existing request
    const existing = await getRequestById(requestId);

    // BUSINESS RULE: Only owner can update
    if (existing.employee_id !== employeeId) {
      throw new AppError('You can only update your own onboarding requests', 403);
    }

    // BUSINESS RULE: Can only update pending requests
    if (existing.status !== 'pending') {
      throw new AppError(
        `Cannot update request with status: ${existing.status}. Only pending requests can be modified.`,
        400
      );
    }

    // BUSINESS RULE: Cannot change protected fields via this method
    const protectedFields = ['id', 'employee_id', 'status', 'created_at', 'approved_by', 'approved_at'];
    protectedFields.forEach(field => {
      if (updates[field] !== undefined) {
        delete updates[field];
      }
    });

    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    // Perform update
    const { data, error } = await supabase
      .from('onboarding_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating onboarding request:', error);
      throw new AppError('Failed to update onboarding request', 500);
    }

    return data;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in updateRequest:', error);
    throw new AppError('Failed to update onboarding request', 500);
  }
}

/**
 * Get Onboarding Request with Documents
 * 
 * Retrieves onboarding request along with all uploaded documents.
 * 
 * @param {string} requestId - UUID of the onboarding request
 * @returns {Object} - Request with documents array
 */
async function getRequestWithDocuments(requestId) {
  try {
    validateUUID(requestId, 'Request ID');

    // Get onboarding request
    const request = await getRequestById(requestId);

    // Get associated documents
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('onboarding_request_id', requestId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      // Don't fail the whole request, just return empty documents
      return {
        ...request,
        documents: []
      };
    }

    return {
      ...request,
      documents: documents || []
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getRequestWithDocuments:', error);
    throw new AppError('Failed to fetch onboarding request with documents', 500);
  }
}

/**
 * Get Complete Onboarding Details
 * 
 * Retrieves full onboarding information including:
 * - Request details
 * - Employee info
 * - Documents
 * - Status history
 * 
 * @param {string} requestId - UUID of the onboarding request
 * @returns {Object} - Complete onboarding details
 */
async function getCompleteDetails(requestId) {
  try {
    validateUUID(requestId, 'Request ID');

    // Get request with documents
    const requestWithDocs = await getRequestWithDocuments(requestId);

    // Get status history
    const history = await statusHistoryService.getTimeline(requestId);

    return {
      ...requestWithDocs,
      statusHistory: history
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getCompleteDetails:', error);
    throw new AppError('Failed to fetch complete onboarding details', 500);
  }
}

/**
 * Check if Employee Can Submit New Request
 * 
 * Business logic to determine if employee is allowed to create
 * a new onboarding request.
 * 
 * @param {string} employeeId - UUID of the employee
 * @returns {Object} - { canSubmit: boolean, reason: string }
 */
async function canSubmitNewRequest(employeeId) {
  try {
    validateUUID(employeeId, 'Employee ID');

    // Check for pending requests
    const { data: pending } = await supabase
      .from('onboarding_requests')
      .select('id, status, created_at')
      .eq('employee_id', employeeId)
      .eq('status', 'pending')
      .single();

    if (pending) {
      return {
        canSubmit: false,
        reason: 'You have a pending onboarding request awaiting review',
        pendingRequestId: pending.id
      };
    }

    return {
      canSubmit: true,
      reason: null
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in canSubmitNewRequest:', error);
    throw new AppError('Failed to check submission eligibility', 500);
  }
}

/**
 * Delete Onboarding Request
 * 
 * Business Rules:
 * - Only PENDING requests can be deleted
 * - Only by the owner
 * - Deletes cascade to documents and status_history (database constraint)
 * 
 * @param {string} requestId - UUID of the request
 * @param {string} employeeId - UUID of the employee
 * @returns {Object} - Deletion confirmation
 */
async function deleteRequest(requestId, employeeId) {
  try {
    validateUUID(requestId, 'Request ID');
    validateUUID(employeeId, 'Employee ID');

    // Get existing request
    const existing = await getRequestById(requestId);

    // BUSINESS RULE: Only owner can delete
    if (existing.employee_id !== employeeId) {
      throw new AppError('You can only delete your own onboarding requests', 403);
    }

    // BUSINESS RULE: Can only delete pending requests
    if (existing.status !== 'pending') {
      throw new AppError(
        `Cannot delete request with status: ${existing.status}. Only pending requests can be deleted.`,
        400
      );
    }

    // Delete the request (cascades to documents and status_history)
    const { error } = await supabase
      .from('onboarding_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting onboarding request:', error);
      throw new AppError('Failed to delete onboarding request', 500);
    }

    return {
      message: 'Onboarding request deleted successfully',
      deletedId: requestId
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in deleteRequest:', error);
    throw new AppError('Failed to delete onboarding request', 500);
  }
}

module.exports = {
  createRequest,
  getRequestById,
  getRequestsByEmployee,
  updateRequest,
  getRequestWithDocuments,
  getCompleteDetails,
  canSubmitNewRequest,
  deleteRequest
};
