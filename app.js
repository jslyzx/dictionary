const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');

const dictionariesRouter = require('./routes/dictionaries');
const wordsRouter = require('./routes/words');
const dictionaryWordsRouter = require('./routes/dictionaryWords');
const dictionaryWordAssociationsRouter = require('./routes/dictionaryWordAssociations');
const pronunciationRulesRouter = require('./routes/pronunciationRules');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger UI - API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/dictionaries', dictionariesRouter);
app.use('/api/words', wordsRouter);
app.use('/api/dictionary-words', dictionaryWordsRouter);
app.use('/api/dictionary-word-associations', dictionaryWordAssociationsRouter);
app.use('/api/pronunciation-rules', pronunciationRulesRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
