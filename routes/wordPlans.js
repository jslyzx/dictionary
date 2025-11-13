const express = require('express');
const {
  getWordPlans,
  getWordPlan,
  createWordPlan,
  updateWordPlan,
  deleteWordPlan,
  activateWordPlan,
  getActiveWordPlan
} = require('../controllers/wordPlanController');

const router = express.Router();

// 获取所有单词计划
router.get('/', getWordPlans);

// 获取活跃计划
router.get('/active', getActiveWordPlan);

// 获取单个单词计划详情
router.get('/:id', getWordPlan);

// 创建单词计划
router.post('/', createWordPlan);

// 更新单词计划
router.put('/:id', updateWordPlan);

// 删除单词计划
router.delete('/:id', deleteWordPlan);

// 激活单词计划
router.put('/:id/activate', activateWordPlan);

module.exports = router;