# 英文句子分词功能开发文档
(English Sentence Tokenizer Development Guide)

## 1. 开发环境准备
- Node.js ≥ 18（已安装 24.11.0）
- 依赖安装（在项目根目录）：
  ```bash
  pnpm install
  ```
- 数据库：确保 MySQL 服务已启动，并执行迁移：
  ```bash
  # 登录 MySQL 后
  source supabase/migrations/20251116_create_sentence_tables.sql
  ```

## 2. 后端开发步骤

### 2.1 新建路由文件 `routes/sentences.js`
```js
const express = require('express');
const { body, param, query } = require('express-validator');
const sentenceController = require('../controllers/sentenceController');
const validate = require('../middleware/validate');

const router = express.Router();

// 分词
router.post('/tokenize',
  [
    body('text').isString().isLength({ min: 1, max: 16000 }),
    validate
  ],
  sentenceController.tokenize
);

// 创建句子
router.post('/',
  [
    body('text').isString().isLength({ min: 1, max: 16000 }),
    body('tokens').isArray({ min: 1 }),
    body('tokens.*.position').isInt({ min: 0 }),
    body('tokens.*.text').isString().isLength({ min: 1, max: 255 }),
    body('tokens.*.type').isIn(['word', 'punctuation']),
    body('tokens.*.wordId').optional({ nullable: true }).isInt({ min: 1 }),
    validate
  ],
  sentenceController.createSentence
);

// 列表
router.get('/',
  [
    query('search').optional().isString().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate
  ],
  sentenceController.listSentences
);

// 详情
router.get('/:id',
  [
    param('id').isInt({ min: 1 }),
    validate
  ],
  sentenceController.getSentence
);

// 删除
router.delete('/:id',
  [
    param('id').isInt({ min: 1 }),
    validate
  ],
  sentenceController.deleteSentence
);

module.exports = router;
```

### 2.2 新建控制器 `controllers/sentenceController.js`
```js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

function tokenize(text) {
  const regex = /([A-Za-z']+|[^A-Za-z\s]+|\s+)/g;
  const raw = text.match(regex) || [];
  const tokens = raw.filter(t => !/^\s+$/.test(t));
  return tokens.map((t, i) => ({
    position: i,
    text: t,
    type: /^[A-Za-z']+$/.test(t) ? 'word' : 'punctuation'
  }));
}

async function matchWords(tokenTexts) {
  if (!tokenTexts.length) return {};
  const placeholders = tokenTexts.map(() => '?').join(',');
  const lowerTexts = tokenTexts.map(t => t.toLowerCase());
  const [rows] = await pool.execute(
    `SELECT word_id, word, phonetic, meaning FROM words WHERE LOWER(word) IN (${placeholders})`,
    lowerTexts
  );
  const map = {};
  rows.forEach(r => { map[r.word.toLowerCase()] = r; });
  return map;
}

const tokenize = async (req, res, next) => {
  try {
    const { text } = req.body;
    const tokens = tokenize(text);
    const wordTokens = tokens.filter(t => t.type === 'word');
    const matchedMap = await matchWords(wordTokens.map(t => t.text));
    const result = tokens.map(t => ({
      position: t.position,
      text: t.text,
      type: t.type,
      matchedWord: t.type === 'word' ? (matchedMap[t.text.toLowerCase()] || null) : null
    }));
    res.json({ tokens: result });
  } catch (err) {
    next(err);
  }
};

const createSentence = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { text, tokens } = req.body;
    await conn.beginTransaction();
    const [sr] = await conn.execute('INSERT INTO sentences (text) VALUES (?)', [text]);
    const sentenceId = sr.insertId;
    const values = tokens.map(t => [
      sentenceId,
      t.position,
      t.text,
      t.type,
      t.type === 'word' ? (t.wordId || null) : null
    ]);
    await conn.query(
      'INSERT INTO sentence_tokens (sentence_id, position, token_text, token_type, word_id) VALUES ?',
      [values]
    );
    await conn.commit();
    res.status(201).json({ id: sentenceId, text, createdAt: new Date() });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new AppError('句子已存在', { status: 409, code: 'SENTENCE_EXISTS' }));
    }
    next(err);
  } finally {
    conn.release();
  }
};

const listSentences = async (req, res, next) => {
  try {
    const search = (req.query.search || '').trim();
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    let where = '';
    const params = [];
    if (search) {
      where = 'WHERE text LIKE ?';
      params.push(`%${search}%`);
    }
    const [rows] = await pool.execute(
      `SELECT id, text, created_at,
              (SELECT COUNT(*) FROM sentence_tokens st WHERE st.sentence_id = s.id AND st.token_type = 'word' AND st.word_id IS NOT NULL) AS wordCount
       FROM sentences s
       ${where}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [totalRow] = await pool.execute(
      `SELECT COUNT(*) AS total FROM sentences ${where}`,
      params
    );
    res.json({
      items: rows.map(r => ({
        id: r.id,
        text: r.text,
        wordCount: r.wordCount,
        createdAt: r.created_at
      })),
      total: totalRow[0].total,
      page,
      limit
    });
  } catch (err) {
    next(err);
  }
};

