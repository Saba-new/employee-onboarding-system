/**
 * Multer Configuration
 * 
 * Configures file upload middleware for document handling.
 * Uses memory storage (files stored in buffer, then uploaded to Supabase).
 */

const multer = require('multer');
const { AppError } = require('../utils/errorHandler');

// Configure memory storage (files stored in memory buffer)
const storage = multer.memoryStorage();

// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new AppError('Invalid file type. Only PDF, JPEG, PNG, DOC, DOCX allowed', 400), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

module.exports = upload;
