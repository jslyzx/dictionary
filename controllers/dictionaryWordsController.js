const { pool, query } = require('../config/db');

const associationSelectBase = `
  SELECT
    dw.relation_id,
    dw.dictionary_id,
    dw.word_id,
    dw.difficulty AS association_difficulty,
    dw.is_mastered AS association_is_mastered,
    dw.notes AS association_notes,
    dw.created_at AS association_created_at,
    w.word_id AS word_word_id,
    w.word AS word_text,
    w.phonetic AS word_phonetic,
    w.meaning AS word_meaning,
    w.pronunciation1 AS word_pronunciation1,
    w.pronunciation2 AS word_pronunciation2,
    w.pronunciation3 AS word_pronunciation3,
    w.created_at AS word_created_at,
    w.difficulty AS word_difficulty,
    w.is_mastered AS word_is_mastered,
    w.notes AS word_notes
  FROM dictionary_words dw
  INNER JOIN words w ON w.word_id = dw.word_id
`;

const toBooleanOrNull = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return Number(value) === 1;
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

const serializeAssociationRow = (row) => ({
  id: Number(row.relation_id),
  dictionaryId: Number(row.dictionary_id),
  wordId: Number(row.word_id),
  difficulty: toNumberOrNull(row.association_difficulty),
  isMastered: toBooleanOrNull(row.association_is_mastered),
  notes: row.association_notes ?? null,
  addedAt: row.association_created_at,
  word: {
    id: Number(row.word_word_id),
    word: row.word_text,
    phonetic: row.word_phonetic,
    meaning: row.word_meaning,
    pronunciation1: row.word_pronunciation1 ?? null,
    pronunciation2: row.word_pronunciation2 ?? null,
    pronunciation3: row.word_pronunciation3 ?? null,
    difficulty: toNumberOrNull(row.word_difficulty),
    isMastered: toBooleanOrNull(row.word_is_mastered),
    notes: row.word_notes ?? null,
    createdAt: row.word_created_at
  }
});

const getAssociationById = async (relationId) => {
  const rows = await query(
    `${associationSelectBase} WHERE dw.relation_id = ?`,
    [relationId]
  );
  return rows.length ? serializeAssociationRow(rows[0]) : null;
};

const ensureDictionaryExists = async (connection, dictionaryId) => {
  const [rows] = await connection.execute(
    'SELECT dictionary_id FROM dictionaries WHERE dictionary_id = ?',
    [dictionaryId]
  );

  if (!rows.length) {
    return false;
  }

  return true;
};

const ensureWordExists = async (connection, wordId) => {
  const [rows] = await connection.execute(
    'SELECT word_id FROM words WHERE word_id = ?',
    [wordId]
  );

  if (!rows.length) {
    return false;
  }

  return true;
};

