/**
 * Response Formatter Utility
 * 
 * Provides consistent response structure across all API endpoints.
 * All responses follow the same format for frontend predictability.
 */

/**
 * Success Response
 * 
 * @param {*} data - Data to send in response
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} - Formatted response object
 */
function successResponse(data = null, message = 'Success', statusCode = 200) {
  return {
    success: true,
    message: message,
    data: data,
    statusCode: statusCode
  };
}

/**
 * Error Response
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Object} - Formatted error response object
 */
function errorResponse(message = 'An error occurred', statusCode = 500) {
  return {
    success: false,
    message: message,
    data: null,
    statusCode: statusCode
  };
}

/**
 * Paginated Response
 * 
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} - Formatted paginated response
 */
function paginatedResponse(data, page, limit, total, message = 'Success') {
  return {
    success: true,
    message: message,
    data: data,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};
