<template>
  <div class="word-search-container">
    <div class="page-header">
      <h1>单词查询</h1>
    </div>
    
    <div class="search-section">
      <div class="search-input-wrapper">
        <a-input
          v-model:value="searchKeyword"
          placeholder="输入单词或关键词进行搜索..."
          style="width: 600px;"
          @keyup.enter="handleSearch"
        >
          <template #addonAfter>
            <a-select v-model:value="searchType" style="width: 120px;">
              <a-select-option value="word">单词</a-select-option>
              <a-select-option value="definition">释义</a-select-option>
              <a-select-option value="all">全部</a-select-option>
            </a-select>
          </template>
        </a-input>
        <a-button type="primary" @click="handleSearch" style="margin-left: 12px;">
          <search-outlined /> 搜索
        </a-button>
      </div>
      
      <div class="search-filters">
        <a-select v-model:value="selectedDictionary" placeholder="选择字典" style="width: 200px; margin-right: 12px;">
          <a-select-option value="">全部字典</a-select-option>
          <a-select-option v-for="dict in dictionaries" :key="dict.dictionary_id" :value="dict.dictionary_id">
            {{ dict.name }}
          </a-select-option>
        </a-select>
        <a-select v-model:value="selectedDifficulty" placeholder="难度" style="width: 120px; margin-right: 12px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="简单">简单</a-select-option>
          <a-select-option value="中等">中等</a-select-option>
          <a-select-option value="困难">困难</a-select-option>
        </a-select>
        <a-select v-model:value="masteredStatus" placeholder="掌握状态" style="width: 120px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="true">已掌握</a-select-option>
          <a-select-option value="false">未掌握</a-select-option>
        </a-select>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <a-spin size="large" tip="搜索中..." />
    </div>
    
    <div v-else-if="searchResults.length > 0" class="results-container">
      <div class="results-header">
        <span>找到 {{ searchResults.length }} 个结果</span>
        <a-button-group>
          <a-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
            <ordered-list-outlined /> 列表视图
          </a-button>
          <a-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
            <appstore-outlined /> 卡片视图
          </a-button>
        </a-button-group>
      </div>
      
      <div v-if="viewMode === 'list'" class="list-view">
        <a-table
          :columns="columns"
          :data-source="searchResults"
          row-key="word_id"
          pagination={{ pageSize: 10 }}
        >
          <template #bodyCell="{ record, column }">
            <template v-if="column.key === 'word'">
              <span class="word-item" @click="showWordDetail(record)">{{ record.word }}</span>
            </template>
            <template v-else-if="column.key === 'difficulty'">
              <a-tag :color="getDifficultyColor(record.difficulty)">{{ record.difficulty }}</a-tag>
            </template>
            <template v-else-if="column.key === 'is_mastered'">
              <a-tag color="blue" v-if="record.is_mastered">已掌握</a-tag>
              <a-tag color="default" v-else>未掌握</a-tag>
            </template>
          </template>
        </a-table>
      </div>
      
      <div v-else class="card-view">
        <div class="card-grid">
          <div v-for="word in searchResults" :key="word.word_id" class="word-card" @click="showWordDetail(word)">
            <div class="card-header">
              <h3 class="word-title">{{ word.word }}</h3>
              <div class="word-tags">
                <a-tag :color="getDifficultyColor(word.difficulty)">{{ word.difficulty }}</a-tag>
                <a-tag v-if="word.is_mastered" color="blue">已掌握</a-tag>
              </div>
            </div>
            <div class="pronunciation">{{ word.pronunciation }}</div>
            <div class="definition">{{ truncateText(word.definition, 100) }}</div>
            <div class="card-footer">
              <span class="dictionary-name">{{ word.dictionary_name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="hasSearched" class="no-results">
      <empty description="没有找到匹配的单词" />
    </div>
    
    <!-- 单词详情模态框 -->
    <a-modal
      v-model:visible="detailModalVisible"
      :title="selectedWord?.word || '单词详情'"
      @cancel="handleCancelDetail"
      width="800px"
    >
      <div v-if="selectedWord" class="word-detail">
        <div class="detail-header">
          <h2>{{ selectedWord.word }}</h2>
          <p class="pronunciation">{{ selectedWord.pronunciation }}</p>
        </div>
        
        <div class="detail-content">
          <div class="info-section">
            <h3>释义</h3>
            <p>{{ selectedWord.definition }}</p>
          </div>
          
          <div v-if="selectedWord.example" class="info-section">
            <h3>例句</h3>
            <p>{{ selectedWord.example }}</p>
          </div>
          
          <div class="info-section">
            <h3>基本信息</h3>
            <a-descriptions bordered :column="2">
              <a-descriptions-item label="所属字典">{{ selectedWord.dictionary_name }}</a-descriptions-item>
              <a-descriptions-item label="难度">
                <a-tag :color="getDifficultyColor(selectedWord.difficulty)">{{ selectedWord.difficulty }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="掌握状态">
                <a-tag color="blue" v-if="selectedWord.is_mastered">已掌握</a-tag>
                <a-tag color="default" v-else>未掌握</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="创建时间">{{ selectedWord.created_at }}</a-descriptions-item>
            </a-descriptions>
          </div>
          
          <div v-if="selectedWord.notes" class="info-section">
            <h3>笔记</h3>
            <p>{{ selectedWord.notes }}</p>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { SearchOutlined, OrderedListOutlined, AppstoreOutlined } from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { searchWords } from '../api/words'
import { getDictionaries } from '../api/dictionaries'

export default {
  name: 'WordSearchView',
  components: {
    SearchOutlined,
    OrderedListOutlined,
    AppstoreOutlined,
    Empty
  },
  setup() {
    const searchKeyword = ref('')
    const searchType = ref('word')
    const selectedDictionary = ref('')
    const selectedDifficulty = ref('')
    const masteredStatus = ref('')
    const searchResults = ref([])
    const dictionaries = ref([])
    const loading = ref(false)
    const hasSearched = ref(false)
    const viewMode = ref('list')
    const detailModalVisible = ref(false)
    const selectedWord = ref(null)
    
    const columns = [
      {
        title: '单词',
        dataIndex: 'word',
        key: 'word',
        width: 150
      },
      {
        title: '发音',
        dataIndex: 'pronunciation',
        key: 'pronunciation',
        width: 150
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
      }
    ]
    
    const loadDictionaries = async () => {
      try {
        const response = await getDictionaries()
        dictionaries.value = response.data || []
      } catch (error) {
        console.error('加载字典失败:', error)
      }
    }
    
    const handleSearch = async () => {
      if (!searchKeyword.value.trim() && !selectedDictionary.value && !selectedDifficulty.value && !masteredStatus.value) {
        message.warning('请输入搜索条件')
        return
      }
      
      loading.value = true
      hasSearched.value = true
      
      try {
        const params = {
          keyword: searchKeyword.value.trim(),
          type: searchType.value,
          dictionary_id: selectedDictionary.value || undefined,
          difficulty: selectedDifficulty.value || undefined,
          is_mastered: masteredStatus.value ? (masteredStatus.value === 'true') : undefined
        }
        
        const response = await searchWords(params)
        searchResults.value = response.data || []
        console.log('搜索结果:', searchResults.value)
      } catch (error) {
        console.error('搜索失败:', error)
        message.error('搜索失败')
        searchResults.value = []
      } finally {
        loading.value = false
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
    
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }
    
    const showWordDetail = (word) => {
      selectedWord.value = word
      detailModalVisible.value = true
    }
    
    const handleCancelDetail = () => {
      detailModalVisible.value = false
      selectedWord.value = null
    }
    
    onMounted(() => {
      loadDictionaries()
    })
    
    return {
      searchKeyword,
      searchType,
      selectedDictionary,
      selectedDifficulty,
      masteredStatus,
      searchResults,
      dictionaries,
      loading,
      hasSearched,
      viewMode,
      detailModalVisible,
      selectedWord,
      columns,
      handleSearch,
      getDifficultyColor,
      truncateText,
      showWordDetail,
      handleCancelDetail
    }
  }
}
</script>

<style scoped>
.word-search-container {
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

.search-section {
  margin-bottom: 24px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.search-filters {
  display: flex;
  align-items: center;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.results-container {
  margin-top: 24px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-view .word-item {
  color: #1890ff;
  cursor: pointer;
  font-weight: bold;
}

.list-view .word-item:hover {
  text-decoration: underline;
}

.card-view {
  margin-top: 16px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.word-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.word-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-color: #1890ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.word-title {
  margin: 0;
  color: #1890ff;
  font-size: 20px;
}

.pronunciation {
  color: #666;
  margin-bottom: 12px;
}

.definition {
  color: #333;
  margin-bottom: 12px;
  line-height: 1.5;
}

.card-footer {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.word-detail .detail-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8e8e8;
}

.word-detail .detail-header h2 {
  color: #1890ff;
  margin: 0 0 8px 0;
}

.word-detail .info-section {
  margin-bottom: 24px;
}

.word-detail .info-section h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
}

.word-detail .info-section p {
  margin: 0;
  line-height: 1.6;
  color: #555;
}
</style>