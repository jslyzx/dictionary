const express = require('express');
const wordsRouter = require('./words');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


router.use('/words', wordsRouter);
module.exports = router;
