const { body, param } = require('express-validator');

const normalizeBoolean = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y'].includes(normalized)) {
      return true;
    }

    if (['0', 'false', 'no', 'n'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
};

const dictionaryIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Dictionary id must be a positive integer.')
    .toInt(),
];

const createDictionaryRules = [
  body('name')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Name is required.')
    .bail()
    .isString()
    .withMessage('Name must be a string.')
    .bail()
    .custom((value, { req }) => {
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error('Name is required.');
      }
      if (trimmed.length > 100) {
        throw new Error('Name must be 100 characters or fewer.');
      }
      req.body.name = trimmed;
      return true;
    }),
  body('description')
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        req.body.description = null;
        return true;
      }

      if (typeof value !== 'string') {
        throw new Error('Description must be a string when provided.');
      }

      const trimmed = value.trim();
      if (trimmed.length > 2000) {
        throw new Error('Description must be 2000 characters or fewer.');
      }
      req.body.description = trimmed || null;
      return true;
    }),
  body('isEnabled')
    .optional()
    .custom((value, { req }) => {
      const normalized = normalizeBoolean(value);
      if (normalized === undefined) {
        throw new Error('isEnabled must be a boolean value.');
      }
      req.body.isEnabled = normalized;
      return true;
    }),
  body('isMastered')
    .optional()
    .custom((value, { req }) => {
      const normalized = normalizeBoolean(value);
      if (normalized === undefined) {
        throw new Error('isMastered must be a boolean value.');
      }
      req.body.isMastered = normalized;
      return true;
    }),
];

const updateDictionaryRules = [
  body()
    .custom((value, { req }) => {
      const fields = ['name', 'description', 'isEnabled', 'isMastered'];
      const hasAtLeastOne = fields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));
      if (!hasAtLeastOne) {
        throw new Error('At least one field must be provided to update a dictionary.');
      }
      return true;
    }),
  body('name')
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        throw new Error('Name cannot be null.');
      }
      if (typeof value !== 'string') {
        throw new Error('Name must be a string.');
      }
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error('Name must be a non-empty string when provided.');
      }
      if (trimmed.length > 100) {
        throw new Error('Name must be 100 characters or fewer.');
      }
      req.body.name = trimmed;
      return true;
    }),
  body('description')
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        req.body.description = null;
        return true;
      }
      if (typeof value !== 'string') {
        throw new Error('Description must be a string when provided.');
      }
      const trimmed = value.trim();
      if (trimmed.length > 2000) {
        throw new Error('Description must be 2000 characters or fewer.');
      }
      req.body.description = trimmed || null;
      return true;
    }),
  body('isEnabled')
    .optional()
    .custom((value, { req }) => {
      const normalized = normalizeBoolean(value);
      if (normalized === undefined) {
        throw new Error('isEnabled must be a boolean value.');
      }
      req.body.isEnabled = normalized;
      return true;
    }),
  body('isMastered')
    .optional()
    .custom((value, { req }) => {
      const normalized = normalizeBoolean(value);
      if (normalized === undefined) {
        throw new Error('isMastered must be a boolean value.');
      }
      req.body.isMastered = normalized;
      return true;
    }),
];

module.exports = {
  dictionaryIdParam,
  createDictionaryRules,
  updateDictionaryRules,
};
