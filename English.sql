-- 1. 删除依赖关系表（需先于words表删除）
DROP TABLE IF EXISTS dictionary_words;
-- 2. 删除单词表
DROP TABLE IF EXISTS words;
-- 3. 删除字典表（可选）
DROP TABLE IF EXISTS dictionaries;
-- 4. 重建字典表
CREATE TABLE dictionaries (
    dictionary_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '字典唯一标识',
    name VARCHAR(100) NOT NULL COMMENT '字典名称(如: CET4/考研核心词)',
    description TEXT COMMENT '字典详细介绍',
    is_enabled TINYINT(1) DEFAULT 1 NOT NULL COMMENT '是否启用(1启用 0停用)',
    is_mastered TINYINT(1) DEFAULT 0 NOT NULL COMMENT '是否全部掌握(1是 0否)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    UNIQUE KEY uniq_dict_name (name) COMMENT '字典名称唯一'
) COMMENT='字典主表';
-- 5. 重建单词表（添加音标字段）
CREATE TABLE words (
    word_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '单词唯一标识',
    word VARCHAR(50) NOT NULL COMMENT '英文单词',
    phonetic VARCHAR(100) NOT NULL COMMENT '音标(支持英式/美式不同标记)',
    meaning VARCHAR(255) NOT NULL COMMENT '中文释义',
    pronunciation1 VARCHAR(255) COMMENT '发音链接1(默认英音)',
    pronunciation2 VARCHAR(255) COMMENT '发音链接2(美音)',
    pronunciation3 VARCHAR(255) COMMENT '发音链接3(例句发音)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    difficulty TINYINT(1) DEFAULT 0 NOT NULL COMMENT '难度等级(0-简单 1-中等 2-困难)',
    is_mastered TINYINT(1) DEFAULT 0 NOT NULL COMMENT '是否掌握(1是 0否)',
    notes VARCHAR(255) COMMENT '笔记(可选)',
    UNIQUE KEY uniq_word (word) COMMENT '单词唯一性约束',
    INDEX idx_phonetic (phonetic(10)) COMMENT '音标查询索引'
) COMMENT='单词库表（含音标）';
-- 6. 重建字典单词关系表
CREATE TABLE dictionary_words (
    relation_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关系主键',
    dictionary_id INT NOT NULL COMMENT '字典ID',
    word_id INT NOT NULL COMMENT '单词ID',
    difficulty TINYINT(1) DEFAULT NULL COMMENT '字典内难度(0-简单 1-中等 2-困难)',
    is_mastered TINYINT(1) DEFAULT NULL COMMENT '字典内掌握状态(1是 0否 NULL未设置)',
    notes VARCHAR(255) DEFAULT NULL COMMENT '字典内备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    FOREIGN KEY (dictionary_id) REFERENCES dictionaries(dictionary_id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE CASCADE,
    UNIQUE KEY unique_dict_word (dictionary_id, word_id) COMMENT '防止重复添加'
) COMMENT='字典单词关系表';

-- 7. 可选：新建索引
-- 在单词表建立首字母索引
ALTER TABLE words ADD INDEX idx_words_first_char (word(1));
-- 在关系表建立反向索引
CREATE INDEX idx_dw_word ON dictionary_words(word_id);