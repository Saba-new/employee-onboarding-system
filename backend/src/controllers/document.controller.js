/**
 * Document Controller
 * 
 * Handles HTTP requests for document upload/download operations.
 */

const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { AppError } = require('../utils/errorHandler');
const documentService = require('../services/document.service');

/**
 * Upload Document
 * POST /api/documents
 */
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  
  const metadata = {
    onboarding_request_id: req.body.onboarding_request_id,
    document_type: req.body.document_type,
    uploaded_by: req.user.id
  };
  
  const document = await documentService.uploadDocument(req.file, metadata);
  
  res.status(201).json(successResponse(
    document,
    'Document uploaded successfully',
    201
  ));
});

/**
 * Get Document by ID
 * GET /api/documents/:id
 */
const getDocument = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  
  const document = await documentService.getDocumentById(documentId);
  
  res.status(200).json(successResponse(
    document,
    'Document retrieved successfully'
  ));
});

/**
 * Download Document
 * GET /api/documents/:id/download
 */
const downloadDocument = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const expiresIn = parseInt(req.query.expiresIn) || 60;
  
  const downloadData = await documentService.downloadDocument(documentId, expiresIn);
  
  res.status(200).json(successResponse(
    downloadData,
    'Download link generated successfully'
  ));
});

/**
 * Get Documents by Onboarding Request
 * GET /api/documents/onboarding/:requestId
 */
const getDocumentsByRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.requestId;
  
  const documents = await documentService.getDocumentsByRequest(requestId);
  
  res.status(200).json(successResponse(
    documents,
    'Documents retrieved successfully'
  ));
});

/**
 * Delete Document
 * DELETE /api/documents/:id
 */
const deleteDocument = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const userId = req.user.id;
  
  const result = await documentService.deleteDocument(documentId, userId);
  
  res.status(200).json(successResponse(
    result,
    'Document deleted successfully'
  ));
});

/**
 * Validate Document Requirements
 * GET /api/documents/validate/:requestId
 */
const validateRequirements = asyncHandler(async (req, res) => {
  const requestId = req.params.requestId;
  
  const validation = await documentService.validateDocumentRequirements(requestId);
  
  res.status(200).json(successResponse(
    validation,
    validation.isValid ? 'All requirements met' : 'Missing required documents'
  ));
});

module.exports = {
  uploadDocument,
  getDocument,
  downloadDocument,
  getDocumentsByRequest,
  deleteDocument,
  validateRequirements
};
