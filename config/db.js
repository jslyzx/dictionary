const mysql = require('mysql2/promise');
require('dotenv').config();

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
  console.error('请检查 .env 文件或环境变量配置');
  process.exit(1);
}

const parseInteger = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInteger(process.env.DB_PORT, 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: parseInteger(process.env.DB_CONNECTION_LIMIT, 20),
  queueLimit: 0,
  connectTimeout: parseInteger(process.env.DB_CONNECT_TIMEOUT, 10000),
  acquireTimeout: parseInteger(process.env.DB_ACQUIRE_TIMEOUT, 10000),
  enableKeepAlive: true,
  keepAliveInitialDelay: parseInteger(process.env.DB_KEEP_ALIVE_INITIAL_DELAY, 0),
};

if (process.env.NODE_ENV !== 'test') {
  console.log('📊 数据库配置:');
  console.log(`   Host: ${poolConfig.host}`);
  console.log(`   Port: ${poolConfig.port}`);
  console.log(`   User: ${poolConfig.user}`);
  console.log(`   Database: ${poolConfig.database}`);
  console.log(`   Connections: ${poolConfig.connectionLimit}`);
}

const RETRYABLE_ERROR_CODES = new Set([
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_SEQUENCE_TIMEOUT',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'PROTOCOL_ENQUEUE_AFTER_QUIT',
  'PROTOCOL_ENQUEUE_HANDSHAKE_TWICE',
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
]);

let poolInstance = createPool();
let reconnectPromise = null;

const poolProxy = new Proxy(
  {},
  {
    get(_, property) {
      if (property === 'getUnderlyingPool') {
        return () => poolInstance;
      }
      const target = poolInstance;
      const value = target[property];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
  },
);

function createPool() {
  const pool = mysql.createPool(poolConfig);

  pool.on('connection', (connection) => {
    connection.on('error', handleConnectionError);
  });

  pool.on('error', handleConnectionError);

  return pool;
}

async function handleConnectionError(error) {
  if (isTransientDatabaseError(error)) {
    console.warn('检测到数据库连接错误，准备重新建立连接池:', error.message);
    try {
      await reconnectPool();
    } catch (reconnectError) {
      console.error('重新建立数据库连接池失败:', reconnectError);
    }
  } else {
    console.error('检测到数据库连接致命错误:', error);
  }
}

function isTransientDatabaseError(error) {
  if (!error) {
    return false;
  }

  if (error.fatal) {
    return true;
  }

  if (error.code && RETRYABLE_ERROR_CODES.has(error.code)) {
    return true;
  }

  if (typeof error.sqlState === 'string' && error.sqlState.startsWith('08')) {
    return true;
  }

  return false;
}

async function reconnectPool() {
  if (reconnectPromise) {
    return reconnectPromise;
  }

  reconnectPromise = (async () => {
    const previousPool = poolInstance;
    const nextPool = createPool();
    let connection;

    try {
      connection = await nextPool.getConnection();
      await connection.ping();
      console.info('✅ 新的数据库连接池已建立');
    } catch (error) {
      if (connection) {
        try {
          connection.release();
        } catch (_) {
          // ignore release errors for failed connections
        }
      }
      await nextPool.end().catch(() => {});
      throw error;
    }

    if (connection) {
      try {
        connection.release();
      } catch (_) {
        // ignore release errors
      }
    }

    poolInstance = nextPool;

    if (previousPool) {
      try {
        await previousPool.end();
      } catch (closeError) {
        console.error('关闭旧的数据库连接池时出错:', closeError.message);
      }
    }
  })();

  try {
    await reconnectPromise;
  } finally {
    reconnectPromise = null;
  }
}

async function getConnection() {
  try {
    return await poolInstance.getConnection();
  } catch (error) {
    if (isTransientDatabaseError(error)) {
      await reconnectPool();
      return poolInstance.getConnection();
    }
    throw error;
  }
}

async function executeWithRetry(sql, params = [], options = {}) {
  const { retries = 2, retryDelay = 200 } = options;
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    let connection;
    try {
      connection = await getConnection();
      const [rows, fields] = await connection.execute(sql, params);
      return [rows, fields];
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt === retries) {
        throw error;
      }

      attempt += 1;
      const delay =
        typeof retryDelay === 'function'
          ? retryDelay(attempt, error)
          : retryDelay * attempt;

      console.warn(
        `数据库操作失败，准备第 ${attempt} 次重试: ${error.message}`,
      );

      try {
        await reconnectPool();
      } catch (reconnectError) {
        console.error('重建数据库连接池失败:', reconnectError);
      }

      await sleep(delay);
    } finally {
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error('释放数据库连接时出错:', releaseError);
        }
      }
    }
  }

  throw lastError;
}

async function query(sql, params = [], options = {}) {
  const [rows] = await executeWithRetry(sql, params, options);
  return rows;
}

async function checkConnection() {
  let connection;
  try {
    connection = await getConnection();
    await connection.ping();
    return true;
  } catch (error) {
    if (isTransientDatabaseError(error)) {
      console.warn('数据库连接健康检查失败，尝试重新建立连接:', error.message);
      await reconnectPool();
      return false;
    }
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (_) {
        // ignore release errors
      }
    }
  }
}

async function testConnection() {
  try {
    const healthy = await checkConnection();
    if (healthy) {
      console.log('✅ 数据库连接成功');
    } else {
      console.warn('⚠️ 数据库连接已重新建立');
    }
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(`   错误: ${error.message}`);
    if (error.code) {
      console.error(`   代码: ${error.code}`);
    }
    console.error('\n💡 请检查:');
    console.error('   1. MySQL 服务是否正在运行？');
    console.error('   2. .env 文件中的数据库配置是否正确？');
    console.error('   3. 数据库是否已创建？');
    console.error('   4. 用户是否有访问权限？');
    return false;
  }
}

module.exports = {
  pool: poolProxy,
  query,
  testConnection,
  executeWithRetry,
  checkConnection,
  getConnection,
  isTransientDatabaseError,
};
