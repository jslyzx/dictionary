# 数据库字符集修复总结

## 问题描述
创建词典时报错：`ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: Incorrect string value: '\\xE8\\xAF\\x91\\xE6\\x9E\\x97...' for column 'name'`

原因：数据库表的字符集不是 UTF-8，无法存储中文字符。

## 修复内容

### 1. 创建修复脚本
- **文件**: `scripts/fix-charset.sql`
- **功能**: 修改现有数据库和表的字符集为 utf8mb4
- **用法**: `mysql -u root -p dictionary < scripts/fix-charset.sql`

### 2. 更新 SQL 建表文件
- **文件**: `English.sql`
- **修改**: 在所有 CREATE TABLE 语句中添加字符集声明
- **添加内容**: `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

### 3. 更新数据库连接配置
- **文件**: `config/db.js`
- **修改**: 在连接池配置中添加 `charset: 'utf8mb4'`

### 4. 更新文档
- **文件**: `README.md`
- **添加**: 详细的字符集配置说明和故障排除指南

### 5. 创建测试脚本
- **文件**: `scripts/test-chinese.sql`
- **功能**: 测试中文字符的插入和查询
- **用法**: `mysql -u root -p dictionary < scripts/test-chinese.sql`

## 修复步骤（用户操作）

### 方式1: 使用修复脚本（推荐）
```bash
mysql -u root -p dictionary < scripts/fix-charset.sql
```

### 方式2: 重建数据库
```bash
mysql -u root -p
DROP DATABASE IF EXISTS dictionary;
CREATE DATABASE dictionary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dictionary;
SOURCE English.sql;
exit;
```

## 验证方法

### 1. 检查字符集设置
```sql
-- 检查数据库字符集
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'dictionary';

-- 检查表的字符集
SELECT TABLE_NAME, TABLE_COLLATION 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'dictionary';
```

### 2. 测试中文数据
```bash
mysql -u root -p dictionary < scripts/test-chinese.sql
```

## 验收标准
- ✅ `English.sql` 所有建表语句包含 `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
- ✅ 创建 `scripts/fix-charset.sql` 修复脚本
- ✅ `config/db.js` 包含 `charset: 'utf8mb4'` 配置
- ✅ README 包含详细的字符集设置说明
- ✅ 提供清晰的修复步骤和验证方法
- ✅ 执行修复后能成功插入中文数据
- ✅ 查询中文数据显示正常，无乱码

## 注意事项
- utf8mb4 是 MySQL 真正的 UTF-8 实现，支持 emoji 和特殊字符
- 修改字符集不会丢失现有数据（如果有的话）
- 如果表中已有乱码数据，需要清空后重新插入
- 确保 MySQL 版本支持 utf8mb4（MySQL 5.5.3+）

## 文件变更清单
1. `scripts/fix-charset.sql` - 新增
2. `scripts/test-chinese.sql` - 新增
3. `English.sql` - 修改（添加字符集声明）
4. `config/db.js` - 修改（添加 charset 配置）
5. `README.md` - 修改（添加字符集说明）
6. `CHARSET_FIX_SUMMARY.md` - 新增