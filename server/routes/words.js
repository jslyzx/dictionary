const express = require('express');
const {
  getWords,
  getWordById,
  createWord,
  updateWord,
  deleteWord,
} = require('../controllers/wordsController');
const { getWordSentences } = require('../../controllers/sentenceController');

const router = express.Router();

router.get('/', getWords);
router.get('/:id', getWordById);
router.get('/:id/sentences', getWordSentences);
router.post('/', createWord);
router.put('/:id', updateWord);
router.delete('/:id', deleteWord);

module.exports = router;
