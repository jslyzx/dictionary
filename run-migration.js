require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '43.156.92.151',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'english',
      multipleStatements: true
    });

    // 读取 SQL 文件
    const sqlFile = path.join(__dirname, 'scripts', 'add-word-image-fields.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('执行 SQL 迁移脚本...');
    console.log('SQL 内容预览:', sql.substring(0, 150) + '...');
    
    // 执行 SQL
    await connection.execute(sql);
    
    console.log('✅ SQL 迁移执行成功！');
    
  } catch (error) {
    console.error('❌ SQL 迁移执行失败:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  字段可能已经存在，这是正常的。');
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('🔍 其他字段错误，请检查表结构。');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();