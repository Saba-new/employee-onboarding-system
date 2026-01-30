const { 
  validateEmail, 
  validatePhone, 
  validateRequiredFields,
  validateStringLength 
} = require('../utils/validation');
const { AppError } = require('../utils/errorHandler');

function validateOnboardingRequest(req, res, next) {
  try {
    const { first_name, last_name, email, phone, address, date_of_birth } = req.body;

    validateRequiredFields(req.body, [
      'first_name',
      'last_name', 
      'email',
      'phone',
      'address',
      'date_of_birth'
    ]);

    validateStringLength(first_name, 'First name', 2, 50);
    validateStringLength(last_name, 'Last name', 2, 50);
    validateEmail(email);
    validatePhone(phone);
    validateStringLength(address, 'Address', 10, 500);

    const dob = new Date(date_of_birth);
    if (isNaN(dob.getTime())) {
      throw new AppError('Invalid date of birth format', 400);
    }

    const age = (new Date() - dob) / (1000 * 60 * 60 * 24 * 365);
    if (age < 18) {
      throw new AppError('Employee must be at least 18 years old', 400);
    }
    if (age > 100) {
      throw new AppError('Invalid date of birth', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
}

function validateLoginRequest(req, res, next) {
  try {
    const { email, password } = req.body;

    validateRequiredFields(req.body, ['email', 'password']);
    validateEmail(email);
    validateStringLength(password, 'Password', 6, 100);

    next();
  } catch (error) {
    next(error);
  }
}

function validateRegisterRequest(req, res, next) {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    validateRequiredFields(req.body, ['email', 'password', 'firstName', 'lastName']);
    
    validateEmail(email);
    validateStringLength(password, 'Password', 6, 100);
    validateStringLength(firstName, 'First name', 2, 50);
    validateStringLength(lastName, 'Last name', 2, 50);

    if (role && !['admin', 'employee'].includes(role)) {
      throw new AppError('Role must be either "admin" or "employee"', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
}

function validateDocumentUpload(req, res, next) {
  try {
    const { documentType } = req.body;
    const allowedTypes = ['passport', 'aadhar', 'pan', 'photo'];

    if (!documentType) {
      throw new AppError('Document type is required', 400);
    }

    if (!allowedTypes.includes(documentType)) {
      throw new AppError(
        `Invalid document type. Allowed types: ${allowedTypes.join(', ')}`,
        400
      );
    }

    if (!req.file) {
      throw new AppError('File is required', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
}

function validateRejectRequest(req, res, next) {
  try {
    const { remarks } = req.body;

    validateRequiredFields(req.body, ['remarks']);
    validateStringLength(remarks, 'Remarks', 10, 500);

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateOnboardingRequest,
  validateLoginRequest,
  validateRegisterRequest,
  validateDocumentUpload,
  validateRejectRequest
};
