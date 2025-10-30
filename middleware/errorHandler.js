const AppError = require('../utils/AppError');

const mapDatabaseError = (error) => {
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return {
        status: 409,
        code: 'DUPLICATE_RESOURCE',
        message: 'A resource with the provided identifier already exists.',
      };
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return {
        status: 400,
        code: 'FOREIGN_KEY_NOT_FOUND',
        message: 'The referenced resource could not be found.',
      };
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return {
        status: 409,
        code: 'FOREIGN_KEY_CONSTRAINT',
        message: 'The resource cannot be modified because it is still in use.',
      };
    default:
      return {
        status: 500,
        code: 'DATABASE_ERROR',
        message: 'A database error occurred.',
      };
  }
};

const errorHandler = (err, req, res, next) => {
  const isDatabaseError = typeof err.code === 'string' && err.code.startsWith('ER_');
  const isAppError = err instanceof AppError;

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  let status = err.status || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred.';
  let details = err.details;

  if (!isAppError && isDatabaseError) {
    const mapped = mapDatabaseError(err);
    status = mapped.status;
    code = mapped.code;
    message = mapped.message;
  }

  if (!isAppError && !isDatabaseError && status === 500) {
    code = 'INTERNAL_SERVER_ERROR';
    message = 'An unexpected error occurred.';
  }

  const response = {
    success: false,
    error: code,
    message,
  };

  if (details !== undefined) {
    response.details = details;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