const getSentence = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [sRows] = await pool.execute('SELECT * FROM sentences WHERE id = ?', [id]);
    if (!sRows.length) return next(new AppError('句子不存在', { status: 404, code: 'NOT_FOUND' }));
    const sentence = sRows[0];
    const [tRows] = await pool.execute(
      `SELECT st.position, st.token_text, st.token_type, st.word_id,
              w.word, w.phonetic, w.meaning
       FROM sentence_tokens st
       LEFT JOIN words w ON w.word_id = st.word_id
       WHERE st.sentence_id = ?
       ORDER BY st.position`,
      [id]
    );
    const [wRows] = await pool.execute(
      `SELECT DISTINCT w.word_id, w.word, w.phonetic, w.meaning
       FROM sentence_tokens st
       JOIN words w ON w.word_id = st.word_id
       WHERE st.sentence_id = ?`,
      [id]
    );
    res.json({
      id,
      text: sentence.text,
      tokens: tRows.map(r => ({
        position: r.position,
        text: r.token_text,
        type: r.token_type,
        wordId: r.word_id,
        matchedWord: r.word ? { id: r.word_id, word: r.word, phonetic: r.phonetic, meaning: r.meaning } : null
      })),
      words: wRows,
      createdAt: sentence.created_at,
      updatedAt: sentence.updated_at
    });
  } catch (err) {
    next(err);
  }
};

const deleteSentence = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [result] = await pool.execute('DELETE FROM sentences WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return next(new AppError('句子不存在', { status: 404, code: 'NOT_FOUND' }));
    }
    res.json({ message: '句子已删除' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  tokenize,
  createSentence,
  listSentences,
  getSentence,
  deleteSentence
};
```

### 2.3 注册路由到 `app.js`
在 `app.js` 原有路由之后添加：
```js
const sentencesRouter = require('./routes/sentences');
app.use('/api/sentences', sentencesRouter);
```

## 3. 前端开发步骤

### 3.1 新建类型文件 `client/src/types/sentence.ts`
```ts
export interface Sentence {
  id: number
  text: string
  createdAt: string
  updatedAt: string
}

export interface SentenceToken {
  position: number
  text: string
  type: 'word' | 'punctuation'
  wordId?: number | null
  matchedWord?: {
    id: number
    word: string
    phonetic: string | null
    meaning: string
  } | null
}

export interface SentenceDetail extends Sentence {
  tokens: SentenceToken[]
  words: Array<{
    id: number
    word: string
    phonetic: string | null
    meaning: string
  }>
}

export interface CreateSentencePayload {
  text: string
  tokens: Omit<SentenceToken, 'matchedWord'>[]
}

export interface ListSentencesParams {
  search?: string
  page?: number
  limit?: number
}
```

### 3.2 新建服务文件 `client/src/services/sentences.ts`
```ts
import { request } from './apiClient'
import type { Sentence, SentenceDetail, SentenceToken, CreateSentencePayload, ListSentencesParams } from '../types/sentence'

export const tokenizeSentence = async (text: string): Promise<SentenceToken[]> => {
  const res = await request<{ tokens: SentenceToken[] }>({
    method: 'POST',
    url: '/sentences/tokenize',
    data: { text }
  })
  return res.tokens
}

export const createSentence = async (payload: CreateSentencePayload): Promise<Sentence> => {
  const res = await request<{ id: number; text: string; createdAt: string }>({
    method: 'POST',
    url: '/sentences',
    data: payload
  })
  return res
}

export const listSentences = async (params?: ListSentencesParams): Promise<{
  items: Array<Sentence & { wordCount: number }>
  total: number
  page: number
  limit: number
}> => {
  const res = await request<{ items: Array<Sentence & { wordCount: number }>; total: number; page: number; limit: number }>({
    method: 'GET',
    url: '/sentences',
    params
  })
  return res
}

export const getSentence = async (id: number): Promise<SentenceDetail> => {
  const res = await request<SentenceDetail>({
    method: 'GET',
    url: `/sentences/${id}`
  })
  return res
}

export const deleteSentence = async (id: number): Promise<void> => {
  await request<{ message: string }>({
    method: 'DELETE',
    url: `/sentences/${id}`
  })
}
```

### 3.3 新建页面组件 `client/src/pages/SentenceEditPage.tsx`
（示例骨架，后续可继续完善）
```tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenizeSentence, createSentence } from '../services/sentences'
import { SentenceToken } from '../types/sentence'
import WordSelectorModal from '../components/WordSelectorModal' // 复用已有单词选择器

