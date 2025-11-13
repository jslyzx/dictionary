const db = require('../config/db');

// 获取所有单词计划
const getWordPlans = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT wp.*, 
             COUNT(wpw.id) as word_count,
             COALESCE(lp.learned_words, 0) as learned_words,
             COALESCE(lp.correct_words, 0) as correct_words,
             COALESCE(lp.error_words, 0) as error_words
      FROM word_plans wp
      LEFT JOIN word_plan_words wpw ON wp.id = wpw.plan_id
      LEFT JOIN learning_progress lp ON wp.id = lp.plan_id
      GROUP BY wp.id
      ORDER BY wp.created_at DESC
    `);
    
    console.log('[getWordPlans] isArray:', Array.isArray(rows), 'length:', Array.isArray(rows) ? rows.length : 'n/a');
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取单词计划失败:', error);
    res.status(500).json({
      success: false,
      message: '获取单词计划失败'
    });
  }
};

// 获取单个单词计划详情
const getWordPlan = async (req, res) => {
  const { id } = req.params;
  
  try {
    // 获取计划基本信息
    const planRows = await db.query('SELECT * FROM word_plans WHERE id = ?', [id]);
    
    if (planRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '单词计划不存在'
      });
    }
    
    const plan = planRows[0];
    
    // 获取计划中的单词
    const wordRows = await db.query(`
      SELECT wpw.*, w.word, w.phonetic, w.meaning, w.has_image, w.image_type, w.image_value, w.difficulty, w.is_mastered
      FROM word_plan_words wpw
      JOIN words w ON wpw.word_id = w.word_id
      WHERE wpw.plan_id = ?
      ORDER BY wpw.order_index
    `, [id]);
    
    console.log('数据库查询结果:', wordRows);
    console.log('查询结果类型:', Array.isArray(wordRows) ? '数组' : '单个对象');
    if (wordRows && wordRows.length > 0) {
      console.log('第一个单词数据:', wordRows[0]);
    }
    
    // 确保words总是数组并进行字段映射
    const rawWords = Array.isArray(wordRows) ? wordRows : [wordRows];
    const words = rawWords.map(word => ({
      id: word.id,
      planId: word.plan_id,
      wordId: word.word_id,
      orderIndex: word.order_index,
      addedAt: word.added_at,
      word: {
        id: word.word_id,
        word: word.word,
        phonetic: word.phonetic,
        meaning: word.meaning,
        hasImage: word.has_image === 1,
        imageType: word.image_type,
        imageValue: word.image_value,
        difficulty: word.difficulty,
        isMastered: word.is_mastered === 1
      },
      isLearned: word.is_learned === 1,
      isCorrect: word.is_correct === 1,
      attempts: word.attempts,
      errorCount: word.error_count
    }));
    
    console.log('映射后的单词数据:', words);
    if (words.length > 0) {
      console.log('映射后第一个单词:', words[0]);
    }
    
    // 获取学习进度
    const progressRows = await db.query('SELECT * FROM learning_progress WHERE plan_id = ?', [id]);
    const progress = progressRows.length > 0 ? progressRows[0] : null;
    
    // 计算统计数据
    const stats = {
      totalWords: words.length,
      learnedWords: progress ? progress.learned_words : 0,
      remainingWords: words.length - (progress ? progress.learned_words : 0),
      correctRate: progress && progress.learned_words > 0 ? 
        Math.round((progress.correct_words / progress.learned_words) * 100) : 0,
      errorWords: progress ? progress.error_words : 0,
      dailyProgress: progress && plan.daily_word_count > 0 ? 
        Math.min(100, Math.round((progress.learned_words / plan.daily_word_count) * 100)) : 0
    };
    
    res.json({
      success: true,
      data: {
        ...plan,
        words: words,
        progress,
        stats
      }
    });
  } catch (error) {
    console.error('获取单词计划详情失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: '获取单词计划详情失败',
      details: {
        error: error.message,
        code: error.code
      }
    });
  }
};

// 创建单词计划
const createWordPlan = async (req, res) => {
  const { name, description, mode, targetWordCount, dailyWordCount, wordIds } = req.body;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 创建计划
    const [result] = await connection.query(`
      INSERT INTO word_plans (name, description, mode, target_word_count, daily_word_count)
      VALUES (?, ?, ?, ?, ?)
    `, [name, description, mode, targetWordCount, dailyWordCount]);
    
    const planId = result.insertId;
    
    // 添加单词到计划
    if (wordIds && wordIds.length > 0) {
      const wordPlanWords = wordIds.map((wordId, index) => [planId, wordId, index]);
      await connection.query(`
        INSERT INTO word_plan_words (plan_id, word_id, order_index)
        VALUES ?
      `, [wordPlanWords]);
    }
    
    // 创建学习进度记录
    await connection.query(`
      INSERT INTO learning_progress (plan_id, total_words)
      VALUES (?, ?)
    `, [planId, wordIds.length]);
    
    await connection.commit();
    
    // 返回完整的计划信息
    const [planRows] = await connection.query('SELECT * FROM word_plans WHERE id = ?', [planId]);
    
    res.json({
      success: true,
      data: planRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建单词计划失败:', error);
    res.status(500).json({
      success: false,
      message: '创建单词计划失败'
    });
  } finally {
    connection.release();
  }
};

// 更新单词计划
const updateWordPlan = async (req, res) => {
  const { id } = req.params;
  const { name, description, mode, targetWordCount, dailyWordCount, status } = req.body;
  
  try {
    const result = await db.query(`
      UPDATE word_plans 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          mode = COALESCE(?, mode),
          target_word_count = COALESCE(?, target_word_count),
          daily_word_count = COALESCE(?, daily_word_count),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, mode, targetWordCount, dailyWordCount, status, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '单词计划不存在'
      });
    }
    
    // 如果激活该计划，禁用其他计划
    if (status === 'active') {
      await db.query(`
        UPDATE word_plans 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE id != ? AND status = 'active'
      `, [id]);
    }
    
    const planRows = await db.query('SELECT * FROM word_plans WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: planRows[0]
    });
  } catch (error) {
    console.error('更新单词计划失败:', error);
    res.status(500).json({
      success: false,
      message: '更新单词计划失败'
    });
  }
};

// 删除单词计划
const deleteWordPlan = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query('DELETE FROM word_plans WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '单词计划不存在'
      });
    }
    
    res.json({
      success: true,
      message: '单词计划删除成功'
    });
  } catch (error) {
    console.error('删除单词计划失败:', error);
    res.status(500).json({
      success: false,
      message: '删除单词计划失败'
    });
  }
};

// 激活单词计划
const activateWordPlan = async (req, res) => {
  const { id } = req.params;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 禁用所有其他计划
    await connection.query(`
      UPDATE word_plans 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'active'
    `);
    
    // 激活指定计划
    const [result] = await connection.query(`
      UPDATE word_plans 
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '单词计划不存在'
      });
    }
    
    await connection.commit();
    
    const [planRows] = await connection.query('SELECT * FROM word_plans WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: planRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('激活单词计划失败:', error);
    res.status(500).json({
      success: false,
      message: '激活单词计划失败'
    });
  } finally {
    connection.release();
  }
};

// 获取活跃计划
const getActiveWordPlan = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM word_plans WHERE status = "active" LIMIT 1');
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '没有激活的单词计划'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('获取活跃计划失败:', error);
    res.status(500).json({
      success: false,
      message: '获取活跃计划失败'
    });
  }
};

module.exports = {
  getWordPlans,
  getWordPlan,
  createWordPlan,
  updateWordPlan,
  deleteWordPlan,
  activateWordPlan,
  getActiveWordPlan
};
