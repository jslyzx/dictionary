require('dotenv').config({ path: '.env' });

const { testConnection } = require('./config/db');
const app = require('./app');

const startServer = async () => {
  // 测试数据库连接
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ 无法启动服务器：数据库连接失败');
    process.exit(1);
  }
  
  // 启动 Express 服务器
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  });
};

startServer();
