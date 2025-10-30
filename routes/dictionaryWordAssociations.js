const express = require('express');
const { updateDictionaryWord } = require('../controllers/dictionaryWordsController');
const {
  validateDictionaryWordAssociationIdParam,
  validateUpdateDictionaryWord
} = require('../middleware/validateDictionaryWord');

const router = express.Router();

router.put(
  '/:id',
  validateDictionaryWordAssociationIdParam,
  validateUpdateDictionaryWord,
  updateDictionaryWord
);

module.exports = router;
