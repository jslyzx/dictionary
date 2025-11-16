const express = require('express');
const wordsRouter = require('./words');
const pronunciationRulesRouter = require('./pronunciationRules');
const sentencesRouter = require('../../routes/sentences');
const dictionariesRouter = require('../../routes/dictionaries');
const dictionaryWordsRouter = require('../../routes/dictionaryWords');
const dictionaryWordAssociationsRouter = require('../../routes/dictionaryWordAssociations');
const wordPlansRouter = require('../../routes/wordPlans');
const wordPlanDetailsRouter = require('../../routes/wordPlanDetails');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/words', wordsRouter);
router.use('/pronunciation-rules', pronunciationRulesRouter);
router.use('/sentences', sentencesRouter);
router.use('/dictionaries', dictionariesRouter);
router.use('/dictionary-words', dictionaryWordsRouter);
router.use('/dictionary-word-associations', dictionaryWordAssociationsRouter);
router.use('/word-plans', wordPlansRouter);
router.use('/word-plan-details', wordPlanDetailsRouter);

module.exports = router;
