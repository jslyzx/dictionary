// 字典管理页面的JavaScript逻辑 - Layui版本

let currentDictionaryId = null;
let dictionaryModal = null;
let wordsModal = null;

// 初始化页面
layui.use(['table', 'form', 'layer', 'jquery'], function () {
    const table = layui.table;
    const form = layui.form;
    const layer = layui.layer;
    const $ = layui.jquery;

    // 渲染字典表格
    const dictTable = table.render({
        elem: '#dictionaries-table',
        url: '/api/dictionaries',
        method: 'GET',
        page: true,
        limit: 10,
        limits: [10, 20, 50],
        request: {
            pageName: 'page',
            limitName: 'limit'
        },
        parseData: function (res) {
            return {
                "code": res.status === 'success' ? 0 : 1,
                "msg": res.message || '',
                "count": res.data.total || 0,
                "data": res.data.list || res.data || []
            };
        },
        cols: [[
            { field: 'name', title: '字典名称', minWidth: 200, align: 'left' },
            {
                field: 'description', title: '字典描述', minWidth: 300, align: 'left', templet: function (d) {
                    return d.description || '-';
                }
            },
            {
                field: 'is_enabled', title: '状态', width: 100, align: 'center', templet: function (d) {
                    return d.is_enabled === 1 ?
                        '<span class="layui-badge layui-bg-green">已启用</span>' :
                        '<span class="layui-badge">已停用</span>';
                }
            },
            {
                field: 'is_mastered', title: '是否掌握', width: 120, align: 'center', templet: function (d) {
                    return d.is_mastered === 1 ? '是' : '否';
                }
            },
            { field: 'created_at', title: '创建时间', width: 180, align: 'center' },
            { title: '操作', width: 200, align: 'center', toolbar: '#dictionary-toolbar' }
        ]],
        done: function (res, curr, count) {
            // 表格渲染完成后的回调
            if (res.data.length === 0) {
                // 无数据时的处理
                const emptyHtml = '<tr><td colspan="6" style="text-align:center; padding:40px;">暂无字典数据</td></tr>';
                this.elem.next('.layui-table-view').find('.layui-table-body tbody').html(emptyHtml);
            }
        }
    });

    // 搜索功能
    $('#dictionary-filter').on('input', function () {
        const keyword = $(this).val().trim();
        dictTable.reload({
            where: { keyword: keyword },
            page: { curr: 1 }
        });
    });

    // 添加字典按钮点击事件
    $('#add-dictionary-btn').on('click', function () {
        openAddModal();
    });

    // 编辑和删除按钮事件监听
    table.on('tool(dictionaries-table)', function (obj) {
        const data = obj.data;
        if (obj.event === 'edit') {
            openEditModal(data);
        } else if (obj.event === 'del') {
            deleteDictionary(data.dictionary_id);
        } else if (obj.event === 'viewWords') {
            viewDictionaryWords(data.dictionary_id, data.name);
        }
    });

    // 表单提交事件
    form.on('submit(save-dictionary)', function (data) {
        const formData = {
            name: data.field.name.trim(),
            description: data.field.description.trim(),
            is_enabled: data.field.enabled ? 1 : 0,
            is_mastered: data.field.mastered ? 1 : 0
        };

        if (currentDictionaryId) {
            // 编辑字典
            updateDictionary(currentDictionaryId, formData);
        } else {
            // 添加字典
            addDictionary(formData);
        }
        return false; // 阻止表单跳转
    });

    // 取消按钮点击事件
    $('#cancel-modal').on('click', function () {
        closeModal();
    });

    // 打开添加字典模态框
    function openAddModal() {
        currentDictionaryId = null;

        // 重置表单
        form.val('dictionary-form', {
            'dictionary_id': '',
            'name': '',
            'description': '',
            'enabled': true,
            'mastered': false
        });

        // 打开模态框
        dictionaryModal = layer.open({
            type: 1,
            title: '添加字典',
            content: $('#dictionary-form-container'),
            area: ['600px', 'auto'],
            maxWidth: '90%',
            success: function () {
                $('#dictionary-name').focus();
            }
        });
    }

    // 打开编辑字典模态框
    function openEditModal(dictionary) {
        layer.load(2);

        // 调用API获取字典详情
        $.ajax({
            url: `/api/dictionaries/${dictionary.dictionary_id}`,
            type: 'GET',
            success: function (res) {
                layer.closeAll('loading');
                if (res.status === 'success') {
                    const dictData = res.data;
                    currentDictionaryId = dictData.dictionary_id;

                    // 填充表单
                    form.val('dictionary-form', {
                        'dictionary_id': dictData.dictionary_id,
                        'name': dictData.name,
                        'description': dictData.description || '',
                        'enabled': dictData.is_enabled === 1,
                        'mastered': dictData.is_mastered === 1
                    });

                    // 打开模态框
                    dictionaryModal = layer.open({
                        type: 1,
                        title: '编辑字典',
                        content: $('#dictionary-form-container'),
                        area: ['600px', 'auto'],
                        maxWidth: '90%',
                        success: function () {
                            $('#dictionary-name').focus();
                        }
                    });
                } else {
                    layer.msg(res.message || '获取字典信息失败', { icon: 5 });
                }
            },
            error: function () {
                layer.closeAll('loading');
                layer.msg('网络错误，请重试', { icon: 5 });
            }
        });
    }

    // 关闭模态框
    function closeModal() {
        if (dictionaryModal) {
            layer.close(dictionaryModal);
            dictionaryModal = null;
        }
    }

    // 添加字典
    function addDictionary(dictionaryData) {
        layer.load(2);

        $.ajax({
            url: '/api/dictionaries',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dictionaryData),
            success: function (res) {
                layer.closeAll('loading');
                if (res.status === 'success') {
                    // 更新表格
                    dictTable.reload();
                    closeModal();
                    layer.msg('字典添加成功', { icon: 6 });
                } else {
                    layer.msg(res.message || '添加失败', { icon: 5 });
                }
            },
            error: function () {
                layer.closeAll('loading');
                layer.msg('网络错误，请重试', { icon: 5 });
            }
        });
    }

    // 更新字典
    function updateDictionary(id, dictionaryData) {
        layer.load(2);

        $.ajax({
            url: `/api/dictionaries/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dictionaryData),
            success: function (res) {
                layer.closeAll('loading');
                if (res.status === 'success') {
                    // 更新表格
                    dictTable.reload();
                    closeModal();
                    layer.msg('字典更新成功', { icon: 6 });
                } else {
                    layer.msg(res.message || '更新失败', { icon: 5 });
                }
            },
            error: function () {
                layer.closeAll('loading');
                layer.msg('网络错误，请重试', { icon: 5 });
            }
        });
    }

    // 删除字典
    function deleteDictionary(id) {
        layer.confirm('确定要删除这个字典吗？删除后将无法恢复。', {
            icon: 3,
            title: '提示'
        }, function (index) {
            layer.close(index);
            layer.load(2);

            $.ajax({
                url: `/api/dictionaries/${id}`,
                type: 'DELETE',
                success: function (res) {
                    layer.closeAll('loading');
                    if (res.status === 'success') {
                        // 更新表格
                        dictTable.reload();
                        layer.msg('字典删除成功', { icon: 6 });
                    } else {
                        layer.msg(res.message || '删除失败', { icon: 5 });
                    }
                },
                error: function () {
                    layer.closeAll('loading');
                    layer.msg('网络错误，请重试', { icon: 5 });
                }
            });
        });
    }

    // 查看字典单词
    function viewDictionaryWords(dictionaryId, dictionaryName) {
        // 跳转到单词页面，并传递字典ID参数
        window.location.href = `words.html?dictionary_id=${dictionaryId}&dictionary_name=${encodeURIComponent(dictionaryName)}`;
    }
});

// 为了兼容性保留的空函数
function apiRequest() { }
function showLoading() { }
function showAlert() { }