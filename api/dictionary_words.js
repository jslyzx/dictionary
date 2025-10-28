// 字典-单词关联相关API路由
const express = require('express');
const router = express.Router();
const db = require('../database');

// 获取字典中的所有单词
router.get('/:dictionaryId/words', async (req, res) => {
    try {
        const { dictionaryId } = req.params;
        
        // 检查字典是否存在
        const dictCheck = await db.query('SELECT * FROM dictionaries WHERE dictionary_id = ?', [dictionaryId]);
        if (dictCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: '字典不存在'
            });
        }
        
        // 获取字典中的单词
        const sql = `
            SELECT w.* 
            FROM words w
            JOIN dictionary_words dw ON w.word_id = dw.word_id
            WHERE dw.dictionary_id = ?
            ORDER BY w.word ASC
        `;
        const words = await db.query(sql, [dictionaryId]);
        
        res.json({
            success: true,
            data: words
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取字典中的单词失败',
            error: error.message
        });
    }
});

// 获取单词所属的所有字典
router.get('/words/:wordId/dictionaries', async (req, res) => {
    try {
        const { wordId } = req.params;
        
        // 检查单词是否存在
        const wordCheck = await db.query('SELECT * FROM words WHERE word_id = ?', [wordId]);
        if (wordCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: '单词不存在'
            });
        }
        
        // 获取单词所属的字典
        const sql = `
            SELECT d.* 
            FROM dictionaries d
            JOIN dictionary_words dw ON d.dictionary_id = dw.dictionary_id
            WHERE dw.word_id = ?
            ORDER BY d.name ASC
        `;
        const dictionaries = await db.query(sql, [wordId]);
        
        res.json({
            success: true,
            data: dictionaries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取单词所属字典失败',
            error: error.message
        });
    }
});

// 向字典中添加单词
router.post('/:dictionaryId/words/:wordId', async (req, res) => {
    try {
        const { dictionaryId, wordId } = req.params;
        
        // 检查字典是否存在
        const dictCheck = await db.query('SELECT * FROM dictionaries WHERE dictionary_id = ?', [dictionaryId]);
        if (dictCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: '字典不存在'
            });
        }
        
        // 检查单词是否存在
        const wordCheck = await db.query('SELECT * FROM words WHERE word_id = ?', [wordId]);
        if (wordCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: '单词不存在'
            });
        }
        
        // 检查关联是否已存在
        const relationCheck = await db.query(
            'SELECT * FROM dictionary_words WHERE dictionary_id = ? AND word_id = ?', 
            [dictionaryId, wordId]
        );
        
        if (relationCheck.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该单词已在字典中'
            });
        }
        
        // 添加关联
        const sql = 'INSERT INTO dictionary_words (dictionary_id, word_id) VALUES (?, ?)';
        await db.query(sql, [dictionaryId, wordId]);
        
        res.json({
            success: true,
            message: '单词已成功添加到字典'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '向字典添加单词失败',
            error: error.message
        });
    }
});

// 从字典中移除单词
router.delete('/:dictionaryId/words/:wordId', async (req, res) => {
    try {
        const { dictionaryId, wordId } = req.params;
        
        // 检查关联是否存在
        const relationCheck = await db.query(
            'SELECT * FROM dictionary_words WHERE dictionary_id = ? AND word_id = ?', 
            [dictionaryId, wordId]
        );
        
        if (relationCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: '该单词不在字典中'
            });
        }
        
        // 移除关联
        const sql = 'DELETE FROM dictionary_words WHERE dictionary_id = ? AND word_id = ?';
        await db.query(sql, [dictionaryId, wordId]);
        
        res.json({
            success: true,
            message: '单词已成功从字典中移除'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '从字典移除单词失败',
            error: error.message
        });
    }
});

// 批量添加单词到字典
router.post('/:dictionaryId/words/batch', async (req, res) => {
    try {
        const { dictionaryId } = req.params;
        const { wordIds } = req.body;
        
        if (!Array.isArray(wordIds) || wordIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的单词ID列表'
            });
        }
        
        // 检查字典是否存在
        const dictCheck = await db.query('SELECT * FROM dictionaries WHERE dictionary_id = ?', [dictionaryId]);
        if (dictCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: '字典不存在'
            });
        }
        
        // 检查所有单词是否存在
        const wordCheck = await db.query(
            `SELECT word_id FROM words WHERE word_id IN (${wordIds.map(() => '?').join(',')})`,
            wordIds
        );
        
        const existingWordIds = new Set(wordCheck.map(w => w.word_id));
        const invalidWordIds = wordIds.filter(id => !existingWordIds.has(id));
        
        if (invalidWordIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `以下单词ID不存在: ${invalidWordIds.join(', ')}`
            });
        }
        
        // 获取已存在的关联
        const existingRelations = await db.query(
            `SELECT word_id FROM dictionary_words WHERE dictionary_id = ? AND word_id IN (${wordIds.map(() => '?').join(',')})`,
            [dictionaryId, ...wordIds]
        );
        
        const existingWordIdsInDict = new Set(existingRelations.map(r => r.word_id));
        const newWordIds = wordIds.filter(id => !existingWordIdsInDict.has(id));
        
        // 批量插入新关联
        if (newWordIds.length > 0) {
            const sql = 'INSERT INTO dictionary_words (dictionary_id, word_id) VALUES ?';
            const values = newWordIds.map(wordId => [dictionaryId, wordId]);
            await db.query(sql, [values]);
        }
        
        res.json({
            success: true,
            message: '单词批量添加成功',
            added: newWordIds.length,
            skipped: wordIds.length - newWordIds.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '批量添加单词失败',
            error: error.message
        });
    }
});

module.exports = router;