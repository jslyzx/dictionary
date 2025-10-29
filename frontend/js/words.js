// 单词管理页面的JavaScript逻辑 - 原生JS版本

// 全局数据
let currentWordId = null;
let selectedDictionaryId = 0; // 默认显示全部字典
let dictionaries = [];
let words = [];

// 从数据库API获取数据，不使用模拟数据

// DOM元素引用
const dictionaryFilter = document.getElementById('dictionary-filter');
const wordSearchInput = document.getElementById('word-search');
const addWordBtn = document.getElementById('add-word-btn');
const wordsTable = document.getElementById('words-table');
const wordsTableBody = wordsTable.querySelector('tbody');
const wordForm = document.getElementById('word-form');
const wordFormContainer = document.getElementById('word-form-container');
const modalTitle = document.getElementById('modal-title');
const cancelModalBtn = document.getElementById('cancel-modal');
const wordName = document.getElementById('word-name');
const wordPhonetic = document.getElementById('word-phonetic');
const wordMeaning = document.getElementById('word-meaning');
const wordDictionaries = document.getElementById('word-dictionaries');
const wordPronunciation1 = document.getElementById('word-pronunciation1');
const wordPronunciation2 = document.getElementById('word-pronunciation2');

// 从URL获取字典ID参数
function getDictionaryIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const dictId = urlParams.get('dictionary_id');
    if (dictId) {
        selectedDictionaryId = parseInt(dictId);
    }
    
    // 从URL获取字典名称
    const dictName = urlParams.get('dictionary_name');
    if (dictName) {
        const titleElement = document.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = `单词管理 - ${decodeURIComponent(dictName)}`;
        }
    }
}

// 加载动画
function showLoading(show = true) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    } else {
        // 如果没有loading元素，创建一个
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: ${show ? 'flex' : 'none'};
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1890ff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 10px;">加载中...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }
}

// 提示框
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    const bgColors = {
        info: '#e6f7ff',
        success: '#f6ffed',
        warning: '#fff7e6',
        error: '#fff2f0'
    };
    const borderColors = {
        info: '#91d5ff',
        success: '#b7eb8f',
        warning: '#ffd591',
        error: '#ffccc7'
    };
    
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${bgColors[type]};
        border: 1px solid ${borderColors[type]};
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    // 3秒后自动消失
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 300);
    }, 3000);
}

// API请求函数 - 仅从数据库获取数据
async function apiRequest(url, method = 'GET', data = null) {
    console.log('从数据库获取数据:', url);
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : null
    });
    
    if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }
    
    return await response.json();
}

// 打开模态框
function openModal(title) {
    modalTitle.textContent = title;
    wordFormContainer.style.display = 'block';
    wordFormContainer.classList.add('modal-open');
    wordName.focus();
}

// 关闭模态框
function closeModal() {
    wordFormContainer.style.display = 'none';
    wordFormContainer.classList.remove('modal-open');
    // 重置表单
    wordForm.reset();
    currentWordId = null;
}

// 加载字典下拉框
async function loadDictionarySelect() {
    try {
        const result = await apiRequest('/api/dictionaries');
        dictionaries = result.data || [];

        // 清空并添加字典选项到主页面的字典选择器
        dictionaryFilter.innerHTML = '<option value="0">全部字典</option>';

        // 清空并添加字典选项到模态框的字典选择器
        wordDictionaries.innerHTML = '';

        dictionaries.forEach(dict => {
            // 主页面的字典选择器
            const option = document.createElement('option');
            option.value = dict.dictionary_id;
            option.textContent = dict.name;
            if (dict.dictionary_id === selectedDictionaryId) {
                option.selected = true;
            }
            dictionaryFilter.appendChild(option);

            // 模态框中的字典多选框
            const dictOption = document.createElement('option');
            dictOption.value = dict.dictionary_id;
            dictOption.textContent = dict.name;
            wordDictionaries.appendChild(dictOption);
        });
    } catch (error) {
        console.error('加载字典下拉框失败:', error);
        showAlert('加载字典列表失败', 'error');
    }
}

