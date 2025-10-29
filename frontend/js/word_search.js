// 单词查询页面的JavaScript逻辑 - 原生JS版本

// 全局数据
let dictionaries = [];

// 从数据库API获取数据，不使用模拟数据

// DOM元素引用
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const resultsContent = document.getElementById('results-content');
const wordDetails = document.getElementById('word-details');
const recommendedWords = document.getElementById('recommended-words');
const recommendationsContainer = document.getElementById('recommendations-container');
const dictionaryFilter = document.getElementById('dictionary-filter');
    
// API请求函数 - 仅从数据库获取数据
async function apiRequest(url, options = {}) {
    console.log('从数据库获取数据:', url);
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }
    
    return await response.json();
}

// 不再使用模拟数据，所有数据将直接从API获取

// 初始化页面
async function initWordSearchPage() {
    showLoading(true);
    
    try {
        // 加载字典过滤下拉框
        await loadDictionaryFilter();
        
        // 绑定事件
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
        
        // 自动获取焦点
        searchInput.focus();
    } catch (error) {
        console.error('初始化页面失败:', error);
        showAlert('页面初始化失败', 'error');
    } finally {
        showLoading(false);
    }
}

// 加载字典过滤下拉框
async function loadDictionaryFilter() {
    try {
        const result = await apiRequest('/api/dictionaries');
        dictionaries = result.data || [];
        
        // 清空并重新添加选项
        dictionaryFilter.innerHTML = '';
        
        // 创建默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '0';
        defaultOption.textContent = '全部字典';
        dictionaryFilter.appendChild(defaultOption);
        
        // 添加字典选项
        dictionaries.forEach(dict => {
            const option = document.createElement('option');
            option.value = dict.dictionary_id;
            option.textContent = dict.name;
            dictionaryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('加载字典下拉框失败:', error);
        showAlert('加载字典列表失败', 'error');
    }
}

// 处理搜索
async function handleSearch() {
    const keyword = searchInput.value.trim();
    if (!keyword) {
        showAlert('请输入要查询的单词', 'info');
        return;
    }
    
    showLoading(true);
    
    try {
        // 获取搜索类型和字典过滤条件
        const searchTypeElements = document.querySelectorAll('input[name="search-type"]:checked');
        const searchType = searchTypeElements.length > 0 ? searchTypeElements[0].value : 'exact';
        const selectedDictionaryId = parseInt(dictionaryFilter.value);
        
        // 执行搜索
        const results = await searchWords(keyword, searchType, selectedDictionaryId);
        
        // 显示结果
        await displayResults(results, keyword);
    } catch (error) {
        console.error('搜索失败:', error);
        showAlert('搜索失败: ' + error.message, 'error');
        searchResults.style.display = 'block';
        resultsContent.innerHTML = '<div style="text-align: center; padding: 40px; background-color: #f9f9f9;">搜索过程中发生错误，请稍后重试。</div>';
    } finally {
        showLoading(false);
    }
}

// 搜索单词
async function searchWords(keyword, searchType, dictionaryId) {
    try {
        // 构建API请求
        let endpoint = '/api/words/search';
        const params = new URLSearchParams({
            term: keyword,
            type: searchType
        });
        
        if (dictionaryId > 0) {
            endpoint = `/api/dictionary/${dictionaryId}/words`;
            params.delete('type'); // 特定字典的单词API不需要type参数
        }
        
        const result = await apiRequest(`${endpoint}?${params.toString()}`);
        return result.data || [];
    } catch (error) {
        console.error('单词搜索失败:', error);
        throw error;
    }
}

// 显示搜索结果
async function displayResults(results, keyword) {
    // 隐藏之前的结果和详情
    wordDetails.style.display = 'none';
    recommendedWords.style.display = 'none';
    
    if (results.length === 0) {
        // 无结果
        searchResults.style.display = 'block';
        resultsContent.innerHTML = '<div style="text-align: center; padding: 40px; background-color: #f9f9f9;">未找到相关单词，请尝试其他关键词。</div>';
    } else if (results.length === 1) {
        // 单个结果，直接显示详情
        searchResults.style.display = 'none';
        await showWordDetails(results[0]);
        await showRecommendations(results[0], keyword);
    } else {
        // 多个结果，显示列表
        searchResults.style.display = 'block';
        renderResultsList(results);
    }
}

// 渲染结果列表
function renderResultsList(results) {
    // 构建表格HTML
    const tableHtml = `
        <table class="result-table">
            <thead>
                <tr>
                    <th>单词</th>
                    <th>音标</th>
                    <th>释义</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(word => `
                    <tr>
                        <td>${word.word}</td>
                        <td>${word.phonetic || '-'}</td>
                        <td>${word.meaning}</td>
                        <td>
                            <button class="view-detail-btn" data-id="${word.word_id}">
                                查看详情
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    resultsContent.innerHTML = tableHtml;
    
    // 添加点击事件
    const detailButtons = document.querySelectorAll('.view-detail-btn');
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            const wordId = parseInt(this.getAttribute('data-id'));
            const word = results.find(w => w.word_id === wordId);
            if (word) {
                searchResults.style.display = 'none';
                showWordDetails(word);
                showRecommendations(word, word.word);
            }
        });
    });
}

