const express = require('express');
const {
  getPronunciationRules,
  getPronunciationRuleById,
  getPronunciationRulesByCombination,
  getWordsUsingRule,
  createPronunciationRule,
  updatePronunciationRule,
  deletePronunciationRule,
  getWordPronunciationRules,
  addWordPronunciationRules,
  removeWordPronunciationRule,
} = require('../controllers/pronunciationRuleController');

const router = express.Router();

console.log('Pronunciation rules route loaded');

// 发音规则基础路由
router.get('/', (req, res, next) => {
  console.log('GET /api/pronunciation-rules called');
  next();
}, getPronunciationRules);
router.get('/:id', getPronunciationRuleById);
router.post('/', createPronunciationRule);
router.put('/:id', updatePronunciationRule);
router.delete('/:id', deletePronunciationRule);

// 特殊查询路由
router.get('/by-combination/:letterCombination', getPronunciationRulesByCombination);
router.get('/:id/words', getWordsUsingRule);

// 单词-发音规则关联路由
router.get('/words/:wordId/pronunciation-rules', getWordPronunciationRules);
router.post('/words/:wordId/pronunciation-rules', addWordPronunciationRules);
router.delete('/words/:wordId/pronunciation-rules/:ruleId', removeWordPronunciationRule);

module.exports = router;