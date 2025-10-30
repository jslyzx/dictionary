const { body, param, query } = require('express-validator');

const relationIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Relation id must be a positive integer.')
    .toInt(),
];

const wordIdParam = [
  param('wordId')
    .isInt({ min: 1 })
    .withMessage('Word id must be a positive integer.')
    .toInt(),
];

const createRelationRules = [
  body('dictionaryId')
    .exists({ checkNull: true })
    .withMessage('dictionaryId is required.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('dictionaryId must be a positive integer.')
    .toInt(),
  body('wordId')
    .exists({ checkNull: true })
    .withMessage('wordId is required.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('wordId must be a positive integer.')
    .toInt(),
];

const listRelationQueryRules = [
  query('dictionaryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('dictionaryId must be a positive integer.')
    .toInt(),
  query('wordId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('wordId must be a positive integer.')
    .toInt(),
  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string.')
    .trim(),
];

const validateDictionaryWordAssociationIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Association id must be a positive integer.')
    .toInt(),
];

const validateUpdateDictionaryWord = [
  body('difficulty')
    .optional()
    .isInt({ min: 0, max: 2 })
    .withMessage('difficulty must be 0 (easy), 1 (medium), or 2 (hard).')
    .toInt(),
  body('isMastered')
    .optional()
    .isBoolean()
    .withMessage('isMastered must be a boolean.')
    .toBoolean(),
  body('notes')
    .optional()
    .isString()
    .withMessage('notes must be a string.')
    .isLength({ max: 255 })
    .withMessage('notes must not exceed 255 characters.')
    .trim(),
];

module.exports = {
  relationIdParam,
  wordIdParam,
  createRelationRules,
  listRelationQueryRules,
  validateDictionaryWordAssociationIdParam,
  validateUpdateDictionaryWord,
};
