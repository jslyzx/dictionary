const express = require('express');
const {
  getAllDictionaries,
  getDictionaryById,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  getDictionaryStats,
} = require('../controllers/dictionaryController');
const {
  getDictionaryWords,
  addDictionaryWord,
  deleteDictionaryWord,
  batchAddDictionaryWords,
} = require('../controllers/dictionaryWordsController');
const {
  dictionaryIdParam,
  createDictionaryRules,
  updateDictionaryRules,
} = require('../middleware/validateDictionary');
const {
  createDictionaryWordRelationRules,
  relationIdParam,
  wordIdParam,
  batchAddWordsRules,
} = require('../middleware/validateDictionaryWord');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', getAllDictionaries);
router.get('/:id/stats', dictionaryIdParam, validate, getDictionaryStats);
router.get('/:id', dictionaryIdParam, validate, getDictionaryById);
router.post('/', createDictionaryRules, validate, createDictionary);
router.put('/:id', dictionaryIdParam, updateDictionaryRules, validate, updateDictionary);
router.delete('/:id', dictionaryIdParam, validate, deleteDictionary);

// Dictionary word routes
router.get('/:id/words', dictionaryIdParam, validate, getDictionaryWords);
router.post('/:id/words', dictionaryIdParam, createDictionaryWordRelationRules, validate, addDictionaryWord);
router.post('/:id/words/batch', dictionaryIdParam, batchAddWordsRules, validate, batchAddDictionaryWords);
router.delete('/:id/words/:wordId', dictionaryIdParam, wordIdParam, validate, deleteDictionaryWord);

module.exports = router;
