const express = require('express');
const {
  listDictionaryWords,
  createDictionaryWord,
  exportDictionaryWordsCsv,
  importDictionaryWordsCsv,
  deleteDictionaryWord,
} = require('../controllers/dictionaryWordController');
const {
  relationIdParam,
  createRelationRules,
  listRelationQueryRules,
} = require('../middleware/validateDictionaryWord');
const validate = require('../middleware/validate');
const createCsvUploadMiddleware = require('../middleware/uploadCsv');

const router = express.Router();
const uploadCsv = createCsvUploadMiddleware('file');

router.get('/export', listRelationQueryRules, validate, exportDictionaryWordsCsv);
router.post('/import', uploadCsv, importDictionaryWordsCsv);
router.get('/', listRelationQueryRules, validate, listDictionaryWords);
router.post('/', createRelationRules, validate, createDictionaryWord);
router.delete('/:id', relationIdParam, validate, deleteDictionaryWord);

module.exports = router;
