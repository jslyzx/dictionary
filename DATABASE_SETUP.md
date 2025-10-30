# 数据库设置指南

本指南将帮助您设置和配置 MySQL 数据库以支持词典管理系统的运行。

## 📋 前置条件

- MySQL 8.0+ 或 MariaDB 10.6+
- MySQL 客户端工具（mysql 命令行、MySQL Workbench、DBeaver 等）
- 具有创建数据库权限的 MySQL 用户

## 🚀 快速设置

如果您已经熟悉 MySQL，可以按照以下快速步骤：

```bash
# 1. 启动 MySQL 服务
sudo systemctl start mysql

# 2. 创建数据库
mysql -u root -p -e "CREATE DATABASE dictionary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. 导入数据
mysql -u root -p dictionary < English.sql

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置正确的数据库密码

# 5. 启动应用
npm run dev
```

## 🔧 详细设置步骤

### 1. 启动 MySQL 服务

#### Windows
```cmd
# 通过服务管理器启动 MySQL 服务
# 或使用命令行（以管理员身份运行）
net start mysql
```

#### Linux (systemd)
```bash
sudo systemctl start mysql
sudo systemctl enable mysql  # 设置开机自启
```

#### Linux (sysvinit)
```bash
sudo service mysql start
sudo chkconfig mysql on  # 设置开机自启
```

#### macOS (Homebrew)
```bash
brew services start mysql
```

### 2. 验证 MySQL 连接

```bash
# 测试连接
mysql -u root -p

# 如果成功，您应该看到 MySQL 提示符：
# mysql>
```

### 3. 创建数据库

在 MySQL 命令行中执行：

```sql
-- 创建数据库（支持完整的 Unicode 字符集）
CREATE DATABASE dictionary 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 验证数据库创建成功
SHOW DATABASES LIKE 'dictionary';

-- 退出 MySQL
EXIT;
```

### 4. 导入表结构和数据

从项目根目录执行：

```bash
# 导入 SQL 文件
mysql -u root -p dictionary < English.sql

# 验证导入成功
mysql -u root -p dictionary -e "SHOW TABLES;"
```

您应该看到以下表：
- `dictionaries` - 词典表
- `words` - 单词表  
- `dictionary_words` - 词典单词关联表

### 5. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
nano .env  # 或使用您喜欢的编辑器
```

确保以下配置正确：

```env
# 数据库配置
DB_HOST=localhost          # MySQL 服务器地址
DB_PORT=3306              # MySQL 端口
DB_USER=root              # MySQL 用户名
DB_PASSWORD=your_password # MySQL 用户密码
DB_NAME=dictionary         # 数据库名称

# 服务器配置
PORT=5000
NODE_ENV=development
```

### 6. 验证配置

启动应用程序验证数据库连接：

```bash
npm run dev
```

您应该看到类似以下的成功输出：

```
📊 数据库配置:
   Host: localhost
   Port: 3306
   User: root
   Database: dictionary
✅ 数据库连接成功
🚀 服务器运行在 http://localhost:5000
```

### 7. 测试 API

```bash
# 测试词典 API
curl http://localhost:5000/api/dictionaries

# 测试单词 API
curl http://localhost:5000/api/words
```

## 🔍 故障排除

### 常见错误和解决方案

#### ❌ "❌ 缺少必需的环境变量"
**原因**: `.env` 文件不存在或缺少必需的变量
**解决**: 
```bash
cp .env.example .env
# 编辑 .env 文件，确保包含所有必需的变量
```

#### ❌ "❌ 数据库连接失败: ECONNREFUSED"
**原因**: MySQL 服务未运行或端口/主机配置错误
**解决**:
```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql  # Linux
# 或
brew services list | grep mysql  # macOS

# 启动服务
sudo systemctl start mysql
```

#### ❌ "❌ 数据库连接失败: ER_ACCESS_DENIED_ERROR"
**原因**: 用户名或密码错误
**解决**:
```bash
# 测试连接
mysql -u your_user -p -h localhost

# 重置密码（如果需要）
mysql -u root -p -e "ALTER USER 'your_user'@'localhost' IDENTIFIED BY 'new_password';"
```

#### ❌ "❌ 数据库连接失败: ER_BAD_DB_ERROR"
**原因**: 数据库不存在
**解决**:
```bash
mysql -u root -p -e "CREATE DATABASE dictionary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 调试技巧

1. **测试数据库连接**:
   ```bash
   mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME
   ```

2. **检查数据库权限**:
   ```sql
   SHOW GRANTS FOR CURRENT_USER();
   ```

3. **查看数据库和表**:
   ```sql
   USE dictionary;
   SHOW TABLES;
   DESCRIBE dictionaries;
   ```

## 🔄 重置数据库

如果需要重新开始：

```bash
# 删除并重新创建数据库
mysql -u root -p -e "
DROP DATABASE IF EXISTS dictionary;
CREATE DATABASE dictionary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"

# 重新导入数据
mysql -u root -p dictionary < English.sql
```

## 📊 数据库结构

### dictionaries 表
| 字段 | 类型 | 描述 |
|------|------|------|
| dictionary_id | INT | 主键 |
| name | VARCHAR(255) | 词典名称 |
| description | TEXT | 词典描述 |
| is_enabled | TINYINT | 是否启用 |
| is_mastered | TINYINT | 是否已掌握 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### words 表
| 字段 | 类型 | 描述 |
|------|------|------|
| word_id | INT | 主键 |
| word | VARCHAR(50) | 单词 |
| phonetic | VARCHAR(100) | 音标 |
| meaning | VARCHAR(255) | 含义 |
| pronunciation1-3 | VARCHAR(255) | 发音文件路径 |
| notes | VARCHAR(255) | 备注 |
| difficulty | TINYINT | 难度等级 (0=简单, 1=中等, 2=困难) |
| is_mastered | TINYINT | 是否已掌握 |
| created_at | TIMESTAMP | 创建时间 |

### dictionary_words 表
| 字段 | 类型 | 描述 |
|------|------|------|
| relation_id | INT | 主键 |
| dictionary_id | INT | 词典 ID (外键) |
| word_id | INT | 单词 ID (外键) |
| difficulty | TINYINT | 在该词典中的难度 |
| is_mastered | TINYINT | 在该词典中是否已掌握 |
| notes | VARCHAR(255) | 备注 |
| created_at | TIMESTAMP | 创建时间 |

## 🛠️ 性能优化建议

1. **索引优化**: 数据库已包含必要的索引，定期分析查询性能
2. **连接池配置**: 根据应用负载调整 `DB_POOL_LIMIT`
3. **字符集**: 使用 `utf8mb4` 支持完整的 Unicode 字符
4. **定期维护**: 定期执行 `OPTIMIZE TABLE` 优化表结构

---

如果您遇到其他问题，请查看 [README.md](./README.md) 的故障排除部分或提交 Issue。
