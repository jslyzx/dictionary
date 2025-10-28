// 单词管理页面的JavaScript逻辑 - Layui版本

layui.use(['table', 'form', 'layer', 'jquery'], function () {
    const table = layui.table;
    const form = layui.form;
    const layer = layui.layer;
    const $ = layui.jquery;

    // 全局数据
    let currentWordId = null;
    let selectedDictionaryId = 0; // 默认显示全部字典
    let dictionaries = [];

    // 从URL获取字典ID参数
    function getDictionaryIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const dictId = urlParams.get('dictionary_id');
        if (dictId) {
            selectedDictionaryId = parseInt(dictId);
        }
    }

    // 初始化页面
    function initWordsPage() {
        // 从URL获取字典ID参数
        getDictionaryIdFromUrl();

        // 加载字典下拉框
        loadDictionarySelect();

        // 初始化表格
        initTable();

        // 绑定事件
        $('.layui-btn-add').on('click', openAddModal);
        form.on('submit(word-form-submit)', handleFormSubmit);
        form.on('select(dictionary-filter)', handleDictionaryChange);
    }

    // 加载字典下拉框
    function loadDictionarySelect() {
        $.ajax({
            url: '/api/dictionaries',
            type: 'GET',
            dataType: 'json',
            success: function (result) {
                dictionaries = result.data || [];

                // 清空并添加字典选项到主页面的字典选择器
                $('#dictionary-filter').empty().append('<option value="0">全部字典</option>');

                // 清空并添加字典选项到模态框的字典选择器
                $('#word-dictionaries').empty();

                dictionaries.forEach(dict => {
                    // 主页面的字典选择器
                    const selected = dict.dictionary_id === selectedDictionaryId ? 'selected' : '';
                    $('#dictionary-filter').append(`<option value="${dict.dictionary_id}" ${selected}>${dict.name}</option>`);

                    // 模态框中的字典多选框
                    $('#word-dictionaries').append(`<option value="${dict.dictionary_id}">${dict.name}</option>`);
                });

                // 重新渲染表单
                form.render('select');
            },
            error: function (xhr, status, error) {
                console.error('加载字典下拉框失败:', error);
                layer.msg('加载字典列表失败', { icon: 5 });
            }
        });
    }

    // 初始化表格
    function initTable() {
        // 构建表格URL
        function getTableUrl() {
            if (selectedDictionaryId > 0) {
                return `/api/dictionary/${selectedDictionaryId}/words`;
            }
            return '/api/words';
        }

        table.render({
            elem: '#words-table',
            url: getTableUrl(),
            method: 'GET',
            parseData: function (res) {
                return {
                    "code": res.success ? 0 : 1,
                    "msg": res.message || "",
                    "count": res.data ? res.data.length : 0,
                    "data": res.data || []
                };
            },
            cols: [[
                { field: 'word', title: '单词', width: 150 },
                { field: 'phonetic', title: '音标', width: 180 },
                { field: 'meaning', title: '释义', minWidth: 200 },
                {
                    field: 'pronunciation1', title: '发音', width: 80, templet: function (d) {
                        return d.pronunciation1 || d.pronunciation2 || d.pronunciation3 ? '有' : '无';
                    }
                },
                { field: 'created_at', title: '创建时间', width: 180 },
                { fixed: 'right', title: '操作', toolbar: '#table-toolbar', width: 200 }
            ]],
            page: true,
            limit: 10,
            limits: [10, 20, 30, 50],
            text: {
                none: '暂无单词数据'
            },
            done: function (res, curr, count) {
                // 表格渲染完成后的回调
            }
        });

        // 监听工具条
        table.on('tool(words-table)', function (obj) {
            const data = obj.data;
            if (obj.event === 'edit') {
                openEditModal(data);
            } else if (obj.event === 'del') {
                deleteWord(data.word_id);
            } else if (obj.event === 'view') {
                viewWordDetails(data.word_id);
            }
        });

        // 监听搜索
        form.on('submit(word-search)', function (data) {
            table.reload('words-table', {
                where: {
                    search: data.field.search
                },
                page: {
                    curr: 1
                }
            });
            return false;
        });
    }

    // 打开添加单词模态框
    function openAddModal() {
        currentWordId = null;

        // 清空表单
        form.val('word-form', {
            'word-id': '',
            'word-text': '',
            'word-phonetic': '',
            'word-meaning': '',
            'word-pronunciation1': '',
            'word-pronunciation2': '',
            'word-pronunciation3': ''
        });

        // 清空字典选择
        $('#word-dictionaries').val([]);
        form.render('select');

        // 打开模态框
        layer.open({
            type: 1,
            title: '添加单词',
            area: ['600px', '600px'],
            content: $('#word-modal'),
            success: function (layero, index) {
                $('#word-text').focus();
            },
            end: function () {
                // 重置表单
                form.val('word-form', {
                    'word-id': '',
                    'word-text': '',
                    'word-phonetic': '',
                    'word-meaning': '',
                    'word-pronunciation1': '',
                    'word-pronunciation2': '',
                    'word-pronunciation3': ''
                });
            }
        });
    }

    // 打开编辑单词模态框
    function openEditModal(word) {
        $.ajax({
            url: `/words/${word.word_id}`,
            type: 'GET',
            dataType: 'json',
            beforeSend: function () {
                layer.load(1);
            },
            success: function (result) {
                const wordData = result.data;

                currentWordId = wordData.word_id;

                // 填充表单
                form.val('word-form', {
                    'word-id': wordData.word_id,
                    'word-text': wordData.word,
                    'word-phonetic': wordData.phonetic,
                    'word-meaning': wordData.meaning,
                    'word-pronunciation1': wordData.pronunciation1 || '',
                    'word-pronunciation2': wordData.pronunciation2 || '',
                    'word-pronunciation3': wordData.pronunciation3 || ''
                });

                // 选中单词所属的字典
                const wordDictIds = wordData.dictionaries ?
                    wordData.dictionaries.map(d => d.dictionary_id.toString()) : [];

                $('#word-dictionaries').val(wordDictIds);
                form.render('select');

                // 打开模态框
                layer.open({
                    type: 1,
                    title: '编辑单词',
                    area: ['600px', '600px'],
                    content: $('#word-modal'),
                    success: function (layero, index) {
                        $('#word-text').focus();
                    }
                });
            },
            error: function (xhr, status, error) {
                console.error('加载单词详情失败:', error);
                layer.msg('加载单词详情失败: ' + (xhr.responseJSON ? xhr.responseJSON.message : error), { icon: 5 });
            },
            complete: function () {
                layer.closeAll('loading');
            }
        });
    }

    // 处理表单提交
    function handleFormSubmit(data) {
        const field = data.field;

        const formData = {
            word: field['word-text'].trim(),
            phonetic: field['word-phonetic'].trim(),
            meaning: field['word-meaning'].trim(),
            pronunciation1: field['word-pronunciation1'].trim() || null,
            pronunciation2: field['word-pronunciation2'].trim() || null,
            pronunciation3: field['word-pronunciation3'].trim() || null
        };

        // 获取选中的字典ID
        const selectedDictIds = $('#word-dictionaries').val() || [];

        layer.load(1);

        if (currentWordId) {
            // 编辑单词
            updateWord(currentWordId, formData, selectedDictIds);
        } else {
            // 添加单词
            addWord(formData, selectedDictIds);
        }

        return false;
    }

    // 添加单词
    function addWord(wordData, dictionaryIds) {
        $.ajax({
            url: '/words',
            type: 'POST',
            dataType: 'json',
            data: {
                ...wordData,
                dictionaries: dictionaryIds
            },
            success: function (result) {
                // 关闭模态框
                layer.closeAll('page');

                // 重新加载表格
                initTable();

                // 显示成功提示
                layer.msg('单词添加成功', { icon: 6 });
            },
            error: function (xhr, status, error) {
                console.error('添加单词失败:', error);
                layer.msg('添加单词失败: ' + (xhr.responseJSON ? xhr.responseJSON.message : error), { icon: 5 });
            },
            complete: function () {
                layer.closeAll('loading');
            }
        });
    }

    // 更新单词
    function updateWord(id, wordData, dictionaryIds) {
        $.ajax({
            url: `/words/${id}`,
            type: 'PUT',
            dataType: 'json',
            data: {
                ...wordData,
                dictionaries: dictionaryIds
            },
            success: function (result) {
                // 关闭模态框
                layer.closeAll('page');

                // 重新加载表格
                initTable();

                // 显示成功提示
                layer.msg('单词更新成功', { icon: 6 });
            },
            error: function (xhr, status, error) {
                console.error('更新单词失败:', error);
                layer.msg('更新单词失败: ' + (xhr.responseJSON ? xhr.responseJSON.message : error), { icon: 5 });
            },
            complete: function () {
                layer.closeAll('loading');
            }
        });
    }

    // 删除单词
    function deleteWord(id) {
        layer.confirm('确定要删除这个单词吗？删除后将无法恢复。', {
            icon: 3,
            title: '确认删除'
        }, function (index) {
            $.ajax({
                url: `/words/${id}`,
                type: 'DELETE',
                dataType: 'json',
                beforeSend: function () {
                    layer.load(1);
                },
                success: function (result) {
                    // 重新加载表格
                    initTable();

                    // 显示成功提示
                    layer.msg('单词删除成功', { icon: 6 });
                },
                error: function (xhr, status, error) {
                    console.error('删除单词失败:', error);
                    layer.msg('删除单词失败: ' + (xhr.responseJSON ? xhr.responseJSON.message : error), { icon: 5 });
                },
                complete: function () {
                    layer.closeAll('loading');
                    layer.close(index);
                }
            });
        });
    }

    // 查看单词详情
    function viewWordDetails(id) {
        $.ajax({
            url: `/words/${id}`,
            type: 'GET',
            dataType: 'json',
            beforeSend: function () {
                layer.load(1);
            },
            success: function (result) {
                const wordData = result.data;

                if (wordData) {
                    // 构建详情内容
                    let content = `
                        <div style="padding: 20px;">
                            <table class="layui-table">
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
                                <tr>
                                    <td style="font-weight: bold;">创建时间</td>
                                    <td>${wordData.created_at || '-'}</td>
                                </tr>
                    `;

                    // 获取单词所属的字典
                    if (wordData.dictionaries && wordData.dictionaries.length > 0) {
                        const dictNames = wordData.dictionaries.map(d => d.name).join(', ');
                        content += `
                            <tr>
                                <td style="font-weight: bold;">所属字典</td>
                                <td>${dictNames}</td>
                            </tr>
                        `;
                    }

                    content += `</table></div>`;

                    // 显示详情弹窗
                    layer.open({
                        type: 1,
                        title: '单词详情',
                        area: ['500px', '400px'],
                        content: content
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error('获取单词详情失败:', error);
                layer.msg('获取单词详情失败: ' + (xhr.responseJSON ? xhr.responseJSON.message : error), { icon: 5 });
            },
            complete: function () {
                layer.closeAll('loading');
            }
        });
    }

    // 处理字典选择变化
    function handleDictionaryChange() {
        selectedDictionaryId = parseInt(this.value);
        // 重新加载表格
        initTable();
    }

    // 从API加载数据
    function loadDataFromStorage() {
        // 此函数名称保持不变以兼容初始化逻辑
        // 但实现改为调用API加载字典
        loadDictionarySelect();
    }

    // 页面加载完成后执行
    $(document).ready(function () {
        // 从API加载数据
        loadDataFromStorage();
        // 初始化页面
        initWordsPage();
    });
}); // 闭合layui.use