const mysql = require('mysql2/promise');
require('dotenv').config();

// 验证环境变量
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
  console.error('请检查 .env 文件或环境变量配置');
  process.exit(1);
}

// 创建连接池配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

console.log('📊 数据库配置:');
console.log(`   Host: ${poolConfig.host}`);
console.log(`   Port: ${poolConfig.port}`);
console.log(`   User: ${poolConfig.user}`);
console.log(`   Database: ${poolConfig.database}`);

const pool = mysql.createPool(poolConfig);

// 测试连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(`   错误: ${error.message}`);
    console.error(`   代码: ${error.code}`);
    console.error('\n💡 请检查:');
    console.error('   1. MySQL 服务是否正在运行？');
    console.error('   2. .env 文件中的数据库配置是否正确？');
    console.error('   3. 数据库是否已创建？');
    console.error('   4. 用户是否有访问权限？');
    return false;
  }
};

const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ SQL 查询错误:', error.message);
    throw error;
  }
};

// 导出池和测试函数
module.exports = {
  pool,
  testConnection,
  query
};