export default function SentenceEditPage() {
  const [text, setText] = useState('')
  const [tokens, setTokens] = useState<SentenceToken[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null)
  const navigate = useNavigate()

  const handleTokenize = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await tokenizeSentence(text.trim())
      setTokens(res)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // 校验所有 word token 已关联
    const unlinked = tokens.filter(t => t.type === 'word' && !t.wordId)
    if (unlinked.length) {
      alert(`还有 ${unlinked.length} 个单词未关联`)
      return
    }
    await createSentence({ text: text.trim(), tokens })
    navigate('/sentences')
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">新建句子</h1>
      <textarea
        className="w-full border rounded p-2 mb-2"
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="粘贴英文句子或段落，支持标点"
      />
      <div className="flex gap-2 mb-4">
        <button className="btn-primary" onClick={handleTokenize} disabled={loading}>
          {loading ? '分词中...' : '分词'}
        </button>
        <button className="btn-success" onClick={handleSave} disabled={tokens.length === 0}>
          保存句子
        </button>
      </div>

      {tokens.length > 0 && (
        <div className="border rounded p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">分词结果（点击单词进行关联）</h2>
          <div className="flex flex-wrap gap-2">
            {tokens.map((t, i) => (
              <span
                key={i}
                className={`inline-block px-2 py-1 rounded cursor-pointer border ${
                  t.type === 'word'
                    ? t.wordId
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => {
                  if (t.type === 'word') {
                    setSelectedTokenIdx(i)
                  }
                }}
              >
                {t.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {selectedTokenIdx !== null && (
        <WordSelectorModal
          open
          onClose={() => setSelectedTokenIdx(null)}
          onSelect={word => {
            const copy = [...tokens]
            copy[selectedTokenIdx].wordId = word.id
            copy[selectedTokenIdx].matchedWord = word
            setTokens(copy)
            setSelectedTokenIdx(null)
          }}
        />
      )}
    </div>
  )
}
```

### 3.4 路由与导航
在 `client/src/App.tsx` 或主路由文件增加：
```tsx
import SentenceEditPage from './pages/SentenceEditPage'
import SentenceListPage from './pages/SentenceListPage'
import SentenceDetailPage from './pages/SentenceDetailPage'

{/* 在 Routes 内添加 */}
<Route path="/sentences" element={<SentenceListPage />} />
<Route path="/sentences/new" element={<SentenceEditPage />} />
<Route path="/sentences/:id" element={<SentenceDetailPage />} />
```

## 4. 测试与验证
1. 启动后端：
   ```bash
   npm run dev   # 或 node server.js
   ```
2. 启动前端：
   ```bash
   cd client && pnpm dev
   ```
3. 打开 http://localhost:5173/sentences/new，粘贴：
   ```
   Hello, world! How are you?
   ```
4. 点击“分词”，确认标点独立成 token；点击未匹配单词进行关联；保存后跳转列表。
5. 在单词详情页应能看到该句子出现在“例句”标签页。

## 5. 后续可扩展
- 支持拖拽调整 token 顺序/合并拆分。
- 支持批量导入句子（CSV/TXT）。
- 支持句子音频与翻译字段。
- 接入更智能 NLP 分词库（compromise、wink-tokenizer）。

---
*文档版本：v1.0*  
*作者：AI Assistant*  
*创建：2025-11-16*