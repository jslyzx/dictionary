const { validationResult, matchedData } = require('express-validator');
const AppError = require('../utils/AppError');

const collectValidationErrors = (result) =>
  result.array().map(({ msg, path, location, value }) => ({
    field: path,
    location,
    message: msg,
    value,
  }));

const extractValidatedData = (req) => ({
  body: matchedData(req, {
    locations: ['body'],
    includeOptionals: true,
    onlyValidData: true,
  }),
  params: matchedData(req, {
    locations: ['params'],
    includeOptionals: true,
    onlyValidData: true,
  }),
  query: matchedData(req, {
    locations: ['query'],
    includeOptionals: true,
    onlyValidData: true,
  }),
});

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const details = collectValidationErrors(result);
    return next(
      new AppError('Request validation failed', {
        status: 400,
        code: 'VALIDATION_ERROR',
        details,
      }),
    );
  }

  const validated = extractValidatedData(req);
  req.validated = {
    body: validated.body,
    params: validated.params,
    query: validated.query,
  };

  return next();
};

module.exports = validate;
