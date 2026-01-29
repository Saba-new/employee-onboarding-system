/**
 * Employee Controller
 * 
 * Handles HTTP requests for employee-related operations.
 * Thin layer - delegates business logic to employeeService.
 */

const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const employeeService = require('../services/employee.service');

/**
 * Get Employee Profile
 * GET /api/employees/:id
 */
const getEmployeeProfile = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  
  const employee = await employeeService.getById(employeeId);
  
  res.status(200).json(successResponse(
    employee,
    'Employee profile retrieved successfully'
  ));
});

/**
 * Get Employee Profile with Onboarding Summary
 * GET /api/employees/:id/profile
 */
const getProfileWithOnboarding = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  
  const profile = await employeeService.getProfileWithOnboarding(employeeId);
  
  res.status(200).json(successResponse(
    profile,
    'Employee profile with onboarding summary retrieved'
  ));
});

/**
 * Update Employee
 * PUT /api/employees/:id
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  const updates = req.body;
  
  const employee = await employeeService.update(employeeId, updates);
  
  res.status(200).json(successResponse(
    employee,
    'Employee updated successfully'
  ));
});

/**
 * Get All Employees (Admin only)
 * GET /api/employees
 */
const getAllEmployees = asyncHandler(async (req, res) => {
  const options = {
    page: req.query.page,
    limit: req.query.limit,
    role: req.query.role
  };
  
  const result = await employeeService.getAll(options);
  
  res.status(200).json({
    success: true,
    message: 'Employees retrieved successfully',
    data: result.employees,
    pagination: result.pagination
  });
});

module.exports = {
  getEmployeeProfile,
  getProfileWithOnboarding,
  updateEmployee,
  getAllEmployees
};
