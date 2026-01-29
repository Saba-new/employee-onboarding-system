const express = require('express');
const cors = require('cors');
const { globalErrorHandler } = require('./utils/errorHandler');
const { successResponse } = require('./utils/response');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json(successResponse(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    'Server is running'
  ));
});

/**
 * Root endpoint
 * Basic welcome message
 */
app.get('/', (req, res) => {
  res.status(200).json(successResponse(
    {
      name: 'Employee Onboarding API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api'
      }
    },
    'Welcome to Employee Onboarding System API'
  ));
});

// ============================================
// API ROUTES
// ============================================

const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404
  });
});

app.use(globalErrorHandler);

module.exports = app;
