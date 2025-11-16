const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const AppError = require('../utils/AppError');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use((req, res, next) => {
  next(new AppError('Resource not found', { status: 404, code: 'NOT_FOUND' }));
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const response = {
    message: err.message || 'Internal Server Error',
  };

  if (err.code) {
    response.code = err.code;
  }
  if (err.details !== undefined) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
    if (err.stack) {
      response.stack = err.stack;
    }
  }

  res.status(status).json(response);
});

module.exports = app;
