const { body, param, query } = require('express-validator');

const relationIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Relation id must be a positive integer.')
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

module.exports = {
  relationIdParam,
  createRelationRules,
  listRelationQueryRules,
};
