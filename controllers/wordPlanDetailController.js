const db = require('../config/db');

// 向计划中添加单词
const addWordToPlan = async (req, res) => {
  const { planId } = req.params;
  const { wordId } = req.body;
  
  try {
    // 检查计划是否存在
    const planRows = await db.query('SELECT * FROM word_plans WHERE id = ?', [planId]);
    if (planRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '单词计划不存在'
      });
    }
    
    // 检查单词是否已存在
    const existingRows = await db.query(
      'SELECT id FROM word_plan_words WHERE plan_id = ? AND word_id = ?',
      [planId, wordId]
    );
    
    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该单词已在计划中'
      });
    }
    
    // 获取最大排序索引
    const maxRows = await db.query(
      'SELECT COALESCE(MAX(order_index), -1) as max_index FROM word_plan_words WHERE plan_id = ?',
      [planId]
    );
    const newIndex = maxRows[0].max_index + 1;
    
    // 添加单词到计划
    await db.query(
      'INSERT INTO word_plan_words (plan_id, word_id, order_index) VALUES (?, ?, ?)',
      [planId, wordId, newIndex]
    );
    
    // 更新学习进度
    await db.query(
      'UPDATE learning_progress SET total_words = total_words + 1 WHERE plan_id = ?',
      [planId]
    );
    
    res.json({
      success: true,
      message: '单词添加成功'
    });
  } catch (error) {
    console.error('添加单词到计划失败:', error);
    res.status(500).json({
      success: false,
      message: '添加单词到计划失败'
    });
  }
};

// 从计划中移除单词
const removeWordFromPlan = async (req, res) => {
  const { planId, wordId } = req.params;
  
  try {
    // 检查记录是否存在
    const existingRows = await db.query(
      'SELECT id FROM word_plan_words WHERE plan_id = ? AND word_id = ?',
      [planId, wordId]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '计划中未找到该单词'
      });
    }
    
    // 删除记录
    await db.query(
      'DELETE FROM word_plan_words WHERE plan_id = ? AND word_id = ?',
      [planId, wordId]
    );
    
    // 更新学习进度
    await db.query(
      'UPDATE learning_progress SET total_words = total_words - 1 WHERE plan_id = ?',
      [planId]
    );
    
    // 删除相关的学习记录
    await db.query(
      'DELETE FROM learning_records WHERE plan_id = ? AND word_id = ?',
      [planId, wordId]
    );
    
    // 删除错误记录
    await db.query(
      'DELETE FROM error_words WHERE plan_id = ? AND word_id = ?',
      [planId, wordId]
    );
    
    res.json({
      success: true,
      message: '单词从计划中移除成功'
    });
  } catch (error) {
    console.error('从计划中移除单词失败:', error);
    res.status(500).json({
      success: false,
      message: '从计划中移除单词失败'
    });
  }
};

