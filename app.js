const express = require('express');

const dictionariesRouter = require('./routes/dictionaries');
const wordsRouter = require('./routes/words');
const dictionaryWordsRouter = require('./routes/dictionaryWords');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/dictionaries', dictionariesRouter);
app.use('/api/words', wordsRouter);
app.use('/api/dictionary-words', dictionaryWordsRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
