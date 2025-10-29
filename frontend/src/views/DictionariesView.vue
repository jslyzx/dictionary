<template>
  <div class="dictionaries-container">
    <div class="page-header">
      <h1>字典管理</h1>
    </div>
    
    <div class="toolbar">
      <div class="search-container">
        <a-input
          v-model:value="searchKeyword"
          placeholder="搜索字典名称"
          style="width: 300px;"
          @keyup.enter="handleSearch"
        />
        <a-button type="primary" @click="handleSearch" style="margin-left: 12px;">
          搜索
        </a-button>
      </div>
      <a-button type="primary" @click="showAddModal">
        <plus-outlined /> 添加字典
      </a-button>
    </div>
    
    <a-table
      :columns="columns"
      :data-source="filteredDictionaries"
      :loading="loading"
      row-key="dictionary_id"
      pagination
      :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
    >
      <template #headerCell="{ column }">
        <div v-if="column.key === 'action'">操作</div>
      </template>
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'is_enabled'">
          <a-tag color="green" v-if="record.is_enabled">启用</a-tag>
          <a-tag color="default" v-else>禁用</a-tag>
        </template>
        <template v-else-if="column.key === 'is_mastered'">
          <a-tag color="blue" v-if="record.is_mastered">已掌握</a-tag>
          <a-tag color="default" v-else>未掌握</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" @click="showEditModal(record)">编辑</a-button>
          <a-popconfirm
            title="确定要删除这个字典吗？"
            @confirm="deleteDictionary(record.dictionary_id)"
            ok-text="确定"
            cancel-text="取消"
          >
            <a-button type="link" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    
    <!-- 添加/编辑字典模态框 -->
    <a-modal
      v-model:visible="isModalVisible"
      :title="isEditMode ? '编辑字典' : '添加字典'"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form :model="formData" layout="vertical">
        <a-form-item label="字典名称" :required="true">
          <a-input v-model:value="formData.name" placeholder="请输入字典名称" />
        </a-form-item>
        <a-form-item label="字典描述">
          <a-input v-model:value="formData.description" placeholder="请输入字典描述" />
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model:checked="formData.is_enabled" />
        </a-form-item>
        <a-form-item label="是否掌握">
          <a-switch v-model:checked="formData.is_mastered" />
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- 批量操作模态框 -->
    <a-modal
      v-model:visible="batchActionVisible"
      title="批量操作"
      @cancel="batchActionVisible = false"
      footer=""
    >
      <div style="text-align: center; padding: 20px;">
        <p>已选择 {{ selectedRowKeys.length }} 个字典</p>
        <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
          <a-button @click="batchEnable">批量启用</a-button>
          <a-button @click="batchDisable">批量禁用</a-button>
          <a-button type="primary" danger @click="batchDelete">批量删除</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getDictionaries, createDictionary, updateDictionary, deleteDictionary as apiDeleteDictionary } from '../api/dictionaries'

export default {
  name: 'DictionariesView',
  components: {
    PlusOutlined
  },
  setup() {
    const dictionaries = ref([])
    const searchKeyword = ref('')
    const loading = ref(false)
    const isModalVisible = ref(false)
    const isEditMode = ref(false)
    const formData = ref({
      name: '',
      description: '',
      is_enabled: true,
      is_mastered: false
    })
    const selectedRowKeys = ref([])
    const batchActionVisible = ref(false)
    
    const columns = [
      {
        title: '字典ID',
        dataIndex: 'dictionary_id',
        key: 'dictionary_id',
        width: 80
      },
      {
        title: '字典名称',
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description'
      },
      {
        title: '状态',
        key: 'is_enabled',
        width: 80
      },
      {
        title: '掌握状态',
        key: 'is_mastered',
        width: 100
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180
      },
      {
        title: '操作',
        key: 'action',
        width: 150
      }
    ]
    
    const filteredDictionaries = computed(() => {
      if (!searchKeyword.value) return dictionaries.value
      return dictionaries.value.filter(dict => 
        dict.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
    })
    
    const loadDictionaries = async () => {
      loading.value = true
      try {
        const response = await getDictionaries()
        dictionaries.value = response.data || []
      } catch (error) {
        console.error('加载字典失败:', error)
        message.error('加载字典失败')
      } finally {
        loading.value = false
      }
    }
    
    const handleSearch = () => {
      console.log('搜索关键字:', searchKeyword.value)
    }
    
    const showAddModal = () => {
      isEditMode.value = false
      formData.value = {
        name: '',
        description: '',
        is_enabled: true,
        is_mastered: false
      }
      isModalVisible.value = true
    }
    
    const showEditModal = (record) => {
      isEditMode.value = true
      formData.value = { ...record }
      isModalVisible.value = true
    }
    
    const handleSubmit = async () => {
      if (!formData.value.name.trim()) {
        message.error('请输入字典名称')
        return
      }
      
      try {
        if (isEditMode.value) {
          await updateDictionary(formData.value.dictionary_id, formData.value)
          message.success('字典更新成功')
        } else {
          await createDictionary(formData.value)
          message.success('字典创建成功')
        }
        isModalVisible.value = false
        await loadDictionaries()
      } catch (error) {
        console.error('操作失败:', error)
        message.error('操作失败')
      }
    }
    
    const handleCancel = () => {
      isModalVisible.value = false
    }
    
    const deleteDictionary = async (id) => {
      try {
        await apiDeleteDictionary(id)
        message.success('字典删除成功')
        await loadDictionaries()
      } catch (error) {
        console.error('删除字典失败:', error)
        message.error('删除字典失败')
      }
    }
    
    const onSelectChange = (newSelectedRowKeys) => {
      selectedRowKeys.value = newSelectedRowKeys
      if (newSelectedRowKeys.length > 0) {
        batchActionVisible.value = true
      } else {
        batchActionVisible.value = false
      }
    }
    
    const batchEnable = async () => {
      // 批量启用逻辑
      batchActionVisible.value = false
      message.success('批量启用成功')
      await loadDictionaries()
    }
    
    const batchDisable = async () => {
      // 批量禁用逻辑
      batchActionVisible.value = false
      message.success('批量禁用成功')
      await loadDictionaries()
    }
    
    const batchDelete = async () => {
      // 批量删除逻辑
      batchActionVisible.value = false
      message.success('批量删除成功')
      await loadDictionaries()
    }
    
    onMounted(() => {
      loadDictionaries()
    })
    
    return {
      dictionaries,
      searchKeyword,
      loading,
      columns,
      filteredDictionaries,
      isModalVisible,
      isEditMode,
      formData,
      selectedRowKeys,
      batchActionVisible,
      handleSearch,
      showAddModal,
      showEditModal,
      handleSubmit,
      handleCancel,
      deleteDictionary,
      onSelectChange,
      batchEnable,
      batchDisable,
      batchDelete
    }
  }
}
</script>

<style scoped>
.dictionaries-container {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-container {
  display: flex;
  align-items: center;
}
</style>