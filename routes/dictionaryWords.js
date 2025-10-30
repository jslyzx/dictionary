const express = require('express');
const {
  listDictionaryWords,
  createDictionaryWord,
  deleteDictionaryWord,
} = require('../controllers/dictionaryWordController');
const {
  relationIdParam,
  createRelationRules,
  listRelationQueryRules,
} = require('../middleware/validateDictionaryWord');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', listRelationQueryRules, validate, listDictionaryWords);
router.post('/', createRelationRules, validate, createDictionaryWord);
router.delete('/:id', relationIdParam, validate, deleteDictionaryWord);

module.exports = router;
