const express = require('express');
const {
  getAllDictionaries,
  getDictionaryById,
  createDictionary,
  updateDictionary,
  deleteDictionary
} = require('../controllers/dictionaryController');
const {
  validateDictionaryIdParam,
  validateCreateDictionary,
  validateUpdateDictionary
} = require('../middleware/validateDictionary');
const dictionaryWordsRouter = require('./dictionaryWords');

const router = express.Router();

router.use('/:id/words', validateDictionaryIdParam, dictionaryWordsRouter);

router.get('/', getAllDictionaries);
router.get('/:id', validateDictionaryIdParam, getDictionaryById);
router.post('/', validateCreateDictionary, createDictionary);
router.put(
  '/:id',
  validateDictionaryIdParam,
  validateUpdateDictionary,
  updateDictionary
);
router.delete('/:id', validateDictionaryIdParam, deleteDictionary);

module.exports = router;
