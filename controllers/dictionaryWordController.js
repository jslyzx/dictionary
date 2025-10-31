const { pool, query } = require('../config/db');
const AppError = require('../utils/AppError');
const { parse } = require('csv-parse/sync');
const { stringifyCsv, normalizeHeaderName } = require('../utils/csv');

const sanitizeDbParams = (params) => params.map(param => param === undefined ? null : param);

const baseSelectColumns = `
  dw.relation_id,
  dw.dictionary_id,
  dw.word_id,
  dw.created_at,
  d.name AS dictionary_name,
  w.word AS word_text,
  w.phonetic AS word_phonetic,
  w.meaning AS word_meaning,
  w.pronunciation1 AS word_pronunciation1,
  w.pronunciation2 AS word_pronunciation2,
  w.pronunciation3 AS word_pronunciation3,
  w.difficulty AS word_difficulty,
  w.is_mastered AS word_is_mastered,
  w.notes AS word_notes
`;

const difficultyNames = {
  0: 'Easy',
  1: 'Medium',
  2: 'Hard',
};

const serializeRelation = (row) => ({
  id: row.relation_id,
  dictionaryId: row.dictionary_id,
  dictionaryName: row.dictionary_name,
  wordId: row.word_id,
  createdAt: row.created_at,
  word: {
    id: row.word_id,
    word: row.word_text,
    phonetic: row.word_phonetic,
    meaning: row.word_meaning,
    pronunciation1: row.word_pronunciation1,
    pronunciation2: row.word_pronunciation2,
    pronunciation3: row.word_pronunciation3,
    difficulty: row.word_difficulty,
    isMastered: row.word_is_mastered === 1,
    notes: row.word_notes,
  },
});

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object ?? {}, key);

const columnExists = (object, key) =>
  Object.prototype.hasOwnProperty.call(object ?? {}, key);

const getRequestFilters = (req) => req.validated?.query ?? req.query ?? {};

