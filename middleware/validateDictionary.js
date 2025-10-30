const isBooleanLike = (value) => {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === 'boolean') {
    return true;
  }

  if (typeof value === 'number') {
    return value === 0 || value === 1;
  }

  if (typeof value === 'string') {
    return ['0', '1', 'true', 'false', 'yes', 'no', 'y', 'n'].includes(
      value.trim().toLowerCase()
    );
  }

  return false;
};

const validateDictionaryIdParam = (req, res, next) => {
  const { id } = req.params;
  const parsed = Number(id);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid dictionary id.'
      }
    });
  }

  req.params.id = parsed;
  return next();
};

const validateCreateDictionary = (req, res, next) => {
  const { name, description, isEnabled, isMastered } = req.body || {};

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Name is required and must be a non-empty string.'
      }
    });
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Description must be a string when provided.'
      }
    });
  }

  if (!isBooleanLike(isEnabled)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'isEnabled must be a boolean-like value when provided.'
      }
    });
  }

  if (!isBooleanLike(isMastered)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'isMastered must be a boolean-like value when provided.'
      }
    });
  }

  req.body.name = name.trim();
  if (typeof description === 'string') {
    req.body.description = description.trim();
  }

  return next();
};

const validateUpdateDictionary = (req, res, next) => {
  const { name, description, isEnabled, isMastered } = req.body || {};

  if (
    name === undefined &&
    description === undefined &&
    isEnabled === undefined &&
    isMastered === undefined
  ) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'At least one field must be provided to update a dictionary.'
      }
    });
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Name must be a non-empty string when provided.'
        }
      });
    }
    req.body.name = name.trim();
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Description must be a string when provided.'
      }
    });
  }

  if (typeof description === 'string') {
    req.body.description = description.trim();
  }

  if (!isBooleanLike(isEnabled)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'isEnabled must be a boolean-like value when provided.'
      }
    });
  }

  if (!isBooleanLike(isMastered)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'isMastered must be a boolean-like value when provided.'
      }
    });
  }

  return next();
};

module.exports = {
  validateDictionaryIdParam,
  validateCreateDictionary,
  validateUpdateDictionary
};
