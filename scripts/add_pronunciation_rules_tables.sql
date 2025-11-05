-- 发音规则管理模块数据库迁移脚本
-- 创建时间: 2025-01-04

-- 1. 创建发音规则表
CREATE TABLE pronunciation_rules (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '发音规则唯一标识',
  letter_combination VARCHAR(50) NOT NULL COMMENT '字母组合，如 "tion", "ea", "ough"',
  pronunciation VARCHAR(100) NOT NULL COMMENT '发音，如 "/ʃən/", "/iː/"',
  rule_description TEXT COMMENT '发音规则说明',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  INDEX idx_letter_combination (letter_combination) COMMENT '字母组合查询索引'
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='发音规则表';

-- 2. 创建单词-发音规则关联表
CREATE TABLE word_pronunciation_rules (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联关系唯一标识',
  word_id INT NOT NULL COMMENT '单词ID，外键关联words表的word_id字段',
  pronunciation_rule_id INT NOT NULL COMMENT '发音规则ID，外键关联pronunciation_rules表的id字段',
  position_in_word INT COMMENT '该规则在单词中的位置（可选）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE CASCADE,
  FOREIGN KEY (pronunciation_rule_id) REFERENCES pronunciation_rules(id) ON DELETE CASCADE,
  UNIQUE KEY uk_word_rule (word_id, pronunciation_rule_id) COMMENT '防止重复关联'
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='单词-发音规则多对多关联表，支持一个单词关联多个发音规则';

-- 3. 添加额外索引以优化查询性能
CREATE INDEX idx_word_pronunciation_rule_word ON word_pronunciation_rules(word_id) COMMENT '根据单词ID查询关联规则';
CREATE INDEX idx_word_pronunciation_rule_rule ON word_pronunciation_rules(pronunciation_rule_id) COMMENT '根据规则ID查询使用该规则的单词';

-- 4. 插入一些示例数据（可选）
INSERT INTO pronunciation_rules (letter_combination, pronunciation, rule_description) VALUES
('tion', '/ʃən/', '结尾发音规则，通常在单词末尾发 /ʃən/ 音，如 action, nation, station'),
('ea', '/iː/', '长音发音，在多数情况下发长音 /iː/，如 eat, beach, teach, read（现在时）'),
('ea', '/e/', '短音发音，在某些情况下发短音 /e/，如 head, bread, ready, weather'),
('ough', '/ɔːf/', '发音变体之一，如 tough, rough, enough'),
('ough', '/uː/', '发音变体之二，如 through'),
('ough', '/ʌf/', '发音变体之三，如 cough, trough'),
('th', '/θ/', '清辅音，在单词开头或中间时通常发清辅音 /θ/，如 think, three, method'),
('th', '/ð/', '浊辅音，在单词中间或结尾时通常发浊辅音 /ð/，如 this, that, mother, with'),
('ph', '/f/', '发 /f/ 音，如 phone, photo, graph, elephant'),
('ch', '/tʃ/', '通常发 /tʃ/ 音，如 chair, teach, church, watch'),
('sh', '/ʃ/', '通常发 /ʃ/ 音，如 she, fish, shoe, push');