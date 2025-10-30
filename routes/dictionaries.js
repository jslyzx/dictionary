const express = require('express');
const {
  getAllDictionaries,
  getDictionaryById,
  createDictionary,
  updateDictionary,
  deleteDictionary,
} = require('../controllers/dictionaryController');
const {
  dictionaryIdParam,
  createDictionaryRules,
  updateDictionaryRules,
} = require('../middleware/validateDictionary');
const validate = require('../middleware/validate');

const router = express.Router();

router.use('/:id/words', validateDictionaryIdParam, dictionaryWordsRouter);

router.get('/', getAllDictionaries);
router.get('/:id', dictionaryIdParam, validate, getDictionaryById);
router.post('/', createDictionaryRules, validate, createDictionary);
router.put('/:id', dictionaryIdParam, updateDictionaryRules, validate, updateDictionary);
router.delete('/:id', dictionaryIdParam, validate, deleteDictionary);

module.exports = router;
