require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkWordsTableStructure() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '43.156.92.151',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'english'
    });

    console.log('🔍 检查 words 表的主键和索引...');
    
    // 获取表结构
    const [columns] = await connection.execute('SHOW COLUMNS FROM words');
    console.log('words 表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Key ? `KEY(${col.Key})` : ''} ${col.Extra}`);
    });
    
    // 获取索引信息
    const [indexes] = await connection.execute('SHOW INDEX FROM words');
    console.log('\nwords 表索引:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.Key_name}: ${idx.Column_name} (${idx.Index_type})`);
    });
    
    // 检查 word_plan_words 表结构
    console.log('\n🔍 检查 word_plan_words 表结构...');
    const [wpwColumns] = await connection.execute('SHOW COLUMNS FROM word_plan_words');
    console.log('word_plan_words 表字段:');
    wpwColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Key ? `KEY(${col.Key})` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkWordsTableStructure();