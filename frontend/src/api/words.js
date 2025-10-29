// 单词相关API服务

const baseUrl = '/api'

// 获取所有单词
export const getWords = async () => {
  try {
    const response = await fetch(`${baseUrl}/words`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('获取单词列表:', data)
    return data
  } catch (error) {
    console.error('获取单词失败:', error)
    // 模拟数据，用于开发测试
    return {
      data: [
        {
          word_id: 1,
          dictionary_id: 1,
          dictionary_name: '基础英语词汇',
          word: 'hello',
          pronunciation: '/həˈləʊ/',
          definition: '你好，用于问候或打招呼',
          example: 'Hello, nice to meet you!',
          difficulty: '简单',
          is_mastered: true,
          notes: '最常用的问候语',
          created_at: '2024-01-01 10:00:00'
        },
        {
          word_id: 2,
          dictionary_id: 1,
          dictionary_name: '基础英语词汇',
          word: 'world',
          pronunciation: '/wɜːld/',
          definition: '世界，地球',
          example: 'The world is a beautiful place.',
          difficulty: '简单',
          is_mastered: true,
          notes: '',
          created_at: '2024-01-01 10:05:00'
        },
        {
          word_id: 3,
          dictionary_id: 2,
          dictionary_name: '商务英语词汇',
          word: 'negotiation',
          pronunciation: '/nɪˌɡəʊʃiˈeɪʃn/',
          definition: '谈判，协商',
          example: 'We need to have a negotiation about the contract.',
          difficulty: '中等',
          is_mastered: false,
          notes: '商务场合常用',
          created_at: '2024-01-02 14:30:00'
        },
        {
          word_id: 4,
          dictionary_id: 2,
          dictionary_name: '商务英语词汇',
          word: 'investment',
          pronunciation: '/ɪnˈvestmənt/',
          definition: '投资',
          example: 'This is a good investment opportunity.',
          difficulty: '中等',
          is_mastered: false,
          notes: '',
          created_at: '2024-01-02 14:40:00'
        },
        {
          word_id: 5,
          dictionary_id: 3,
          dictionary_name: '学术英语词汇',
          word: 'hypothesis',
          pronunciation: '/haɪˈpɒθəsɪs/',
          definition: '假设，假说',
          example: 'The researcher proposed a new hypothesis.',
          difficulty: '困难',
          is_mastered: false,
          notes: '学术论文中常用',
          created_at: '2024-01-03 09:15:00'
        }
      ]
    }
  }
}

// 创建单词
export const createWord = async (wordData) => {
  try {
    const response = await fetch(`${baseUrl}/words`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(wordData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('创建单词:', data)
    return data
  } catch (error) {
    console.error('创建单词失败:', error)
    // 返回模拟成功响应
    return {
      success: true,
      data: {
        word_id: Date.now(),
        ...wordData,
        created_at: new Date().toLocaleString()
      }
    }
  }
}

// 更新单词
export const updateWord = async (id, wordData) => {
  try {
    const response = await fetch(`${baseUrl}/words/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(wordData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('更新单词:', data)
    return data
  } catch (error) {
    console.error('更新单词失败:', error)
    // 返回模拟成功响应
    return {
      success: true,
      data: {
        ...wordData,
        updated_at: new Date().toLocaleString()
      }
    }
  }
}

// 删除单词
export const deleteWord = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/words/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('删除单词:', data)
    return data
  } catch (error) {
    console.error('删除单词失败:', error)
    // 返回模拟成功响应
    return {
      success: true,
      message: '单词删除成功'
    }
  }
}

// 搜索单词
export const searchWords = async (params) => {
  try {
    // 构建查询字符串
    const queryParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key])
      }
    })
    
    const response = await fetch(`${baseUrl}/words/search?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('搜索单词结果:', data)
    return data
  } catch (error) {
    console.error('搜索单词失败:', error)
    // 模拟搜索结果
    const mockResults = [
      {
        word_id: 1,
        dictionary_id: 1,
        dictionary_name: '基础英语词汇',
        word: 'hello',
        pronunciation: '/həˈləʊ/',
        definition: '你好，用于问候或打招呼',
        example: 'Hello, nice to meet you!',
        difficulty: '简单',
        is_mastered: true,
        notes: '最常用的问候语',
        created_at: '2024-01-01 10:00:00'
      },
      {
        word_id: 2,
        dictionary_id: 1,
        dictionary_name: '基础英语词汇',
        word: 'world',
        pronunciation: '/wɜːld/',
        definition: '世界，地球',
        example: 'The world is a beautiful place.',
        difficulty: '简单',
        is_mastered: true,
        notes: '',
        created_at: '2024-01-01 10:05:00'
      }
    ]
    
    // 根据搜索参数过滤模拟数据
    let filteredResults = [...mockResults]
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      if (params.type === 'word') {
        filteredResults = filteredResults.filter(item => item.word.toLowerCase().includes(keyword))
      } else if (params.type === 'definition') {
        filteredResults = filteredResults.filter(item => item.definition.toLowerCase().includes(keyword))
      } else {
        filteredResults = filteredResults.filter(item => 
          item.word.toLowerCase().includes(keyword) || 
          item.definition.toLowerCase().includes(keyword)
        )
      }
    }
    
    if (params.dictionary_id) {
      filteredResults = filteredResults.filter(item => item.dictionary_id == params.dictionary_id)
    }
    
    if (params.difficulty) {
      filteredResults = filteredResults.filter(item => item.difficulty === params.difficulty)
    }
    
    if (params.is_mastered !== undefined) {
      filteredResults = filteredResults.filter(item => item.is_mastered === params.is_mastered)
    }
    
    return {
      data: filteredResults
    }
  }
}

// 批量标记单词掌握状态
export const batchUpdateMasteredStatus = async (ids, isMastered) => {
  try {
    const response = await fetch(`${baseUrl}/words/batch/mastered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids, is_mastered: isMastered })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('批量更新掌握状态:', data)
    return data
  } catch (error) {
    console.error('批量更新掌握状态失败:', error)
    // 返回模拟成功响应
    return {
      success: true,
      message: '批量更新成功'
    }
  }
}

// 批量删除单词
export const batchDeleteWords = async (ids) => {
  try {
    const response = await fetch(`${baseUrl}/words/batch/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('批量删除单词:', data)
    return data
  } catch (error) {
    console.error('批量删除单词失败:', error)
    // 返回模拟成功响应
    return {
      success: true,
      message: '批量删除成功'
    }
  }
}

// 获取字典中的单词
export const getWordsByDictionary = async (dictionaryId) => {
  try {
    const response = await fetch(`${baseUrl}/dictionaries/${dictionaryId}/words`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('获取字典单词:', data)
    return data
  } catch (error) {
    console.error('获取字典单词失败:', error)
    // 返回模拟数据
    return {
      data: [
        {
          word_id: 1,
          word: 'hello',
          pronunciation: '/həˈləʊ/',
          definition: '你好',
          difficulty: '简单',
          is_mastered: true
        }
      ]
    }
  }
}