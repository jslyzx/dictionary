const express = require('express');
const {
  getWords,
  getWordById,
  createWord,
  updateWord,
  deleteWord,
  getWordStats,
  exportWordsCsv,
  importWordsCsv,
} = require('../controllers/wordController');
const {
  wordIdParam,
  listWordQueryRules,
  createWordRules,
  updateWordRules,
} = require('../middleware/validateWord');
const validate = require('../middleware/validate');
const createCsvUploadMiddleware = require('../middleware/uploadCsv');

const router = express.Router();
const uploadCsv = createCsvUploadMiddleware('file');

router.get('/stats', listWordQueryRules, validate, getWordStats);
router.get('/export', listWordQueryRules, validate, exportWordsCsv);
router.post('/import', uploadCsv, importWordsCsv);
router.get('/', listWordQueryRules, validate, getWords);
router.get('/:id', wordIdParam, validate, getWordById);
router.post('/', createWordRules, validate, createWord);
router.put('/:id', wordIdParam, updateWordRules, validate, updateWord);
router.delete('/:id', wordIdParam, validate, deleteWord);

module.exports = router;