// 渲染单词表格
function renderWordsTable(wordList) {
    // 清空表格
    wordsTableBody.innerHTML = '';
    
    if (wordList.length === 0) {
        // 无数据时的处理
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" style="text-align:center; padding:40px;">暂无单词数据</td>';
        wordsTableBody.appendChild(emptyRow);
        return;
    }
    
    // 渲染数据行
    wordList.forEach(word => {
        // 获取单词所属的字典名称
        const dictNames = word.dictionaries
            .map(dictId => {
                const dict = dictionaries.find(d => d.dictionary_id === dictId);
                return dict ? dict.name : '';
            })
            .filter(name => name)
            .join(', ');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${word.word}</td>
            <td>${word.phonetic}</td>
            <td>${word.meaning}</td>
            <td>${dictNames || '-'}</td>
            <td>${word.created_at}</td>
            <td style="text-align:center;">
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="editWord(${word.word_id})"><i class="icon-edit"></i> 编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteWord(${word.word_id})"><i class="icon-delete"></i> 删除</button>
                    <button class="btn btn-default btn-sm" onclick="viewWordDetail(${word.word_id})"><i class="icon-view"></i> 详情</button>
                </div>
            </td>
        `;
        wordsTableBody.appendChild(row);
    });
}

// 加载单词列表
async function loadWords() {
    showLoading();
    try {
        let url = '/api/words';
        const params = new URLSearchParams();
        
        // 添加字典ID过滤条件
        if (selectedDictionaryId > 0) {
            params.append('dictionary_id', selectedDictionaryId);
        }
        
        // 添加搜索关键词
        const keyword = wordSearchInput.value.trim();
        if (keyword) {
            params.append('keyword', keyword);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const result = await apiRequest(url);
        if (result.status === 'success') {
            words = result.data || [];
            renderWordsTable(words);
        } else {
            showAlert(result.message || '加载单词列表失败', 'error');
        }
    } catch (error) {
        // 使用模拟数据并进行过滤
        let filteredWords = [...mockData.words];
        
        // 根据字典ID过滤
        if (selectedDictionaryId > 0) {
            filteredWords = filteredWords.filter(word => 
                word.dictionaries.includes(selectedDictionaryId)
            );
        }
        
        // 根据关键词过滤
        const keyword = wordSearchInput.value.trim().toLowerCase();
        if (keyword) {
            filteredWords = filteredWords.filter(word => 
                word.word.toLowerCase().includes(keyword) || 
                word.meaning.toLowerCase().includes(keyword)
            );
        }
        
        words = filteredWords;
        renderWordsTable(words);
    } finally {
        showLoading(false);
    }
}

// 初始化页面
    function initWordsPage() {
        console.log('初始化单词页面，开始从API加载数据...');
        
        // 设置默认页面标题
        const titleElement = document.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = '单词管理';
        }

        // 从URL获取字典ID
        getDictionaryIdFromUrl();

        // 加载字典下拉框
        loadDictionarySelect();

        // 加载单词列表
        loadWords();

        // 添加搜索事件监听
        wordSearchInput.addEventListener('input', loadWords);

        // 添加字典选择变化事件监听
        dictionaryFilter.addEventListener('change', handleDictionaryChange);

        // 添加单词按钮点击事件
        addWordBtn.addEventListener('click', openAddModal);

        // 表单提交事件
        wordForm.addEventListener('submit', handleFormSubmit);

        // 取消按钮点击事件
        cancelModalBtn.addEventListener('click', closeModal);
        
        // 添加全局函数
        window.editWord = editWord;
        window.deleteWord = deleteWord;
        window.viewWordDetail = viewWordDetail;
        window.playPronunciation = playPronunciation;
    }

    // 加载单词表格数据
    function loadWords() {
        console.log('开始加载单词列表，从API获取数据...');
        showLoading(true);
        
        // 构建请求URL和参数
        let url = '/api/words';
        const params = new URLSearchParams();
        
        // 添加字典ID过滤条件
        if (selectedDictionaryId > 0) {
            params.append('dictionary_id', selectedDictionaryId);
        }
        
        // 添加搜索关键词
        const keyword = wordSearchInput.value.trim();
        if (keyword) {
            params.append('keyword', keyword);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        apiRequest(url, 'GET', null, mockData.words)
            .then(result => {
                console.log('成功从API获取单词数据:', result.length, '个单词');
                renderWordsTable(result);
            })
            .catch(error => {
                console.error('获取单词列表失败，使用模拟数据:', error);
                // 使用模拟数据并进行过滤
                let filteredWords = [...mockData.words];
                
                // 根据字典ID过滤
                if (selectedDictionaryId > 0) {
                    filteredWords = filteredWords.filter(word => 
                        word.dictionaries && word.dictionaries.includes(selectedDictionaryId)
                    );
                }
                
                // 根据关键词过滤
                if (keyword) {
                    filteredWords = filteredWords.filter(word => 
                        word.word.toLowerCase().includes(keyword.toLowerCase()) || 
                        word.meaning.toLowerCase().includes(keyword.toLowerCase())
                    );
                }
                
                renderWordsTable(filteredWords);
            })
            .finally(() => {
                showLoading(false);
            });
    }

    // 渲染单词表格
    function renderWordsTable(words) {
        const tableBody = document.getElementById('words-table-body');
        const emptyData = document.getElementById('empty-data');
        
        // 清空表格
        tableBody.innerHTML = '';
        
        if (!words || words.length === 0) {
            // 显示空数据提示
            emptyData.style.display = 'block';
            return;
        }
        
        // 隐藏空数据提示
        emptyData.style.display = 'none';
        
        // 渲染单词列表
        words.forEach(word => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${word.word || '-'}</td>
                <td>${word.phonetic || '-'}</td>
                <td>${word.meaning || '-'}</td>
                <td>${word.pronunciation1 || word.pronunciation2 || word.pronunciation3 ? '有' : '无'}</td>
                <td>${word.created_at || '-'}</td>
                <td>
                    <button class="btn btn-view" onclick="viewWordDetail(${word.word_id})">查看</button>
                    <button class="btn btn-edit" onclick="editWord(${word.word_id})">编辑</button>
                    <button class="btn btn-delete" onclick="deleteWord(${word.word_id})">删除</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    }

    // 打开添加单词模态框
    function openAddModal() {
        console.log('打开添加单词模态框');
        currentWordId = null;

        // 清空表单
        document.getElementById('word-id').value = '';
        document.getElementById('word-text').value = '';
        document.getElementById('word-phonetic').value = '';
        document.getElementById('word-meaning').value = '';
        document.getElementById('word-pronunciation1').value = '';
        document.getElementById('word-pronunciation2').value = '';
        document.getElementById('word-pronunciation3').value = '';

        // 清空字典选择
        const wordDictionaries = document.getElementById('word-dictionaries');
        if (wordDictionaries) {
            wordDictionaries.value = '';
        }

        // 设置模态框标题
        document.getElementById('modal-title').textContent = '添加单词';
        
        // 显示模态框
        const modal = document.getElementById('word-modal');
        if (modal) {
            modal.style.display = 'block';
            // 设置焦点
            document.getElementById('word-text').focus();
        }
    }
    }

    // 编辑单词
    function editWord(wordId) {
        console.log(`编辑单词，从API获取单词ID: ${wordId}的数据`);
        showLoading(true);
        
        // 从API获取单词详情
        apiRequest(`/words/${wordId}`, 'GET', null, mockData.words.find(w => w.word_id === wordId))
            .then(wordData => {
                console.log('成功从API获取单词详情:', wordData);
                currentWordId = wordData.word_id;

                // 填充表单
                document.getElementById('word-id').value = wordData.word_id;
                document.getElementById('word-text').value = wordData.word || '';
                document.getElementById('word-phonetic').value = wordData.phonetic || '';
                document.getElementById('word-meaning').value = wordData.meaning || '';
                document.getElementById('word-pronunciation1').value = wordData.pronunciation1 || '';
                document.getElementById('word-pronunciation2').value = wordData.pronunciation2 || '';
                document.getElementById('word-pronunciation3').value = wordData.pronunciation3 || '';

                // 选中单词所属的字典
                const wordDictionaries = document.getElementById('word-dictionaries');
                if (wordDictionaries && wordData.dictionaries) {
                    const wordDictId = wordData.dictionaries[0]; // 简化处理，取第一个字典
                    wordDictionaries.value = wordDictId || '';
                }

                // 设置模态框标题
                document.getElementById('modal-title').textContent = '编辑单词';
                
                // 显示模态框
                const modal = document.getElementById('word-modal');
                if (modal) {
                    modal.style.display = 'block';
                    // 设置焦点
                    document.getElementById('word-text').focus();
                }
            })
            .catch(error => {
                console.error('获取单词详情失败:', error);
                showAlert('获取单词详情失败', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }
            },
    // 打开编辑单词模态框（兼容旧代码）
    function openEditModal(word) {
        editWord(word.word_id);
    }
    }

    // 处理表单提交
    function handleFormSubmit(event) {
        event.preventDefault();
        console.log('处理表单提交，当前单词ID:', currentWordId || '新建');
        
        // 收集表单数据
        const formData = {
            word: document.getElementById('word-text').value.trim(),
            phonetic: document.getElementById('word-phonetic').value.trim(),
            meaning: document.getElementById('word-meaning').value.trim(),
            pronunciation1: document.getElementById('word-pronunciation1').value.trim() || null,
            pronunciation2: document.getElementById('word-pronunciation2').value.trim() || null,
            pronunciation3: document.getElementById('word-pronunciation3').value.trim() || null
        };

        // 简单验证
        if (!formData.word) {
            showAlert('请输入单词', 'warning');
            return;
        }
        
        if (!formData.meaning) {
            showAlert('请输入释义', 'warning');
            return;
        }

        // 获取选中的字典ID
        const wordDictionaries = document.getElementById('word-dictionaries');
        const selectedDictId = wordDictionaries ? parseInt(wordDictionaries.value) : null;
        const selectedDictIds = selectedDictId ? [selectedDictId] : [];

        showLoading(true);

        if (currentWordId) {
            // 编辑单词
            updateWord(currentWordId, formData, selectedDictIds);
        } else {
            // 添加单词
            addWord(formData, selectedDictIds);
        }
    }
    }

    // 添加单词
    function addWord(wordData, dictionaryIds) {
        console.log('添加新单词到API:', wordData.word);
        
        const data = {
            ...wordData,
            dictionaries: dictionaryIds
        };
        
        // 调用API添加单词
        apiRequest('/words', 'POST', data, null)
            .then(result => {
                console.log('单词添加成功:', result);
                // 关闭模态框
                closeModal();
                // 重新加载单词列表
                loadWords();
                // 显示成功提示
                showAlert('单词添加成功', 'success');
            })
            .catch(error => {
                console.error('添加单词失败:', error);
                // 由于API调用失败，我们将单词添加到模拟数据中
                const newWord = {
                    ...wordData,
                    word_id: Date.now(), // 使用时间戳作为临时ID
                    dictionaries: dictionaryIds,
                    created_at: new Date().toISOString()
                };
                mockData.words.push(newWord);
                // 重新加载单词列表
                loadWords();
                // 显示使用模拟数据的提示
                showAlert('API调用失败，已添加到本地模拟数据', 'info');
            })
            .finally(() => {
                showLoading(false);
            });
    }
    }

    // 更新单词
    function updateWord(id, wordData, dictionaryIds) {
        console.log(`更新单词ID: ${id}`);
        
        const data = {
            ...wordData,
            dictionaries: dictionaryIds
        };
        
        // 调用API更新单词
        apiRequest(`/words/${id}`, 'PUT', data, null)
            .then(result => {
                console.log('单词更新成功:', result);
                // 关闭模态框
                closeModal();
                // 重新加载单词列表
                loadWords();
                // 显示成功提示
                showAlert('单词更新成功', 'success');
            })
            .catch(error => {
                console.error('更新单词失败:', error);
                // 由于API调用失败，我们更新模拟数据
                const wordIndex = mockData.words.findIndex(w => w.word_id === id);
                if (wordIndex !== -1) {
                    mockData.words[wordIndex] = {
                        ...mockData.words[wordIndex],
                        ...wordData,
                        dictionaries: dictionaryIds
                    };
                }
                // 重新加载单词列表
                loadWords();
                // 显示使用模拟数据的提示
                showAlert('API调用失败，已更新本地模拟数据', 'info');
            })
            .finally(() => {
                showLoading(false);
            });
    }
    }

    // 删除单词
    function deleteWord(id) {
        console.log(`删除单词ID: ${id}`);
        
        if (confirm('确定要删除这个单词吗？删除后将无法恢复。')) {
            showLoading(true);
            
            // 调用API删除单词
            apiRequest(`/words/${id}`, 'DELETE', null, null)
                .then(result => {
                    console.log('单词删除成功:', result);
                    // 重新加载单词列表
                    loadWords();
                    // 显示成功提示
                    showAlert('单词删除成功', 'success');
                })
                .catch(error => {
                    console.error('删除单词失败:', error);
                    // 由于API调用失败，我们从模拟数据中删除
                    const wordIndex = mockData.words.findIndex(w => w.word_id === id);
                    if (wordIndex !== -1) {
                        mockData.words.splice(wordIndex, 1);
                    }
                    // 重新加载单词列表
                    loadWords();
                    // 显示使用模拟数据的提示
                    showAlert('API调用失败，已从本地模拟数据删除', 'info');
                })
                .finally(() => {
                    showLoading(false);
                });
        }
    }
    }

    // 查看单词详情
    function viewWordDetail(id) {
        console.log(`查看单词详情，从API获取单词ID: ${id}的数据`);
        showLoading(true);
        
        // 从API获取单词详情
        apiRequest(`/words/${id}`, 'GET', null, mockData.words.find(w => w.word_id === id))
            .then(wordData => {
                console.log('成功从API获取单词详情:', wordData);
                
                // 构建详情内容
                let content = `
                    <div style="padding: 20px;">
                        <table class="detail-table">
                            <tr>
                                <td style="width: 80px; font-weight: bold;">单词</td>
                                <td>${wordData.word || '-'}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold;">音标</td>
                                <td>${wordData.phonetic || '-'}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold;">释义</td>
                                <td>${wordData.meaning || '-'}</td>
                            </tr>
                `;
                
                // 发音信息
                if (wordData.pronunciation1 || wordData.pronunciation2 || wordData.pronunciation3) {
                    content += `
                        <tr>
                            <td style="font-weight: bold;">发音</td>
                            <td>
                                <button class="btn btn-primary" onclick="playPronunciation(${wordData.word_id})">播放发音</button>
                            </td>
                        </tr>
                    `;
                }
                
                // 创建时间
                content += `
                            <tr>
                                <td style="font-weight: bold;">创建时间</td>
                                <td>${wordData.created_at || '-'}</td>
                            </tr>
                `;
                
                // 获取单词所属的字典
                if (wordData.dictionaries && wordData.dictionaries.length > 0) {
                    // 简化处理，直接显示字典ID
                    const dictIds = wordData.dictionaries.join(', ');
                    content += `
                            <tr>
                                <td style="font-weight: bold;">所属字典ID</td>
                                <td>${dictIds}</td>
                            </tr>
                    `;
                }
                
                content += `</table></div>`;
                
                // 创建并显示详情模态框
                const detailModal = document.createElement('div');
                detailModal.className = 'modal';
                detailModal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>单词详情</h3>
                            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                    </div>
                `;
                
                document.body.appendChild(detailModal);
                
                // 显示模态框
                detailModal.style.display = 'block';
                
                // 添加点击模态框外部关闭的功能
                window.addEventListener('click', function(event) {
                    if (event.target === detailModal) {
                        detailModal.remove();
                    }
                });
            })
            .catch(error => {
                console.error('获取单词详情失败:', error);
                showAlert('获取单词详情失败', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }
    }

    // 处理字典选择变化
    function handleDictionaryChange() {
        selectedDictionaryId = parseInt(this.value) || 0;
        console.log('字典选择变化，当前字典ID:', selectedDictionaryId);
        // 重新加载单词列表
        loadWords();
    }

    // 从API加载数据
    function loadDataFromStorage() {
        console.log('从API加载初始数据');
        // 加载字典下拉框
        loadDictionarySelect();
    }

    // 播放发音
    function playPronunciation(wordId) {
        console.log(`播放单词ID: ${wordId}的发音`);
        // 这里可以实现播放发音的逻辑
        showAlert('播放发音功能', 'info');
    }

    // 关闭模态框
    function closeModal() {
        console.log('关闭模态框');
        const modal = document.getElementById('word-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 页面加载完成后执行
    document.addEventListener('DOMContentLoaded', function() {
        console.log('页面加载完成，开始初始化...');
        // 从API加载数据
        loadDataFromStorage();
        // 初始化页面
        initWordsPage();
    });