// 显示单词详情
async function showWordDetails(word) {
    showLoading(true);
    
    try {
        // 调用API获取单词详情
        const result = await apiRequest(`/words/${word.word_id}`);
        const wordData = result.data;
        
        // 构建发音按钮
        let pronunciationHtml = '';
        if (wordData.pronunciation1 || wordData.pronunciation2 || wordData.pronunciation3) {
            pronunciationHtml = '<div class="pronunciation-container">';
            if (wordData.pronunciation1) {
                pronunciationHtml += `<button class="pronunciation-btn" data-url="${wordData.pronunciation1}">英音 <i class="speaker-icon"></i></button>`;
            }
            if (wordData.pronunciation2) {
                pronunciationHtml += `<button class="pronunciation-btn" data-url="${wordData.pronunciation2}">美音 <i class="speaker-icon"></i></button>`;
            }
            if (wordData.pronunciation3) {
                pronunciationHtml += `<button class="pronunciation-btn" data-url="${wordData.pronunciation3}">例句 <i class="speaker-icon"></i></button>`;
            }
            pronunciationHtml += '</div>';
        } else {
            pronunciationHtml = '<div class="pronunciation-container"><span class="no-pronunciation">暂无发音数据</span></div>';
        }
        
        wordDetails.innerHTML = `
            <div class="word-detail-container">
                <div class="word-header">
                    <h2>${wordData.word}</h2>
                    <span class="phonetic">${wordData.phonetic}</span>
                </div>
                
                <div class="detail-item">
                    <label>中文释义：</label>
                    <div class="detail-content">
                        <p>${wordData.meaning}</p>
                    </div>
                </div>
                
                <div class="detail-item">
                    <label>发音：</label>
                    ${pronunciationHtml}
                </div>
                
                <div class="detail-item">
                    <label>创建时间：</label>
                    <div class="detail-content">
                        <p>${wordData.created_at}</p>
                    </div>
                </div>
                
                <div class="detail-item">
                    <label>所属字典：</label>
                    <div class="detail-content">
                        <p>
                            ${wordData.dictionaries && wordData.dictionaries.length > 0 ?
                                wordData.dictionaries.map(d => d.name).join(', ') : '未分配到任何字典'
                            }
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定发音按钮事件
        const pronunciationButtons = wordDetails.querySelectorAll('.pronunciation-btn');
        pronunciationButtons.forEach(button => {
            button.addEventListener('click', function() {
                const audioUrl = this.getAttribute('data-url');
                playPronunciation(audioUrl);
            });
        });
        
        wordDetails.style.display = 'block';
    } catch (error) {
        console.error('获取单词详情失败:', error);
        wordDetails.innerHTML = `<div style="text-align: center; padding: 40px; background-color: #f9f9f9;">加载单词详情失败: ${error.message}</div>`;
        wordDetails.style.display = 'block';
    } finally {
        showLoading(false);
    }
}

// 显示推荐单词
async function showRecommendations(currentWord, keyword) {
    try {
        // 调用API获取推荐单词
        const result = await apiRequest(`/words/recommend/${currentWord.word_id}`);
        const recommendations = result.data || [];
        
        if (recommendations.length > 0) {
            recommendationsContainer.innerHTML = '';
            
            // 创建推荐单词容器
            const row = document.createElement('div');
            row.className = 'recommendation-row';
            
            // 最多显示6个推荐
            recommendations.slice(0, 6).forEach((word, index) => {
                const card = document.createElement('div');
                card.className = 'recommendation-card';
                card.innerHTML = `
                    <h4>${word.word}</h4>
                    <p class="card-phonetic">${word.phonetic}</p>
                    <p class="card-meaning">${word.meaning}</p>
                    <button class="view-recommendation-btn" data-id="${word.word_id}">
                        查看详情
                    </button>
                `;
                row.appendChild(card);
            });
            
            recommendationsContainer.appendChild(row);
            
            // 绑定推荐单词点击事件
            const recommendationButtons = document.querySelectorAll('.view-recommendation-btn');
            recommendationButtons.forEach(button => {
                button.addEventListener('click', async function() {
                    const wordId = parseInt(this.getAttribute('data-id'));
                    const word = recommendations.find(w => w.word_id === wordId);
                    if (word) {
                        await showWordDetails(word);
                        await showRecommendations(word, word.word);
                    }
                });
            });
            
            recommendedWords.style.display = 'block';
        }
    } catch (error) {
        console.error('获取推荐单词失败:', error);
        // 推荐失败不影响主功能，所以不显示错误
    }
}

// 模拟发音播放
function simulatePlayPronunciation(word) {
    showAlert(`正在播放 "${word}" 的发音`, 'info');
    // 在真实环境中，这里会播放实际的音频文件
}

// 播放发音
function playPronunciation(audioUrl) {
    if (audioUrl.includes('example.com')) {
        // 对于示例URL，模拟播放
        const word = audioUrl.split('/').pop().split('-')[0];
        simulatePlayPronunciation(word);
    } else {
        // 对于真实URL，使用原始函数播放
        try {
            const audio = new Audio(audioUrl);
            audio.play().catch(error => {
                console.error('播放发音失败:', error);
                showAlert('发音播放失败', 'error');
            });
        } catch (e) {
            showAlert('发音播放失败', 'error');
        }
    }
}

// 显示加载状态
function showLoading(show) {
    // 简单的加载动画实现
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (!loadingOverlay && show) {
        // 创建加载层
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>加载中...</span>
            </div>
        `;
        document.body.appendChild(overlay);
    } else if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// 显示提示信息
function showAlert(msg, type = 'info') {
    // 简单的提示框实现
    const alertBox = document.createElement('div');
    alertBox.className = `alert-message alert-${type}`;
    alertBox.textContent = msg;
    document.body.appendChild(alertBox);
    
    // 添加动画样式
    setTimeout(() => {
        alertBox.classList.add('show');
    }, 10);
    
    // 2秒后移除
    setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(alertBox);
        }, 300);
    }, 2000);
}

