const express = require('express');
const {
  tokenizeText,
  createSentence,
  listSentences,
  getSentence,
  deleteSentence,
  updateTokenWord,
  getWordSentences
} = require('../controllers/sentenceController');

const router = express.Router();

/**
 * @route   POST /api/sentences/tokenize
 * @desc    对输入文本进行分词（不写入数据库）
 * @access  Public
 * @body    { text: string }
 */
router.post('/tokenize', tokenizeText);

/**
 * @route   POST /api/sentences
 * @desc    创建句子及其分词
 * @access  Public
 * @body    { text: string, tokens?: Array<{position,text,type,word_id}> }
 */
router.post('/', createSentence);

/**
 * @route   GET /api/sentences
 * @desc    分页列出句子，支持搜索
 * @access  Public
 * @query   { page?: number, pageSize?: number, search?: string }
 */
router.get('/', listSentences);

/**
 * @route   GET /api/sentences/:id
 * @desc    获取句子详情，含分词及关联单词信息
 * @access  Public
 */
router.get('/:id', getSentence);

/**
 * @route   DELETE /api/sentences/:id
 * @desc    删除句子及其分词
 * @access  Public
 */
router.delete('/:id', deleteSentence);

/**
 * @route   PATCH /api/sentences/:id/tokens/:position
 * @desc    更新单个分词与单词的关联
 * @access  Public
 * @body    { word_id: number|null }
 */
router.patch('/:id/tokens/:position', updateTokenWord);

/**
 * @route   GET /api/words/:id/sentences
 * @desc    根据单词查询出现的句子列表
 * @access  Public
 */
router.get('/words/:id/sentences', getWordSentences);

module.exports = router;