const multer = require('multer');
const AppError = require('../utils/AppError');

const allowedMimeTypes = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
]);

const createCsvUploadMiddleware = (fieldName = 'file') => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const fileName = file.originalname?.toLowerCase() ?? '';
      if (allowedMimeTypes.has(file.mimetype) || fileName.endsWith('.csv')) {
        cb(null, true);
        return;
      }

      cb(
        new AppError('Only CSV files are allowed.', {
          status: 400,
          code: 'INVALID_FILE_TYPE',
        }),
      );
    },
  });

  return (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          if (error.code === 'LIMIT_FILE_SIZE') {
            return next(
              new AppError('CSV file is too large. Maximum size is 5MB.', {
                status: 400,
                code: 'FILE_TOO_LARGE',
              }),
            );
          }

          return next(
            new AppError('File upload failed.', {
              status: 400,
              code: 'UPLOAD_ERROR',
              details: error.code,
            }),
          );
        }

        return next(error);
      }

      if (!req.file) {
        return next(
          new AppError('CSV file is required.', {
            status: 400,
            code: 'FILE_REQUIRED',
          }),
        );
      }

      return next();
    });
  };
};

module.exports = createCsvUploadMiddleware;