// 从API加载数据 - 保持兼容性
async function loadDataFromStorage() {
    // 此函数名称保持不变以兼容初始化逻辑
    // 但实现改为调用API加载字典
    // 字典加载已在initWordSearchPage中处理
}

// 初始化页面
initWordSearchPage();

// 添加必要的CSS样式
const style = document.createElement('style');
style.textContent = `
    /* 加载动画样式 */
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    
    .loading-spinner {
        text-align: center;
    }
    
    .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #1890ff;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* 提示框样式 */
    .alert-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-50px);
        background-color: #f0f0f0;
        color: #333;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .alert-message.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
    
    .alert-success {
        background-color: #52c41a;
        color: white;
    }
    
    .alert-error {
        background-color: #ff4d4f;
        color: white;
    }
    
    .alert-warning {
        background-color: #faad14;
        color: white;
    }
    
    /* 结果表格样式 */
    .result-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }
    
    .result-table th,
    .result-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e8e8e8;
    }
    
    .result-table th {
        background-color: #fafafa;
        font-weight: 600;
    }
    
    .result-table tr:hover {
        background-color: #f5f5f5;
    }
    
    /* 详情页面样式 */
    .word-detail-container {
        padding: 20px;
    }
    
    .word-header {
        border-bottom: 1px solid #e8e8e8;
        padding-bottom: 15px;
        margin-bottom: 20px;
    }
    
    .word-header h2 {
        display: inline-block;
        margin: 0;
        font-size: 32px;
    }
    
    .phonetic {
        margin-left: 15px;
        color: #666;
        font-size: 18px;
    }
    
    .detail-item {
        margin-bottom: 20px;
    }
    
    .detail-item label {
        display: inline-block;
        width: 120px;
        font-weight: 600;
        vertical-align: top;
    }
    
    .detail-content {
        display: inline-block;
        width: calc(100% - 130px);
    }
    
    .detail-content p {
        line-height: 1.6;
        margin: 0;
    }
    
    /* 发音按钮样式 */
    .pronunciation-container {
        display: inline-block;
    }
    
    .pronunciation-btn {
        background-color: #f0f0f0;
        border: 1px solid #d9d9d9;
        padding: 6px 12px;
        border-radius: 4px;
        margin-right: 8px;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .pronunciation-btn:hover {
        background-color: #e6f7ff;
        border-color: #91d5ff;
    }
    
    .speaker-icon {
        margin-left: 4px;
    }
    
    /* 推荐单词样式 */
    .recommendation-row {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
    }
    
    .recommendation-card {
        background-color: #fafafa;
        border-radius: 4px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .recommendation-card h4 {
        margin-top: 0;
        margin-bottom: 8px;
    }
    
    .card-phonetic {
        color: #7f8c8d;
        font-size: 0.9rem;
        margin-bottom: 10px;
    }
    
    .card-meaning {
        margin-bottom: 15px;
        height: 60px;
        overflow: hidden;
    }
    
    .view-recommendation-btn,
    .view-detail-btn {
        background-color: #1890ff;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .view-recommendation-btn:hover,
    .view-detail-btn:hover {
        background-color: #40a9ff;
    }
`;
document.head.appendChild(style);
