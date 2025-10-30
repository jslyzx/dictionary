const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(
    new AppError('Resource not found.', {
      status: 404,
      code: 'NOT_FOUND',
    }),
  );
};

module.exports = notFound;
