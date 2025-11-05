const pool = require('../config/db');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const WORD_COLUMNS = 'word_id, word, phonetic, meaning, pronunciation1, pronunciation2, pronunciation3, created_at, difficulty, is_mastered, notes, has_image, image_type, image_value';
const DIFFICULTY_LABELS = {
  easy: 0,
  medium: 1,
  hard: 2,
};
const IMAGE_TYPE_ENUM = ['url', 'iconfont', 'emoji'];
const IMAGE_VALUE_MAX_LENGTHS = {
  url: 500,
  iconfont: 100,
  emoji: 50
};

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

const parseDifficulty = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    if (value >= 0 && value <= 2) {
      return value;
    }
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === '') {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(DIFFICULTY_LABELS, normalized)) {
    return DIFFICULTY_LABELS[normalized];
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 2) {
    return parsed;
  }

  return null;
};

const parseMasteryStatus = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === 0 || value === 1) {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === '') {
    return undefined;
  }

  if (['1', 'true', 'yes', 'y', 'mastered'].includes(normalized)) {
    return 1;
  }

  if (['0', 'false', 'no', 'n', 'unmastered', 'not_mastered', 'not-mastered'].includes(normalized)) {
    return 0;
  }

  return null;
};

const sanitizeRequiredString = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw createHttpError(400, `${fieldName} is required`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw createHttpError(400, `${fieldName} is required`);
  }
  return trimmed;
};

const sanitizeOptionalRequiredString = (value, fieldName) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    throw createHttpError(400, `${fieldName} cannot be null`);
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    throw createHttpError(400, `${fieldName} cannot be empty`);
  }
  return trimmed;
};

const sanitizeOptionalNullableString = (value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const parseOptionalDate = (value, fieldName) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, `${fieldName} must be a valid date`);
  }
  return date;
};

const validateImageType = (imageType) => {
  if (!imageType) return null;
  return IMAGE_TYPE_ENUM.includes(imageType) ? imageType : null;
};

const validateImageValue = (imageType, imageValue) => {
  if (!imageType || !imageValue) return null;
  
  const maxLength = IMAGE_VALUE_MAX_LENGTHS[imageType];
  if (!maxLength) return null;
  
  const trimmed = String(imageValue).trim();
  if (!trimmed) return null;
  
  return trimmed.length > maxLength ? null : trimmed;
};

const deriveHasImage = (hasImage, imageType, imageValue) => {
  if (hasImage === true) return true;
  if (hasImage === false) return false;
  return !!(imageType && imageValue);
};

