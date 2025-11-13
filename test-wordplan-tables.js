const { query, run } = require('./config/db-sqlite');

async function testWordPlanTables() {
  try {
    console.log('🔄 开始测试单词计划数据库表...');
    
    // 检查word_plans表是否存在
    const wordPlansExists = await query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='word_plans'
    `);
    
    console.log('📋 word_plans表状态:', wordPlansExists.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    if (wordPlansExists.length > 0) {
      // 获取表结构
      const wordPlansSchema = await query("PRAGMA table_info(word_plans)");
      console.log('📊 word_plans表结构:');
      wordPlansSchema.forEach(column => {
        console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
    
    // 检查word_plan_words表是否存在
    const wordPlanWordsExists = await query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='word_plan_words'
    `);
    
    console.log('📋 word_plan_words表状态:', wordPlanWordsExists.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    if (wordPlanWordsExists.length > 0) {
      const wordPlanWordsSchema = await query("PRAGMA table_info(word_plan_words)");
      console.log('📊 word_plan_words表结构:');
      wordPlanWordsSchema.forEach(column => {
        console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
    
    // 检查learning_records表是否存在
    const learningRecordsExists = await query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='learning_records'
    `);
    
    console.log('📋 learning_records表状态:', learningRecordsExists.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    if (learningRecordsExists.length > 0) {
      const learningRecordsSchema = await query("PRAGMA table_info(learning_records)");
      console.log('📊 learning_records表结构:');
      learningRecordsSchema.forEach(column => {
        console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
    
    // 检查error_words表是否存在
    const errorWordsExists = await query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='error_words'
    `);
    
    console.log('📋 error_words表状态:', errorWordsExists.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    if (errorWordsExists.length > 0) {
      const errorWordsSchema = await query("PRAGMA table_info(error_words)");
      console.log('📊 error_words表结构:');
      errorWordsSchema.forEach(column => {
        console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
    
    // 测试插入数据
    console.log('🧪 测试数据操作...');
    
    // 插入测试计划
    const testPlanResult = await run(`
      INSERT INTO word_plans (name, description, mode, status, target_word_count, daily_word_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, ['测试计划', '这是一个测试计划', 'flash-card', 'active', 10, 5]);
    
    console.log('✅ 测试计划创建成功，ID:', testPlanResult.lastID);
    
    // 查询测试计划
    const testPlans = await query('SELECT * FROM word_plans WHERE name = ?', ['测试计划']);
    console.log('📋 查询到的测试计划:', testPlans.length > 0 ? '✅ 成功' : '❌ 失败');
    
    if (testPlans.length > 0) {
      console.log('📊 测试计划详情:', JSON.stringify(testPlans[0], null, 2));
    }
    
    // 清理测试数据
    await run('DELETE FROM word_plans WHERE name = ?', ['测试计划']);
    console.log('🧹 测试数据已清理');
    
    console.log('✅ 数据库表结构验证完成！');
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
    console.error('📋 错误详情:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testWordPlanTables().then(() => {
    console.log('🎉 测试完成！');
    process.exit(0);
  }).catch(error => {
    console.error('💥 测试失败:', error);
    process.exit(1);
  });
}

module.exports = { testWordPlanTables };