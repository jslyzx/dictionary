const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库文件路径
const dbPath = path.join(__dirname, '..', 'dictionary.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log('✅ 已连接到SQLite数据库');
  }
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 查询函数
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// 执行函数（用于INSERT, UPDATE, DELETE）
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

// 测试连接
const testConnection = async () => {
  try {
    await query('SELECT 1');
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
};

module.exports = {
  db,
  query,
  run,
  testConnection
};