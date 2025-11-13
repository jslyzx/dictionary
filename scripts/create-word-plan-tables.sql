-- 单词计划表
CREATE TABLE word_plans (
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
CREATE TABLE word_plan_words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL COMMENT '计划ID',
  word_id INT NOT NULL COMMENT '单词ID',
  order_index INT NOT NULL DEFAULT 0 COMMENT '排序索引',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES word_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE CASCADE,
  UNIQUE KEY unique_plan_word (plan_id, word_id)
);

-- 学习记录表
CREATE TABLE learning_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL COMMENT '计划ID',
  word_id INT NOT NULL COMMENT '单词ID',
  user_answer VARCHAR(255) COMMENT '用户答案',
  is_correct BOOLEAN NOT NULL COMMENT '是否正确',
  attempts INT NOT NULL DEFAULT 1 COMMENT '尝试次数',
  learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES word_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE CASCADE
);

-- 错误单词记录表
CREATE TABLE error_words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL COMMENT '计划ID',
  word_id INT NOT NULL COMMENT '单词ID',
  error_count INT NOT NULL DEFAULT 1 COMMENT '错误次数',
  last_error_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES word_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE CASCADE,
  UNIQUE KEY unique_plan_error_word (plan_id, word_id)
);

-- 学习进度表
CREATE TABLE learning_progress (
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
CREATE INDEX idx_word_plans_status ON word_plans(status);
CREATE INDEX idx_word_plan_words_plan_id ON word_plan_words(plan_id);
CREATE INDEX idx_word_plan_words_word_id ON word_plan_words(word_id);
CREATE INDEX idx_learning_records_plan_id ON learning_records(plan_id);
CREATE INDEX idx_learning_records_word_id ON learning_records(word_id);
CREATE INDEX idx_error_words_plan_id ON error_words(plan_id);
CREATE INDEX idx_learning_progress_plan_id ON learning_progress(plan_id);