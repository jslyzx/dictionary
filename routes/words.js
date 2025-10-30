const express = require('express');
const {
  getWords,
  getWordById,
  createWord,
  updateWord,
  deleteWord,
} = require('../controllers/wordController');
const {
  wordIdParam,
  listWordQueryRules,
  createWordRules,
  updateWordRules,
} = require('../middleware/validateWord');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', listWordQueryRules, validate, getWords);
router.get('/:id', wordIdParam, validate, getWordById);
router.post('/', createWordRules, validate, createWord);
router.put('/:id', wordIdParam, updateWordRules, validate, updateWord);
router.delete('/:id', wordIdParam, validate, deleteWord);

module.exports = router;
