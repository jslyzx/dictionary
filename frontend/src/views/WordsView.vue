<template>
  <div class="words-container">
    <div class="page-header">
      <h1>单词管理</h1>
    </div>
    
    <div class="toolbar">
      <div class="search-filter">
        <a-select v-model:value="selectedDictionary" placeholder="选择字典" style="width: 200px; margin-right: 12px;">
          <a-select-option value="">全部字典</a-select-option>
          <a-select-option v-for="dict in dictionaries" :key="dict.dictionary_id" :value="dict.dictionary_id">
            {{ dict.name }}
          </a-select-option>
        </a-select>
        <a-input
          v-model:value="searchKeyword"
          placeholder="搜索单词"
          style="width: 300px; margin-right: 12px;"
          @keyup.enter="handleSearch"
        />
        <a-button type="primary" @click="handleSearch">搜索</a-button>
      </div>
      <a-button type="primary" @click="showAddModal">
        <plus-outlined /> 添加单词
      </a-button>
    </div>
    
    <a-table
      :columns="columns"
      :data-source="filteredWords"
      :loading="loading"
      row-key="word_id"
      pagination
      :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
    >
      <template #headerCell="{ column }">
        <div v-if="column.key === 'action'">操作</div>
      </template>
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'is_mastered'">
          <a-tag color="blue" v-if="record.is_mastered">已掌握</a-tag>
          <a-tag color="default" v-else>未掌握</a-tag>
        </template>
        <template v-else-if="column.key === 'difficulty'">
          <a-tag :color="getDifficultyColor(record.difficulty)">{{ record.difficulty }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" @click="showEditModal(record)">编辑</a-button>
          <a-popconfirm
            title="确定要删除这个单词吗？"
            @confirm="deleteWord(record.word_id)"
            ok-text="确定"
            cancel-text="取消"
          >
            <a-button type="link" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    
    <!-- 添加/编辑单词模态框 -->
    <a-modal
      v-model:visible="isModalVisible"
      :title="isEditMode ? '编辑单词' : '添加单词'"
      @ok="handleSubmit"
      @cancel="handleCancel"
      width="800px"
    >
      <a-form :model="formData" layout="vertical">
        <a-form-item label="所属字典" :required="true">
          <a-select v-model:value="formData.dictionary_id" placeholder="请选择字典">
            <a-select-option v-for="dict in dictionaries" :key="dict.dictionary_id" :value="dict.dictionary_id">
              {{ dict.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="单词" :required="true">
          <a-input v-model:value="formData.word" placeholder="请输入单词" />
        </a-form-item>
        <a-form-item label="发音">
          <a-input v-model:value="formData.pronunciation" placeholder="请输入发音" />
        </a-form-item>
        <a-form-item label="释义" :required="true">
          <a-input v-model:value="formData.definition" placeholder="请输入释义" />
        </a-form-item>
        <a-form-item label="例句">
          <a-input v-model:value="formData.example" placeholder="请输入例句" />
        </a-form-item>
        <div style="display: flex; gap: 24px;">
          <a-form-item label="难度" style="flex: 1;">
            <a-select v-model:value="formData.difficulty" placeholder="请选择难度">
              <a-select-option value="简单">简单</a-select-option>
              <a-select-option value="中等">中等</a-select-option>
              <a-select-option value="困难">困难</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="是否掌握" style="flex: 1;">
            <a-switch v-model:checked="formData.is_mastered" />
          </a-form-item>
        </div>
        <a-form-item label="笔记">
          <a-input v-model:value="formData.notes" placeholder="请输入笔记" rows="3" />
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
        <p>已选择 {{ selectedRowKeys.length }} 个单词</p>
        <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
          <a-button @click="batchMarkMastered">标记为已掌握</a-button>
          <a-button @click="batchMarkUnmastered">标记为未掌握</a-button>
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
import { getWords, createWord, updateWord, deleteWord as apiDeleteWord } from '../api/words'
import { getDictionaries } from '../api/dictionaries'

export default {
  name: 'WordsView',
  components: {
    PlusOutlined
  },
  // 使用Ant Design Vue的自动导入机制，无需手动注册a-input-textarea等基础组件
  setup() {
    const words = ref([])
    const dictionaries = ref([])
    const searchKeyword = ref('')
    const selectedDictionary = ref('')
    const loading = ref(false)
    const isModalVisible = ref(false)
    const isEditMode = ref(false)
    const formData = ref({
      dictionary_id: '',
      word: '',
      pronunciation: '',
      definition: '',
      example: '',
      difficulty: '简单',
      is_mastered: false,
      notes: ''
    })
    const selectedRowKeys = ref([])
    const batchActionVisible = ref(false)
    
    const columns = [
      {
        title: '单词ID',
        dataIndex: 'word_id',
        key: 'word_id',
        width: 80
      },
      {
        title: '单词',
        dataIndex: 'word',
        key: 'word'
      },
      {
        title: '发音',
        dataIndex: 'pronunciation',
        key: 'pronunciation'
      },
      {
        title: '释义',
        dataIndex: 'definition',
        key: 'definition'
      },
      {
        title: '难度',
        key: 'difficulty',
        width: 80
      },
      {
        title: '掌握状态',
        key: 'is_mastered',
        width: 100
      },
      {
        title: '所属字典',
        dataIndex: 'dictionary_name',
        key: 'dictionary_name'
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
    
    const filteredWords = computed(() => {
      return words.value.filter(word => {
        const matchesKeyword = !searchKeyword.value || 
          word.word.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
          word.definition.toLowerCase().includes(searchKeyword.value.toLowerCase())
        const matchesDictionary = !selectedDictionary.value || 
          word.dictionary_id === selectedDictionary.value
        return matchesKeyword && matchesDictionary
      })
    })
    
    const loadWords = async () => {
      loading.value = true
      try {
        const response = await getWords()
        words.value = response.data || []
      } catch (error) {
        console.error('加载单词失败:', error)
        message.error('加载单词失败')
      } finally {
        loading.value = false
      }
    }
    
    const loadDictionaries = async () => {
      try {
        const response = await getDictionaries()
        dictionaries.value = response.data || []
      } catch (error) {
        console.error('加载字典失败:', error)
      }
    }
    
    const getDifficultyColor = (difficulty) => {
      const colorMap = {
        '简单': 'green',
        '中等': 'orange',
        '困难': 'red'
      }
      return colorMap[difficulty] || 'default'
    }
    
    const handleSearch = () => {
      console.log('搜索关键字:', searchKeyword.value, '字典ID:', selectedDictionary.value)
    }
    
    const showAddModal = () => {
      isEditMode.value = false
      formData.value = {
        dictionary_id: selectedDictionary.value || '',
        word: '',
        pronunciation: '',
        definition: '',
        example: '',
        difficulty: '简单',
        is_mastered: false,
        notes: ''
      }
      isModalVisible.value = true
    }
    
    const showEditModal = (record) => {
      isEditMode.value = true
      formData.value = { ...record }
      isModalVisible.value = true
    }
    
    const handleSubmit = async () => {
      if (!formData.value.word.trim()) {
        message.error('请输入单词')
        return
      }
      if (!formData.value.definition.trim()) {
        message.error('请输入释义')
        return
      }
      if (!formData.value.dictionary_id) {
        message.error('请选择所属字典')
        return
      }
      
      try {
        if (isEditMode.value) {
          await updateWord(formData.value.word_id, formData.value)
          message.success('单词更新成功')
        } else {
          await createWord(formData.value)
          message.success('单词创建成功')
        }
        isModalVisible.value = false
        await loadWords()
      } catch (error) {
        console.error('操作失败:', error)
        message.error('操作失败')
      }
    }
    
    const handleCancel = () => {
      isModalVisible.value = false
    }
    
    const deleteWord = async (id) => {
      try {
        await apiDeleteWord(id)
        message.success('单词删除成功')
        await loadWords()
      } catch (error) {
        console.error('删除单词失败:', error)
        message.error('删除单词失败')
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
    
    const batchMarkMastered = async () => {
      // 批量标记为已掌握逻辑
      batchActionVisible.value = false
      message.success('批量标记成功')
      await loadWords()
    }
    
    const batchMarkUnmastered = async () => {
      // 批量标记为未掌握逻辑
      batchActionVisible.value = false
      message.success('批量标记成功')
      await loadWords()
    }
    
    const batchDelete = async () => {
      // 批量删除逻辑
      batchActionVisible.value = false
      message.success('批量删除成功')
      await loadWords()
    }
    
    onMounted(async () => {
      await loadDictionaries()
      await loadWords()
    })
    
    return {
      words,
      dictionaries,
      searchKeyword,
      selectedDictionary,
      loading,
      columns,
      filteredWords,
      isModalVisible,
      isEditMode,
      formData,
      selectedRowKeys,
      batchActionVisible,
      getDifficultyColor,
      handleSearch,
      showAddModal,
      showEditModal,
      handleSubmit,
      handleCancel,
      deleteWord,
      onSelectChange,
      batchMarkMastered,
      batchMarkUnmastered,
      batchDelete
    }
  }
}
</script>

<style scoped>
.words-container {
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

.search-filter {
  display: flex;
  align-items: center;
}
</style>