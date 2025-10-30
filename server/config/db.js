const mysql = require('mysql2/promise');

const normalizePort = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return 3306;
  }
  return parsed;
};

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: normalizePort(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
