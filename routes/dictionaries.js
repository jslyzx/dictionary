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

const router = express.Router();

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