const getDictionaryWords = async (req, res, next) => {
  try {
    const dictionaryId = req.params.id;

    const dictionaryRows = await query(
      'SELECT dictionary_id FROM dictionaries WHERE dictionary_id = ?',
      [dictionaryId]
    );

    if (!dictionaryRows.length) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Dictionary not found'
        }
      });
    }

    const rows = await query(
      `${associationSelectBase} WHERE dw.dictionary_id = ? ORDER BY dw.created_at DESC`,
      [dictionaryId]
    );

    return res.json({
      success: true,
      data: rows.map(serializeAssociationRow)
    });
  } catch (error) {
    console.error('获取词典单词关联失败:', error);
    
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

const addDictionaryWord = async (req, res, next) => {
  const dictionaryId = req.params.id;
  const { wordId, difficulty, isMastered, notes } = req.body;

  let connection;
  let transactionActive = false;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionActive = true;

    const dictionaryExists = await ensureDictionaryExists(connection, dictionaryId);
    if (!dictionaryExists) {
      await connection.rollback();
      transactionActive = false;
      return res.status(404).json({
        success: false,
        error: {
          message: 'Dictionary not found'
        }
      });
    }

    const wordExists = await ensureWordExists(connection, wordId);
    if (!wordExists) {
      await connection.rollback();
      transactionActive = false;
      return res.status(404).json({
        success: false,
        error: {
          message: 'Word not found'
        }
      });
    }

    const columns = ['dictionary_id', 'word_id'];
    const placeholders = ['?', '?'];
    const values = [dictionaryId, wordId];

    if (difficulty !== undefined) {
      columns.push('difficulty');
      placeholders.push('?');
      values.push(difficulty);
    }

    if (isMastered !== undefined) {
      columns.push('is_mastered');
      placeholders.push('?');
      values.push(isMastered);
    }

    if (notes !== undefined) {
      columns.push('notes');
      placeholders.push('?');
      values.push(notes);
    }

    const insertSql = `INSERT INTO dictionary_words (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const [result] = await connection.execute(insertSql, values);

    await connection.commit();
    transactionActive = false;

    const association = await getAssociationById(result.insertId);

    return res.status(201).json({
      success: true,
      data: association
    });
  } catch (error) {
    if (connection && transactionActive) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'The word is already associated with this dictionary.'
        }
      });
    }

    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const deleteDictionaryWord = async (req, res, next) => {
  const dictionaryId = req.params.id;
  const { wordId } = req.params;

  let connection;
  let transactionActive = false;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionActive = true;

    const dictionaryExists = await ensureDictionaryExists(connection, dictionaryId);
    if (!dictionaryExists) {
      await connection.rollback();
      transactionActive = false;
      return res.status(404).json({
        success: false,
        error: {
          message: 'Dictionary not found'
        }
      });
    }

    const wordExists = await ensureWordExists(connection, wordId);
    if (!wordExists) {
      await connection.rollback();
      transactionActive = false;
      return res.status(404).json({
        success: false,
        error: {
          message: 'Word not found'
        }
      });
    }

    const [result] = await connection.execute(
      'DELETE FROM dictionary_words WHERE dictionary_id = ? AND word_id = ?',
      [dictionaryId, wordId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      transactionActive = false;
      return res.status(404).json({
        success: false,
        error: {
          message: 'Word is not associated with this dictionary.'
        }
      });
    }

    await connection.commit();
    transactionActive = false;

    return res.json({
      success: true,
      message: 'Word removed from dictionary.'
    });
  } catch (error) {
    if (connection && transactionActive) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const updateDictionaryWord = async (req, res, next) => {
  const associationId = req.params.id;
  const { difficulty, isMastered, notes } = req.body;

  let connection;
  let transactionActive = false;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionActive = true;

    const [existingRows] = await connection.execute(
      'SELECT relation_id FROM dictionary_words WHERE relation_id = ?',
      [associationId]
    );

    if (!existingRows.length) {
      await connection.rollback();
      transactionActive = false;
      return res.status(404).json({
        success: false,
        error: {
          message: 'Dictionary word association not found'
        }
      });
    }

    const updates = [];
    const params = [];

    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      params.push(difficulty);
    }

    if (isMastered !== undefined) {
      updates.push('is_mastered = ?');
      params.push(isMastered);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (!updates.length) {
      await connection.rollback();
      transactionActive = false;
      return res.status(400).json({
        success: false,
        error: {
          message: 'No valid fields provided to update the association.'
        }
      });
    }

    await connection.execute(
      `UPDATE dictionary_words SET ${updates.join(', ')} WHERE relation_id = ?`,
      [...params, associationId]
    );

    await connection.commit();
    transactionActive = false;

    const association = await getAssociationById(associationId);

    return res.json({
      success: true,
      data: association
    });
  } catch (error) {
    if (connection && transactionActive) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const batchAddDictionaryWords = async (req, res, next) => {
  const dictionaryId = req.params.id;
  const { wordIds } = req.body;

  let connection;
  let transactionActive = false;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionActive = true;

    // Check if dictionary exists
    const dictionaryExists = await ensureDictionaryExists(connection, dictionaryId);
    if (!dictionaryExists) {
      await connection.rollback();
      transactionActive = false;
      return res.status(404).json({
        success: false,
        error: {
          message: 'Dictionary not found'
        }
      });
    }

    // Check which words exist and filter out invalid ones
    const uniqueWordIds = [...new Set(wordIds)];
    const wordIdPlaceholders = uniqueWordIds.map(() => '?').join(',');
    const [existingWordRows] = await connection.execute(
      `SELECT word_id FROM words WHERE word_id IN (${wordIdPlaceholders})`,
      uniqueWordIds
    );
    
    const existingWordIds = new Set(existingWordRows.map(row => row.word_id));
    const invalidWordIds = uniqueWordIds.filter(id => !existingWordIds.has(id));

    if (invalidWordIds.length > 0) {
      await connection.rollback();
      transactionActive = false;
      return res.status(404).json({
        success: false,
        error: {
          message: `Words not found: ${invalidWordIds.join(', ')}`
        }
      });
    }

    // Check for existing associations to avoid duplicates
    const associationPlaceholders = uniqueWordIds.map(() => '?').join(',');
    const [existingAssociationRows] = await connection.execute(
      `SELECT word_id FROM dictionary_words WHERE dictionary_id = ? AND word_id IN (${associationPlaceholders})`,
      [dictionaryId, ...uniqueWordIds]
    );
    
    const existingAssociationWordIds = new Set(existingAssociationRows.map(row => row.word_id));
    const newWordIds = uniqueWordIds.filter(id => !existingAssociationWordIds.has(id));

    let created = 0;
    let skipped = 0;

    // Batch insert new associations
    if (newWordIds.length > 0) {
      const valuePlaceholders = newWordIds.map(() => '(?, ?)').join(', ');
      const values = [];
      for (const wordId of newWordIds) {
        values.push(dictionaryId, wordId);
      }

      const [result] = await connection.execute(
        `INSERT INTO dictionary_words (dictionary_id, word_id) VALUES ${valuePlaceholders}`,
        values
      );
      
      created = result.affectedRows;
    }

    skipped = existingAssociationWordIds.size;

    await connection.commit();
    transactionActive = false;

    return res.status(201).json({
      success: true,
      data: {
        totalRequested: wordIds.length,
        uniqueWords: uniqueWordIds.length,
        created,
        skipped,
        duplicates: wordIds.length - uniqueWordIds.length,
        results: {
          created: newWordIds,
          skipped: Array.from(existingAssociationWordIds),
          invalid: invalidWordIds
        }
      }
    });
  } catch (error) {
    if (connection && transactionActive) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    console.error('批量添加词典单词失败:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: '数据库连接失败，请检查数据库服务是否运行',
        code: 'DB_CONNECTION_ERROR'
      });
    }

    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getDictionaryWords,
  addDictionaryWord,
  deleteDictionaryWord,
  updateDictionaryWord,
  batchAddDictionaryWords,
};
