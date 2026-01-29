/**
 * Request Validation Middleware
 * 
 * Validates incoming request data before it reaches controllers.
 * Uses validation functions from utils/validation.js
 */

const { 
  validateEmail, 
  validatePhone, 
  validateUUID,
  validateRequiredFields,
  validateStringLength 
} = require('../utils/validation');
const { AppError } = require('../utils/errorHandler');

/**
 * Validate Onboarding Request Data
 * 
 * Validates data for creating/updating onboarding requests.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function validateOnboardingRequest(req, res, next) {
  try {
    const { first_name, last_name, email, phone, address, date_of_birth } = req.body;

    // Check required fields
    validateRequiredFields(req.body, [
      'first_name',
      'last_name',
      'email',
      'phone',
      'address',
      'date_of_birth'
    ]);

    // Validate individual fields
    validateStringLength(first_name, 'First name', 2, 50);
    validateStringLength(last_name, 'Last name', 2, 50);
    validateEmail(email);
    validatePhone(phone);
    validateStringLength(address, 'Address', 10, 255);

    // Validate date of birth is a valid date
    const dob = new Date(date_of_birth);
    if (isNaN(dob.getTime())) {
      throw new AppError('Invalid date of birth format', 400);
    }

    // Check if date of birth is in the past
    if (dob > new Date()) {
      throw new AppError('Date of birth cannot be in the future', 400);
    }

    // Check if person is at least 18 years old
    const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      throw new AppError('Employee must be at least 18 years old', 400);
    }

    // Validation passed
    next();

  } catch (error) {
    next(error);
  }
}

/**
 * Validate UUID Parameter
 * 
 * Validates that route parameters contain valid UUIDs.
 * Useful for routes like /api/employees/:id
 * 
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} - Middleware function
 */
function validateUUIDParam(paramName = 'id') {
  return (req, res, next) => {
    try {
      const value = req.params[paramName];
      validateUUID(value, paramName);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate Document Upload
 * 
 * Validates uploaded document files.
 * Checks file type and size.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function validateDocumentUpload(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Allowed document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError(
        'Invalid file type. Allowed: PDF, JPEG, PNG, DOC, DOCX',
        400
      );
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      throw new AppError('File size must not exceed 5MB', 400);
    }

    // Validate required fields in request body
    validateRequiredFields(req.body, ['document_type', 'onboarding_request_id']);

    // Validate document_type
    const validDocTypes = ['resume', 'id_proof', 'address_proof', 'education', 'other'];
    if (!validDocTypes.includes(req.body.document_type)) {
      throw new AppError(
        `Invalid document type. Allowed: ${validDocTypes.join(', ')}`,
        400
      );
    }

    // Validate onboarding_request_id is UUID
    validateUUID(req.body.onboarding_request_id, 'Onboarding Request ID');

    // Validation passed
    next();

  } catch (error) {
    next(error);
  }
}

/**
 * Validate Status Update
 * 
 * Validates admin status update requests (approve/reject).
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function validateStatusUpdate(req, res, next) {
  try {
    const { status, remarks } = req.body;

    // Status is required
    if (!status) {
      throw new AppError('Status is required', 400);
    }

    // Valid status values
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new AppError(
        `Invalid status. Allowed: ${validStatuses.join(', ')}`,
        400
      );
    }

    // Remarks are required for rejection
    if (status === 'rejected' && (!remarks || remarks.trim() === '')) {
      throw new AppError('Remarks are required when rejecting', 400);
    }

    // Validate remarks length if provided
    if (remarks) {
      validateStringLength(remarks, 'Remarks', 10, 500);
    }

    // Validation passed
    next();

  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateOnboardingRequest,
  validateUUIDParam,
  validateDocumentUpload,
  validateStatusUpdate
};
