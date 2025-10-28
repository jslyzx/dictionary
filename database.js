// 数据库连接模块
const mysql = require('mysql2/promise');
const config = require('./config');

// 创建数据库连接池
const pool = mysql.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    port: config.database.port,
    connectionLimit: config.database.connectionLimit,
    waitForConnections: true,
    queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功！');
        connection.release();
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        return false;
    }
}

// 执行SQL查询
async function query(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('SQL查询错误:', error.message);
        throw error;
    }
}

// 执行事务
async function transaction(callback) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        console.error('事务执行失败:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}

// 关闭连接池
async function closePool() {
    try {
        await pool.end();
        console.log('数据库连接池已关闭');
    } catch (error) {
        console.error('关闭连接池失败:', error.message);
    }
}

module.exports = {
    pool,
    testConnection,
    query,
    transaction,
    closePool
};