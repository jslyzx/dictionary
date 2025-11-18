const { query, executeWithRetry } = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * 将英文句子分词，保留标点符号
 * @param {string} text - 英文句子
 * @returns {Array<{position:number,text:string,type:'word'|'punctuation'}>}
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  // 匹配单词、标点符号，忽略空白字符
  const regex = /([A-Za-z']+|[^A-Za-z\s]+|\s+)/g;
  const tokens = text.match(regex)?.filter(t => !/^\s+$/.test(t)) || [];
  return tokens.map((t, i) => ({
    position: i,
    text: t,
    type: /^[A-Za-z']+$/.test(t) ? 'word' : 'punctuation'
  }));
}

/**
 * POST /api/sentences/tokenize
 * 对输入文本进行分词（不写入数据库）
 */
async function tokenizeText(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      throw new AppError('text 字段必填且为字符串', { status: 400, code: 'INVALID_TEXT' });
    }
    const tokens = tokenize(text);
    res.json({ text, tokens });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sentences
 * 创建句子及其分词，支持关联已有单词
 */
async function createSentence(req, res, next) {
  const connection = await require('../config/db').getConnection();
  try {
    const { text, tokens: clientTokens } = req.body;
    if (!text || typeof text !== 'string') {
      throw new AppError('text 字段必填且为字符串', { status: 400, code: 'INVALID_TEXT' });
    }

    await connection.beginTransaction();

    // 1. 插入句子
    const [sentenceResult] = await connection.execute(
      'INSERT INTO sentences (text) VALUES (?)',
      [text.trim()]
    );
    const sentenceId = sentenceResult.insertId;

    // 2. 生成分词（若客户端未传则自动分词）
    const tokens = Array.isArray(clientTokens) && clientTokens.length
      ? clientTokens
      : tokenize(text);

    // 3. 批量插入分词
    if (tokens.length) {
      const placeholders = tokens.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const values = tokens.flatMap(t => [
        sentenceId,
        t.position,
        t.text,
        t.type,
        t.word_id || null
      ]);
      await connection.execute(
        `INSERT INTO sentence_tokens 
         (sentence_id, position, token_text, token_type, word_id) 
         VALUES ${placeholders}`,
        values
      );
    }

    await connection.commit();

    // 4. 查询完整数据返回（避免 JSON 聚合兼容性问题）
    const [sentenceRows] = await connection.execute(
      `SELECT id, text, created_at FROM sentences WHERE id = ?`,
      [sentenceId]
    );
    const [tokenRows] = await connection.execute(
      `SELECT position, token_text AS text, token_type AS type, word_id 
         FROM sentence_tokens 
        WHERE sentence_id = ? 
        ORDER BY position ASC`,
      [sentenceId]
    );

    connection.release();

    res.status(201).json({ id: sentenceRows[0].id, text: sentenceRows[0].text, created_at: sentenceRows[0].created_at, tokens: tokenRows });
  } catch (err) {
    await connection.rollback().catch(() => {});
    connection.release();
    next(err);
  }
}

/**
 * GET /api/sentences
 * 分页列出句子，支持搜索
 */
async function listSentences(req, res, next) {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = ''
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limit = Math.min(100, Math.max(1, Number(pageSize)));
    const offset = (pageNum - 1) * limit;

    let whereClause = '';
    let params = [];
    if (search && search.trim()) {
      whereClause = 'WHERE s.text LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    const [rows] = await query(
      `SELECT
              s.id, s.text, s.created_at,
              COUNT(st.id) AS token_count
         FROM sentences s
         LEFT JOIN sentence_tokens st ON st.sentence_id = s.id
         ${whereClause}
        GROUP BY s.id
        ORDER BY s.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await query(
      `SELECT COUNT(*) AS total FROM sentences s ${whereClause || ''}`,
      params
    );
    const total = Array.isArray(countRows) && countRows.length ? Number(countRows[0].total) : 0;

    const items = Array.isArray(rows) ? rows : (rows ? [rows] : []);
    res.json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sentences/:id
 * 获取句子详情，含分词及关联单词信息
 */
async function getSentence(req, res, next) {
  try {
    const { id } = req.params;
    const sentenceId = Number(id);
    if (!sentenceId) {
      throw new AppError('无效句子 ID', { status: 400, code: 'INVALID_ID' });
    }

    const sentenceRows = await query(
      `SELECT id, text, created_at FROM sentences WHERE id = ?`,
      [sentenceId]
    );

    if (!sentenceRows.length) {
      throw new AppError('句子不存在', { status: 404, code: 'NOT_FOUND' });
    }

    const tokenRows = await query(
      `SELECT st.position, st.token_text AS text, st.token_type AS type, st.word_id,
              w.word, w.meaning, w.phonetic
         FROM sentence_tokens st
         LEFT JOIN words w ON w.word_id = st.word_id
        WHERE st.sentence_id = ?
        ORDER BY st.position ASC`,
      [sentenceId]
    );

    const tokens = tokenRows.map(tr => ({
      position: tr.position,
      text: tr.text,
      type: tr.type,
      word_id: tr.word_id ?? null,
      word: tr.word_id ? { word_id: tr.word_id, word: tr.word, meaning: tr.meaning, phonetic: tr.phonetic } : null,
    }));

    res.json({ id: sentenceRows[0].id, text: sentenceRows[0].text, created_at: sentenceRows[0].created_at, tokens });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/sentences/:id
 * 删除句子及其分词
 */
async function deleteSentence(req, res, next) {
  try {
    const { id } = req.params;
    const sentenceId = Number(id);
    if (!sentenceId) {
      throw new AppError('无效句子 ID', { status: 400, code: 'INVALID_ID' });
    }

    const [result] = await query('DELETE FROM sentences WHERE id = ?', [sentenceId]);
    if (result.affectedRows === 0) {
      throw new AppError('句子不存在', { status: 404, code: 'NOT_FOUND' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/sentences/:id/tokens/:position
 * 更新单个分词与单词的关联
 */
async function updateTokenWord(req, res, next) {
  try {
    const { id, position } = req.params;
    const { word_id: wordId } = req.body;

    const sentenceId = Number(id);
    const tokenPosition = Number(position);

    if (!sentenceId || tokenPosition < 0) {
      throw new AppError('无效句子 ID 或分词位置', { status: 400, code: 'INVALID_PARAMS' });
    }

    // 可选：校验单词是否存在
    if (wordId !== null && wordId !== undefined) {
      const [wordRows] = await query('SELECT word_id FROM words WHERE word_id = ?', [wordId]);
      if (!wordRows.length) {
        throw new AppError('关联的单词不存在', { status: 404, code: 'WORD_NOT_FOUND' });
      }
    }

    const [result] = await query(
      `UPDATE sentence_tokens 
          SET word_id = ? 
        WHERE sentence_id = ? AND position = ?`,
      [wordId || null, sentenceId, tokenPosition]
    );

    if (result.affectedRows === 0) {
      throw new AppError('分词不存在', { status: 404, code: 'TOKEN_NOT_FOUND' });
    }

    // 返回更新后的分词信息
    const [rows] = await query(
      `SELECT st.position, st.token_text, st.token_type, st.word_id,
              w.word, w.meaning, w.phonetic
         FROM sentence_tokens st
         LEFT JOIN words w ON w.word_id = st.word_id
        WHERE st.sentence_id = ? AND st.position = ?`,
      [sentenceId, tokenPosition]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/words/:id/sentences
 * 根据单词查询出现的句子列表
 */
async function getWordSentences(req, res, next) {
  try {
    const { id } = req.params;
    const wordId = Number(id);
    if (!wordId) {
      throw new AppError('无效单词 ID', { status: 400, code: 'INVALID_ID' });
    }

    const [rows] = await query(
      `SELECT s.id, s.text, s.created_at,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'position', st.position,
                  'text', st.token_text,
                  'type', st.token_type
                )
              ) AS tokens
         FROM words w
         JOIN sentence_tokens st ON st.word_id = w.word_id
         JOIN sentences s ON s.id = st.sentence_id
        WHERE w.word_id = ?
        GROUP BY s.id
        ORDER BY s.id DESC`,
      [wordId]
    );

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  tokenizeText,
  createSentence,
  listSentences,
  getSentence,
  deleteSentence,
  updateTokenWord,
  getWordSentences,
  tokenize // 暴露出去方便单测或复用
};