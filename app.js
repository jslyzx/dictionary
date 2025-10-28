// 主应用文件
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./database');

// 创建Express应用
const app = express();
const PORT = config.server.port || 3000;
const HOST = config.server.host || 'localhost';

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'frontend')));

// API路由
const dictionariesRouter = require('./backend/api/dictionaries');
const wordsRouter = require('./backend/api/words');
const dictionaryWordsRouter = require('./backend/api/dictionary_words');

// 注册路由
app.use('/api/dictionaries', dictionariesRouter);
app.use('/api/words', wordsRouter);
app.use('/api/dictionary', dictionaryWordsRouter);

// 主页面路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// 其他页面路由（SPA路由支持）
app.get('/dictionaries', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dictionaries.html'));
});

app.get('/words', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'words.html'));
});

app.get('/word_search', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'word_search.html'));
});

// 404处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// 启动服务器
async function startServer() {
    try {
        // 测试数据库连接
        await db.testConnection();
        console.log('数据库连接成功');

        // 启动服务器
        app.listen(PORT, HOST, () => {
            console.log(`服务器运行在 http://${HOST}:${PORT}`);
            console.log('API文档:');
            console.log('  - GET    /api/dictionaries    - 获取所有字典');
            console.log('  - GET    /api/dictionaries/:id - 获取单个字典');
            console.log('  - POST   /api/dictionaries    - 创建字典');
            console.log('  - PUT    /api/dictionaries/:id - 更新字典');
            console.log('  - DELETE /api/dictionaries/:id - 删除字典');
            console.log('  - GET    /api/words           - 获取所有单词');
            console.log('  - GET    /api/words/:id       - 获取单个单词');
            console.log('  - POST   /api/words           - 创建单词');
            console.log('  - PUT    /api/words/:id       - 更新单词');
            console.log('  - DELETE /api/words/:id       - 删除单词');
            console.log('  - GET    /api/words/search    - 搜索单词');
        });
    } catch (error) {
        console.error('启动服务器失败:', error.message);
        process.exit(1);
    }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('正在关闭服务器...');
    await db.close();
    console.log('服务器已关闭');
    process.exit(0);
});