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

## API 字段校验说明

所有接口均通过 `express-validator` 执行统一的入参校验，并在失败时返回如下结构的 400 响应：

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "name",
      "location": "body",
      "message": "Name is required."
    }
  ]
}
```

下表总结了当前可用接口对入参的约束，供前端或调用方参考。

### 字典 (`/api/dictionaries`)

| 字段 | 位置 | 说明 |
| --- | --- | --- |
| `name` | body | **必填**，字符串，长度 1-100。自动去除首尾空格。
| `description` | body | 选填，字符串（≤2000）或 `null`，空字符串会被转为空值。
| `isEnabled` | body | 选填，布尔值。可接受 `true/false/1/0/yes/no/y/n` 等。
| `isMastered` | body | 选填，布尔值，取值同 `isEnabled`。

> `PUT /api/dictionaries/:id` 至少需要提供上述字段中的一个。

### 单词 (`/api/words`)

| 字段 | 位置 | 说明 |
| --- | --- | --- |
| `word` | body | **必填**，字符串（≤50）。
| `phonetic` | body | **必填**，字符串（≤100）。
| `meaning` | body | **必填**，字符串（≤255）。
| `pronunciation1/2/3` | body | 选填，字符串（≤255）或 `null`。
| `notes` | body | 选填，字符串（≤255）或 `null`。
| `difficulty` | body | 选填，数值 `0/1/2` 或字符串 `easy/medium/hard`。
| `isMastered` | body | 选填，布尔值，取值同上。
| `createdAt` | body | 选填，合法日期字符串，未提供时使用数据库默认值。

查询参数：

- `page`、`limit`：正整数，`limit` 最大 100。
- `difficulty`：同上，支持 `0/1/2` 或 `easy/medium/hard`。
- `masteryStatus`：布尔值筛选（`true/false/1/0/yes/no/y/n`）。
- `search`：字符串，对 `word`、`meaning`、`phonetic` 模糊匹配。

`PUT /api/words/:id` 至少提供一个可更新字段。

### 字典与单词关联 (`/api/dictionary-words`)

| 字段 | 位置 | 说明 |
| --- | --- | --- |
| `dictionaryId` | body | **必填**，正整数，必须指向已存在的字典。
| `wordId` | body | **必填**，正整数，必须指向已存在的单词。

查询参数 `dictionaryId`、`wordId` 可用于筛选列表。`DELETE /api/dictionary-words/:id` 需要正整数 `id`，成功删除返回统一成功结构。

### 统一错误格式

全局错误处理中对数据库错误（唯一约束、外键约束等）进行了归一化映射，所有非 2xx 响应均包含：

- `success`: `false`
- `error`: 错误编码（例如 `NOT_FOUND`、`DUPLICATE_RESOURCE`）
- `message`: 人类可读的说明
- `details`: 可选，包含具体字段或校验失败信息

这使得前端可依据 `error` 或 `details` 字段进行一致的错误处理。