const getWords = async (req, res, next) => {
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
    const difficultyInput = getFirstDefined(req.query, ['difficulty']);
    const masteryInput = getFirstDefined(req.query, ['masteryStatus', 'isMastered', 'is_mastered']);

    const difficulty = parseDifficulty(difficultyInput);
    if (difficulty === null) {
      throw createHttpError(400, 'difficulty must be 0, 1, 2 or easy/medium/hard');
    }

    const masteryStatus = parseMasteryStatus(masteryInput);
    if (masteryStatus === null) {
      throw createHttpError(400, 'masteryStatus must be a boolean value');
    }

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    const searchTerm = typeof searchInput === 'string' ? searchInput.trim() : '';
    if (searchTerm) {
      const likePattern = `%${searchTerm}%`;
      conditions.push('(word LIKE ? OR meaning LIKE ?)');
      params.push(likePattern, likePattern);
    }

    if (difficulty !== undefined) {
      conditions.push('difficulty = ?');
      params.push(difficulty);
    }

    if (masteryStatus !== undefined) {
      conditions.push('is_mastered = ?');
      params.push(masteryStatus);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT ${WORD_COLUMNS} FROM words ${whereClause} ORDER BY word_id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM words ${whereClause}`,
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

const getWordById = async (req, res, next) => {
  try {
    const wordId = parseId(req.params.id);
    if (!wordId) {
      throw createHttpError(400, 'Invalid word id');
    }

    const [rows] = await pool.execute(
      `SELECT ${WORD_COLUMNS} FROM words WHERE word_id = ?`,
      [wordId],
    );

    if (rows.length === 0) {
      throw createHttpError(404, 'Word not found');
    }

    res.status(200).json({ item: rows[0] });
  } catch (error) {
    next(error);
  }
};

const createWord = async (req, res, next) => {
  try {
    const wordInput = getFirstDefined(req.body, ['word']);
    const phoneticInput = getFirstDefined(req.body, ['phonetic', 'phonetics']);
    const meaningInput = getFirstDefined(req.body, ['meaning', 'description']);
    const pronunciation1Input = getFirstDefined(req.body, ['pronunciation1', 'pronunciation', 'pronunciationUrl', 'pronunciation_url']);
    const pronunciation2Input = getFirstDefined(req.body, ['pronunciation2']);
    const pronunciation3Input = getFirstDefined(req.body, ['pronunciation3']);
    const notesInput = getFirstDefined(req.body, ['notes']);
    const difficultyInput = getFirstDefined(req.body, ['difficulty']);
    const masteryInput = getFirstDefined(req.body, ['masteryStatus', 'is_mastered', 'isMastered', 'mastered']);
    const createdAtInput = getFirstDefined(req.body, ['created_at', 'createdAt']);
    const hasImageInput = getFirstDefined(req.body, ['hasImage', 'has_image']);
    const imageTypeInput = getFirstDefined(req.body, ['imageType', 'image_type']);
    const imageValueInput = getFirstDefined(req.body, ['imageValue', 'image_value']);

    const word = sanitizeRequiredString(wordInput, 'word');
    const phonetic = sanitizeRequiredString(phoneticInput, 'phonetic');
    const meaning = sanitizeRequiredString(meaningInput, 'meaning');

    const difficulty = parseDifficulty(difficultyInput);
    if (difficulty === null) {
      throw createHttpError(400, 'difficulty must be 0, 1, 2 or easy/medium/hard');
    }

    const masteryStatus = parseMasteryStatus(masteryInput);
    if (masteryStatus === null) {
      throw createHttpError(400, 'masteryStatus must be a boolean value');
    }

    const pronunciation1 = sanitizeOptionalNullableString(pronunciation1Input);
    const pronunciation2 = sanitizeOptionalNullableString(pronunciation2Input);
    const pronunciation3 = sanitizeOptionalNullableString(pronunciation3Input);
    const notes = sanitizeOptionalNullableString(notesInput);
    const createdAt = parseOptionalDate(createdAtInput, 'created_at');

    // Handle image fields with validation
    let hasImage = hasImageInput !== undefined ? parseMasteryStatus(hasImageInput) : undefined;
    const imageType = validateImageType(imageTypeInput);
    const imageValue = validateImageValue(imageType, imageValueInput);
    
    // Derive has_image if not explicitly provided
    hasImage = deriveHasImage(hasImage, imageType, imageValue);

    const columns = ['word', 'phonetic', 'meaning', 'difficulty', 'is_mastered', 'has_image', 'image_type', 'image_value'];
    const values = [word, phonetic, meaning, difficulty ?? 0, masteryStatus ?? 0, hasImage ? 1 : 0, hasImage ? imageType : null, hasImage ? imageValue : null];

    const optionalEntries = {
      pronunciation1,
      pronunciation2,
      pronunciation3,
      notes,
    };

    Object.entries(optionalEntries).forEach(([column, value]) => {
      if (value !== undefined) {
        columns.push(column);
        values.push(value);
      }
    });

    if (createdAt !== undefined) {
      columns.push('created_at');
      values.push(createdAt);
    }

    const placeholders = columns.map(() => '?').join(', ');
    const insertQuery = `INSERT INTO words (${columns.join(', ')}) VALUES (${placeholders})`;

    const [result] = await pool.execute(insertQuery, values);

    const [rows] = await pool.execute(
      `SELECT ${WORD_COLUMNS} FROM words WHERE word_id = ?`,
      [result.insertId],
    );

    res.status(201).json({ item: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createHttpError(409, 'Word already exists'));
      return;
    }
    next(error);
  }
};

const updateWord = async (req, res, next) => {
  try {
    const wordId = parseId(req.params.id);
    if (!wordId) {
      throw createHttpError(400, 'Invalid word id');
    }

    const wordInput = getFirstDefined(req.body, ['word']);
    const phoneticInput = getFirstDefined(req.body, ['phonetic', 'phonetics']);
    const meaningInput = getFirstDefined(req.body, ['meaning', 'description']);
    const pronunciation1Input = getFirstDefined(req.body, ['pronunciation1', 'pronunciation', 'pronunciationUrl', 'pronunciation_url']);
    const pronunciation2Input = getFirstDefined(req.body, ['pronunciation2']);
    const pronunciation3Input = getFirstDefined(req.body, ['pronunciation3']);
    const notesInput = getFirstDefined(req.body, ['notes']);
    const difficultyInput = getFirstDefined(req.body, ['difficulty']);
    const masteryInput = getFirstDefined(req.body, ['masteryStatus', 'is_mastered', 'isMastered', 'mastered']);
    const createdAtInput = getFirstDefined(req.body, ['created_at', 'createdAt']);
    const hasImageInput = getFirstDefined(req.body, ['hasImage', 'has_image']);
    const imageTypeInput = getFirstDefined(req.body, ['imageType', 'image_type']);
    const imageValueInput = getFirstDefined(req.body, ['imageValue', 'image_value']);

    const updates = [];
    const values = [];

    if (wordInput !== undefined) {
      const word = sanitizeOptionalRequiredString(wordInput, 'word');
      updates.push('word = ?');
      values.push(word);
    }

    if (phoneticInput !== undefined) {
      const phonetic = sanitizeOptionalRequiredString(phoneticInput, 'phonetic');
      updates.push('phonetic = ?');
      values.push(phonetic);
    }

    if (meaningInput !== undefined) {
      const meaning = sanitizeOptionalRequiredString(meaningInput, 'meaning');
      updates.push('meaning = ?');
      values.push(meaning);
    }

    if (pronunciation1Input !== undefined) {
      const pronunciation1 = sanitizeOptionalNullableString(pronunciation1Input);
      updates.push('pronunciation1 = ?');
      values.push(pronunciation1);
    }

    if (pronunciation2Input !== undefined) {
      const pronunciation2 = sanitizeOptionalNullableString(pronunciation2Input);
      updates.push('pronunciation2 = ?');
      values.push(pronunciation2);
    }

    if (pronunciation3Input !== undefined) {
      const pronunciation3 = sanitizeOptionalNullableString(pronunciation3Input);
      updates.push('pronunciation3 = ?');
      values.push(pronunciation3);
    }

    if (notesInput !== undefined) {
      const notes = sanitizeOptionalNullableString(notesInput);
      updates.push('notes = ?');
      values.push(notes);
    }

    if (difficultyInput !== undefined) {
      const difficulty = parseDifficulty(difficultyInput);
      if (difficulty === null) {
        throw createHttpError(400, 'difficulty must be 0, 1, 2 or easy/medium/hard');
      }
      updates.push('difficulty = ?');
      values.push(difficulty);
    }

    if (masteryInput !== undefined) {
      const masteryStatus = parseMasteryStatus(masteryInput);
      if (masteryStatus === null) {
        throw createHttpError(400, 'masteryStatus must be a boolean value');
      }
      updates.push('is_mastered = ?');
      values.push(masteryStatus);
    }

    if (createdAtInput !== undefined) {
      const createdAt = parseOptionalDate(createdAtInput, 'created_at');
      updates.push('created_at = ?');
      values.push(createdAt);
    }

    // Handle image fields with validation
    if (hasImageInput !== undefined || imageTypeInput !== undefined || imageValueInput !== undefined) {
      let hasImage = hasImageInput !== undefined ? parseMasteryStatus(hasImageInput) : undefined;
      const imageType = validateImageType(imageTypeInput);
      const imageValue = validateImageValue(imageType, imageValueInput);
      
      // Derive has_image if not explicitly provided
      hasImage = deriveHasImage(hasImage, imageType, imageValue);
      
      // Update all image fields
      updates.push('has_image = ?', 'image_type = ?', 'image_value = ?');
      values.push(hasImage ? 1 : 0, hasImage ? imageType : null, hasImage ? imageValue : null);
    }

    if (updates.length === 0) {
      throw createHttpError(400, 'No valid fields provided for update');
    }

    const [result] = await pool.execute(
      `UPDATE words SET ${updates.join(', ')} WHERE word_id = ?`,
      [...values, wordId],
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, 'Word not found');
    }

    const [rows] = await pool.execute(
      `SELECT ${WORD_COLUMNS} FROM words WHERE word_id = ?`,
      [wordId],
    );

    res.status(200).json({ item: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createHttpError(409, 'Word already exists'));
      return;
    }
    next(error);
  }
};

const deleteWord = async (req, res, next) => {
  try {
    const wordId = parseId(req.params.id);
    if (!wordId) {
      throw createHttpError(400, 'Invalid word id');
    }

    const [result] = await pool.execute(
      'DELETE FROM words WHERE word_id = ?',
      [wordId],
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, 'Word not found');
    }

    res.status(200).json({ message: 'Word deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWords,
  getWordById,
  createWord,
  updateWord,
  deleteWord,
};
