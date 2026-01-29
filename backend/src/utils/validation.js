/**
 * Validation Utility
 * 
 * Provides reusable validation functions for request data.
 * Keeps validation logic centralized and consistent.
 */

const { AppError } = require('./errorHandler');

/**
 * Validate Email Format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 * @throws {AppError} - If email is invalid
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    throw new AppError('Email is required', 400);
  }
  
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400);
  }
  
  return true;
}

/**
 * Validate Phone Number (10 digits)
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 * @throws {AppError} - If phone is invalid
 */
function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  
  if (!phone) {
    throw new AppError('Phone number is required', 400);
  }
  
  if (!phoneRegex.test(phone)) {
    throw new AppError('Phone number must be 10 digits', 400);
  }
  
  return true;
}

/**
 * Validate UUID Format
 * 
 * @param {string} uuid - UUID to validate
 * @param {string} fieldName - Name of the field (for error message)
 * @returns {boolean} - True if valid
 * @throws {AppError} - If UUID is invalid
 */
function validateUUID(uuid, fieldName = 'ID') {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuid) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  
  if (!uuidRegex.test(uuid)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
  
  return true;
}

/**
 * Validate Required Fields
 * 
 * @param {Object} data - Object containing data
 * @param {Array<string>} requiredFields - Array of required field names
 * @throws {AppError} - If any required field is missing
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new AppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400
    );
  }
}

/**
 * Validate String Length
 * 
 * @param {string} value - String to validate
 * @param {string} fieldName - Name of the field
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @throws {AppError} - If length is invalid
 */
function validateStringLength(value, fieldName, minLength = 1, maxLength = 255) {
  if (!value) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue.length < minLength) {
    throw new AppError(
      `${fieldName} must be at least ${minLength} characters`,
      400
    );
  }
  
  if (trimmedValue.length > maxLength) {
    throw new AppError(
      `${fieldName} must not exceed ${maxLength} characters`,
      400
    );
  }
  
  return true;
}

/**
 * Validate File Upload
 * 
 * @param {Object} file - Multer file object
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @throws {AppError} - If file is invalid
 */
function validateFile(file, allowedTypes, maxSize = 5 * 1024 * 1024) {
  if (!file) {
    throw new AppError('File is required', 400);
  }
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      400
    );
  }
  
  // Check file size (default: 5MB)
  if (file.size > maxSize) {
    throw new AppError(
      `File size must not exceed ${maxSize / (1024 * 1024)}MB`,
      400
    );
  }
  
  return true;
}

module.exports = {
  validateEmail,
  validatePhone,
  validateUUID,
  validateRequiredFields,
  validateStringLength,
  validateFile
};
