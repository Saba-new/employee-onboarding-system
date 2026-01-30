const {
  validateEmail,
  validatePhone,
  validateUUID,
  validateRequiredFields,
  validateStringLength
} = require('../validation');
const { AppError } = require('../errorHandler');

describe('Validation Utils', () => {
  
  describe('validateEmail', () => {
    test('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.in')).toBe(true);
    });

    test('should reject invalid email format', () => {
      expect(() => validateEmail('invalid-email')).toThrow(AppError);
      expect(() => validateEmail('test@')).toThrow(AppError);
      expect(() => validateEmail('@example.com')).toThrow(AppError);
      expect(() => validateEmail('test @example.com')).toThrow(AppError);
    });

    test('should reject empty email', () => {
      expect(() => validateEmail('')).toThrow('Email is required');
      expect(() => validateEmail(null)).toThrow('Email is required');
    });
  });

  describe('validatePhone', () => {
    test('should accept valid 10-digit phone', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('1234567890')).toBe(true);
    });

    test('should reject invalid phone format', () => {
      expect(() => validatePhone('123')).toThrow('Phone number must be 10 digits');
      expect(() => validatePhone('12345678901')).toThrow('Phone number must be 10 digits');
      expect(() => validatePhone('abcd123456')).toThrow('Phone number must be 10 digits');
    });

    test('should reject empty phone', () => {
      expect(() => validatePhone('')).toThrow('Phone number is required');
      expect(() => validatePhone(null)).toThrow('Phone number is required');
    });
  });

  describe('validateUUID', () => {
    test('should accept valid UUID', () => {
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    test('should reject invalid UUID format', () => {
      expect(() => validateUUID('invalid-uuid')).toThrow('Invalid ID format');
      expect(() => validateUUID('123-456')).toThrow('Invalid ID format');
    });

    test('should reject empty UUID', () => {
      expect(() => validateUUID('')).toThrow('ID is required');
      expect(() => validateUUID(null)).toThrow('ID is required');
    });

    test('should use custom field name in error', () => {
      expect(() => validateUUID('invalid', 'Employee ID')).toThrow('Invalid Employee ID format');
    });
  });

  describe('validateRequiredFields', () => {
    test('should accept object with all required fields', () => {
      const data = { name: 'John', email: 'john@example.com', age: 25 };
      expect(() => validateRequiredFields(data, ['name', 'email', 'age'])).not.toThrow();
    });

    test('should reject object missing required fields', () => {
      const data = { name: 'John' };
      expect(() => validateRequiredFields(data, ['name', 'email'])).toThrow('Missing required fields: email');
    });

    test('should reject object with empty string fields', () => {
      const data = { name: 'John', email: '   ' };
      expect(() => validateRequiredFields(data, ['name', 'email'])).toThrow('Missing required fields: email');
    });

    test('should list all missing fields', () => {
      const data = { name: 'John' };
      expect(() => validateRequiredFields(data, ['name', 'email', 'phone'])).toThrow('Missing required fields: email, phone');
    });
  });

  describe('validateStringLength', () => {
    test('should accept string within length range', () => {
      expect(validateStringLength('Hello', 'Name', 3, 10)).toBe(true);
      expect(validateStringLength('Test', 'Name', 1, 100)).toBe(true);
    });

    test('should reject string shorter than minimum', () => {
      expect(() => validateStringLength('Hi', 'Name', 5, 20)).toThrow('Name must be at least 5 characters');
    });

    test('should reject string longer than maximum', () => {
      expect(() => validateStringLength('Very long string here', 'Name', 1, 10)).toThrow('Name must not exceed 10 characters');
    });

    test('should reject empty string', () => {
      expect(() => validateStringLength('', 'Name', 1, 10)).toThrow('Name is required');
    });

    test('should trim whitespace before checking length', () => {
      expect(() => validateStringLength('   ', 'Name', 1, 10)).toThrow('Name must be at least 1 characters');
    });
  });

});
