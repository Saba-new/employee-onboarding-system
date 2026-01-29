/**
 * Document Service
 * 
 * Handles document upload, download, and management.
 * Works with both Supabase Storage (file storage) and database (metadata).
 */

const supabase = require('../config/supabase');
const { AppError } = require('../utils/errorHandler');
const { validateUUID } = require('../utils/validation');

/**
 * Upload Document
 * 
 * Business Logic:
 * 1. Upload file to Supabase Storage (private bucket)
 * 2. Save metadata to documents table
 * 3. Link to onboarding request
 * 
 * @param {Object} file - Multer file object
 * @param {Object} metadata - Document metadata
 * @returns {Object} - Created document record
 */
async function uploadDocument(file, metadata) {
  try {
    const { onboarding_request_id, document_type, uploaded_by } = metadata;

    // Validate inputs
    validateUUID(onboarding_request_id, 'Onboarding Request ID');
    validateUUID(uploaded_by, 'Uploaded By User ID');

    // BUSINESS RULE: Verify onboarding request exists
    const { data: onboarding, error: onboardingError } = await supabase
      .from('onboarding_requests')
      .select('id, status, employee_id')
      .eq('id', onboarding_request_id)
      .single();

    if (onboardingError || !onboarding) {
      throw new AppError('Onboarding request not found', 404);
    }

    // BUSINESS RULE: Can only upload to pending requests
    if (onboarding.status !== 'pending') {
      throw new AppError(
        `Cannot upload documents to ${onboarding.status} request`,
        400
      );
    }

    // Generate unique file name to prevent conflicts
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${onboarding_request_id}/${timestamp}_${sanitizedOriginalName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(process.env.STORAGE_BUCKET || 'employee-documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      throw new AppError('Failed to upload document to storage', 500);
    }

    // Save document metadata to database
    const documentData = {
      onboarding_request_id,
      document_type,
      file_name: file.originalname,
      file_path: uploadData.path,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by,
      uploaded_at: new Date().toISOString()
    };

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      console.error('Error saving document metadata:', dbError);
      
      // Rollback: Delete uploaded file
      await supabase.storage
        .from(process.env.STORAGE_BUCKET || 'employee-documents')
        .remove([uploadData.path]);
      
      throw new AppError('Failed to save document metadata', 500);
    }

    return document;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in uploadDocument:', error);
    throw new AppError('Failed to upload document', 500);
  }
}

/**
 * Get Document by ID
 * 
 * Retrieves document metadata from database.
 * 
 * @param {string} documentId - UUID of the document
 * @returns {Object} - Document record
 */
async function getDocumentById(documentId) {
  try {
    validateUUID(documentId, 'Document ID');

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        onboarding_request:onboarding_requests!onboarding_request_id (
          id,
          employee_id,
          status
        )
      `)
      .eq('id', documentId)
      .single();

    if (error || !data) {
      throw new AppError('Document not found', 404);
    }

    return data;

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getDocumentById:', error);
    throw new AppError('Failed to fetch document', 500);
  }
}

/**
 * Download Document
 * 
 * Retrieves document file from Supabase Storage.
 * Returns signed URL or file buffer.
 * 
 * @param {string} documentId - UUID of the document
 * @param {number} expiresIn - URL expiration time in seconds (default: 60)
 * @returns {Object} - Signed URL and document metadata
 */
async function downloadDocument(documentId, expiresIn = 60) {
  try {
    // Get document metadata
    const document = await getDocumentById(documentId);

    // Generate signed URL for private storage access
    const { data: signedUrlData, error: urlError } = await supabase
      .storage
      .from(process.env.STORAGE_BUCKET || 'employee-documents')
      .createSignedUrl(document.file_path, expiresIn);

    if (urlError || !signedUrlData) {
      console.error('Error creating signed URL:', urlError);
      throw new AppError('Failed to generate download link', 500);
    }

    return {
      url: signedUrlData.signedUrl,
      fileName: document.file_name,
      mimeType: document.mime_type,
      fileSize: document.file_size,
      expiresIn
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in downloadDocument:', error);
    throw new AppError('Failed to download document', 500);
  }
}

/**
 * Get Documents by Onboarding Request
 * 
 * Retrieves all documents for a specific onboarding request.
 * 
 * @param {string} onboardingRequestId - UUID of the onboarding request
 * @returns {Array} - Array of document records
 */
async function getDocumentsByRequest(onboardingRequestId) {
  try {
    validateUUID(onboardingRequestId, 'Onboarding Request ID');

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('onboarding_request_id', onboardingRequestId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw new AppError('Failed to fetch documents', 500);
    }

    return data || [];

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in getDocumentsByRequest:', error);
    throw new AppError('Failed to fetch documents', 500);
  }
}

/**
 * Delete Document
 * 
 * Business Rules:
 * - Only documents from pending requests can be deleted
 * - Deletes both file from storage and metadata from database
 * 
 * @param {string} documentId - UUID of the document
 * @param {string} userId - UUID of the user requesting deletion
 * @returns {Object} - Deletion confirmation
 */
async function deleteDocument(documentId, userId) {
  try {
    validateUUID(documentId, 'Document ID');
    validateUUID(userId, 'User ID');

    // Get document details
    const document = await getDocumentById(documentId);

    // BUSINESS RULE: Can only delete from pending requests
    if (document.onboarding_request.status !== 'pending') {
      throw new AppError(
        `Cannot delete documents from ${document.onboarding_request.status} request`,
        400
      );
    }

    // Delete file from storage
    const { error: storageError } = await supabase
      .storage
      .from(process.env.STORAGE_BUCKET || 'employee-documents')
      .remove([document.file_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue anyway - file might already be deleted
    }

    // Delete metadata from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error deleting document metadata:', dbError);
      throw new AppError('Failed to delete document', 500);
    }

    return {
      message: 'Document deleted successfully',
      deletedId: documentId
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in deleteDocument:', error);
    throw new AppError('Failed to delete document', 500);
  }
}

/**
 * Validate Document Requirements
 * 
 * Business logic to check if onboarding request has required documents.
 * 
 * @param {string} onboardingRequestId - UUID of the onboarding request
 * @returns {Object} - Validation result
 */
async function validateDocumentRequirements(onboardingRequestId) {
  try {
    const documents = await getDocumentsByRequest(onboardingRequestId);

    // BUSINESS RULE: Minimum 2 documents required
    const minRequired = 2;
    const hasEnoughDocuments = documents.length >= minRequired;

    // Check for specific required document types
    const documentTypes = documents.map(doc => doc.document_type);
    const hasResume = documentTypes.includes('resume');
    const hasIdProof = documentTypes.includes('id_proof');

    return {
      isValid: hasEnoughDocuments && hasResume && hasIdProof,
      totalDocuments: documents.length,
      minRequired,
      hasResume,
      hasIdProof,
      missingRequirements: [
        !hasEnoughDocuments && `Minimum ${minRequired} documents required`,
        !hasResume && 'Resume is required',
        !hasIdProof && 'ID proof is required'
      ].filter(Boolean)
    };

  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Unexpected error in validateDocumentRequirements:', error);
    throw new AppError('Failed to validate document requirements', 500);
  }
}

module.exports = {
  uploadDocument,
  getDocumentById,
  downloadDocument,
  getDocumentsByRequest,
  deleteDocument,
  validateDocumentRequirements
};
