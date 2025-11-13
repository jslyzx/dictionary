const db = require('../config/db');

// 执行SQL文件
const executeSQLFile = async () => {
  const sql = `
-- 单词计划表
CREATE TABLE IF NOT EXISTS word_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT '计划名称',
  description TEXT COMMENT '计划描述',
  mode ENUM('flash-card', 'spelling') NOT NULL DEFAULT 'flash-card' COMMENT '答题模式',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'inactive' COMMENT '启用状态',
  target_word_count INT NOT NULL DEFAULT 10 COMMENT '目标单词数量',
  daily_word_count INT NOT NULL DEFAULT 5 COMMENT '每日学习单词数量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 单词计划与单词关联表
CREATE TABLE IF NOT EXISTS word_plan_words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL COMMENT '计划ID',
  word_id INT NOT NULL COMMENT '单词ID',
  order_index INT NOT NULL DEFAULT 0 COMMENT '排序索引',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES word_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  UNIQUE KEY unique_plan_word (plan_id, word_id)
);

-- 学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL COMMENT '计划ID',
  word_id INT NOT NULL COMMENT '单词ID',
  user_answer VARCHAR(255) COMMENT '用户答案',
  is_correct BOOLEAN NOT NULL COMMENT '是否正确',
  attempts INT NOT NULL DEFAULT 1 COMMENT '尝试次数',
  learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES word_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- 错误单词记录表
CREATE TABLE IF NOT EXISTS error_words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL COMMENT '计划ID',
  word_id INT NOT NULL COMMENT '单词ID',
  error_count INT NOT NULL DEFAULT 1 COMMENT '错误次数',
  last_error_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES word_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  UNIQUE KEY unique_plan_error_word (plan_id, word_id)
);

-- 学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL COMMENT '计划ID',
  total_words INT NOT NULL COMMENT '总单词数',
  learned_words INT NOT NULL DEFAULT 0 COMMENT '已学习单词数',
  correct_words INT NOT NULL DEFAULT 0 COMMENT '正确单词数',
  error_words INT NOT NULL DEFAULT 0 COMMENT '错误单词数',
  last_studied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES word_plans(id) ON DELETE CASCADE,
  UNIQUE KEY unique_plan_progress (plan_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_word_plans_status ON word_plans(status);
CREATE INDEX IF NOT EXISTS idx_word_plan_words_plan_id ON word_plan_words(plan_id);
CREATE INDEX IF NOT EXISTS idx_word_plan_words_word_id ON word_plan_words(word_id);
CREATE INDEX IF NOT EXISTS idx_learning_records_plan_id ON learning_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_learning_records_word_id ON learning_records(word_id);
CREATE INDEX IF NOT EXISTS idx_error_words_plan_id ON error_words(plan_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_plan_id ON learning_progress(plan_id);
`;

  try {
    console.log('开始创建单词计划相关表...');
    
    // 逐条执行SQL语句
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
    
    console.log('✅ 单词计划相关表创建成功！');
    
    // 检查是否已有活跃计划
    const [activePlans] = await db.query('SELECT COUNT(*) as count FROM word_plans WHERE status = "active"');
    if (activePlans[0].count === 0) {
      console.log('💡 提示：目前没有激活的单词计划，请在管理界面创建并激活一个计划。');
    }
    
  } catch (error) {
    console.error('❌ 创建单词计划表失败:', error);
    throw error;
  } finally {
    await db.end();
  }
};

// 执行脚本
if (require.main === module) {
  executeSQLFile()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { executeSQLFile };