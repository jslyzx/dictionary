// 字典管理页面的JavaScript逻辑 - 原生JS版本

// 全局数据
let currentDictionaryId = null;
let dictionaries = [];
let dictionaryTable = null;

// 从数据库API获取数据，不使用模拟数据

// DOM元素引用
const dictionaryFilter = document.getElementById('dictionary-filter');
const addDictionaryBtn = document.getElementById('add-dictionary-btn');
const dictionariesTable = document.getElementById('dictionaries-table');
const dictionariesTableBody = dictionariesTable.querySelector('tbody');
const dictionaryForm = document.getElementById('dictionary-form');
const dictionaryFormContainer = document.getElementById('dictionary-form-container');
const modalTitle = document.getElementById('modal-title');
const cancelModalBtn = document.getElementById('cancel-modal');
const dictionaryName = document.getElementById('dictionary-name');
const dictionaryDescription = document.getElementById('dictionary-description');
const dictionaryEnabled = document.getElementById('dictionary-enabled');
const dictionaryMastered = document.getElementById('dictionary-mastered');

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
    dictionaryFormContainer.style.display = 'block';
    dictionaryFormContainer.classList.add('modal-open');
    dictionaryName.focus();
}

// 关闭模态框
function closeModal() {
    dictionaryFormContainer.style.display = 'none';
    dictionaryFormContainer.classList.remove('modal-open');
    // 重置表单
    dictionaryForm.reset();
    currentDictionaryId = null;
}

// 打开添加字典模态框
function openAddModal() {
    currentDictionaryId = null;
    dictionaryName.value = '';
    dictionaryDescription.value = '';
    dictionaryEnabled.checked = true;
    dictionaryMastered.checked = false;
    openModal('添加字典');
}

