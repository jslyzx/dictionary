const express = require('express');
const {
  getDictionaryWords,
  addDictionaryWord,
  deleteDictionaryWord
} = require('../controllers/dictionaryWordsController');
const {
  validateWordIdParam,
  validateCreateDictionaryWord
} = require('../middleware/validateDictionaryWord');

const router = express.Router({ mergeParams: true });

router.get('/', getDictionaryWords);
router.post('/', validateCreateDictionaryWord, addDictionaryWord);
router.delete('/:wordId', validateWordIdParam, deleteDictionaryWord);

module.exports = router;