const buildDictionaryWordFilter = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.dictionaryId !== undefined) {
    conditions.push('dw.dictionary_id = ?');
    params.push(filters.dictionaryId);
  }

  if (filters.wordId !== undefined) {
    conditions.push('dw.word_id = ?');
    params.push(filters.wordId);
  }

  if (typeof filters.search === 'string' && filters.search.trim()) {
    const like = `%${filters.search.trim()}%`;
    conditions.push('(w.word LIKE ? OR w.meaning LIKE ? OR w.phonetic LIKE ? )');
    params.push(like, like, like);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const getValidatedBody = (req) => {
  const candidate = req.validated?.body;
  if (candidate && Object.keys(candidate).length) {
    return candidate;
  }
  return req.body ?? {};
};

const listDictionaryWords = async (req, res, next) => {
  try {
    const filters = getRequestFilters(req);
    const { whereClause, params } = buildDictionaryWordFilter(filters);

    const rows = await query(
      `SELECT ${baseSelectColumns}
         FROM dictionary_words dw
         INNER JOIN dictionaries d ON d.dictionary_id = dw.dictionary_id
         INNER JOIN words w ON w.word_id = dw.word_id
         ${whereClause}
         ORDER BY dw.created_at DESC`,
      params,
    );

    return res.json({
      success: true,
      data: rows.map(serializeRelation),
    });
  } catch (error) {
    console.error('获取词典单词列表失败:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: '数据库连接失败，请检查数据库服务是否运行',
        code: 'DB_CONNECTION_ERROR'
      });
    }
    
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
      sanitizeDbParams([dictionaryId, wordId]),
    );

    const rows = await query(
      `SELECT ${baseSelectColumns}
         FROM dictionary_words dw
         INNER JOIN dictionaries d ON d.dictionary_id = dw.dictionary_id
         INNER JOIN words w ON w.word_id = dw.word_id
         WHERE dw.relation_id = ?`,
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

const exportDictionaryWordsCsv = async (req, res, next) => {
  try {
    const filters = getRequestFilters(req);
    const { whereClause, params } = buildDictionaryWordFilter(filters);

    const rows = await query(
      `SELECT ${baseSelectColumns}
         FROM dictionary_words dw
         INNER JOIN dictionaries d ON d.dictionary_id = dw.dictionary_id
         INNER JOIN words w ON w.word_id = dw.word_id
         ${whereClause}
         ORDER BY d.name ASC, w.word ASC`,
      params,
    );

    const dataset = rows.map((row) => {
      const relation = serializeRelation(row);
      return {
        dictionaryId: relation.dictionaryId,
        dictionaryName: relation.dictionaryName,
        wordId: relation.wordId,
        word: relation.word.word,
        meaning: relation.word.meaning,
        phonetic: relation.word.phonetic,
        difficulty: relation.word.difficulty,
        mastered: relation.word.isMastered,
        createdAt: relation.createdAt,
      };
    });

    const csvColumns = [
      { key: 'dictionaryId', header: 'Dictionary ID' },
      { key: 'dictionaryName', header: 'Dictionary Name' },
      { key: 'wordId', header: 'Word ID' },
      { key: 'word', header: 'Word' },
      { key: 'meaning', header: 'Meaning' },
      { key: 'phonetic', header: 'Phonetic' },
      {
        key: 'difficulty',
        header: 'Difficulty',
        formatter: (value) => difficultyNames[value] ?? value ?? '',
      },
      {
        key: 'mastered',
        header: 'Mastered',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
      { key: 'createdAt', header: 'Added At' },
    ];

    const csvContent = stringifyCsv(csvColumns, dataset);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dictionary-words-${Date.now()}.csv"`,
    );

    return res.send(csvContent);
  } catch (error) {
    return next(error);
  }
};

const importDictionaryWordsCsv = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      throw new AppError('CSV file is required.', {
        status: 400,
        code: 'FILE_REQUIRED',
      });
    }

    let fallbackDictionaryId;
    if (columnExists(req.body, 'dictionaryId')) {
      const parsed = Number(req.body.dictionaryId);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new AppError('dictionaryId must be a positive integer.', {
          status: 400,
          code: 'INVALID_DICTIONARY_ID',
        });
      }
      fallbackDictionaryId = parsed;
    }

    let records;
    try {
      records = parse(req.file.buffer.toString('utf8'), {
        columns: (header) => header.map(normalizeHeaderName),
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      throw new AppError('Failed to parse CSV file.', {
        status: 400,
        code: 'CSV_PARSE_ERROR',
      });
    }

    if (!records.length) {
      throw new AppError('CSV file is empty.', {
        status: 400,
        code: 'CSV_EMPTY',
      });
    }

    const errors = [];
    const sanitizedRecords = [];

    records.forEach((record, index) => {
      const rowNumber = index + 2;

      let dictionaryId = fallbackDictionaryId;
      if (columnExists(record, 'dictionaryId')) {
        const parsed = Number(record.dictionaryId);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          errors.push({
            row: rowNumber,
            field: 'dictionaryId',
            message: 'dictionaryId must be a positive integer.',
          });
          return;
        }
        dictionaryId = parsed;
      }

      if (!dictionaryId) {
        errors.push({
          row: rowNumber,
          field: 'dictionaryId',
          message: 'dictionaryId is required (either in the CSV or as a form field).',
        });
        return;
      }

      let wordId;
      if (columnExists(record, 'wordId') && record.wordId !== '') {
        const parsed = Number(record.wordId);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          errors.push({
            row: rowNumber,
            field: 'wordId',
            message: 'wordId must be a positive integer.',
          });
          return;
        }
        wordId = parsed;
      }

      let wordName;
      if (!wordId) {
        if (!columnExists(record, 'word')) {
          errors.push({
            row: rowNumber,
            field: 'word',
            message: 'word is required when wordId is not provided.',
          });
          return;
        }
        const value = String(record.word ?? '').trim();
        if (!value) {
          errors.push({
            row: rowNumber,
            field: 'word',
            message: 'word must be a non-empty string.',
          });
          return;
        }
        wordName = value;
      }

      sanitizedRecords.push({
        rowNumber,
        dictionaryId,
        wordId,
        wordName,
      });
    });

    if (errors.length) {
      throw new AppError('CSV validation failed.', {
        status: 400,
        code: 'CSV_VALIDATION_FAILED',
        details: errors,
      });
    }

    const uniqueDictionaryIds = [...new Set(sanitizedRecords.map((record) => record.dictionaryId))];
    if (uniqueDictionaryIds.length) {
      const placeholders = uniqueDictionaryIds.map(() => '?').join(', ');
      const existingDictionaries = await query(
        `SELECT dictionary_id FROM dictionaries WHERE dictionary_id IN (${placeholders})`,
        uniqueDictionaryIds,
      );
      const existingDictionaryIds = new Set(
        existingDictionaries.map((row) => row.dictionary_id),
      );
      sanitizedRecords.forEach((record) => {
        if (!existingDictionaryIds.has(record.dictionaryId)) {
          errors.push({
            row: record.rowNumber,
            field: 'dictionaryId',
            message: `Dictionary ${record.dictionaryId} does not exist.`,
          });
        }
      });
    }

    const recordsWithWordId = sanitizedRecords.filter((record) => record.wordId);
    if (recordsWithWordId.length) {
      const uniqueWordIds = [...new Set(recordsWithWordId.map((record) => record.wordId))];
      const placeholders = uniqueWordIds.map(() => '?').join(', ');
      const existingWordRows = await query(
        `SELECT word_id FROM words WHERE word_id IN (${placeholders})`,
        uniqueWordIds,
      );
      const existingWordIds = new Set(existingWordRows.map((row) => row.word_id));
      recordsWithWordId.forEach((record) => {
        if (!existingWordIds.has(record.wordId)) {
          errors.push({
            row: record.rowNumber,
            field: 'wordId',
            message: `Word with id ${record.wordId} does not exist.`,
          });
        }
      });
    }

    const recordsWithWordName = sanitizedRecords.filter(
      (record) => !record.wordId && record.wordName,
    );

    if (recordsWithWordName.length) {
      const uniqueWordNames = [...new Set(recordsWithWordName.map((record) => record.wordName))];
      const placeholders = uniqueWordNames.map(() => '?').join(', ');
      const wordRows = await query(
        `SELECT word_id, word FROM words WHERE word IN (${placeholders})`,
        uniqueWordNames,
      );
      const wordMap = new Map(wordRows.map((row) => [row.word, row.word_id]));
      recordsWithWordName.forEach((record) => {
        const resolvedId = wordMap.get(record.wordName);
        if (!resolvedId) {
          errors.push({
            row: record.rowNumber,
            field: 'word',
            message: `Word "${record.wordName}" does not exist.`,
          });
        } else {
          record.wordId = resolvedId;
        }
      });
    }

    if (errors.length) {
      throw new AppError('CSV validation failed.', {
        status: 400,
        code: 'CSV_VALIDATION_FAILED',
        details: errors,
      });
    }

    let connection;
    let created = 0;
    let skipped = 0;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      for (const record of sanitizedRecords) {
        const [result] = await connection.execute(
          `INSERT INTO dictionary_words (dictionary_id, word_id) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE dictionary_id = dictionary_id`,
          [record.dictionaryId, record.wordId],
        );

        if (result.affectedRows === 1) {
          created += 1;
        } else if (result.affectedRows === 2) {
          skipped += 1;
        }
      }

      await connection.commit();

      return res.json({
        success: true,
        data: {
          totalRows: sanitizedRecords.length,
          created,
          skipped,
        },
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      throw error;
    } finally {
      connection?.release();
    }
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(
      new AppError('Failed to import dictionary words.', {
        status: 500,
        code: 'CSV_IMPORT_FAILED',
      }),
    );
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
  exportDictionaryWordsCsv,
  importDictionaryWordsCsv,
  deleteDictionaryWord,
};
