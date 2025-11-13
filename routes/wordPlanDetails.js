const express = require('express');
const {
  addWordToPlan,
  removeWordFromPlan,
  getPlanWords,
  recordLearning,
  getLearningStats
} = require('../controllers/wordPlanDetailController');

const router = express.Router();

// 获取计划的单词列表
router.get('/:planId/words', getPlanWords);

// 向计划中添加单词
router.post('/:planId/words', addWordToPlan);

// 从计划中移除单词
router.delete('/:planId/words/:wordId', removeWordFromPlan);

// 记录学习结果
router.post('/:planId/learning-records', recordLearning);

// 获取学习统计
router.get('/:planId/stats', getLearningStats);

module.exports = router;