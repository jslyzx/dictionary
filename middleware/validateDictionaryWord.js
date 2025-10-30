const difficultyLabels = {
  easy: 0,
  medium: 1,
  hard: 2
};

const isPositiveInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const parseDifficulty = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0 && value <= 2) {
      return value;
    }
    return null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(difficultyLabels, normalized)) {
      return difficultyLabels[normalized];
    }

    const parsed = Number.parseInt(normalized, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 2) {
      return parsed;
    }
  }

  return null;
};

const parseBooleanLike = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'number') {
    if (value === 0 || value === 1) {
      return value;
    }
    return null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (['1', 'true', 'yes', 'y', 'mastered'].includes(normalized)) {
      return 1;
    }

    if (['0', 'false', 'no', 'n', 'unmastered'].includes(normalized)) {
      return 0;
    }
  }

  return null;
};

const sanitizeNotes = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue === '' ? null : stringValue;
};

const validateWordIdParam = (req, res, next) => {
  const parsed = isPositiveInteger(req.params.wordId);

  if (parsed === null) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid word id.'
      }
    });
  }

  req.params.wordId = parsed;
  return next();
};

const validateDictionaryWordAssociationIdParam = (req, res, next) => {
  const parsed = isPositiveInteger(req.params.id);

  if (parsed === null) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid dictionary word association id.'
      }
    });
  }

  req.params.id = parsed;
  return next();
};

const validateCreateDictionaryWord = (req, res, next) => {
  const { wordId, difficulty, isMastered, notes } = req.body || {};

  const parsedWordId = isPositiveInteger(wordId);
  if (parsedWordId === null) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'wordId is required and must be a positive integer.'
      }
    });
  }

  const parsedDifficulty = parseDifficulty(difficulty);
  if (parsedDifficulty === null && difficulty !== undefined) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'difficulty must be 0, 1, 2 or one of easy/medium/hard.'
      }
    });
  }

  const parsedIsMastered = parseBooleanLike(isMastered);
  if (parsedIsMastered === null && isMastered !== undefined) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'isMastered must be a boolean-like value when provided.'
      }
    });
  }

  const sanitizedNotes = sanitizeNotes(notes);

  req.body = {
    wordId: parsedWordId
  };

  if (parsedDifficulty !== undefined) {
    req.body.difficulty = parsedDifficulty;
  }

  if (parsedIsMastered !== undefined) {
    req.body.isMastered = parsedIsMastered;
  }

  if (sanitizedNotes !== undefined) {
    req.body.notes = sanitizedNotes;
  }

  return next();
};

const validateUpdateDictionaryWord = (req, res, next) => {
  const { difficulty, isMastered, notes } = req.body || {};

  if (difficulty === undefined && isMastered === undefined && notes === undefined) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'At least one field must be provided to update the association.'
      }
    });
  }

  const parsedDifficulty = parseDifficulty(difficulty);
  if (parsedDifficulty === null && difficulty !== undefined) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'difficulty must be 0, 1, 2 or one of easy/medium/hard.'
      }
    });
  }

  const parsedIsMastered = parseBooleanLike(isMastered);
  if (parsedIsMastered === null && isMastered !== undefined) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'isMastered must be a boolean-like value when provided.'
      }
    });
  }

  const sanitizedNotes = sanitizeNotes(notes);

  req.body = {};

  if (parsedDifficulty !== undefined) {
    req.body.difficulty = parsedDifficulty;
  }

  if (parsedIsMastered !== undefined) {
    req.body.isMastered = parsedIsMastered;
  }

  if (notes !== undefined) {
    req.body.notes = sanitizedNotes;
  }

  return next();
};

module.exports = {
  validateWordIdParam,
  validateDictionaryWordAssociationIdParam,
  validateCreateDictionaryWord,
  validateUpdateDictionaryWord
};
