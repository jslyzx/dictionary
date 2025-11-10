# English Dictionary API 文档

该接口文档面向独立部署的后端服务，默认基础地址为 `http://localhost:5000/api`（可通过环境变量 `PORT` 调整）。客户端通过 `VITE_API_BASE_URL` 指向后端根地址（例如 `http://localhost:5000`），所有请求路径以 `/api` 开头。

## 通用约定
- 响应格式：`{ success: boolean, data?: any, message?: string }` 或更简单的 `{ message: string }`
- 内容类型：`application/json`
- 分页约定：`page`, `limit` 作为查询参数；返回中包含 `items`, `page`, `limit`, `total`

## 词典 Dictionaries
- `GET /api/dictionaries`
  - 描述：获取所有词典（按创建时间倒序）
  - 响应：`{ success: true, data: Dictionary[] }`
  - 示例：`curl http://localhost:5000/api/dictionaries`

- `POST /api/dictionaries`
  - 描述：创建词典
  - 请求体：`{ name: string, description?: string, isEnabled?: boolean, isMastered?: boolean }`
  - 响应：`{ success: true, data: Dictionary }`

- `GET /api/dictionaries/:id`
  - 描述：获取单个词典详情
  - 响应：`{ success: true, data: Dictionary }`

- `PUT /api/dictionaries/:id`
  - 描述：更新词典（名称、描述、状态）
  - 请求体：同创建接口的字段的子集
  - 响应：`{ success: true, data: Dictionary }`

- `DELETE /api/dictionaries/:id`
  - 描述：删除词典（及其关联通过数据库约束清理）
  - 响应：`{ success: true, message: string }`

## 词典-单词关联 Dictionary Words
- `GET /api/dictionaries/:id/words`
  - 描述：列出某词典下的单词关联
  - 响应：`{ success: true, data: DictionaryWordAssociation[] }`

- `POST /api/dictionaries/:id/words`
  - 描述：向词典添加单词
  - 请求体：`{ wordId: number, difficulty?: 'easy'|'medium'|'hard', isMastered?: boolean|null, notes?: string|null }`
  - 响应：`{ success: true, data: DictionaryWordAssociation }`

- `DELETE /api/dictionaries/:id/words/:wordId`
  - 描述：从词典移除单词
  - 响应：`{ success: true, message: string }`

- `PUT /api/dictionary-word-associations/:id`
  - 描述：更新词典-单词关联属性（难度、掌握状态、备注）
  - 请求体：以上属性的子集
  - 响应：`{ success: true, data: DictionaryWordAssociation }`

## 单词 Words
- `GET /api/words`
  - 描述：分页列出单词，支持筛选参数（如 `difficulty`, `isMastered` 等）
  - 响应：`{ success: true, data: { items: Word[], page, limit, total } }`

- `GET /api/words/stats`
  - 描述：全局单词统计（总数、掌握比例、难度分布）
  - 响应：`{ success: true, data: WordStats }`

- `GET /api/words/export`
  - 描述：导出 CSV
  - 响应：`text/csv`（二进制）

- `POST /api/words/import`
  - 描述：导入 CSV
  - 请求：`multipart/form-data`，字段 `file`
  - 响应：`{ success: true, data: { totalRows, created, updated?, skipped? } }`

## 发音规则 Pronunciation Rules
- `GET /api/pronunciation-rules`
  - 描述：分页列出发音规则
  - 响应：`{ items: PronunciationRule[], page, limit, total }`

- `GET /api/pronunciation-rules/:id`
  - 描述：获取单个发音规则
  - 响应：`{ item: PronunciationRule }`

- `GET /api/pronunciation-rules/by-combination/:letterCombination`
  - 描述：按字母组合查询对应规则
  - 响应：`{ items: PronunciationRule[] }`

### 示例 curl
```bash
# 获取词典列表
curl http://localhost:5000/api/dictionaries

# 创建词典
curl -X POST http://localhost:5000/api/dictionaries \
  -H "Content-Type: application/json" \
  -d '{"name":"My Dict","description":"notes"}'

# 为词典添加单词
curl -X POST http://localhost:5000/api/dictionaries/1/words \
  -H "Content-Type: application/json" \
  -d '{"wordId":123,"difficulty":"medium"}'
```

## 部署与配置
- 服务端通过 `PORT` 环境变量控制监听端口，默认 `5000`
- 客户端通过 `VITE_API_BASE_URL` 指向后端根地址，如 `http://<host>:<port>`
- 跨域：后端已启用 CORS，独立部署时可直接跨源访问