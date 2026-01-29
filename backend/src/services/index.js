/**
 * Services Index
 * 
 * Central export point for all service modules.
 * Makes importing services easier in controllers and other files.
 */

const employeeService = require('./employee.service');
const onboardingService = require('./onboarding.service');
const documentService = require('./document.service');
const adminService = require('./admin.service');
const statusHistoryService = require('./statusHistory.service');

module.exports = {
  employeeService,
  onboardingService,
  documentService,
  adminService,
  statusHistoryService
};
