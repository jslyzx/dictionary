// 单词查询页面的JavaScript逻辑 - Layui版本

layui.use(['form', 'layer', 'jquery'], function() {
    const $ = layui.jquery;
    const layer = layui.layer;
    const form = layui.form;
    
    // 全局数据
    let dictionaries = [];
    
    // DOM元素引用
    const $searchInput = $('#search-input');
    const $searchBtn = $('#search-btn');
    const $searchResults = $('#search-results');
    const $resultsContent = $('#results-content');
    const $wordDetails = $('#word-details');
    const $recommendedWords = $('#recommended-words');
    const $recommendationsContainer = $('#recommendations-container');
    const $dictionaryFilter = $('#dictionary-filter');
    
    // 初始化页面
    async function initWordSearchPage() {
        showLoading(true);
        
        try {
            // 加载字典过滤下拉框
            await loadDictionaryFilter();
            
            // 绑定事件
            $searchBtn.on('click', handleSearch);
            $searchInput.on('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
            
            // 自动获取焦点
            $searchInput.focus();
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
            $dictionaryFilter.empty();
            $dictionaryFilter.append('<option value="0">全部字典</option>');
            
            dictionaries.forEach(dict => {
                $dictionaryFilter.append(`<option value="${dict.dictionary_id}">${dict.name}</option>`);
            });
            
            // 刷新表单
            form.render('select');
        } catch (error) {
            console.error('加载字典下拉框失败:', error);
            showAlert('加载字典列表失败', 'error');
        }
    }
    
    // 处理搜索
    async function handleSearch() {
        const keyword = $searchInput.val().trim();
        if (!keyword) {
            showAlert('请输入要查询的单词', 'info');
            return;
        }
        
        showLoading(true);
        
        try {
            // 获取搜索类型和字典过滤条件
            const searchType = $('input[name="search-type"]:checked').val();
            const selectedDictionaryId = parseInt($dictionaryFilter.val());
            
            // 执行搜索
            const results = await searchWords(keyword, searchType, selectedDictionaryId);
            
            // 显示结果
            await displayResults(results, keyword);
        } catch (error) {
            console.error('搜索失败:', error);
            showAlert('搜索失败: ' + error.message, 'error');
            $searchResults.show();
            $resultsContent.html('<div style="text-align: center; padding: 40px; background-color: #f9f9f9;">搜索过程中发生错误，请稍后重试。</div>');
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
        $wordDetails.hide();
        $recommendedWords.hide();
        
        if (results.length === 0) {
            // 无结果
            $searchResults.show();
            $resultsContent.html('<div style="text-align: center; padding: 40px; background-color: #f9f9f9;">未找到相关单词，请尝试其他关键词。</div>');
        } else if (results.length === 1) {
            // 单个结果，直接显示详情
            $searchResults.hide();
            await showWordDetails(results[0]);
            await showRecommendations(results[0], keyword);
        } else {
            // 多个结果，显示列表
            $searchResults.show();
            renderResultsList(results);
        }
    }
    
    // 渲染结果列表
    function renderResultsList(results) {
        // 使用layui table
        $resultsContent.html(`
            <table class="layui-table" lay-even lay-skin="row">
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
                                <button class="layui-btn layui-btn-sm layui-btn-primary view-detail-btn" data-id="${word.word_id}">
                                    查看详情
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `);
        
        // 添加点击事件
        $('.view-detail-btn').on('click', function() {
            const wordId = parseInt($(this).attr('data-id'));
            const word = results.find(w => w.word_id === wordId);
            if (word) {
                $searchResults.hide();
                showWordDetails(word);
                showRecommendations(word, word.word);
            }
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
                pronunciationHtml = '<div class="layui-input-block">';
                if (wordData.pronunciation1) {
                    pronunciationHtml += `<button class="layui-btn layui-btn-sm pronunciation-btn" data-url="${wordData.pronunciation1}">英音 <i class="layui-icon layui-icon-speaker"></i></button>`;
                }
                if (wordData.pronunciation2) {
                    pronunciationHtml += `<button class="layui-btn layui-btn-sm pronunciation-btn" data-url="${wordData.pronunciation2}">美音 <i class="layui-icon layui-icon-speaker"></i></button>`;
                }
                if (wordData.pronunciation3) {
                    pronunciationHtml += `<button class="layui-btn layui-btn-sm pronunciation-btn" data-url="${wordData.pronunciation3}">例句 <i class="layui-icon layui-icon-speaker"></i></button>`;
                }
                pronunciationHtml += '</div>';
            } else {
                pronunciationHtml = '<div class="layui-input-block"><span class="layui-text">暂无发音数据</span></div>';
            }
            
            $wordDetails.html(`
                <div class="layui-row">
                    <div class="layui-col-md12">
                        <div style="border-bottom: 1px solid #e6e6e6; padding-bottom: 15px; margin-bottom: 20px;">
                            <h2 style="display: inline-block; margin: 0; font-size: 32px;">${wordData.word}</h2>
                            <span style="margin-left: 15px; color: #666; font-size: 18px;">${wordData.phonetic}</span>
                        </div>
                        
                        <div class="layui-form-item">
                            <label class="layui-form-label">中文释义：</label>
                            <div class="layui-input-block">
                                <p style="line-height: 36px; margin: 0;">${wordData.meaning}</p>
                            </div>
                        </div>
                        
                        <div class="layui-form-item">
                            <label class="layui-form-label">发音：</label>
                            ${pronunciationHtml}
                        </div>
                        
                        <div class="layui-form-item">
                            <label class="layui-form-label">创建时间：</label>
                            <div class="layui-input-block">
                                <p style="line-height: 36px; margin: 0;">${wordData.created_at}</p>
                            </div>
                        </div>
                        
                        <div class="layui-form-item">
                            <label class="layui-form-label">所属字典：</label>
                            <div class="layui-input-block">
                                <p style="line-height: 36px; margin: 0;">
                                    ${wordData.dictionaries && wordData.dictionaries.length > 0 ?
                                        wordData.dictionaries.map(d => d.name).join(', ') : '未分配到任何字典'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            // 绑定发音按钮事件
            $('.pronunciation-btn').on('click', function() {
                const audioUrl = $(this).attr('data-url');
                playPronunciation(audioUrl);
            });
            
            $wordDetails.show();
        } catch (error) {
            console.error('获取单词详情失败:', error);
            $wordDetails.html(`<div style="text-align: center; padding: 40px; background-color: #f9f9f9;">加载单词详情失败: ${error.message}</div>`);
            $wordDetails.show();
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
                $recommendationsContainer.empty();
                
                // 最多显示6个推荐
                const recommendationHtml = recommendations.slice(0, 6).map((word, index) => `
                    <div class="layui-col-md2">
                        <div class="layui-card">
                            <div class="layui-card-body">
                                <h4 style="margin-top: 0;">${word.word}</h4>
                                <p style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 10px;">${word.phonetic}</p>
                                <p style="margin-bottom: 15px; height: 60px; overflow: hidden;">${word.meaning}</p>
                                <button class="layui-btn layui-btn-sm layui-btn-primary view-recommendation-btn" data-id="${word.word_id}">
                                    查看详情
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                $recommendationsContainer.html(recommendationHtml);
                
                // 绑定推荐单词点击事件
                $('.view-recommendation-btn').on('click', async function() {
                    const wordId = parseInt($(this).attr('data-id'));
                    const word = recommendations.find(w => w.word_id === wordId);
                    if (word) {
                        await showWordDetails(word);
                        await showRecommendations(word, word.word);
                    }
                });
                
                $recommendedWords.show();
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
        if (show) {
            layer.load(2);
        } else {
            layer.closeAll('loading');
        }
    }
    
    // 显示提示信息
    function showAlert(msg, type = 'info') {
        const iconMap = {
            info: 0,
            success: 1,
            warning: 3,
            error: 2
        };
        
        layer.msg(msg, {
            icon: iconMap[type] || 0,
            time: 2000
        });
    }
    
    // 从API加载数据 - 保持兼容性
    async function loadDataFromStorage() {
        // 此函数名称保持不变以兼容初始化逻辑
        // 但实现改为调用API加载字典
        // 字典加载已在initWordSearchPage中处理
    }
    
    // 初始化页面
    initWordSearchPage();
});
