# 英文句子分词与关联功能技术架构文档
(English Sentence Tokenizer & Word Association Technical Architecture)

## 1. 总体架构 (System Architecture)

```
┌-------------------------┐
│      React Frontend     │
│  (Sentence Editor Page) │
└-----------┬-------------┘
            │ Axios /api
┌-----------┴-------------┐
│    Express API Layer    │
│  /api/sentences/*       │
└-----------┬-------------┘
            │ SQL
┌-----------┴-------------┐
│    MySQL Database       │
│ sentences / sentence_tokens │
└-------------------------┘
```

- **前端**: React + TypeScript + Axios，复用现有组件库（卡片、拖拽、弹窗）。
- **后端**: Node.js + Express，统一使用 AppError 与事务封装。
- **数据库**: MySQL 8.0，新增表及外键，保持与 words 表逻辑外键。

## 2. 数据库模型 (Database Schema)

### 2.1 sentences
```sql
CREATE TABLE sentences (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  text          TEXT        NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_text_prefix (text(768))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 sentence_tokens
```sql
CREATE TABLE sentence_tokens (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  sentence_id   BIGINT NOT NULL,
  position      INT    NOT NULL COMMENT 'token 顺序，从 0 开始',
  token_text    VARCHAR(255) NOT NULL,
  token_type    ENUM('word','punctuation') NOT NULL,
  word_id       BIGINT NULL COMMENT 'NULL 表示未关联单词',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_token_sentence
    FOREIGN KEY (sentence_id) REFERENCES sentences(id) ON DELETE CASCADE,
  CONSTRAINT fk_token_word
    FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE SET NULL,
  UNIQUE KEY uniq_sentence_position (sentence_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 索引策略
- `sentences.text(768)` 前缀唯一索引，防止重复句子。
- `sentence_tokens(sentence_id, position)` 复合唯一索引，保证顺序唯一。
- `sentence_tokens(word_id)` 普通索引，加速“查单词关联句子”。

## 3. API 设计 (RESTful endpoints)

### 3.1 分词 (Tokenize)
```http
POST /api/sentences/tokenize
Content-Type: application/json

{ "text": "Hello, world!" }

200 OK
{
  "tokens": [
    { "position": 0, "text": "Hello", "type": "word",   "matchedWord": { "id": 1, "word": "hello", ... } },
    { "position": 1, "text": ",",     "type": "punctuation", "matchedWord": null },
    { "position": 2, "text": "world", "type": "word",   "matchedWord": { "id": 2, "word": "world", ... } },
    { "position": 3, "text": "!",     "type": "punctuation", "matchedWord": null }
  ]
}
```
- 匹配逻辑：不区分大小写，等于 `LOWER(words.word)`。
- 返回的 `matchedWord` 可为 null，前端据此提示用户新建/选择。

### 3.2 创建句子
```http
POST /api/sentences
Content-Type: application/json

{
  "text": "Hello, world!",
  "tokens": [
    { "position": 0, "text": "Hello", "type": "word", "wordId": 1 },
    { "position": 1, "text": ",",     "type": "punctuation" },
    { "position": 2, "text": "world", "type": "word", "wordId": 2 },
    { "position": 3, "text": "!",     "type": "punctuation" }
  ]
}

201 Created
{ "id": 123, "text": "Hello, world!", "createdAt": "2025-11-16T..." }
```
- 后端开启事务：
  1. `INSERT INTO sentences ...`
  2. `INSERT INTO sentence_tokens ...` 批量写入。
- 若 text 重复，返回 409 Conflict `{ code: 'SENTENCE_EXISTS', message: '句子已存在' }`。

### 3.3 查询句子列表
```http
GET /api/sentences?search=hello&page=1&limit=20

200 OK
{
  "items": [
    { "id": 123, "text": "Hello, world!", "wordCount": 2, "createdAt": "..." }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### 3.4 句子详情
```http
GET /api/sentences/:id

200 OK
{
  "id": 123,
  "text": "Hello, world!",
  "tokens": [ /* 同 tokenize 格式 */ ],
  "words": [
    { "id": 1, "word": "hello", "phonetic": "həˈloʊ", "meaning": "你好" },
    { "id": 2, "word": "world", "phonetic": "wɜːrld", "meaning": "世界" }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 3.5 单词关联句子
```http
GET /api/words/:id/sentences?page=1&limit=10

200 OK
{
  "items": [
    { "id": 123, "text": "Hello, world!", "createdAt": "..." }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### 3.6 删除句子
```http
DELETE /api/sentences/:id

200 OK
{ "message": "句子已删除" }
```
- 级联删除 sentence_tokens，不删除 words。

## 4. 分词算法 (Tokenizer Algorithm)
```js
function tokenize(text) {
  // 1. 使用正则切分：连续字母+撇号 或 连续标点/空格
  const regex = /([A-Za-z']+|[^A-Za-z\s]+|\s+)/g;
  const raw = text.match(regex) || [];
  // 2. 过滤纯空格
  const tokens = raw.filter(t => !/^\s+$/.test(t));
  // 3. 遍历生成对象
  return tokens.map((t, i) => ({
    position: i,
    text: t,
    type: /^[A-Za-z']+$/.test(t) ? 'word' : 'punctuation'
  }));
}
```
- 标点包含：`,.!?;:"'()[]{}` 等。
- 扩展：后续可接入 NLP 库（compromise / wink-tokenizer）支持更复杂缩写与连字符。

## 5. 事务与一致性 (Transaction & Consistency)
- 使用 `mysql2/promise` 的 `connection.beginTransaction()`，伪代码：
```js
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  const [res] = await conn.execute('INSERT INTO sentences (text) VALUES (?)', [text]);
  const sentenceId = res.insertId;
  const tokenValues = tokens.map(t => [sentenceId, t.position, t.text, t.type, t.wordId || null]);
  await conn.query('INSERT INTO sentence_tokens (sentence_id, position, token_text, token_type, word_id) VALUES ?', [tokenValues]);
  await conn.commit();
} catch (e) {
  await conn.rollback();
  throw e;
} finally {
  conn.release();
}
```
- 所有写操作均走事务；读操作无锁。

## 6. 前端组件设计 (Frontend Components)
- `SentenceListPage`：表格 + 搜索 + 分页，复用现有 `useApi`。
- `SentenceEditPage`：
  - `TextInputPanel`：textarea + 分词按钮。
  - `TokenFlow`：横向拖拽列表（react-beautiful-dnd），token 卡片颜色区分类型。
  - `WordAssociateModal`：复用已有单词选择弹窗，支持搜索/分页/新建。
- `SentenceDetailPage`：原文 + token 列表 + 关联单词卡片，支持移除关联。
- 路由：
  - `/sentences` → list
  - `/sentences/new` → create
  - `/sentences/:id` → detail
  - `/sentences/:id/edit` → edit

## 7. 权限与安全 (Security)
- 所有接口走现有 `/api` 前缀，复用统一错误处理与认证中间件（若已集成）。
- 仅登录用户可访问句子相关接口；未登录返回 401。
- SQL 注入：使用 `?` 占位符，已覆盖。
- XSS：前端 React 自动转义；富文本仅展示不执行。

## 8. 性能与扩展 (Performance & Extensibility)
- 分词纯内存正则，1000 字符 < 5ms；数据库批量写入，单次事务 < 50ms。
- 句子文本长度上限 16KB（约 8000 字符），满足常规使用。
- 后续可扩展：
  - 支持中文分词（jieba-js）。
  - 支持音频/翻译字段存储。
  - 支持句子难度自动评分。

## 9. 部署与回滚 (Deployment & Rollback)
- 数据库变更通过新增表完成，可热部署；回滚仅删除新表，不影响旧数据。
- 接口版本化：保留 `/api/sentences/v1/` 前缀，后续升级 v2。

---
*文档版本：v1.0*  
*作者：AI Assistant*  
*创建：2025-11-16*