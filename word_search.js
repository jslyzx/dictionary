// 单词查询页面的JavaScript逻辑

// 全局数据
let dictionaries = [];

// DOM元素
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const resultsContent = document.getElementById('results-content');
const wordDetails = document.getElementById('word-details');
const recommendedWords = document.getElementById('recommended-words');
const recommendationsContainer = document.getElementById('recommendations-container');
const dictionaryFilter = document.getElementById('dictionary-filter');
const searchTypeRadios = document.querySelectorAll('input[name="search-type"]');

// 初始化页面
async function initWordSearchPage() {
    showLoading(true);

    try {
        // 加载字典过滤下拉框
        await loadDictionaryFilter();

        // 绑定事件
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
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
        const result = await apiRequest('/dictionaries');
        dictionaries = result.data || [];

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
        const searchType = document.querySelector('input[name="search-type"]:checked').value;
        const selectedDictionaryId = parseInt(dictionaryFilter.value);

        // 执行搜索
        const results = await searchWords(keyword, searchType, selectedDictionaryId);

        // 显示结果
        await displayResults(results, keyword);
    } catch (error) {
        console.error('搜索失败:', error);
        showAlert('搜索失败: ' + error.message, 'error');
        searchResults.style.display = 'block';
        resultsContent.innerHTML = `<p style="text-align: center; padding: 40px;">搜索过程中发生错误，请稍后重试。</p>`;
    } finally {
        showLoading(false);
    }
}

// 搜索单词
async function searchWords(keyword, searchType, dictionaryId) {
    try {
        // 构建API请求
        let endpoint = '/words/search';
        const params = new URLSearchParams({
            term: keyword,
            type: searchType
        });

        if (dictionaryId > 0) {
            endpoint = `/dictionaries/${dictionaryId}/words/search`;
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
        resultsContent.innerHTML = '<p style="text-align: center; padding: 40px;">未找到相关单词，请尝试其他关键词。</p>';
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
    const table = document.createElement('table');
    table.className = 'data-table';

    // 表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>单词</th>
            <th>音标</th>
            <th>释义</th>
            <th>操作</th>
        </tr>
    `;
    table.appendChild(thead);

    // 表体
    const tbody = document.createElement('tbody');
    results.forEach(word => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${word.word}</td>
            <td>${word.phonetic}</td>
            <td>${word.meaning}</td>
            <td>
                <button class="action-btn btn-primary" data-id="${word.word_id}">查看详情</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // 添加点击事件
    tbody.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const wordId = parseInt(btn.getAttribute('data-id'));
            const word = results.find(w => w.word_id === wordId);
            if (word) {
                searchResults.style.display = 'none';
                showWordDetails(word);
                showRecommendations(word, word.word);
            }
        });
    });

    resultsContent.innerHTML = '';
    resultsContent.appendChild(table);
}

// 显示单词详情
async function showWordDetails(word) {
    showLoading(true);

    try {
        // 调用API获取单词详情
        const result = await apiRequest(`/words/${word.word_id}`);
        const wordData = result.data;

        wordDetails.innerHTML = `
            <div class="word-header">
                <h2>${wordData.word}</h2>
                <span class="phonetic">${wordData.phonetic}</span>
            </div>
            <div class="form-group">
                <label><strong>中文释义：</strong></label>
                <p>${wordData.meaning}</p>
            </div>
            <div class="form-group">
                <label><strong>发音：</strong></label>
                <div class="pronunciation-buttons">
                    ${wordData.pronunciation1 ? `<button class="pronunciation-btn" onclick="playPronunciation('${wordData.pronunciation1}')">英音 <span>🔊</span></button>` : ''}
                    ${wordData.pronunciation2 ? `<button class="pronunciation-btn" onclick="playPronunciation('${wordData.pronunciation2}')">美音 <span>🔊</span></button>` : ''}
                    ${wordData.pronunciation3 ? `<button class="pronunciation-btn" onclick="playPronunciation('${wordData.pronunciation3}')">例句 <span>🔊</span></button>` : ''}
                    ${!wordData.pronunciation1 && !wordData.pronunciation2 && !wordData.pronunciation3 ? '<span>暂无发音数据</span>' : ''}
                </div>
            </div>
            <div class="form-group">
                <label><strong>创建时间：</strong></label>
                <p>${wordData.created_at}</p>
            </div>
            <div class="form-group">
                <label><strong>所属字典：</strong></label>
                <p>${wordData.dictionaries && wordData.dictionaries.length > 0 ?
                wordData.dictionaries.map(d => d.name).join(', ') : '未分配到任何字典'
            }</p>
            </div>
        `;

        wordDetails.style.display = 'block';
    } catch (error) {
        console.error('获取单词详情失败:', error);
        wordDetails.innerHTML = `<p>加载单词详情失败: ${error.message}</p>`;
        wordDetails.style.display = 'block';
    } finally {
        showLoading(false);
    }
}

// 获取单词所属的字典 - 通过API
// 注意: 此函数不再直接使用，已在showWordDetails中直接从API返回的数据获取

// 显示推荐单词
async function showRecommendations(currentWord, keyword) {
    try {
        // 调用API获取推荐单词
        const result = await apiRequest(`/words/recommend/${currentWord.word_id}`);
        const recommendations = result.data || [];

        if (recommendations.length > 0) {
            recommendationsContainer.innerHTML = '';

            recommendations.slice(0, 6).forEach(word => { // 最多显示6个推荐
                const recommendationItem = document.createElement('div');
                recommendationItem.className = 'feature-item';
                recommendationItem.innerHTML = `
                    <h4>${word.word}</h4>
                    <p style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 10px;">${word.phonetic}</p>
                    <p>${word.meaning}</p>
                    <button class="btn-secondary" style="margin-top: 10px;" data-id="${word.word_id}">查看详情</button>
                `;

                recommendationItem.querySelector('button').addEventListener('click', async () => {
                    await showWordDetails(word);
                    await showRecommendations(word, word.word);
                });

                recommendationsContainer.appendChild(recommendationItem);
            });

            recommendedWords.style.display = 'block';
        }
    } catch (error) {
        console.error('获取推荐单词失败:', error);
        // 推荐失败不影响主功能，所以不显示错误
    }
}

// 模拟发音播放（实际应用中会使用真实的音频URL）
function simulatePlayPronunciation(word) {
    showAlert(`正在播放 "${word}" 的发音`, 'info');
    // 在真实环境中，这里会播放实际的音频文件
}

// 覆盖全局的playPronunciation函数以适应模拟环境
window.playPronunciation = function (audioUrl) {
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
};

// 从API加载数据
async function loadDataFromStorage() {
    // 此函数名称保持不变以兼容初始化逻辑
    // 但实现改为调用API加载字典
    // 字典加载已在initWordSearchPage中处理
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', async function () {
    // 初始化页面（已包含数据加载）
    await initWordSearchPage();
});