const { pool, query } = require('../config/db');
const AppError = require('../utils/AppError');

const baseSelectColumns = `
  dictionary_id,
  name,
  description,
  is_enabled,
  is_mastered,
  created_at,
  updated_at
`;

const serializeDictionary = (row) => ({
  id: row.dictionary_id,
  name: row.name,
  description: row.description,
  isEnabled: row.is_enabled === 1,
  isMastered: row.is_mastered === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object ?? {}, key);

const toDatabaseBoolean = (value, fallback) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  return value ? 1 : 0;
};

const getValidatedBody = (req) => {
  const candidate = req.validated?.body;
  if (candidate && Object.keys(candidate).length) {
    return candidate;
  }
  return req.body ?? {};
};

const getDictionaryIdFromRequest = (req) => {
  if (req.validated?.params?.id !== undefined) {
    return req.validated.params.id;
  }

  const parsed = Number(req.params.id);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getAllDictionaries = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries ORDER BY created_at DESC`,
    );

    // Get word counts for each dictionary
    const dictionariesWithCounts = await Promise.all(
      rows.map(async (row) => {
        const [countRow = {}] = await query(
          'SELECT COUNT(*) as wordCount FROM dictionary_words WHERE dictionary_id = ?',
          [row.dictionary_id]
        );
        
        return {
          ...serializeDictionary(row),
          wordCount: Number(countRow.wordCount ?? 0)
        };
      })
    );

    return res.json({
      success: true,
      data: dictionariesWithCounts,
    });
  } catch (error) {
    console.error('获取词典列表失败:', error);
    
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

const getDictionaryById = async (req, res, next) => {
  try {
    const dictionaryId = getDictionaryIdFromRequest(req);

    const rows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries WHERE dictionary_id = ?`,
      [dictionaryId],
    );

    if (!rows.length) {
      throw new AppError('Dictionary not found.', {
        status: 404,
        code: 'DICTIONARY_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      data: serializeDictionary(rows[0]),
    });
  } catch (error) {
    console.error('获取词典详情失败:', error);
    
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

const createDictionary = async (req, res, next) => {
  try {
    const body = getValidatedBody(req);
    const name = body.name;
    const description = hasOwn(body, 'description') ? (body.description ?? null) : null;
    const isEnabled = hasOwn(body, 'isEnabled') && body.isEnabled !== undefined
      ? toDatabaseBoolean(body.isEnabled)
      : 1;
    const isMastered = hasOwn(body, 'isMastered') && body.isMastered !== undefined
      ? toDatabaseBoolean(body.isMastered)
      : 0;

    const [result] = await pool.execute(
      `INSERT INTO dictionaries (name, description, is_enabled, is_mastered)
       VALUES (?, ?, ?, ?)`,
      [name, description, isEnabled, isMastered],
    );

    const rows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries WHERE dictionary_id = ?`,
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      data: serializeDictionary(rows[0]),
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return next(
        new AppError('A dictionary with this name already exists.', {
          status: 409,
          code: 'DICTIONARY_ALREADY_EXISTS',
        }),
      );
    }

    return next(error);
  }
};

const updateDictionary = async (req, res, next) => {
  try {
    const dictionaryId = getDictionaryIdFromRequest(req);
    const body = getValidatedBody(req);

    const existingRows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries WHERE dictionary_id = ?`,
      [dictionaryId],
    );

    if (!existingRows.length) {
      throw new AppError('Dictionary not found.', {
        status: 404,
        code: 'DICTIONARY_NOT_FOUND',
      });
    }

    const updates = [];
    const params = [];

    if (hasOwn(body, 'name')) {
      updates.push('name = ?');
      params.push(body.name);
    }

    if (hasOwn(body, 'description')) {
      updates.push('description = ?');
      params.push(body.description ?? null);
    }

    if (hasOwn(body, 'isEnabled') && body.isEnabled !== undefined) {
      updates.push('is_enabled = ?');
      params.push(toDatabaseBoolean(body.isEnabled));
    }

    if (hasOwn(body, 'isMastered') && body.isMastered !== undefined) {
      updates.push('is_mastered = ?');
      params.push(toDatabaseBoolean(body.isMastered));
    }

    if (!updates.length) {
      throw new AppError('No valid fields provided for update.', {
        status: 400,
        code: 'INVALID_UPDATE',
      });
    }

    params.push(dictionaryId);

    await pool.execute(
      `UPDATE dictionaries
         SET ${updates.join(', ')}
       WHERE dictionary_id = ?`,
      params,
    );

    const updatedRows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries WHERE dictionary_id = ?`,
      [dictionaryId],
    );

    return res.json({
      success: true,
      data: serializeDictionary(updatedRows[0]),
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return next(
        new AppError('A dictionary with this name already exists.', {
          status: 409,
          code: 'DICTIONARY_ALREADY_EXISTS',
        }),
      );
    }

    return next(error);
  }
};

const deleteDictionary = async (req, res, next) => {
  try {
    const dictionaryId = getDictionaryIdFromRequest(req);

    const [result] = await pool.execute(
      'DELETE FROM dictionaries WHERE dictionary_id = ?',
      [dictionaryId],
    );

    if (result.affectedRows === 0) {
      throw new AppError('Dictionary not found.', {
        status: 404,
        code: 'DICTIONARY_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      message: 'Dictionary deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

const getDictionaryStats = async (req, res, next) => {
  try {
    const dictionaryId = getDictionaryIdFromRequest(req);

    const dictionaryRows = await query(
      'SELECT dictionary_id, name FROM dictionaries WHERE dictionary_id = ?',
      [dictionaryId],
    );

    if (!dictionaryRows.length) {
      throw new AppError('Dictionary not found.', {
        status: 404,
        code: 'DICTIONARY_NOT_FOUND',
      });
    }

    const dictionary = dictionaryRows[0];

    const [statsRow = {}] = await query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN w.is_mastered = 1 THEN 1 ELSE 0 END) AS masteredCount,
         SUM(CASE WHEN w.difficulty = 0 THEN 1 ELSE 0 END) AS easyCount,
         SUM(CASE WHEN w.difficulty = 1 THEN 1 ELSE 0 END) AS mediumCount,
         SUM(CASE WHEN w.difficulty = 2 THEN 1 ELSE 0 END) AS hardCount
       FROM dictionary_words dw
       INNER JOIN words w ON w.word_id = dw.word_id
       WHERE dw.dictionary_id = ?`,
      [dictionaryId],
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
        dictionaryId: dictionary.dictionary_id,
        name: dictionary.name,
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

module.exports = {
  getAllDictionaries,
  getDictionaryById,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  getDictionaryStats,
};
