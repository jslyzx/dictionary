const express = require('express');

const dictionariesRouter = require('./routes/dictionaries');
const dictionaryWordAssociationsRouter = require('./routes/dictionaryWordAssociations');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/dictionaries', dictionariesRouter);
app.use('/api/dictionary-words', dictionaryWordAssociationsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found.'
    }
  });
});

app.use((error, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  const status = error.status || 500;
  const message =
    status === 500 ? 'An unexpected error occurred.' : error.message;

  res.status(status).json({
    success: false,
    error: {
      message
    }
  });
});

module.exports = app;