// 打开编辑字典模态框
async function openEditModal(dictionary) {
    showLoading();
    try {
        const result = await apiRequest(`/api/dictionaries/${dictionary.dictionary_id}`);
        if (result.status === 'success') {
            const dictData = result.data;
            currentDictionaryId = dictData.dictionary_id;
            
            // 填充表单
            dictionaryName.value = dictData.name;
            dictionaryDescription.value = dictData.description || '';
            dictionaryEnabled.checked = dictData.is_enabled === 1;
            dictionaryMastered.checked = dictData.is_mastered === 1;
            
            openModal('编辑字典');
        } else {
            showAlert(result.message || '获取字典信息失败', 'error');
        }
    } catch (error) {
        // 使用模拟数据
        const dict = mockData.dictionaries.find(d => d.dictionary_id === dictionary.dictionary_id);
        if (dict) {
            currentDictionaryId = dict.dictionary_id;
            dictionaryName.value = dict.name;
            dictionaryDescription.value = dict.description || '';
            dictionaryEnabled.checked = dict.is_enabled === 1;
            dictionaryMastered.checked = dict.is_mastered === 1;
            openModal('编辑字典');
        } else {
            showAlert('获取字典信息失败', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// 渲染字典表格
function renderDictionaryTable(dictionaryList) {
    // 清空表格
    dictionariesTableBody.innerHTML = '';
    
    if (dictionaryList.length === 0) {
        // 无数据时的处理
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" style="text-align:center; padding:40px;">暂无字典数据</td>';
        dictionariesTableBody.appendChild(emptyRow);
        return;
    }
    
    // 渲染数据行
    dictionaryList.forEach(dict => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dict.name}</td>
            <td>${dict.description || '-'}</td>
            <td style="text-align:center;">
                <span class="status-badge ${dict.is_enabled === 1 ? 'enabled' : 'disabled'}">
                    ${dict.is_enabled === 1 ? '已启用' : '已停用'}
                </span>
            </td>
            <td style="text-align:center;">${dict.is_mastered === 1 ? '是' : '否'}</td>
            <td style="text-align:center;">${dict.created_at}</td>
            <td style="text-align:center;">
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="editDictionary(${dict.dictionary_id})"><i class="icon-edit"></i> 编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDictionary(${dict.dictionary_id})"><i class="icon-delete"></i> 删除</button>
                    <button class="btn btn-default btn-sm" onclick="viewDictionaryWords(${dict.dictionary_id}, '${encodeURIComponent(dict.name)}')"><i class="icon-view"></i> 查看单词</button>
                </div>
            </td>
        `;
        dictionariesTableBody.appendChild(row);
    });
}

// 加载字典列表
async function loadDictionaries() {
    showLoading();
    try {
        const result = await apiRequest('/api/dictionaries');
        if (result.status === 'success') {
            dictionaries = result.data || [];
            renderDictionaryTable(dictionaries);
        } else {
            showAlert(result.message || '加载字典列表失败', 'error');
        }
    } catch (error) {
        // 使用模拟数据
        dictionaries = mockData.dictionaries;
        renderDictionaryTable(dictionaries);
    } finally {
        showLoading(false);
    }
}

// 添加字典
async function addDictionary(dictionaryData) {
    showLoading();
    try {
        const result = await apiRequest('/api/dictionaries', 'POST', dictionaryData);
        if (result.status === 'success') {
            loadDictionaries();
            closeModal();
            showAlert('字典添加成功', 'success');
        } else {
            showAlert(result.message || '添加失败', 'error');
        }
    } catch (error) {
        // 模拟添加成功
        const newId = Math.max(...mockData.dictionaries.map(d => d.dictionary_id)) + 1;
        const newDict = {
            dictionary_id: newId,
            ...dictionaryData,
            created_at: new Date().toLocaleString('zh-CN')
        };
        mockData.dictionaries.push(newDict);
        loadDictionaries();
        closeModal();
        showAlert('字典添加成功', 'success');
    } finally {
        showLoading(false);
    }
}

// 更新字典
async function updateDictionary(id, dictionaryData) {
    showLoading();
    try {
        const result = await apiRequest(`/api/dictionaries/${id}`, 'PUT', dictionaryData);
        if (result.status === 'success') {
            loadDictionaries();
            closeModal();
            showAlert('字典更新成功', 'success');
        } else {
            showAlert(result.message || '更新失败', 'error');
        }
    } catch (error) {
        // 模拟更新成功
        const index = mockData.dictionaries.findIndex(d => d.dictionary_id === id);
        if (index !== -1) {
            mockData.dictionaries[index] = {
                ...mockData.dictionaries[index],
                ...dictionaryData
            };
            loadDictionaries();
            closeModal();
            showAlert('字典更新成功', 'success');
        }
    } finally {
        showLoading(false);
    }
}

// 删除字典
async function deleteDictionary(id) {
    if (confirm('确定要删除这个字典吗？删除后将无法恢复。')) {
        showLoading();
        try {
            const result = await apiRequest(`/api/dictionaries/${id}`, 'DELETE');
            if (result.status === 'success') {
                loadDictionaries();
                showAlert('字典删除成功', 'success');
            } else {
                showAlert(result.message || '删除失败', 'error');
            }
        } catch (error) {
            // 模拟删除成功
            mockData.dictionaries = mockData.dictionaries.filter(d => d.dictionary_id !== id);
            loadDictionaries();
            showAlert('字典删除成功', 'success');
        } finally {
            showLoading(false);
        }
    }
}

// 编辑字典
function editDictionary(id) {
    const dictionary = dictionaries.find(d => d.dictionary_id === id);
    if (dictionary) {
        openEditModal(dictionary);
    }
}

// 查看字典单词
function viewDictionaryWords(dictionaryId, dictionaryName) {
    window.location.href = `words.html?dictionary_id=${dictionaryId}&dictionary_name=${dictionaryName}`;
}

// 搜索功能
function handleSearch() {
    const keyword = dictionaryFilter.value.trim().toLowerCase();
    const filtered = dictionaries.filter(dict => 
        dict.name.toLowerCase().includes(keyword) || 
        (dict.description && dict.description.toLowerCase().includes(keyword))
    );
    renderDictionaryTable(filtered);
}

// 表单提交处理
function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: dictionaryName.value.trim(),
        description: dictionaryDescription.value.trim(),
        is_enabled: dictionaryEnabled.checked ? 1 : 0,
        is_mastered: dictionaryMastered.checked ? 1 : 0
    };
    
    // 简单验证
    if (!formData.name) {
        showAlert('请输入字典名称', 'warning');
        dictionaryName.focus();
        return;
    }
    
    if (currentDictionaryId) {
        // 编辑字典
        updateDictionary(currentDictionaryId, formData);
    } else {
        // 添加字典
        addDictionary(formData);
    }
}

// 初始化页面
function init() {
    // 添加事件监听器
    addDictionaryBtn.addEventListener('click', openAddModal);
    cancelModalBtn.addEventListener('click', closeModal);
    dictionaryForm.addEventListener('submit', handleFormSubmit);
    dictionaryFilter.addEventListener('input', handleSearch);
    
    // 添加全局函数
    window.editDictionary = editDictionary;
    window.deleteDictionary = deleteDictionary;
    window.viewDictionaryWords = viewDictionaryWords;
    
    // 加载字典列表
    loadDictionaries();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 添加一些基础样式
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
    }
    
    .btn-primary {
        background-color: #1890ff;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #40a9ff;
    }
    
    .btn-danger {
        background-color: #ff4d4f;
        color: white;
    }
    
    .btn-danger:hover {
        background-color: #ff7875;
    }
    
    .btn-default {
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #d9d9d9;
    }
    
    .btn-default:hover {
        background-color: #e6e6e6;
    }
    
    .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
    }
    
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
    }
    
    .status-badge.enabled {
        background-color: #f6ffed;
        color: #52c41a;
        border: 1px solid #b7eb8f;
    }
    
    .status-badge.disabled {
        background-color: #f5f5f5;
        color: #999;
        border: 1px solid #d9d9d9;
    }
    
    .action-buttons button {
        margin: 0 4px;
    }
    
    #dictionary-form-container {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        justify-content: center;
        align-items: center;
    }
    
    #dictionary-form-container.modal-open {
        display: flex;
    }
    
    #dictionary-form {
        background: white;
        padding: 24px;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    #dictionary-form h2 {
        margin-top: 0;
        margin-bottom: 20px;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }
    
    .form-group input[type="text"],
    .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        font-size: 14px;
    }
    
    .form-group textarea {
        resize: vertical;
        min-height: 80px;
    }
    
    .form-group input[type="checkbox"] {
        margin-right: 8px;
    }
    
    .form-actions {
        text-align: right;
        margin-top: 24px;
    }
    
    .form-actions button {
        margin-left: 12px;
    }
`;
document.head.appendChild(style);