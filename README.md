# 基于单词的词典管理

该仓库提供了词典管理系统所需的 `English.sql` 数据库结构，并新增了基于 Node.js + Express 的后端脚手架。

## 运行要求

- Node.js 18 或更高版本
- MySQL 8 或兼容版本

## 本地开发步骤

1. 复制环境变量文件并根据本地环境填写：
   ```bash
   cp .env.example .env
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```
4. 默认情况下服务器会在 `.env` 中配置的 `PORT`（默认为 3000）启动，并提供健康检查接口 `GET /api/health`。

生产模式可以通过 `npm start` 启动。

## 导入 `English.sql`

1. 在 MySQL 中创建目标数据库，例如：
   ```sql
   CREATE DATABASE dictionary_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. 使用 MySQL 命令行或 GUI 工具导入根目录下的 `English.sql`：
   ```bash
   mysql -u <用户名> -p dictionary_db < English.sql
   ```
   将 `<用户名>` 和 `dictionary_db` 替换为实际的数据库用户名与库名。

导入完成后，即可使用提供的后端脚手架连接数据库并扩展业务逻辑。
