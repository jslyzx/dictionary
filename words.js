// 单词管理页面的JavaScript逻辑

// 全局数据
let words = [];
let dictionaries = [];

let currentWordId = null;
let selectedDictionaryId = 0; // 默认显示全部字典

// DOM元素
const wordsBody = document.getElementById('words-body');
const addWordBtn = document.getElementById('add-word-btn');
const wordModal = document.getElementById('word-modal');
const wordModalTitle = document.getElementById('word-modal-title');
const closeWordModalBtn = document.getElementById('close-word-modal');
const cancelWordModalBtn = document.getElementById('cancel-word-modal');
const wordForm = document.getElementById('word-form');
const wordFilter = document.getElementById('word-filter');
const dictionarySelect = document.getElementById('dictionary-select');
const wordDictionariesSelect = document.getElementById('word-dictionaries');

// 初始化页面
function initWordsPage() {
    // 从URL获取字典ID参数
    const urlParams = new URLSearchParams(window.location.search);
    const dictId = urlParams.get('dictionary_id');
    if (dictId) {
        selectedDictionaryId = parseInt(dictId);
    }

    // 加载字典下拉框
    loadDictionarySelect();

    // 加载单词列表
    loadWords();

    // 初始化搜索功能
    initFilter('#words-table', '#word-filter');

    // 绑定事件
    addWordBtn.addEventListener('click', openAddModal);
    closeWordModalBtn.addEventListener('click', closeModal);
    cancelWordModalBtn.addEventListener('click', closeModal);
    wordForm.addEventListener('submit', handleFormSubmit);
    dictionarySelect.addEventListener('change', handleDictionaryChange);

    // 点击模态框外部关闭
    wordModal.addEventListener('click', (e) => {
        if (e.target === wordModal) {
            closeModal();
        }
    });
}

// 加载字典下拉框
async function loadDictionarySelect() {
    try {
        const result = await apiRequest('/dictionaries');
        dictionaries = result.data || [];

        // 清空现有选项
        dictionarySelect.innerHTML = '<option value="0">全部字典</option>';
        wordDictionariesSelect.innerHTML = '';

        // 添加字典选项
        dictionaries.forEach(dict => {
            // 主页面的字典选择器
            const option1 = document.createElement('option');
            option1.value = dict.dictionary_id;
            option1.textContent = dict.name;
            if (dict.dictionary_id === selectedDictionaryId) {
                option1.selected = true;
            }
            dictionarySelect.appendChild(option1);

            // 模态框中的字典多选框
            const option2 = document.createElement('option');
            option2.value = dict.dictionary_id;
            option2.textContent = dict.name;
            wordDictionariesSelect.appendChild(option2);
        });
    } catch (error) {
        console.error('加载字典下拉框失败:', error);
        showAlert('加载字典列表失败', 'error');
    }
}

// 加载单词列表
async function loadWords() {
    showLoading(true);

    try {
        // 清空表格
        wordsBody.innerHTML = '';

        // 构建API请求
        let endpoint = '/words';
        if (selectedDictionaryId > 0) {
            endpoint = `/dictionaries/${selectedDictionaryId}/words`;
        }

        const result = await apiRequest(endpoint);
        const filteredWords = result.data || [];

        if (filteredWords.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="6" style="text-align: center; padding: 40px;">暂无单词数据</td>';
            wordsBody.appendChild(emptyRow);
            return;
        }

        // 渲染单词数据
        filteredWords.forEach(word => {
            const row = buildTableRow(
                word,
                [
                    'word',
                    'phonetic',
                    'meaning',
                    (data) => {
                        const hasAudio = data.pronunciation1 || data.pronunciation2 || data.pronunciation3;
                        return hasAudio ? '有' : '无';
                    },
                    'created_at'
                ],
                [
                    {
                        text: '编辑',
                        className: 'btn-edit',
                        onClick: (data) => openEditModal(data)
                    },
                    {
                        text: '删除',
                        className: 'btn-delete',
                        onClick: (data) => deleteWord(data.word_id)
                    },
                    {
                        text: '详情',
                        className: 'btn-secondary',
                        onClick: (data) => viewWordDetails(data.word_id)
                    }
                ]
            );
            wordsBody.appendChild(row);
        });
    } catch (error) {
        console.error('加载单词列表失败:', error);
        const errorRow = document.createElement('tr');
        errorRow.innerHTML = '<td colspan="6" style="text-align: center; padding: 40px;">加载单词数据失败</td>';
        wordsBody.appendChild(errorRow);
    } finally {
        showLoading(false);
    }
}

// 打开添加单词模态框
function openAddModal() {
    currentWordId = null;
    wordModalTitle.textContent = '添加单词';

    // 清空表单
    wordForm.reset();
    document.getElementById('word-id').value = '';

    // 显示模态框
    openModal();
}

