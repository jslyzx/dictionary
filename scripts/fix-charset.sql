-- 修复字符集脚本
-- 使用方法: mysql -u root -p dictionary < scripts/fix-charset.sql

USE dictionary;

-- 修改数据库默认字符集
ALTER DATABASE dictionary 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 修改表字符集
ALTER TABLE dictionaries 
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE words 
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE dictionary_words 
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 验证修改
SELECT 
  TABLE_NAME, 
  TABLE_COLLATION 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'dictionary';

SELECT '✓ 字符集修复完成' AS status;