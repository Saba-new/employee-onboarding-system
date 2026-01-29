/**
 * Employee Service
 * 
 * Handles all business logic related to employee operations.
 * This includes CRUD operations, validation, and business rules.
 */

const supabase = require('../config/supabase');
const { AppError } = require('../utils/errorHandler');
const { validateEmail, validateUUID } = require('../utils/validation');

/**
 * Get Employee by ID
 * 
 * Retrieves a single employee record by ID.
 * 
 * @param {string} employeeId - UUID of the employee
 * @returns {Object} - Employee record
 */
async function getById(employeeId) {
  try {
    validateUUID(employeeId, 'Employee ID');

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error || !data) {
      throw new AppError('Employee not found', 404);
    }

    // Remove sensitive fields before returning
    delete data.password_hash;

    return data;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getById:', error);
    throw new AppError('Failed to fetch employee', 500);
  }
}

/**
 * Get Employee by Email
 * 
 * Retrieves employee record by email address.
 * Useful for checking if email exists during registration.
 * 
 * @param {string} email - Employee email address
 * @returns {Object|null} - Employee record or null if not found
 */
async function getByEmail(email) {
  try {
    validateEmail(email);

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = No rows returned (this is okay)
      console.error('Error fetching employee by email:', error);
      throw new AppError('Failed to fetch employee', 500);
    }

    if (data) {
      delete data.password_hash;
    }

    return data || null;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getByEmail:', error);
    throw new AppError('Failed to fetch employee', 500);
  }
}

/**
 * Check if Email Exists
 * 
 * Business logic to verify email uniqueness.
 * Used during employee creation/update.
 * 
 * @param {string} email - Email to check
 * @param {string} excludeId - Optional employee ID to exclude from check
 * @returns {boolean} - True if email exists, false otherwise
 */
async function checkEmailExists(email, excludeId = null) {
  try {
    validateEmail(email);

    let query = supabase
      .from('employees')
      .select('id')
      .eq('email', email.toLowerCase().trim());

    // Exclude specific employee ID (useful for updates)
    if (excludeId) {
      validateUUID(excludeId, 'Exclude ID');
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email:', error);
      throw new AppError('Failed to check email availability', 500);
    }

    // If data exists, email is taken
    return data !== null;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in checkEmailExists:', error);
    throw new AppError('Failed to check email', 500);
  }
}

/**
 * Update Employee
 * 
 * Updates employee information.
 * Business rules:
 * - Cannot change email to one that already exists
 * - Cannot change role (requires separate admin action)
 * 
 * @param {string} employeeId - UUID of employee to update
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated employee record
 */
async function update(employeeId, updates) {
  try {
    validateUUID(employeeId, 'Employee ID');

    // Business rule: Check if employee exists
    const existing = await getById(employeeId);

    // Business rule: If email is being changed, verify it's not taken
    if (updates.email && updates.email !== existing.email) {
      validateEmail(updates.email);
      const emailExists = await checkEmailExists(updates.email, employeeId);
      
      if (emailExists) {
        throw new AppError('Email address is already registered', 400);
      }
      
      // Normalize email
      updates.email = updates.email.toLowerCase().trim();
    }

    // Business rule: Cannot update certain protected fields via this method
    const protectedFields = ['id', 'role', 'created_at', 'password_hash'];
    protectedFields.forEach(field => {
      if (updates[field] !== undefined) {
        delete updates[field];
      }
    });

    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    // Perform update
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employeeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      throw new AppError('Failed to update employee', 500);
    }

    delete data.password_hash;
    return data;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in update:', error);
    throw new AppError('Failed to update employee', 500);
  }
}

/**
 * Get All Employees
 * 
 * Retrieves list of all employees with pagination.
 * Admin-only operation.
 * 
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.role - Filter by role (optional)
 * @returns {Object} - Paginated employee list
 */
async function getAll(options = {}) {
  try {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by role if specified
    if (options.role) {
      query = query.eq('role', options.role);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching employees:', error);
      throw new AppError('Failed to fetch employees', 500);
    }

    // Remove sensitive fields
    const employees = (data || []).map(emp => {
      delete emp.password_hash;
      return emp;
    });

    return {
      employees,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getAll:', error);
    throw new AppError('Failed to fetch employees', 500);
  }
}

/**
 * Get Employee Profile with Onboarding Summary
 * 
 * Gets employee details along with summary of their onboarding requests.
 * 
 * @param {string} employeeId - UUID of employee
 * @returns {Object} - Employee with onboarding summary
 */
async function getProfileWithOnboarding(employeeId) {
  try {
    validateUUID(employeeId, 'Employee ID');

    // Get employee details
    const employee = await getById(employeeId);

    // Get onboarding requests count by status
    const { data: onboardingStats, error } = await supabase
      .from('onboarding_requests')
      .select('status')
      .eq('employee_id', employeeId);

    if (error) {
      console.error('Error fetching onboarding stats:', error);
      // Don't fail the whole request, just return empty stats
      return {
        ...employee,
        onboarding: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        }
      };
    }

    // Calculate statistics
    const stats = {
      total: onboardingStats.length,
      pending: onboardingStats.filter(r => r.status === 'pending').length,
      approved: onboardingStats.filter(r => r.status === 'approved').length,
      rejected: onboardingStats.filter(r => r.status === 'rejected').length
    };

    return {
      ...employee,
      onboarding: stats
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getProfileWithOnboarding:', error);
    throw new AppError('Failed to fetch employee profile', 500);
  }
}

module.exports = {
  getById,
  getByEmail,
  checkEmailExists,
  update,
  getAll,
  getProfileWithOnboarding
};
