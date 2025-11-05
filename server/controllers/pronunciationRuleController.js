const pool = require('../config/db');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const getFirstDefined = (source, keys) => {
  if (!source || typeof source !== 'object') {
    return undefined;
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      return source[key];
    }
  }
  return undefined;
};

const parsePositiveInteger = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const parseLimit = (value) => {
  const parsed = parsePositiveInteger(value, DEFAULT_LIMIT);
  if (parsed === null) {
    return null;
  }
  return Math.min(parsed, MAX_LIMIT);
};

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const sanitizeRequiredString = (value, fieldName, maxLength = null) => {
  if (typeof value !== 'string') {
    throw createHttpError(400, `${fieldName} is required`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw createHttpError(400, `${fieldName} is required`);
  }
  if (maxLength && trimmed.length > maxLength) {
    throw createHttpError(400, `${fieldName} must be less than ${maxLength} characters`);
  }
  return trimmed;
};

const sanitizeOptionalString = (value, fieldName, maxLength = null) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  if (maxLength && trimmed.length > maxLength) {
    throw createHttpError(400, `${fieldName} must be less than ${maxLength} characters`);
  }
  return trimmed === '' ? null : trimmed;
};

const parseOptionalInteger = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
};

// 获取发音规则列表
const getPronunciationRules = async (req, res, next) => {
  try {
    const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
    if (page === null) {
      throw createHttpError(400, 'page must be a positive integer');
    }

    const limit = parseLimit(req.query.limit);
    if (limit === null) {
      throw createHttpError(400, 'limit must be a positive integer');
    }

    const searchInput = getFirstDefined(req.query, ['search']);
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    const searchTerm = typeof searchInput === 'string' ? searchInput.trim() : '';
    if (searchTerm) {
      const likePattern = `%${searchTerm}%`;
      conditions.push('(letter_combination LIKE ? OR pronunciation LIKE ? OR rule_description LIKE ?)');
      params.push(likePattern, likePattern, likePattern);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT id, letter_combination, pronunciation, rule_description, created_at, updated_at,
              (SELECT COUNT(*) FROM word_pronunciation_rules wpr WHERE wpr.pronunciation_rule_id = pronunciation_rules.id) as word_count
       FROM pronunciation_rules ${whereClause} 
       ORDER BY letter_combination ASC, pronunciation ASC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM pronunciation_rules ${whereClause}`,
      params,
    );

    res.status(200).json({
      items: rows,
      page,
      limit,
      total: countResult[0].total,
    });
  } catch (error) {
    next(error);
  }
};

// 根据ID获取单个发音规则
const getPronunciationRuleById = async (req, res, next) => {
  try {
    const ruleId = parseId(req.params.id);
    if (!ruleId) {
      throw createHttpError(400, 'Invalid pronunciation rule id');
    }

    const [rows] = await pool.execute(
      `SELECT id, letter_combination, pronunciation, rule_description, created_at, updated_at,
              (SELECT COUNT(*) FROM word_pronunciation_rules wpr WHERE wpr.pronunciation_rule_id = pronunciation_rules.id) as word_count
       FROM pronunciation_rules WHERE id = ?`,
      [ruleId],
    );

    if (rows.length === 0) {
      throw createHttpError(404, 'Pronunciation rule not found');
    }

    res.status(200).json({ item: rows[0] });
  } catch (error) {
    next(error);
  }
};

// 根据字母组合获取发音规则
const getPronunciationRulesByCombination = async (req, res, next) => {
  try {
    const letterCombination = req.params.letterCombination;
    if (!letterCombination || typeof letterCombination !== 'string') {
      throw createHttpError(400, 'Letter combination is required');
    }

    const [rows] = await pool.execute(
      `SELECT id, letter_combination, pronunciation, rule_description, created_at, updated_at,
              (SELECT COUNT(*) FROM word_pronunciation_rules wpr WHERE wpr.pronunciation_rule_id = pronunciation_rules.id) as word_count
       FROM pronunciation_rules 
       WHERE letter_combination = ?
       ORDER BY pronunciation ASC`,
      [letterCombination.trim()],
    );

    res.status(200).json({ items: rows });
  } catch (error) {
    next(error);
  }
};

// 获取使用指定发音规则的单词列表
const getWordsUsingRule = async (req, res, next) => {
  try {
    const ruleId = parseId(req.params.id);
    if (!ruleId) {
      throw createHttpError(400, 'Invalid pronunciation rule id');
    }

    const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
    if (page === null) {
      throw createHttpError(400, 'page must be a positive integer');
    }

    const limit = parseLimit(req.query.limit);
    if (limit === null) {
      throw createHttpError(400, 'limit must be a positive integer');
    }

    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT w.word_id, w.word, w.phonetic, w.meaning, w.difficulty, w.is_mastered,
              wpr.position_in_word, wpr.created_at as rule_added_at
       FROM words w
       INNER JOIN word_pronunciation_rules wpr ON w.word_id = wpr.word_id
       WHERE wpr.pronunciation_rule_id = ?
       ORDER BY w.word ASC
       LIMIT ? OFFSET ?`,
      [ruleId, limit, offset],
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM words w
       INNER JOIN word_pronunciation_rules wpr ON w.word_id = wpr.word_id
       WHERE wpr.pronunciation_rule_id = ?`,
      [ruleId],
    );

    res.status(200).json({
      items: rows,
      page,
      limit,
      total: countResult[0].total,
    });
  } catch (error) {
    next(error);
  }
};

// 创建发音规则
const createPronunciationRule = async (req, res, next) => {
  try {
    const letterCombinationInput = getFirstDefined(req.body, ['letter_combination', 'letterCombination']);
    const pronunciationInput = getFirstDefined(req.body, ['pronunciation']);
    const ruleDescriptionInput = getFirstDefined(req.body, ['rule_description', 'ruleDescription']);

    const letterCombination = sanitizeRequiredString(letterCombinationInput, 'letter_combination', 50);
    const pronunciation = sanitizeRequiredString(pronunciationInput, 'pronunciation', 100);
    const ruleDescription = sanitizeOptionalString(ruleDescriptionInput, 'rule_description');

    const [result] = await pool.execute(
      'INSERT INTO pronunciation_rules (letter_combination, pronunciation, rule_description) VALUES (?, ?, ?)',
      [letterCombination, pronunciation, ruleDescription],
    );

    const [rows] = await pool.execute(
      `SELECT id, letter_combination, pronunciation, rule_description, created_at, updated_at,
              0 as word_count
       FROM pronunciation_rules WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({ item: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createHttpError(409, 'Pronunciation rule already exists'));
      return;
    }
    next(error);
  }
};

// 更新发音规则
const updatePronunciationRule = async (req, res, next) => {
  try {
    const ruleId = parseId(req.params.id);
    if (!ruleId) {
      throw createHttpError(400, 'Invalid pronunciation rule id');
    }

    const letterCombinationInput = getFirstDefined(req.body, ['letter_combination', 'letterCombination']);
    const pronunciationInput = getFirstDefined(req.body, ['pronunciation']);
    const ruleDescriptionInput = getFirstDefined(req.body, ['rule_description', 'ruleDescription']);

    const updates = [];
    const values = [];

    if (letterCombinationInput !== undefined) {
      const letterCombination = sanitizeOptionalString(letterCombinationInput, 'letter_combination', 50);
      if (letterCombination === null || letterCombination === '') {
        throw createHttpError(400, 'letter_combination cannot be empty');
      }
      updates.push('letter_combination = ?');
      values.push(letterCombination);
    }

    if (pronunciationInput !== undefined) {
      const pronunciation = sanitizeOptionalString(pronunciationInput, 'pronunciation', 100);
      if (pronunciation === null || pronunciation === '') {
        throw createHttpError(400, 'pronunciation cannot be empty');
      }
      updates.push('pronunciation = ?');
      values.push(pronunciation);
    }

    if (ruleDescriptionInput !== undefined) {
      const ruleDescription = sanitizeOptionalString(ruleDescriptionInput, 'rule_description');
      updates.push('rule_description = ?');
      values.push(ruleDescription);
    }

    if (updates.length === 0) {
      throw createHttpError(400, 'No valid fields provided for update');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(ruleId);

    const [result] = await pool.execute(
      `UPDATE pronunciation_rules SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, 'Pronunciation rule not found');
    }

    const [rows] = await pool.execute(
      `SELECT id, letter_combination, pronunciation, rule_description, created_at, updated_at,
              (SELECT COUNT(*) FROM word_pronunciation_rules wpr WHERE wpr.pronunciation_rule_id = pronunciation_rules.id) as word_count
       FROM pronunciation_rules WHERE id = ?`,
      [ruleId],
    );

    res.status(200).json({ item: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createHttpError(409, 'Pronunciation rule already exists'));
      return;
    }
    next(error);
  }
};

// 删除发音规则
const deletePronunciationRule = async (req, res, next) => {
  try {
    const ruleId = parseId(req.params.id);
    if (!ruleId) {
      throw createHttpError(400, 'Invalid pronunciation rule id');
    }

    const [result] = await pool.execute(
      'DELETE FROM pronunciation_rules WHERE id = ?',
      [ruleId],
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, 'Pronunciation rule not found');
    }

    res.status(200).json({ message: 'Pronunciation rule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 获取单词的发音规则
const getWordPronunciationRules = async (req, res, next) => {
  try {
    const wordId = parseId(req.params.wordId);
    if (!wordId) {
      throw createHttpError(400, 'Invalid word id');
    }

    const [rows] = await pool.execute(
      `SELECT pr.id, pr.letter_combination, pr.pronunciation, pr.rule_description,
              wpr.position_in_word, wpr.created_at as rule_associated_at
       FROM pronunciation_rules pr
       INNER JOIN word_pronunciation_rules wpr ON pr.id = wpr.pronunciation_rule_id
       WHERE wpr.word_id = ?
       ORDER BY pr.letter_combination ASC, pr.pronunciation ASC`,
      [wordId],
    );

    res.status(200).json({ items: rows });
  } catch (error) {
    next(error);
  }
};

// 为单词添加发音规则关联
const addWordPronunciationRules = async (req, res, next) => {
  try {
    const wordId = parseId(req.params.wordId);
    if (!wordId) {
      throw createHttpError(400, 'Invalid word id');
    }

    const { pronunciationRuleIds, positionInWord } = req.body;

    if (!Array.isArray(pronunciationRuleIds) || pronunciationRuleIds.length === 0) {
      throw createHttpError(400, 'pronunciationRuleIds must be a non-empty array');
    }

    // 验证所有规则ID都是有效的
    const validRuleIds = [];
    for (const ruleId of pronunciationRuleIds) {
      const parsedId = parseId(ruleId);
      if (!parsedId) {
        throw createHttpError(400, `Invalid pronunciation rule id: ${ruleId}`);
      }
      validRuleIds.push(parsedId);
    }

    // 验证单词是否存在
    const [wordCheck] = await pool.execute('SELECT word_id FROM words WHERE word_id = ?', [wordId]);
    if (wordCheck.length === 0) {
      throw createHttpError(404, 'Word not found');
    }

    // 验证所有发音规则是否存在
    const [ruleCheck] = await pool.execute(
      `SELECT id FROM pronunciation_rules WHERE id IN (?)`,
      [validRuleIds],
    );
    if (ruleCheck.length !== validRuleIds.length) {
      throw createHttpError(404, 'One or more pronunciation rules not found');
    }

    // 批量插入关联关系（忽略已存在的关联）
    const insertValues = validRuleIds.map(ruleId => [wordId, ruleId, positionInWord || null]);
    const placeholders = insertValues.map(() => '(?, ?, ?)').join(', ');
    const flatValues = insertValues.flat();

    const [result] = await pool.execute(
      `INSERT IGNORE INTO word_pronunciation_rules (word_id, pronunciation_rule_id, position_in_word) 
       VALUES ${placeholders}`,
      flatValues,
    );

    // 获取更新后的关联列表
    const [rows] = await pool.execute(
      `SELECT pr.id, pr.letter_combination, pr.pronunciation, pr.rule_description,
              wpr.position_in_word, wpr.created_at as rule_associated_at
       FROM pronunciation_rules pr
       INNER JOIN word_pronunciation_rules wpr ON pr.id = wpr.pronunciation_rule_id
       WHERE wpr.word_id = ?
       ORDER BY pr.letter_combination ASC, pr.pronunciation ASC`,
      [wordId],
    );

    res.status(200).json({ 
      message: `Added ${result.affectedRows} pronunciation rule associations`,
      items: rows 
    });
  } catch (error) {
    next(error);
  }
};

// 移除单词的发音规则关联
const removeWordPronunciationRule = async (req, res, next) => {
  try {
    const wordId = parseId(req.params.wordId);
    if (!wordId) {
      throw createHttpError(400, 'Invalid word id');
    }

    const ruleId = parseId(req.params.ruleId);
    if (!ruleId) {
      throw createHttpError(400, 'Invalid pronunciation rule id');
    }

    const [result] = await pool.execute(
      'DELETE FROM word_pronunciation_rules WHERE word_id = ? AND pronunciation_rule_id = ?',
      [wordId, ruleId],
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, 'Word-pronunciation rule association not found');
    }

    res.status(200).json({ message: 'Pronunciation rule association removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPronunciationRules,
  getPronunciationRuleById,
  getPronunciationRulesByCombination,
  getWordsUsingRule,
  createPronunciationRule,
  updatePronunciationRule,
  deletePronunciationRule,
  getWordPronunciationRules,
  addWordPronunciationRules,
  removeWordPronunciationRule,
};