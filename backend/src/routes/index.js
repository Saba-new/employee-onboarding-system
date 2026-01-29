/**
 * Routes Index
 * 
 * Central routing configuration.
 * Mounts all route modules.
 */

const express = require('express');
const router = express.Router();

const employeeRoutes = require('./employee.routes');
const onboardingRoutes = require('./onboarding.routes');
const documentRoutes = require('./document.routes');
const adminRoutes = require('./admin.routes');

// Mount route modules
router.use('/employees', employeeRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/documents', documentRoutes);
router.use('/admin', adminRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Employee Onboarding API',
    version: '1.0.0',
    endpoints: {
      employees: '/api/employees',
      onboarding: '/api/onboarding',
      documents: '/api/documents',
      admin: '/api/admin'
    }
  });
});

module.exports = router;
