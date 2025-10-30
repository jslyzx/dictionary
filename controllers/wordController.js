const { pool, query } = require('../config/db');
const AppError = require('../utils/AppError');
const { parse } = require('csv-parse/sync');
const { stringifyCsv, normalizeHeaderName } = require('../utils/csv');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const baseSelectColumns = `
  w.word_id,
  w.word,
  w.phonetic,
  w.meaning,
  w.pronunciation1,
  w.pronunciation2,
  w.pronunciation3,
  w.notes,
  w.created_at,
  w.difficulty,
  w.is_mastered
`;

const difficultyLabels = {
  easy: 0,
  medium: 1,
  hard: 2,
};

const difficultyNames = {
  0: 'Easy',
  1: 'Medium',
  2: 'Hard',
};

const WORD_MAX_LENGTH = 50;
const PHONETIC_MAX_LENGTH = 100;
const MEANING_MAX_LENGTH = 255;
const PRONUNCIATION_MAX_LENGTH = 255;
const NOTES_MAX_LENGTH = 255;

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object ?? {}, key);

const toDatabaseBoolean = (value) => (value ? 1 : 0);

const getRequestFilters = (req) => req.validated?.query ?? req.query ?? {};

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

const getPagination = (filters = {}) => {
  const page = filters.page ?? DEFAULT_PAGE;
  const limit = filters.limit ?? DEFAULT_LIMIT;
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const buildFilter = (filters = {}) => {
  const conditions = [];
  const params = [];
  const joins = [];
  const search = filters.search;
  const difficulty = filters.difficulty;
  const masteryStatus = filters.masteryStatus;
  const dictionaryId = filters.dictionaryId;
  const createdAfter = filters.createdAfter;
  const createdBefore = filters.createdBefore;

  if (typeof search === 'string' && search.trim()) {
    conditions.push('(w.word LIKE ? OR w.meaning LIKE ? OR w.phonetic LIKE ?)');
    const like = `%${search.trim()}%`;
    params.push(like, like, like);
  }

  if (difficulty !== undefined) {
    conditions.push('w.difficulty = ?');
    params.push(difficulty);
  }

  if (masteryStatus !== undefined) {
    conditions.push('w.is_mastered = ?');
    params.push(toDatabaseBoolean(masteryStatus));
  }

  if (createdAfter) {
    conditions.push('w.created_at >= ?');
    params.push(createdAfter);
  }

  if (createdBefore) {
    conditions.push('w.created_at <= ?');
    params.push(createdBefore);
  }

  if (dictionaryId !== undefined) {
    joins.push('INNER JOIN dictionary_words dw ON dw.word_id = w.word_id');
    conditions.push('dw.dictionary_id = ?');
    params.push(dictionaryId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    joins,
    whereClause,
    params,
  };
};

const normalizeCsvBoolean = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (['1', 'true', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return null;
};

const normalizeCsvDifficulty = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0 && value <= 2) {
      return value;
    }
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(difficultyLabels, normalized)) {
    return difficultyLabels[normalized];
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 2) {
    return parsed;
  }

  return null;
};

const sanitizeNullableString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const columnExists = (record, key) =>
  Object.prototype.hasOwnProperty.call(record ?? {}, key);

