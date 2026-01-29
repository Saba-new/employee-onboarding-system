require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log('\n🚀 ===================================');
  console.log('🚀 Employee Onboarding API Server');
  console.log('🚀 ===================================');
  console.log(`🚀 Environment: ${NODE_ENV}`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
  console.log('🚀 ===================================\n');
  console.log('✓ Server is ready to accept requests');
  console.log('✓ Press Ctrl+C to stop\n');
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✓ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n\n⚠️  SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✓ HTTP server closed');
    console.log('👋 Goodbye!\n');
    process.exit(0);
  });
});

/**
 * Unhandled Promise Rejection Handler
 * Catches any unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server and exit
  server.close(() => {
    process.exit(1);
  });
});
