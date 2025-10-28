-- 初始化英语字典数据库脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS english_dictionary;

-- 使用数据库
USE english_dictionary;

-- 创建字典表
CREATE TABLE IF NOT EXISTS dictionaries (
    dictionary_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建单词表
CREATE TABLE IF NOT EXISTS words (
    word_id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(100) NOT NULL UNIQUE,
    phonetic VARCHAR(100),
    meaning TEXT NOT NULL,
    pronunciation1 VARCHAR(255),
    pronunciation2 VARCHAR(255),
    pronunciation3 VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建字典-单词关联表
CREATE TABLE IF NOT EXISTS dictionary_words (
    relation_id INT AUTO_INCREMENT PRIMARY KEY,
    dictionary_id INT NOT NULL,
    word_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 添加外键约束
    FOREIGN KEY (dictionary_id) REFERENCES dictionaries(dictionary_id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE CASCADE,
    
    -- 确保每个字典中每个单词只出现一次
    UNIQUE KEY unique_dictionary_word (dictionary_id, word_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_word ON words(word);
CREATE INDEX idx_dictionary ON dictionaries(name);
CREATE INDEX idx_dictionary_id ON dictionary_words(dictionary_id);
CREATE INDEX idx_word_id ON dictionary_words(word_id);

-- 插入示例字典数据
INSERT INTO dictionaries (name, description) VALUES
('CET4核心词汇', '大学英语四级考试核心词汇'),
('考研核心词汇', '研究生入学考试必备词汇'),
('日常英语3000词', '日常生活中最常用的3000个英语单词');

-- 插入示例单词数据
INSERT INTO words (word, phonetic, meaning, pronunciation1, pronunciation2) VALUES
('apple', '/ˈæpl/', '苹果，苹果树', 'https://dict.youdao.com/dictvoice?audio=apple', 'https://dict.youdao.com/dictvoice?audio=apple&type=2'),
('banana', '/bəˈnɑːnə/', '香蕉', 'https://dict.youdao.com/dictvoice?audio=banana', 'https://dict.youdao.com/dictvoice?audio=banana&type=2'),
('book', '/bʊk/', '书，书籍', 'https://dict.youdao.com/dictvoice?audio=book', 'https://dict.youdao.com/dictvoice?audio=book&type=2'),
('computer', '/kəmˈpjuːtə(r)/', '计算机，电脑', 'https://dict.youdao.com/dictvoice?audio=computer', 'https://dict.youdao.com/dictvoice?audio=computer&type=2'),
('dictionary', '/ˈdɪkʃənri/', '字典，词典', 'https://dict.youdao.com/dictvoice?audio=dictionary', 'https://dict.youdao.com/dictvoice?audio=dictionary&type=2');

-- 插入字典-单词关联数据
INSERT INTO dictionary_words (dictionary_id, word_id) VALUES
(1, 1), -- CET4核心词汇包含apple
(1, 2), -- CET4核心词汇包含banana
(1, 3), -- CET4核心词汇包含book
(2, 3), -- 考研核心词汇包含book
(2, 4), -- 考研核心词汇包含computer
(2, 5), -- 考研核心词汇包含dictionary
(3, 1), -- 日常英语3000词包含apple
(3, 2), -- 日常英语3000词包含banana
(3, 3); -- 日常英语3000词包含book

-- 显示创建的表结构
SHOW TABLES;

-- 显示每个表的数据量
SELECT 'dictionaries' as table_name, COUNT(*) as row_count FROM dictionaries
UNION
SELECT 'words' as table_name, COUNT(*) as row_count FROM words
UNION
SELECT 'dictionary_words' as table_name, COUNT(*) as row_count FROM dictionary_words;
