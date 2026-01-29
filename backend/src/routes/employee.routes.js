/**
 * Employee Routes
 * 
 * Defines all employee-related API endpoints.
 */

const express = require('express');
const router = express.Router();
const { verifyAuth, requireAuth, checkOwnership, validateUUIDParam } = require('../middlewares');
const {
  getEmployeeProfile,
  getProfileWithOnboarding,
  updateEmployee,
  getAllEmployees
} = require('../controllers/employee.controller');

/**
 * GET /api/employees
 * Get all employees (admin only will be added later)
 */
router.get('/', verifyAuth, getAllEmployees);

/**
 * GET /api/employees/:id
 * Get employee profile by ID
 */
router.get(
  '/:id',
  verifyAuth,
  validateUUIDParam('id'),
  checkOwnership('id'),
  getEmployeeProfile
);

/**
 * GET /api/employees/:id/profile
 * Get employee profile with onboarding summary
 */
router.get(
  '/:id/profile',
  verifyAuth,
  validateUUIDParam('id'),
  checkOwnership('id'),
  getProfileWithOnboarding
);

/**
 * PUT /api/employees/:id
 * Update employee information
 */
router.put(
  '/:id',
  verifyAuth,
  validateUUIDParam('id'),
  checkOwnership('id'),
  updateEmployee
);

module.exports = router;
