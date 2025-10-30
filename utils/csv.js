const BOM = '\uFEFF';

const escapeValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const stringValue = String(value);
  if (stringValue === '') {
    return '';
  }

  const needsEscaping = /[",\n\r]/.test(stringValue);
  const sanitized = stringValue.replace(/"/g, '""');
  return needsEscaping ? `"${sanitized}"` : sanitized;
};

const normalizeHeaderName = (column) => {
  if (column === undefined || column === null) {
    return column;
  }

  const cleaned = String(column).trim();
  if (!cleaned) {
    return cleaned;
  }

  const segments = cleaned
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return cleaned;
  }

  const [first, ...rest] = segments;
  const base = first.charAt(0).toLowerCase() + first.slice(1);
  const suffix = rest
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');

  return `${base}${suffix}`;
};

const stringifyCsv = (columns, rows) => {
  if (!Array.isArray(columns) || !columns.length) {
    throw new Error('CSV columns definition is required.');
  }

  const header = columns.map((column) => escapeValue(column.header ?? column.key));

  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const rawValue = typeof column.accessor === 'function'
          ? column.accessor(row)
          : row[column.key];

        if (column.formatter) {
          return escapeValue(column.formatter(rawValue, row));
        }

        return escapeValue(rawValue);
      })
      .join(','),
  );

  return `${BOM}${[header.join(','), ...lines].join('\n')}`;
};

module.exports = {
  stringifyCsv,
  normalizeHeaderName,
};
