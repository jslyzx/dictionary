const { pool, query } = require('../config/db');
const AppError = require('../utils/AppError');

const baseSelectColumns = `
  relation_id,
  dictionary_id,
  word_id,
  created_at
`;

const serializeRelation = (row) => ({
  id: row.relation_id,
  dictionaryId: row.dictionary_id,
  wordId: row.word_id,
  createdAt: row.created_at,
});

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object ?? {}, key);

const getValidatedBody = (req) => {
  const candidate = req.validated?.body;
  if (candidate && Object.keys(candidate).length) {
    return candidate;
  }
  return req.body ?? {};
};

const listDictionaryWords = async (req, res, next) => {
  try {
    const filters = [];
    const params = [];
    const queryParams = req.query ?? {};

    if (hasOwn(queryParams, 'dictionaryId')) {
      filters.push('dictionary_id = ?');
      params.push(queryParams.dictionaryId);
    }

    if (hasOwn(queryParams, 'wordId')) {
      filters.push('word_id = ?');
      params.push(queryParams.wordId);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const rows = await query(
      `SELECT ${baseSelectColumns}
         FROM dictionary_words
         ${whereClause}
         ORDER BY created_at DESC`,
      params,
    );

    return res.json({
      success: true,
      data: rows.map(serializeRelation),
    });
  } catch (error) {
    return next(error);
  }
};

const ensureDictionaryExists = async (dictionaryId) => {
  const rows = await query(
    'SELECT dictionary_id FROM dictionaries WHERE dictionary_id = ?',
    [dictionaryId],
  );

  if (!rows.length) {
    throw new AppError('Dictionary not found.', {
      status: 404,
      code: 'DICTIONARY_NOT_FOUND',
    });
  }
};

const ensureWordExists = async (wordId) => {
  const rows = await query(
    'SELECT word_id FROM words WHERE word_id = ?',
    [wordId],
  );

  if (!rows.length) {
    throw new AppError('Word not found.', {
      status: 404,
      code: 'WORD_NOT_FOUND',
    });
  }
};

const createDictionaryWord = async (req, res, next) => {
  try {
    const body = getValidatedBody(req);
    const { dictionaryId, wordId } = body;

    await ensureDictionaryExists(dictionaryId);
    await ensureWordExists(wordId);

    const [result] = await pool.execute(
      'INSERT INTO dictionary_words (dictionary_id, word_id) VALUES (?, ?)',
      [dictionaryId, wordId],
    );

    const rows = await query(
      `SELECT ${baseSelectColumns} FROM dictionary_words WHERE relation_id = ?`,
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      data: serializeRelation(rows[0]),
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return next(
        new AppError('The word is already associated with this dictionary.', {
          status: 409,
          code: 'ASSOCIATION_ALREADY_EXISTS',
        }),
      );
    }

    return next(error);
  }
};

const relationIdFromRequest = (req) => {
  if (req.validated?.params?.id !== undefined) {
    return req.validated.params.id;
  }

  const parsed = Number(req.params.id);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const deleteDictionaryWord = async (req, res, next) => {
  try {
    const relationId = relationIdFromRequest(req);

    const [result] = await pool.execute(
      'DELETE FROM dictionary_words WHERE relation_id = ?',
      [relationId],
    );

    if (result.affectedRows === 0) {
      throw new AppError('Association not found.', {
        status: 404,
        code: 'ASSOCIATION_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      message: 'Association removed successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listDictionaryWords,
  createDictionaryWord,
  deleteDictionaryWord,
};
