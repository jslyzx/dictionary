require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTableStructure() {
  let connection;
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '43.156.92.151',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'english'
    });

    console.log('🔍 检查 words 表结构...');
    
    // 获取表结构
    const [columns] = await connection.execute('SHOW COLUMNS FROM words');
    
    console.log('words 表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // 检查是否有我们需要的字段
    const hasHasImage = columns.some(col => col.Field.toLowerCase() === 'hasimage' || col.Field.toLowerCase() === 'has_image');
    const hasImageType = columns.some(col => col.Field.toLowerCase() === 'imagetype' || col.Field.toLowerCase() === 'image_type');
    const hasImageValue = columns.some(col => col.Field.toLowerCase() === 'imagevalue' || col.Field.toLowerCase() === 'image_value');
    
    console.log('\n📋 字段检查结果:');
    console.log(`  hasImage: ${hasHasImage ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`  imageType: ${hasImageType ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`  imageValue: ${hasImageValue ? '✅ 存在' : '❌ 不存在'}`);
    
    // 检查 word_plan_words 表结构
    console.log('\n🔍 检查 word_plan_words 表结构...');
    const [wpwColumns] = await connection.execute('SHOW COLUMNS FROM word_plan_words');
    console.log('word_plan_words 表字段:');
    wpwColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    // 检查 learning_progress 表结构
    console.log('\n🔍 检查 learning_progress 表结构...');
    const [lpColumns] = await connection.execute('SHOW COLUMNS FROM learning_progress');
    console.log('learning_progress 表字段:');
    lpColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTableStructure();