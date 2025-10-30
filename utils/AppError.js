class AppError extends Error {
  constructor(message, options = {}) {
    super(message);

    const { status = 500, code = 'INTERNAL_SERVER_ERROR', details } = options;

    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    Error.captureStackTrace?.(this, AppError);
  }
}

module.exports = AppError;