const getWords = async (req, res, next) => {
  try {
    const filters = getRequestFilters(req);
    const { page, limit, offset } = getPagination(filters);
    const { joins, whereClause, params } = buildFilter(filters);
    const joinClause = joins.length ? ` ${joins.join(' ')}` : '';

    const rows = await query(
      `SELECT ${baseSelectColumns}
         FROM words w${joinClause}
         ${whereClause}
         ORDER BY w.word_id DESC
         LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRow] = await query(
      `SELECT COUNT(DISTINCT w.word_id) AS total
         FROM words w${joinClause}
         ${whereClause}`,
      params,
    );

    return res.json({
      success: true,
      data: {
        items: rows.map(serializeWord),
        page,
        limit,
        total: Number(countRow?.total ?? 0),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getWordStats = async (req, res, next) => {
  try {
    const filters = getRequestFilters(req);
    const { joins, whereClause, params } = buildFilter(filters);
    const joinClause = joins.length ? ` ${joins.join(' ')}` : '';

    const [statsRow = {}] = await query(
      `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN word_scope.is_mastered = 1 THEN 1 ELSE 0 END) AS masteredCount,
          SUM(CASE WHEN word_scope.difficulty = 0 THEN 1 ELSE 0 END) AS easyCount,
          SUM(CASE WHEN word_scope.difficulty = 1 THEN 1 ELSE 0 END) AS mediumCount,
          SUM(CASE WHEN word_scope.difficulty = 2 THEN 1 ELSE 0 END) AS hardCount
        FROM (
          SELECT DISTINCT w.word_id, w.is_mastered, w.difficulty
            FROM words w${joinClause}
            ${whereClause}
        ) AS word_scope`,
      params,
    );

    const total = Number(statsRow.total ?? 0);
    const masteredCount = Number(statsRow.masteredCount ?? 0);
    const easyCount = Number(statsRow.easyCount ?? 0);
    const mediumCount = Number(statsRow.mediumCount ?? 0);
    const hardCount = Number(statsRow.hardCount ?? 0);
    const unmasteredCount = Math.max(total - masteredCount, 0);

    const masteredPercentage = total
      ? Number(((masteredCount / total) * 100).toFixed(2))
      : 0;
    const unmasteredPercentage = total
      ? Number(((unmasteredCount / total) * 100).toFixed(2))
      : 0;

    return res.json({
      success: true,
      data: {
        total,
        masteredCount,
        unmasteredCount,
        masteredPercentage,
        unmasteredPercentage,
        difficulty: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const exportWordsCsv = async (req, res, next) => {
  try {
    const filters = getRequestFilters(req);
    const { joins, whereClause, params } = buildFilter(filters);
    const joinClause = joins.length ? ` ${joins.join(' ')}` : '';

    const rows = await query(
      `SELECT ${baseSelectColumns}
         FROM words w${joinClause}
         ${whereClause}
         ORDER BY w.word ASC`,
      params,
    );

    const csvColumns = [
      { key: 'word', header: 'Word' },
      { key: 'phonetic', header: 'Phonetic' },
      { key: 'meaning', header: 'Meaning' },
      {
        key: 'difficulty',
        header: 'Difficulty',
        formatter: (value) => difficultyNames[value] ?? '',
      },
      {
        key: 'isMastered',
        header: 'Mastered',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
      { key: 'createdAt', header: 'Created At' },
      { key: 'notes', header: 'Notes' },
      { key: 'pronunciation1', header: 'Pronunciation 1' },
      { key: 'pronunciation2', header: 'Pronunciation 2' },
      { key: 'pronunciation3', header: 'Pronunciation 3' },
    ];

    const csvContent = stringifyCsv(csvColumns, rows.map(serializeWord));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="words-export-${Date.now()}.csv"`,
    );

    return res.send(csvContent);
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
      if (hasOwn(body, field) && value !== undefined) {
        columns.push(field);
        values.push(value);
      }
    });

    if (hasOwn(body, 'createdAt') && body.createdAt !== undefined) {
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

const importWordsCsv = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      throw new AppError('CSV file is required.', {
        status: 400,
        code: 'FILE_REQUIRED',
      });
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
      const rowNumber = index + 2; // account for header row
      const issues = [];
      const sanitized = {
        rowNumber,
        fields: new Set(),
      };

      const wordRaw = columnExists(record, 'word') ? record.word : undefined;
      const word = typeof wordRaw === 'string' ? wordRaw.trim() : String(wordRaw ?? '').trim();
      if (!word) {
        issues.push({ field: 'word', message: 'word is required.' });
      } else if (word.length > WORD_MAX_LENGTH) {
        issues.push({
          field: 'word',
          message: `word must be ${WORD_MAX_LENGTH} characters or fewer.`,
        });
      } else {
        sanitized.word = word;
      }

      const phoneticRaw = columnExists(record, 'phonetic') ? record.phonetic : undefined;
      const phonetic = typeof phoneticRaw === 'string'
        ? phoneticRaw.trim()
        : String(phoneticRaw ?? '').trim();
      if (!phonetic) {
        issues.push({ field: 'phonetic', message: 'phonetic is required.' });
      } else if (phonetic.length > PHONETIC_MAX_LENGTH) {
        issues.push({
          field: 'phonetic',
          message: `phonetic must be ${PHONETIC_MAX_LENGTH} characters or fewer.`,
        });
      } else {
        sanitized.phonetic = phonetic;
      }

      const meaningRaw = columnExists(record, 'meaning') ? record.meaning : undefined;
      const meaning = typeof meaningRaw === 'string'
        ? meaningRaw.trim()
        : String(meaningRaw ?? '').trim();
      if (!meaning) {
        issues.push({ field: 'meaning', message: 'meaning is required.' });
      } else if (meaning.length > MEANING_MAX_LENGTH) {
        issues.push({
          field: 'meaning',
          message: `meaning must be ${MEANING_MAX_LENGTH} characters or fewer.`,
        });
      } else {
        sanitized.meaning = meaning;
      }

      const pronunciationFields = ['pronunciation1', 'pronunciation2', 'pronunciation3'];
      pronunciationFields.forEach((field) => {
        if (!columnExists(record, field)) {
          return;
        }
        const value = sanitizeNullableString(record[field]);
        if (value && value.length > PRONUNCIATION_MAX_LENGTH) {
          issues.push({
            field,
            message: `${field} must be ${PRONUNCIATION_MAX_LENGTH} characters or fewer.`,
          });
          return;
        }
        sanitized.fields.add(field);
        sanitized[field] = value;
      });

      if (columnExists(record, 'notes')) {
        const value = sanitizeNullableString(record.notes);
        if (value && value.length > NOTES_MAX_LENGTH) {
          issues.push({
            field: 'notes',
            message: `notes must be ${NOTES_MAX_LENGTH} characters or fewer.`,
          });
        } else {
          sanitized.fields.add('notes');
          sanitized.notes = value;
        }
      }

      if (columnExists(record, 'difficulty')) {
        const normalizedDifficulty = normalizeCsvDifficulty(record.difficulty);
        if (normalizedDifficulty === null) {
          issues.push({
            field: 'difficulty',
            message: 'difficulty must be 0, 1, 2 or easy/medium/hard.',
          });
        } else if (normalizedDifficulty !== undefined) {
          sanitized.fields.add('difficulty');
          sanitized.difficulty = normalizedDifficulty;
        }
      }

      if (columnExists(record, 'isMastered')) {
        const normalizedMastered = normalizeCsvBoolean(record.isMastered);
        if (normalizedMastered === null) {
          issues.push({
            field: 'isMastered',
            message: 'isMastered must be a boolean value.',
          });
        } else if (normalizedMastered !== undefined) {
          sanitized.fields.add('is_mastered');
          sanitized.isMastered = normalizedMastered;
        }
      }

      if (columnExists(record, 'createdAt')) {
        if (record.createdAt === null || record.createdAt === '') {
          sanitized.fields.add('created_at');
          sanitized.createdAt = null;
        } else {
          const date = new Date(record.createdAt);
          if (Number.isNaN(date.getTime())) {
            issues.push({
              field: 'createdAt',
              message: 'createdAt must be a valid date value.',
            });
          } else {
            sanitized.fields.add('created_at');
            sanitized.createdAt = date;
          }
        }
      }

      if (issues.length) {
        issues.forEach((issue) =>
          errors.push({ row: rowNumber, field: issue.field, message: issue.message }),
        );
        return;
      }

      sanitizedRecords.push(sanitized);
    });

    if (errors.length) {
      throw new AppError('CSV validation failed.', {
        status: 400,
        code: 'CSV_VALIDATION_FAILED',
        details: errors,
      });
    }

    const connection = await pool.getConnection();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    try {
      await connection.beginTransaction();

      for (const record of sanitizedRecords) {
        const columns = ['word', 'phonetic', 'meaning'];
        const values = [record.word, record.phonetic, record.meaning];
        const updates = [
          'phonetic = VALUES(phonetic)',
          'meaning = VALUES(meaning)',
        ];

        if (record.fields.has('pronunciation1')) {
          columns.push('pronunciation1');
          values.push(record.pronunciation1);
          updates.push('pronunciation1 = VALUES(pronunciation1)');
        }

        if (record.fields.has('pronunciation2')) {
          columns.push('pronunciation2');
          values.push(record.pronunciation2);
          updates.push('pronunciation2 = VALUES(pronunciation2)');
        }

        if (record.fields.has('pronunciation3')) {
          columns.push('pronunciation3');
          values.push(record.pronunciation3);
          updates.push('pronunciation3 = VALUES(pronunciation3)');
        }

        if (record.fields.has('notes')) {
          columns.push('notes');
          values.push(record.notes);
          updates.push('notes = VALUES(notes)');
        }

        if (record.fields.has('difficulty')) {
          columns.push('difficulty');
          values.push(record.difficulty);
          updates.push('difficulty = VALUES(difficulty)');
        }

        if (record.fields.has('is_mastered')) {
          columns.push('is_mastered');
          values.push(toDatabaseBoolean(record.isMastered));
          updates.push('is_mastered = VALUES(is_mastered)');
        }

        if (record.fields.has('created_at')) {
          columns.push('created_at');
          values.push(record.createdAt);
        }

        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO words (${columns.join(', ')}) VALUES (${placeholders})
          ON DUPLICATE KEY UPDATE ${updates.join(', ')}`;

        const [result] = await connection.execute(sql, values);
        if (result.affectedRows === 1) {
          created += 1;
        } else if (result.affectedRows === 2) {
          if (result.changedRows && result.changedRows > 0) {
            updated += 1;
          } else {
            skipped += 1;
          }
        }
      }

      await connection.commit();

      return res.json({
        success: true,
        data: {
          totalRows: sanitizedRecords.length,
          created,
          updated,
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
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(
      new AppError('Failed to import words.', {
        status: 500,
        code: 'CSV_IMPORT_FAILED',
      }),
    );
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
  getWordStats,
  exportWordsCsv,
  importWordsCsv,
  deleteWord,
};
