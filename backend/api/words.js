// 单词相关API路由
const express = require('express');
const router = express.Router();
const db = require('../../database');

// 获取所有单词
router.get('/', async (req, res) => {
    try {
        const { dictionary_id } = req.query;
        let sql = 'SELECT * FROM words ';
        const params = [];
        
        // 如果指定了字典ID，过滤该字典中的单词
        if (dictionary_id) {
            sql = `
                SELECT w.* 
                FROM words w
                JOIN dictionary_words dw ON w.word_id = dw.word_id
                WHERE dw.dictionary_id = ?
            `;
            params.push(dictionary_id);
        }
        
        sql += ' ORDER BY w.word ASC';
        
        const words = await db.query(sql, params);
        res.json({
            success: true,
            data: words
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取单词列表失败',
            error: error.message
        });
    }
});

// 获取单个单词
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM words WHERE word_id = ?';
        const words = await db.query(sql, [id]);
        
        if (words.length === 0) {
            return res.status(404).json({
                success: false,
                message: '单词不存在'
            });
        }
        
        // 获取单词所属的字典
        const dictSql = `
            SELECT d.dictionary_id, d.name 
            FROM dictionaries d
            JOIN dictionary_words dw ON d.dictionary_id = dw.dictionary_id
            WHERE dw.word_id = ?
        `;
        const dictionaries = await db.query(dictSql, [id]);
        
        res.json({
            success: true,
            data: {
                ...words[0],
                dictionaries: dictionaries
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取单词失败',
            error: error.message
        });
    }
});

// 创建单词
router.post('/', async (req, res) => {
    try {
        const { word, phonetic, meaning, pronunciation1, pronunciation2, pronunciation3, dictionaries = [] } = req.body;
        
        // 验证必填字段
        if (!word || !phonetic || !meaning) {
            return res.status(400).json({
                success: false,
                message: '单词、音标和释义不能为空'
            });
        }
        
        // 检查单词是否已存在
        const checkSql = 'SELECT * FROM words WHERE word = ?';
        const existing = await db.query(checkSql, [word]);
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '单词已存在'
            });
        }
        
        // 使用事务插入单词及其关联
        const result = await db.transaction(async (connection) => {
            // 插入新单词
            const insertSql = 'INSERT INTO words (word, phonetic, meaning, pronunciation1, pronunciation2, pronunciation3) VALUES (?, ?, ?, ?, ?, ?)';
            const [insertResult] = await connection.execute(insertSql, [
                word, phonetic, meaning, pronunciation1 || null, pronunciation2 || null, pronunciation3 || null
            ]);
            
            const wordId = insertResult.insertId;
            
            // 添加单词与字典的关联
            if (dictionaries.length > 0) {
                const relationSql = 'INSERT INTO dictionary_words (dictionary_id, word_id) VALUES (?, ?)';
                for (const dictId of dictionaries) {
                    await connection.execute(relationSql, [dictId, wordId]);
                }
            }
            
            return { wordId };
        });
        
        // 获取创建的单词
        const createdWord = await db.query('SELECT * FROM words WHERE word_id = ?', [result.wordId]);
        
        res.json({
            success: true,
            message: '单词创建成功',
            data: createdWord[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建单词失败',
            error: error.message
        });
    }
});

// 更新单词
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { word, phonetic, meaning, pronunciation1, pronunciation2, pronunciation3, dictionaries } = req.body;
        
        // 检查单词是否存在
        const checkSql = 'SELECT * FROM words WHERE word_id = ?';
        const existing = await db.query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '单词不存在'
            });
        }
        
        // 使用事务更新单词及其关联
        await db.transaction(async (connection) => {
            // 构建更新SQL
            const updateFields = [];
            const updateValues = [];
            
            if (word !== undefined) { updateFields.push('word = ?'); updateValues.push(word); }
            if (phonetic !== undefined) { updateFields.push('phonetic = ?'); updateValues.push(phonetic); }
            if (meaning !== undefined) { updateFields.push('meaning = ?'); updateValues.push(meaning); }
            if (pronunciation1 !== undefined) { updateFields.push('pronunciation1 = ?'); updateValues.push(pronunciation1 || null); }
            if (pronunciation2 !== undefined) { updateFields.push('pronunciation2 = ?'); updateValues.push(pronunciation2 || null); }
            if (pronunciation3 !== undefined) { updateFields.push('pronunciation3 = ?'); updateValues.push(pronunciation3 || null); }
            
            // 更新单词
            if (updateFields.length > 0) {
                updateValues.push(id);
                const updateSql = `UPDATE words SET ${updateFields.join(', ')} WHERE word_id = ?`;
                await connection.execute(updateSql, updateValues);
            }
            
            // 更新单词与字典的关联
            if (dictionaries !== undefined) {
                // 删除旧的关联
                await connection.execute('DELETE FROM dictionary_words WHERE word_id = ?', [id]);
                
                // 添加新的关联
                if (dictionaries.length > 0) {
                    const relationSql = 'INSERT INTO dictionary_words (dictionary_id, word_id) VALUES (?, ?)';
                    for (const dictId of dictionaries) {
                        await connection.execute(relationSql, [dictId, id]);
                    }
                }
            }
        });
        
        // 获取更新后的单词
        const updatedWord = await db.query(checkSql, [id]);
        
        res.json({
            success: true,
            message: '单词更新成功',
            data: updatedWord[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新单词失败',
            error: error.message
        });
    }
});

// 删除单词
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查单词是否存在
        const checkSql = 'SELECT * FROM words WHERE word_id = ?';
        const existing = await db.query(checkSql, [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '单词不存在'
            });
        }
        
        // 使用事务删除单词及其关联
        await db.transaction(async (connection) => {
            // 删除字典单词关联
            await connection.execute('DELETE FROM dictionary_words WHERE word_id = ?', [id]);
            // 删除单词
            await connection.execute('DELETE FROM words WHERE word_id = ?', [id]);
        });
        
        res.json({
            success: true,
            message: '单词删除成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除单词失败',
            error: error.message
        });
    }
});

// 搜索单词
router.get('/search', async (req, res) => {
    try {
        const { keyword, type = 'exact', dictionary_id } = req.query;
        
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: '搜索关键词不能为空'
            });
        }
        
        let sql = 'SELECT w.* FROM words w ';
        const params = [];
        
        // 如果指定了字典ID，加入JOIN条件
        if (dictionary_id) {
            sql += 'JOIN dictionary_words dw ON w.word_id = dw.word_id ';
            sql += 'WHERE dw.dictionary_id = ? ';
            params.push(dictionary_id);
        } else {
            sql += 'WHERE ';
        }
        
        // 根据搜索类型添加条件
        if (type === 'exact') {
            sql += 'w.word = ? ';
            params.push(keyword);
        } else { // contains
            sql += 'w.word LIKE ? ';
            params.push(`%${keyword}%`);
        }
        
        sql += 'ORDER BY w.word ASC';
        
        const results = await db.query(sql, params);
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '搜索单词失败',
            error: error.message
        });
    }
});

module.exports = router;