/**
 * Status History Service
 * 
 * Handles all business logic related to tracking status changes.
 * This service is used by multiple other services to maintain audit trail.
 */

const supabase = require('../config/supabase');
const { AppError } = require('../utils/errorHandler');
const { validateUUID } = require('../utils/validation');

/**
 * Create Status History Entry
 * 
 * Records a status change in the status_history table.
 * This maintains an audit trail of all status changes.
 * 
 * @param {Object} data - Status history data
 * @param {string} data.onboarding_request_id - ID of the onboarding request
 * @param {string} data.from_status - Previous status (null for initial)
 * @param {string} data.to_status - New status
 * @param {string} data.changed_by - ID of user who made the change
 * @param {string} data.remarks - Optional remarks about the change
 * @returns {Object} - Created status history record
 */
async function createHistoryEntry(data) {
  try {
    const { 
      onboarding_request_id, 
      from_status, 
      to_status, 
      changed_by, 
      remarks 
    } = data;

    // Validate required fields
    if (!onboarding_request_id || !to_status || !changed_by) {
      throw new AppError('Missing required fields for status history', 400);
    }

    // Validate UUIDs
    validateUUID(onboarding_request_id, 'Onboarding Request ID');
    validateUUID(changed_by, 'Changed By User ID');

    // Create history entry
    const { data: history, error } = await supabase
      .from('status_history')
      .insert({
        onboarding_request_id,
        from_status: from_status || null,
        to_status,
        changed_by,
        remarks: remarks || null,
        changed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating status history:', error);
      throw new AppError('Failed to create status history entry', 500);
    }

    return history;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in createHistoryEntry:', error);
    throw new AppError('Failed to create status history', 500);
  }
}

/**
 * Get Status History by Onboarding Request
 * 
 * Retrieves all status changes for a specific onboarding request,
 * ordered by change time (newest first).
 * 
 * @param {string} onboardingRequestId - ID of the onboarding request
 * @returns {Array} - Array of status history records
 */
async function getHistoryByRequest(onboardingRequestId) {
  try {
    validateUUID(onboardingRequestId, 'Onboarding Request ID');

    const { data, error } = await supabase
      .from('status_history')
      .select(`
        *,
        changed_by_user:employees!changed_by (
          id,
          email,
          first_name,
          last_name,
          role
        )
      `)
      .eq('onboarding_request_id', onboardingRequestId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching status history:', error);
      throw new AppError('Failed to fetch status history', 500);
    }

    return data || [];

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getHistoryByRequest:', error);
    throw new AppError('Failed to fetch status history', 500);
  }
}

/**
 * Get Latest Status for Onboarding Request
 * 
 * Retrieves the most recent status entry.
 * Useful for checking current status.
 * 
 * @param {string} onboardingRequestId - ID of the onboarding request
 * @returns {Object|null} - Latest status history record or null
 */
async function getLatestStatus(onboardingRequestId) {
  try {
    validateUUID(onboardingRequestId, 'Onboarding Request ID');

    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('onboarding_request_id', onboardingRequestId)
      .order('changed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = No rows returned (this is okay)
      console.error('Error fetching latest status:', error);
      throw new AppError('Failed to fetch latest status', 500);
    }

    return data || null;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getLatestStatus:', error);
    throw new AppError('Failed to fetch latest status', 500);
  }
}

/**
 * Get Status History Timeline
 * 
 * Returns a formatted timeline of status changes.
 * Useful for displaying history to users.
 * 
 * @param {string} onboardingRequestId - ID of the onboarding request
 * @returns {Array} - Formatted timeline array
 */
async function getTimeline(onboardingRequestId) {
  try {
    const history = await getHistoryByRequest(onboardingRequestId);

    // Format timeline for better readability
    return history.map(entry => ({
      id: entry.id,
      fromStatus: entry.from_status,
      toStatus: entry.to_status,
      changedAt: entry.changed_at,
      changedBy: {
        id: entry.changed_by_user?.id,
        name: `${entry.changed_by_user?.first_name} ${entry.changed_by_user?.last_name}`,
        email: entry.changed_by_user?.email,
        role: entry.changed_by_user?.role
      },
      remarks: entry.remarks
    }));

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getTimeline:', error);
    throw new AppError('Failed to generate timeline', 500);
  }
}

module.exports = {
  createHistoryEntry,
  getHistoryByRequest,
  getLatestStatus,
  getTimeline
};
