/**
 * Document Routes
 * 
 * Defines all document upload/download API endpoints.
 */

const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
  verifyAuth,
  requireAuth,
  validateUUIDParam,
  validateDocumentUpload
} = require('../middlewares');
const {
  uploadDocument,
  getDocument,
  downloadDocument,
  getDocumentsByRequest,
  deleteDocument,
  validateRequirements
} = require('../controllers/document.controller');

/**
 * POST /api/documents
 * Upload document
 */
router.post(
  '/',
  verifyAuth,
  upload.single('file'),
  validateDocumentUpload,
  uploadDocument
);

/**
 * GET /api/documents/:id
 * Get document metadata by ID
 */
router.get(
  '/:id',
  verifyAuth,
  validateUUIDParam('id'),
  getDocument
);

/**
 * GET /api/documents/:id/download
 * Download document
 */
router.get(
  '/:id/download',
  verifyAuth,
  validateUUIDParam('id'),
  downloadDocument
);

/**
 * GET /api/documents/onboarding/:requestId
 * Get all documents for an onboarding request
 */
router.get(
  '/onboarding/:requestId',
  verifyAuth,
  validateUUIDParam('requestId'),
  getDocumentsByRequest
);

/**
 * GET /api/documents/validate/:requestId
 * Validate document requirements for onboarding
 */
router.get(
  '/validate/:requestId',
  verifyAuth,
  validateUUIDParam('requestId'),
  validateRequirements
);

/**
 * DELETE /api/documents/:id
 * Delete document
 */
router.delete(
  '/:id',
  verifyAuth,
  validateUUIDParam('id'),
  deleteDocument
);

module.exports = router;
