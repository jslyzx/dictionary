-- 2025-11-16 创建句子与分词关联表
-- 用于英文句子分词与单词多对多关联功能

-- 1. 句子表
CREATE TABLE sentences (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  text          TEXT        NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 防止完全重复的句子文本（前缀 768 字符）
  UNIQUE KEY uniq_text_prefix (text(768))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 句子分词表
CREATE TABLE sentence_tokens (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  sentence_id   BIGINT NOT NULL,
  position      INT    NOT NULL COMMENT 'token 在句中的顺序，从 0 开始',
  token_text    VARCHAR(255) NOT NULL COMMENT '原始文本片段',
  token_type    ENUM('word','punctuation') NOT NULL COMMENT '单词或标点',
  word_id       INT NULL COMMENT '关联的单词 ID，NULL 表示未关联',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 外键：删除句子时级联删除分词；删除单词时置空
  CONSTRAINT fk_token_sentence
    FOREIGN KEY (sentence_id) REFERENCES sentences(id) ON DELETE CASCADE,
  CONSTRAINT fk_token_word
    FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE SET NULL,
  
  -- 同一句子内 position 唯一
  UNIQUE KEY uniq_sentence_position (sentence_id, position),
  
  -- 加速根据单词查句子的场景
  KEY idx_token_word_id (word_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 可选：全文索引（如需搜索句子内容）
-- FULLTEXT KEY ft_sentences_text (text);

-- 4. 权限授权（若使用 Supabase RLS 则忽略，此处给 MySQL 原生用户授权示例）
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sentences TO 'english_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sentence_tokens TO 'english_user'@'%';