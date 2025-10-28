// 基础配置
const API_BASE_URL = 'api'; // 假设API基础路径

// 工具函数
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

// 显示消息提示
function showAlert(message, type = 'info') {
    const alertContainer = $('.alerts-container') || createAlertsContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    
    // 3秒后自动移除
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 3000);
}

function createAlertsContainer() {
    const container = document.createElement('div');
    container.className = 'alerts-container';
    container.style.position = 'fixed';
    top: '20px';
    right: '20px';
    zIndex: '1000';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 300px;
    `;
    document.body.appendChild(container);
    return container;
}

// 显示加载状态
function showLoading(element) {
    const loading = document.createElement('div');
    loading.className = 'loading';
    if (element) {
        element.innerHTML = '';
        element.appendChild(loading);
        return loading;
    } else {
        document.body.appendChild(loading);
        return loading;
    }
}

// 隐藏加载状态
function hideLoading(element) {
    const loading = element ? element.querySelector('.loading') : document.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
}

// 简单的API请求封装
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        // 直接使用传入的完整URL路径
        const url = endpoint;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        console.log(`API请求: ${method} ${url}`, data);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '请求失败');
        }
        
        return result;
    } catch (error) {
        console.error('API请求失败:', error);
        showAlert(`API请求失败: ${error.message}`, 'error');
        throw error;
    }
}

// 播放发音
function playPronunciation(audioUrl) {
    if (!audioUrl) {
        showAlert('发音文件不可用', 'info');
        return;
    }
    
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
        console.error('播放发音失败:', error);
        showAlert('发音播放失败', 'error');
    });
}

// 初始化表单验证
function initFormValidation(formSelector) {
    const form = $(formSelector);
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;
        
        // 简单的必填项验证
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = '#e74c3c';
                field.addEventListener('input', function() {
                    field.style.borderColor = '#ddd';
                }, { once: true });
            }
        });
        
        if (isValid) {
            form.dispatchEvent(new CustomEvent('formValidated'));
        } else {
            showAlert('请填写所有必填字段', 'error');
        }
    });
}

// 构建表格行
function buildTableRow(data, columns, actions = []) {
    const row = document.createElement('tr');
    
    columns.forEach(column => {
        const cell = document.createElement('td');
        if (typeof column === 'string') {
            cell.textContent = data[column] || '';
        } else if (typeof column === 'function') {
            const content = column(data);
            if (content instanceof Node) {
                cell.appendChild(content);
            } else {
                cell.textContent = content || '';
            }
        }
        row.appendChild(cell);
    });
    
    // 添加操作列
    if (actions.length > 0) {
        const actionCell = document.createElement('td');
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `action-btn ${action.className || ''}`;
            button.textContent = action.text;
            button.addEventListener('click', () => action.onClick(data));
            actionButtons.appendChild(button);
        });
        
        actionCell.appendChild(actionButtons);
        row.appendChild(actionCell);
    }
    
    return row;
}

// 过滤功能
function initFilter(tableSelector, filterInputSelector) {
    const table = $(tableSelector);
    const filterInput = $(filterInputSelector);
    
    if (!table || !filterInput) return;
    
    filterInput.addEventListener('input', function() {
        const filterValue = this.value.toLowerCase();
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filterValue) ? '' : 'none';
        });
    });
}

// 简单的本地存储操作
const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },
    get: (key) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
};

// 初始化日期选择器
function initDatePickers() {
    const dateInputs = $$('input[type="date"]');
    dateInputs.forEach(input => {
        const today = new Date().toISOString().split('T')[0];
        input.max = today;
    });
}

// 页面加载完成后的初始化
function init() {
    // 初始化日期选择器
    initDatePickers();
    
    // 根据当前页面执行特定的初始化
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'index.html':
            initHomePage();
            break;
        case 'dictionaries.html':
            initDictionariesPage();
            break;
        case 'words.html':
            initWordsPage();
            break;
        case 'word_search.html':
            initWordSearchPage();
            break;
    }
}

// 各页面特定的初始化函数
function initHomePage() {
    // 首页特定逻辑
    console.log('Home page initialized');
}

function initDictionariesPage() {
    // 字典管理页面逻辑
    console.log('Dictionaries page initialized');
}

function initWordsPage() {
    // 单词管理页面逻辑
    console.log('Words page initialized');
}

function initWordSearchPage() {
    // 单词查询页面逻辑
    console.log('Word search page initialized');
}

// 当文档加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 暴露全局函数
window.showAlert = showAlert;
window.apiRequest = apiRequest;
window.playPronunciation = playPronunciation;
window.initFormValidation = initFormValidation;
window.buildTableRow = buildTableRow;
window.initFilter = initFilter;
window.Storage = Storage;