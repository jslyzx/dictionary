const { pool, query } = require('../config/db');

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
  updatedAt: row.updated_at
});

const normalizeBoolean = (value, fallback) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'number') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y'].includes(normalized)) {
      return 1;
    }

    if (['0', 'false', 'no', 'n'].includes(normalized)) {
      return 0;
    }
  }

  return fallback;
};

const getAllDictionaries = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      data: rows.map(serializeDictionary)
    });
  } catch (error) {
    return next(error);
  }
};

const getDictionaryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries WHERE dictionary_id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Dictionary not found'
        }
      });
    }

    return res.json({
      success: true,
      data: serializeDictionary(rows[0])
    });
  } catch (error) {
    return next(error);
  }
};

const createDictionary = async (req, res, next) => {
  try {
    const { name, description, isEnabled, isMastered } = req.body;

    const dictionaryName = typeof name === 'string' ? name.trim() : name;
    const dictionaryDescription =
      description === undefined || description === null ? null : description;

    const [result] = await pool.execute(
      `INSERT INTO dictionaries (name, description, is_enabled, is_mastered)
       VALUES (?, ?, ?, ?)`,
      [
        dictionaryName,
        dictionaryDescription,
        normalizeBoolean(isEnabled, 1),
        normalizeBoolean(isMastered, 0)
      ]
    );

    const rows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries WHERE dictionary_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      data: serializeDictionary(rows[0])
    });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'A dictionary with this name already exists.'
        }
      });
    }

    return next(error);
  }
};

const updateDictionary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isEnabled, isMastered } = req.body;

    const existingRows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries WHERE dictionary_id = ?`,
      [id]
    );

    if (!existingRows.length) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Dictionary not found'
        }
      });
    }

    const existing = existingRows[0];
    const updatedName = name !== undefined ? name : existing.name;
    const updatedDescription =
      description !== undefined
        ? description === null
          ? null
          : description
        : existing.description;
    const updatedIsEnabled = normalizeBoolean(isEnabled, existing.is_enabled);
    const updatedIsMastered = normalizeBoolean(
      isMastered,
      existing.is_mastered
    );

    await pool.execute(
      `UPDATE dictionaries
         SET name = ?,
             description = ?,
             is_enabled = ?,
             is_mastered = ?
       WHERE dictionary_id = ?`,
      [
        updatedName,
        updatedDescription,
        updatedIsEnabled,
        updatedIsMastered,
        id
      ]
    );

    const updatedRows = await query(
      `SELECT ${baseSelectColumns} FROM dictionaries WHERE dictionary_id = ?`,
      [id]
    );

    return res.json({
      success: true,
      data: serializeDictionary(updatedRows[0])
    });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'A dictionary with this name already exists.'
        }
      });
    }

    return next(error);
  }
};

const deleteDictionary = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM dictionaries WHERE dictionary_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Dictionary not found'
        }
      });
    }

    return res.json({
      success: true,
      message: 'Dictionary deleted successfully.'
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
  deleteDictionary
};
