// 字典相关API路由
const express = require('express');
const router = express.Router();
const db = require('../../database');

// 获取所有字典
router.get('/', async (req, res) => {
    try {
        const sql = 'SELECT * FROM dictionaries ORDER BY created_at DESC';
        const dictionaries = await db.query(sql);
        res.json({
            success: true,
            data: dictionaries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取字典列表失败',
            error: error.message
        });
    }
});

// 获取单个字典
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM dictionaries WHERE dictionary_id = ?';
        const dictionaries = await db.query(sql, [id]);

        if (dictionaries.length === 0) {
            return res.status(404).json({
                success: false,
                message: '字典不存在'
            });
        }

        res.json({
            success: true,
            data: dictionaries[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取字典失败',
            error: error.message
        });
    }
});

// 创建字典
router.post('/', async (req, res) => {
    try {
        const { name, description, is_enabled = 1, is_mastered = 0 } = req.body;

        // 验证必填字段
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '字典名称不能为空'
            });
        }

        // 检查字典名称是否已存在
        const checkSql = 'SELECT * FROM dictionaries WHERE name = ?';
        const existing = await db.query(checkSql, [name]);

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '字典名称已存在'
            });
        }

        // 插入新字典
        const insertSql = 'INSERT INTO dictionaries (name, description, is_enabled, is_mastered) VALUES (?, ?, ?, ?)';
        const result = await db.query(insertSql, [name, description || '', is_enabled, is_mastered]);

        res.json({
            success: true,
            message: '字典创建成功',
            data: {
                dictionary_id: result.insertId,
                name,
                description,
                is_enabled,
                is_mastered
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建字典失败',
            error: error.message
        });
    }
});

// 更新字典
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_enabled, is_mastered } = req.body;

        // 检查字典是否存在
        const checkSql = 'SELECT * FROM dictionaries WHERE dictionary_id = ?';
        const existing = await db.query(checkSql, [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '字典不存在'
            });
        }

        // 检查新名称是否与其他字典冲突
        if (name && name !== existing[0].name) {
            const nameCheckSql = 'SELECT * FROM dictionaries WHERE name = ? AND dictionary_id != ?';
            const nameConflict = await db.query(nameCheckSql, [name, id]);

            if (nameConflict.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '字典名称已存在'
                });
            }
        }

        // 构建更新SQL
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
        if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
        if (is_enabled !== undefined) { updateFields.push('is_enabled = ?'); updateValues.push(is_enabled); }
        if (is_mastered !== undefined) { updateFields.push('is_mastered = ?'); updateValues.push(is_mastered); }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有需要更新的字段'
            });
        }

        updateValues.push(id);
        const updateSql = `UPDATE dictionaries SET ${updateFields.join(', ')}, updated_at = NOW() WHERE dictionary_id = ?`;

        await db.query(updateSql, updateValues);

        // 获取更新后的字典
        const updatedDictionary = await db.query(checkSql, [id]);

        res.json({
            success: true,
            message: '字典更新成功',
            data: updatedDictionary[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新字典失败',
            error: error.message
        });
    }
});

// 删除字典
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 检查字典是否存在
        const checkSql = 'SELECT * FROM dictionaries WHERE dictionary_id = ?';
        const existing = await db.query(checkSql, [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '字典不存在'
            });
        }

        // 使用事务删除字典及其关联数据
        await db.transaction(async (connection) => {
            // 删除字典单词关联
            await connection.execute('DELETE FROM dictionary_words WHERE dictionary_id = ?', [id]);
            // 删除字典
            await connection.execute('DELETE FROM dictionaries WHERE dictionary_id = ?', [id]);
        });

        res.json({
            success: true,
            message: '字典删除成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除字典失败',
            error: error.message
        });
    }
});

// 获取字典中的单词
router.get('/:id/words', async (req, res) => {
    try {
        const { id } = req.params;

        // 检查字典是否存在
        const checkSql = 'SELECT * FROM dictionaries WHERE dictionary_id = ?';
        const existing = await db.query(checkSql, [id]);

        if (existing.length === 0) {
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

        const words = await db.query(sql, [id]);

        res.json({
            success: true,
            data: words
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取字典单词失败',
            error: error.message
        });
    }
});

module.exports = router;