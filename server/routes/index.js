const express = require('express');
const wordsRouter = require('./words');
const pronunciationRulesRouter = require('./pronunciationRules');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


router.use('/words', wordsRouter);
router.use('/pronunciation-rules', pronunciationRulesRouter);
module.exports = router;
