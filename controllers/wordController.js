const { pool, query } = require('../config/db');
const AppError = require('../utils/AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const baseSelectColumns = `
  word_id,
  word,
  phonetic,
  meaning,
  pronunciation1,
  pronunciation2,
  pronunciation3,
  notes,
  created_at,
  difficulty,
  is_mastered
`;

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object ?? {}, key);

const toDatabaseBoolean = (value) => (value ? 1 : 0);

const getValidatedBody = (req) => {
  const candidate = req.validated?.body;
  if (candidate && Object.keys(candidate).length) {
    return candidate;
  }
  return req.body ?? {};
};

const serializeWord = (row) => ({
  id: row.word_id,
  word: row.word,
  phonetic: row.phonetic,
  meaning: row.meaning,
  pronunciation1: row.pronunciation1,
  pronunciation2: row.pronunciation2,
  pronunciation3: row.pronunciation3,
  notes: row.notes,
  createdAt: row.created_at,
  difficulty: row.difficulty,
  isMastered: row.is_mastered === 1,
});

const getPagination = (req) => {
  const page = req.query?.page ?? DEFAULT_PAGE;
  const limit = req.query?.limit ?? DEFAULT_LIMIT;
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const buildFilter = (req) => {
  const conditions = [];
  const params = [];
  const search = req.query?.search;
  const difficulty = req.query?.difficulty;
  const masteryStatus = req.query?.masteryStatus;

  if (typeof search === 'string' && search.trim()) {
    conditions.push('(word LIKE ? OR meaning LIKE ? OR phonetic LIKE ?)');
    const like = `%${search.trim()}%`;
    params.push(like, like, like);
  }

  if (difficulty !== undefined) {
    conditions.push('difficulty = ?');
    params.push(difficulty);
  }

  if (masteryStatus !== undefined) {
    conditions.push('is_mastered = ?');
    params.push(toDatabaseBoolean(masteryStatus));
  }

  if (!conditions.length) {
    return { clause: '', params };
  }

  return {
    clause: `WHERE ${conditions.join(' AND ')}`,
    params,
  };
};

const getWords = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const { clause, params } = buildFilter(req);

    const rows = await query(
      `SELECT ${baseSelectColumns}
         FROM words
         ${clause}
         ORDER BY word_id DESC
         LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM words ${clause}`,
      params,
    );

    return res.json({
      success: true,
      data: {
        items: rows.map(serializeWord),
        page,
        limit,
        total: countRow.total ?? 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getWordIdFromRequest = (req) => {
  if (req.validated?.params?.id !== undefined) {
    return req.validated.params.id;
  }

  const parsed = Number(req.params.id);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getWordById = async (req, res, next) => {
  try {
    const wordId = getWordIdFromRequest(req);

    const rows = await query(
      `SELECT ${baseSelectColumns} FROM words WHERE word_id = ?`,
      [wordId],
    );

    if (!rows.length) {
      throw new AppError('Word not found.', {
        status: 404,
        code: 'WORD_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      data: serializeWord(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

const createWord = async (req, res, next) => {
  try {
    const body = getValidatedBody(req);

    const difficulty = hasOwn(body, 'difficulty') ? body.difficulty : 0;
    const isMastered = hasOwn(body, 'isMastered') ? body.isMastered : false;

    const columns = ['word', 'phonetic', 'meaning', 'difficulty', 'is_mastered'];
    const values = [
      body.word,
      body.phonetic,
      body.meaning,
      difficulty,
      toDatabaseBoolean(isMastered),
    ];

    const optionalFields = [
      ['pronunciation1', body.pronunciation1],
      ['pronunciation2', body.pronunciation2],
      ['pronunciation3', body.pronunciation3],
      ['notes', body.notes],
    ];

    optionalFields.forEach(([field, value]) => {
      if (hasOwn(body, field)) {
        columns.push(field);
        values.push(value);
      }
    });

    if (hasOwn(body, 'createdAt')) {
      columns.push('created_at');
      values.push(body.createdAt);
    }

    const placeholders = columns.map(() => '?').join(', ');

    const [result] = await pool.execute(
      `INSERT INTO words (${columns.join(', ')}) VALUES (${placeholders})`,
      values,
    );

    const rows = await query(
      `SELECT ${baseSelectColumns} FROM words WHERE word_id = ?`,
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      data: serializeWord(rows[0]),
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return next(
        new AppError('A word with this spelling already exists.', {
          status: 409,
          code: 'WORD_ALREADY_EXISTS',
        }),
      );
    }

    return next(error);
  }
};

const updateWord = async (req, res, next) => {
  try {
    const wordId = getWordIdFromRequest(req);
    const body = getValidatedBody(req);

    const existingRows = await query(
      `SELECT ${baseSelectColumns} FROM words WHERE word_id = ?`,
      [wordId],
    );

    if (!existingRows.length) {
      throw new AppError('Word not found.', {
        status: 404,
        code: 'WORD_NOT_FOUND',
      });
    }

    const updates = [];
    const params = [];

    if (hasOwn(body, 'word')) {
      updates.push('word = ?');
      params.push(body.word);
    }

    if (hasOwn(body, 'phonetic')) {
      updates.push('phonetic = ?');
      params.push(body.phonetic);
    }

    if (hasOwn(body, 'meaning')) {
      updates.push('meaning = ?');
      params.push(body.meaning);
    }

    if (hasOwn(body, 'pronunciation1')) {
      updates.push('pronunciation1 = ?');
      params.push(body.pronunciation1);
    }

    if (hasOwn(body, 'pronunciation2')) {
      updates.push('pronunciation2 = ?');
      params.push(body.pronunciation2);
    }

    if (hasOwn(body, 'pronunciation3')) {
      updates.push('pronunciation3 = ?');
      params.push(body.pronunciation3);
    }

    if (hasOwn(body, 'notes')) {
      updates.push('notes = ?');
      params.push(body.notes);
    }

    if (hasOwn(body, 'difficulty')) {
      updates.push('difficulty = ?');
      params.push(body.difficulty);
    }

    if (hasOwn(body, 'isMastered')) {
      updates.push('is_mastered = ?');
      params.push(toDatabaseBoolean(body.isMastered));
    }

    if (hasOwn(body, 'createdAt')) {
      updates.push('created_at = ?');
      params.push(body.createdAt);
    }

    if (!updates.length) {
      throw new AppError('No valid fields provided for update.', {
        status: 400,
        code: 'INVALID_UPDATE',
      });
    }

    params.push(wordId);

    await pool.execute(
      `UPDATE words
         SET ${updates.join(', ')}
       WHERE word_id = ?`,
      params,
    );

    const rows = await query(
      `SELECT ${baseSelectColumns} FROM words WHERE word_id = ?`,
      [wordId],
    );

    return res.json({
      success: true,
      data: serializeWord(rows[0]),
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return next(
        new AppError('A word with this spelling already exists.', {
          status: 409,
          code: 'WORD_ALREADY_EXISTS',
        }),
      );
    }

    return next(error);
  }
};

const deleteWord = async (req, res, next) => {
  try {
    const wordId = getWordIdFromRequest(req);

    const [result] = await pool.execute(
      'DELETE FROM words WHERE word_id = ?',
      [wordId],
    );

    if (result.affectedRows === 0) {
      throw new AppError('Word not found.', {
        status: 404,
        code: 'WORD_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      message: 'Word deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWords,
  getWordById,
  createWord,
  updateWord,
  deleteWord,
};
