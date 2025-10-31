-- 测试中文字符支持
-- 使用方法: mysql -u root -p dictionary < scripts/test-chinese.sql

USE dictionary;

-- 测试插入中文数据
INSERT INTO dictionaries (name, description) 
VALUES ('测试词典', '这是一个测试描述，包含中文字符：译林、考研、托福等');

-- 验证查询中文数据
SELECT * FROM dictionaries WHERE name = '测试词典';

-- 测试插入包含中文的单词
INSERT INTO words (word, phonetic, meaning) 
VALUES ('test', '/test/', '测试单词');

-- 验证查询单词
SELECT * FROM words WHERE meaning LIKE '%测试%';

SELECT '✓ 中文字符测试完成' AS status;