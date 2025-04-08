import multer from 'multer';

/**
 * Multer configuration for handling file uploads
 * Currently configured for avatar images with:
 * - Memory storage
 * - 5MB file size limit
 * - Single file upload
 * - Image files only
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}); 