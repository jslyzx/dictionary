const fs = require('fs');
const path = require('path');
const { query } = require('./config/db');

async function runMigration() {
  try {
    console.log('🚀 开始运行发音规则数据库迁移...');
    
    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'scripts', 'add_pronunciation_rules_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // 分割SQL语句（简单按分号分割）
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 找到 ${statements.length} 条SQL语句`);
    
    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`⚡ 执行语句 ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        await query(statement);
        console.log(`✅ 语句 ${i + 1} 执行成功`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
          console.log(`⚠️  表已存在，跳过: ${error.message}`);
        } else {
          console.error(`❌ 语句 ${i + 1} 执行失败:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('🎉 数据库迁移完成！');
    
    // 验证表是否创建成功
    const tables = await query('SHOW TABLES LIKE "%pronunciation%"');
    console.log('📊 发音规则相关表:', tables.map(t => Object.values(t)[0]));
    
    // 验证示例数据
    const rules = await query('SELECT COUNT(*) as count FROM pronunciation_rules');
    console.log(`📚 发音规则数量: ${rules[0].count}`);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('✅ 迁移脚本执行完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 迁移脚本执行失败:', error);
  process.exit(1);
});