const { body, param, query } = require('express-validator');

const difficultyLabels = {
  easy: 0,
  medium: 1,
  hard: 2,
};

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object ?? {}, key);

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

const normalizeDifficulty = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0 && value <= 2) {
      return value;
    }
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (hasOwn(difficultyLabels, normalized)) {
    return difficultyLabels[normalized];
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 2) {
    return parsed;
  }

  return null;
};

const optionalNullableString = (field, maxLength, message) =>
  body(field)
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        req.body[field] = null;
        return true;
      }

      if (typeof value !== 'string') {
        throw new Error(message ?? `${field} must be a string.`);
      }

      const trimmed = value.trim();
      if (maxLength && trimmed.length > maxLength) {
        throw new Error(
          `${field} must be ${maxLength} characters or fewer.`,
        );
      }

      req.body[field] = trimmed || null;
      return true;
    });

const wordIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Word id must be a positive integer.')
    .toInt(),
];

const listWordQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100.')
    .toInt(),
  query('difficulty')
    .optional()
    .custom((value, { req }) => {
      const normalized = normalizeDifficulty(value);
      if (normalized === null) {
        throw new Error('difficulty must be 0, 1, 2 or easy/medium/hard.');
      }
      if (normalized === undefined) {
        delete req.query.difficulty;
        return true;
      }
      req.query.difficulty = normalized;
      return true;
    }),
  query('masteryStatus')
    .optional()
    .custom((value, { req }) => {
      const normalized = normalizeBoolean(value);
      if (normalized === undefined) {
        throw new Error('masteryStatus must be a boolean value.');
      }
      req.query.masteryStatus = normalized;
      return true;
    }),
  query('dictionaryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('dictionaryId must be a positive integer.')
    .toInt(),
  query('createdAfter')
    .optional()
    .custom((value, { req }) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new Error('createdAfter must be a valid date.');
      }
      req.query.createdAfter = date.toISOString();
      return true;
    }),
  query('createdBefore')
    .optional()
    .custom((value, { req }) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new Error('createdBefore must be a valid date.');
      }
      if (req.query.createdAfter) {
        const afterDate = new Date(req.query.createdAfter);
        if (!Number.isNaN(afterDate.getTime()) && afterDate > date) {
          throw new Error('createdBefore must be on or after createdAfter.');
        }
      }
      req.query.createdBefore = date.toISOString();
      return true;
    }),
  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string.')
    .trim(),
];

const createWordRules = [
  body('word')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('word is required.')
    .bail()
    .isString()
    .withMessage('word must be a string.')
    .bail()
    .custom((value, { req }) => {
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error('word is required.');
      }
      if (trimmed.length > 50) {
        throw new Error('word must be 50 characters or fewer.');
      }
      req.body.word = trimmed;
      return true;
    }),
  body('phonetic')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('phonetic is required.')
    .bail()
    .isString()
    .withMessage('phonetic must be a string.')
    .bail()
    .custom((value, { req }) => {
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error('phonetic is required.');
      }
      if (trimmed.length > 100) {
        throw new Error('phonetic must be 100 characters or fewer.');
      }
      req.body.phonetic = trimmed;
      return true;
    }),
  body('meaning')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('meaning is required.')
    .bail()
    .isString()
    .withMessage('meaning must be a string.')
    .bail()
    .custom((value, { req }) => {
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error('meaning is required.');
      }
      if (trimmed.length > 255) {
        throw new Error('meaning must be 255 characters or fewer.');
      }
      req.body.meaning = trimmed;
      return true;
    }),
  optionalNullableString('pronunciation1', 255, 'pronunciation1 must be a string when provided.'),
  optionalNullableString('pronunciation2', 255, 'pronunciation2 must be a string when provided.'),
  optionalNullableString('pronunciation3', 255, 'pronunciation3 must be a string when provided.'),
  optionalNullableString('notes', 255, 'notes must be a string when provided.'),
  body('difficulty')
    .optional()
    .custom((value, { req }) => {
      const normalized = normalizeDifficulty(value);
      if (normalized === null) {
        throw new Error('difficulty must be 0, 1, 2 or easy/medium/hard.');
      }
      if (normalized === undefined) {
        delete req.body.difficulty;
        return true;
      }
      req.body.difficulty = normalized;
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
  body('createdAt')
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        req.body.createdAt = null;
        return true;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new Error('createdAt must be a valid date.');
      }
      req.body.createdAt = date;
      return true;
    }),
];

const updateWordRules = [
  body()
    .custom((value, { req }) => {
      const fields = [
        'word',
        'phonetic',
        'meaning',
        'pronunciation1',
        'pronunciation2',
        'pronunciation3',
        'notes',
        'difficulty',
        'isMastered',
        'createdAt',
      ];
      const hasField = fields.some((field) => hasOwn(req.body, field));
      if (!hasField) {
        throw new Error('At least one field must be provided to update a word.');
      }
      return true;
    }),
  body('word')
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        throw new Error('word cannot be null.');
      }
      if (typeof value !== 'string') {
        throw new Error('word must be a string.');
      }
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error('word must be a non-empty string when provided.');
      }
      if (trimmed.length > 50) {
        throw new Error('word must be 50 characters or fewer.');
      }
      req.body.word = trimmed;
      return true;
    }),
  body('phonetic')
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        throw new Error('phonetic cannot be null.');
      }
      if (typeof value !== 'string') {
        throw new Error('phonetic must be a string.');
      }
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error('phonetic must be a non-empty string when provided.');
      }
      if (trimmed.length > 100) {
        throw new Error('phonetic must be 100 characters or fewer.');
      }
      req.body.phonetic = trimmed;
      return true;
    }),
  body('meaning')
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        throw new Error('meaning cannot be null.');
      }
      if (typeof value !== 'string') {
        throw new Error('meaning must be a string.');
      }
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error('meaning must be a non-empty string when provided.');
      }
      if (trimmed.length > 255) {
        throw new Error('meaning must be 255 characters or fewer.');
      }
      req.body.meaning = trimmed;
      return true;
    }),
  optionalNullableString('pronunciation1', 255, 'pronunciation1 must be a string when provided.'),
  optionalNullableString('pronunciation2', 255, 'pronunciation2 must be a string when provided.'),
  optionalNullableString('pronunciation3', 255, 'pronunciation3 must be a string when provided.'),
  optionalNullableString('notes', 255, 'notes must be a string when provided.'),
  body('difficulty')
    .optional()
    .custom((value, { req }) => {
      const normalized = normalizeDifficulty(value);
      if (normalized === null) {
        throw new Error('difficulty must be 0, 1, 2 or easy/medium/hard.');
      }
      if (normalized === undefined) {
        delete req.body.difficulty;
        return true;
      }
      req.body.difficulty = normalized;
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
  body('createdAt')
    .optional()
    .custom((value, { req }) => {
      if (value === null) {
        req.body.createdAt = null;
        return true;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new Error('createdAt must be a valid date.');
      }
      req.body.createdAt = date;
      return true;
    }),
];

module.exports = {
  wordIdParam,
  listWordQueryRules,
  createWordRules,
  updateWordRules,
};