// 获取计划的单词列表
const getPlanWords = async (req, res) => {
  const { planId } = req.params;
  const { page = 1, limit = 50, search = '', learned = 'all' } = req.query;
  
  const offset = (page - 1) * limit;
  
  try {
    let whereConditions = ['wpw.plan_id = ?'];
    let params = [planId];
    
    if (search) {
      whereConditions.push('(w.word LIKE ? OR w.meaning LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (learned === 'learned') {
      whereConditions.push('lr.id IS NOT NULL');
    } else if (learned === 'unlearned') {
      whereConditions.push('lr.id IS NULL');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 获取总数
    const countRows = await db.query(`
      SELECT COUNT(DISTINCT wpw.id) as total
      FROM word_plan_words wpw
      JOIN words w ON wpw.word_id = w.word_id
      LEFT JOIN learning_records lr ON wpw.plan_id = lr.plan_id AND wpw.word_id = lr.word_id
      ${whereClause}
    `, params);
    
    const total = countRows && countRows[0] ? countRows[0].total : 0;
    
    // 获取单词列表
    const rows = await db.query(`
      SELECT 
        wpw.*,
        w.word, w.phonetic, w.meaning, w.difficulty, w.is_mastered,
        w.has_image, w.image_type, w.image_value,
        CASE WHEN lr.id IS NOT NULL THEN 1 ELSE 0 END as is_learned,
        CASE WHEN lr.is_correct = 1 THEN 1 ELSE 0 END as is_correct,
        lr.attempts,
        ew.error_count
      FROM word_plan_words wpw
      JOIN words w ON wpw.word_id = w.word_id
      LEFT JOIN learning_records lr ON wpw.plan_id = lr.plan_id AND wpw.word_id = lr.word_id
      LEFT JOIN error_words ew ON wpw.plan_id = ew.plan_id AND wpw.word_id = ew.word_id
      ${whereClause}
      ORDER BY wpw.order_index
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const items = Array.isArray(rows) ? rows : (rows ? [rows] : []);
    
    res.json({
      success: true,
      data: {
        items: items,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取计划单词列表失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: '获取计划单词列表失败',
      details: {
        error: error.message,
        code: error.code
      }
    });
  }
};

// 记录学习结果
const recordLearning = async (req, res) => {
  const { planId } = req.params;
  const { wordId, isCorrect, userAnswer, attempts = 1 } = req.body;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 记录学习记录
    const [recordResult] = await connection.query(`
      INSERT INTO learning_records (plan_id, word_id, user_answer, is_correct, attempts)
      VALUES (?, ?, ?, ?, ?)
    `, [planId, wordId, userAnswer, isCorrect, attempts]);
    
    // 更新学习进度
    await connection.query(`
      INSERT INTO learning_progress (plan_id, total_words, learned_words, correct_words, error_words)
      VALUES (
        ?,
        (SELECT COUNT(*) FROM word_plan_words WHERE plan_id = ?),
        1,
        ?,
        ?
      )
      ON DUPLICATE KEY UPDATE
        learned_words = learned_words + 1,
        correct_words = correct_words + ?,
        error_words = error_words + ?,
        last_studied_at = CURRENT_TIMESTAMP
    `, [
      planId,
      planId,
      isCorrect ? 1 : 0,
      isCorrect ? 0 : 1,
      isCorrect ? 1 : 0,
      isCorrect ? 0 : 1,
    ]);
    
    // 如果是错误答案，更新错误单词记录
    if (!isCorrect) {
      await connection.query(`
        INSERT INTO error_words (plan_id, word_id, error_count)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE
        error_count = error_count + 1,
        last_error_at = CURRENT_TIMESTAMP
      `, [planId, wordId]);
    }
    
    await connection.commit();
    
    // 返回新创建的学习记录
    const [recordRows] = await connection.query(`
      SELECT * FROM learning_records WHERE id = ?
    `, [recordResult.insertId]);
    
    res.json({
      success: true,
      data: recordRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('记录学习结果失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: '记录学习结果失败'
    });
  } finally {
    connection.release();
  }
};

// 获取学习统计
const getLearningStats = async (req, res) => {
  const { planId } = req.params;
  
  try {
    const statsRows = await db.query(`
      SELECT 
        lp.total_words,
        lp.learned_words,
        lp.correct_words,
        lp.error_words,
        lp.last_studied_at,
        ROUND((lp.correct_words / NULLIF(lp.learned_words, 0)) * 100, 2) as correct_rate,
        (SELECT COUNT(*) FROM word_plan_words WHERE plan_id = ?) as current_words,
        (SELECT COUNT(*) FROM error_words WHERE plan_id = ?) as total_errors
      FROM learning_progress lp
      WHERE lp.plan_id = ?
    `, [planId, planId, planId]);
    
    if (statsRows.length === 0) {
      return res.json({
        success: true,
        data: {
          totalWords: 0,
          learnedWords: 0,
          correctWords: 0,
          errorWords: 0,
          correctRate: 0,
          currentWords: 0,
          totalErrors: 0,
          lastStudiedAt: null
        }
      });
    }
    
    const stats = statsRows[0];
    
    // 获取今日学习统计
    const todayRows = await db.query(`
      SELECT 
        COUNT(*) as today_learned,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as today_correct,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as today_errors
      FROM learning_records
      WHERE plan_id = ? AND DATE(learned_at) = CURDATE()
    `, [planId]);
    
    const todayStats = todayRows[0];
    
    res.json({
      success: true,
      data: {
        ...stats,
        todayLearned: todayStats.today_learned || 0,
        todayCorrect: todayStats.today_correct || 0,
        todayErrors: todayStats.today_errors || 0
      }
    });
  } catch (error) {
    console.error('获取学习统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习统计失败'
    });
  }
};

module.exports = {
  addWordToPlan,
  removeWordFromPlan,
  getPlanWords,
  recordLearning,
  getLearningStats
};