// 打开编辑单词模态框
async function openEditModal(word) {
    showLoading(true);

    try {
        // 调用API获取单词详情
        const result = await apiRequest(`/words/${word.word_id}`);
        const wordData = result.data;

        currentWordId = wordData.word_id;
        wordModalTitle.textContent = '编辑单词';

        // 填充表单
        document.getElementById('word-id').value = wordData.word_id;
        document.getElementById('word-text').value = wordData.word;
        document.getElementById('word-phonetic').value = wordData.phonetic;
        document.getElementById('word-meaning').value = wordData.meaning;
        document.getElementById('word-pronunciation1').value = wordData.pronunciation1 || '';
        document.getElementById('word-pronunciation2').value = wordData.pronunciation2 || '';
        document.getElementById('word-pronunciation3').value = wordData.pronunciation3 || '';

        // 选中单词所属的字典
        const wordDictIds = wordData.dictionaries ?
            wordData.dictionaries.map(d => d.dictionary_id.toString()) : [];

        Array.from(wordDictionariesSelect.options).forEach(option => {
            option.selected = wordDictIds.includes(option.value);
        });

        // 显示模态框
        openModal();
    } catch (error) {
        console.error('加载单词详情失败:', error);
        showAlert('加载单词详情失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        word: document.getElementById('word-text').value.trim(),
        phonetic: document.getElementById('word-phonetic').value.trim(),
        meaning: document.getElementById('word-meaning').value.trim(),
        pronunciation1: document.getElementById('word-pronunciation1').value.trim() || null,
        pronunciation2: document.getElementById('word-pronunciation2').value.trim() || null,
        pronunciation3: document.getElementById('word-pronunciation3').value.trim() || null
    };

    // 获取选中的字典ID
    const selectedDictIds = Array.from(wordDictionariesSelect.selectedOptions)
        .map(option => parseInt(option.value));

    showLoading(true);

    try {
        if (currentWordId) {
            // 编辑单词
            await updateWord(currentWordId, formData, selectedDictIds);
        } else {
            // 添加单词
            await addWord(formData, selectedDictIds);
        }
    } catch (error) {
        console.error('处理表单提交失败:', error);
    } finally {
        showLoading(false);
    }
}

// 添加单词
async function addWord(wordData, dictionaryIds) {
    try {
        // 调用API添加单词
        const result = await apiRequest('/words', {
            method: 'POST',
            data: {
                ...wordData,
                dictionaries: dictionaryIds
            }
        });

        // 更新UI
        await loadWords();
        closeModal();
        showAlert('单词添加成功', 'success');
    } catch (error) {
        console.error('添加单词失败:', error);
        showAlert('添加单词失败: ' + error.message, 'error');
    }
}

// 更新单词
async function updateWord(id, wordData, dictionaryIds) {
    try {
        // 调用API更新单词
        const result = await apiRequest(`/words/${id}`, {
            method: 'PUT',
            data: {
                ...wordData,
                dictionaries: dictionaryIds
            }
        });

        // 更新UI
        await loadWords();
        closeModal();
        showAlert('单词更新成功', 'success');
    } catch (error) {
        console.error('更新单词失败:', error);
        showAlert('更新单词失败: ' + error.message, 'error');
    }
}

// 删除单词
async function deleteWord(id) {
    if (!confirm('确定要删除这个单词吗？删除后将无法恢复。')) {
        return;
    }

    showLoading(true);

    try {
        // 调用API删除单词
        await apiRequest(`/words/${id}`, {
            method: 'DELETE'
        });

        // 更新UI
        await loadWords();
        showAlert('单词删除成功', 'success');
    } catch (error) {
        console.error('删除单词失败:', error);
        showAlert('删除单词失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 查看单词详情
async function viewWordDetails(id) {
    showLoading(true);

    try {
        // 调用API获取单词详情
        const result = await apiRequest(`/words/${id}`);
        const wordData = result.data;

        if (wordData) {
            // 简单的详情展示
            let message = `单词: ${wordData.word}\n`;
            message += `音标: ${wordData.phonetic}\n`;
            message += `释义: ${wordData.meaning}\n`;
            message += `创建时间: ${wordData.created_at}`;

            // 获取单词所属的字典
            if (wordData.dictionaries && wordData.dictionaries.length > 0) {
                const dictNames = wordData.dictionaries.map(d => d.name).join(', ');
                message += `\n所属字典: ${dictNames}`;
            }

            alert(message);
        }
    } catch (error) {
        console.error('获取单词详情失败:', error);
        showAlert('获取单词详情失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 处理字典选择变化
function handleDictionaryChange() {
    selectedDictionaryId = parseInt(this.value);
    loadWords();
}

// 打开模态框
function openModal() {
    wordModal.style.display = 'flex';
    // 聚焦第一个输入框
    document.getElementById('word-text').focus();
}

// 关闭模态框
function closeModal() {
    wordModal.style.display = 'none';
}

// 保存数据到数据库 - 通过API
// 注意: 此函数不再需要，因为添加/更新操作已直接调用API

// 从API加载数据
async function loadDataFromStorage() {
    // 此函数名称保持不变以兼容初始化逻辑
    // 但实现改为调用API加载字典
    await loadDictionarySelect();
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', async function () {
    // 从API加载数据
    await loadDataFromStorage();
    // 初始化页面
    initWordsPage();
});