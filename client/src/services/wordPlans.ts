import { request } from './apiClient'
import type {
  WordPlan,
  WordPlanWord,
  LearningRecord,
  ErrorWord,
  LearningProgress,
  CreateWordPlanPayload,
  UpdateWordPlanPayload,
  WordPlanStats
} from '../types/wordPlan'

// 获取所有单词计划
export const getWordPlans = async (): Promise<WordPlan[]> => {
  try {
    const response = await request<{ success: boolean; data: WordPlan[] | WordPlan }>({
      method: 'GET',
      url: '/word-plans'
    })
    
    // 处理各种可能的响应格式
    if (response && response.success === true) {
      if (Array.isArray(response.data)) {
        // 格式: { success: true, data: [...] }
        return response.data
      } else if (response.data && typeof response.data === 'object') {
        // 格式: { success: true, data: {...} } - 单个对象，转换为数组
        return [response.data]
      }
    }
    
    console.error('API 返回数据格式错误:', response)
    return []
  } catch (error) {
    console.error('获取单词计划失败:', error)
    return []
  }
}

// 获取单个单词计划详情
export const getWordPlan = async (id: number): Promise<WordPlan & {
  words: WordPlanWord[]
  progress: LearningProgress | null
  stats: WordPlanStats
}> => {
  console.log('调用getWordPlan API，ID:', id)
  const response = await request<{
    success: boolean
    data: WordPlan & {
      words: WordPlanWord[]
      progress: LearningProgress | null
      stats: WordPlanStats
    }
  }>({
    method: 'GET',
    url: `/word-plans/${id}`
  })
  console.log('getWordPlan API响应:', response)
  return response.data
}

// 创建单词计划
export const createWordPlan = async (payload: CreateWordPlanPayload): Promise<WordPlan> => {
  const response = await request<{ success: boolean; data: WordPlan }>({
    method: 'POST',
    url: '/word-plans',
    data: payload
  })
  return response.data
}

// 更新单词计划
export const updateWordPlan = async (id: number, payload: UpdateWordPlanPayload): Promise<WordPlan> => {
  const response = await request<{ success: boolean; data: WordPlan }>({
    method: 'PUT',
    url: `/word-plans/${id}`,
    data: payload
  })
  return response.data
}

// 删除单词计划
export const deleteWordPlan = async (id: number): Promise<void> => {
  await request<{ success: boolean; data: { message: string } }>({
    method: 'DELETE',
    url: `/word-plans/${id}`
  })
}

// 激活单词计划（同时禁用其他计划）
export const activateWordPlan = async (id: number): Promise<WordPlan> => {
  const response = await request<{ success: boolean; data: WordPlan }>({
    method: 'PUT',
    url: `/word-plans/${id}/activate`
  })
  return response.data
}

// 向计划中添加单词
export const addWordToPlan = async (planId: number, wordId: number): Promise<void> => {
  await request<{ success: boolean; data: { message: string } }>({
    method: 'POST',
    url: `/word-plans/${planId}/words`,
    data: { wordId }
  })
}

// 从计划中移除单词
export const removeWordFromPlan = async (planId: number, wordId: number): Promise<void> => {
  await request<{ success: boolean; data: { message: string } }>({
    method: 'DELETE',
    url: `/word-plans/${planId}/words/${wordId}`
  })
}

// 记录学习结果
export const recordLearning = async (planId: number, wordId: number, isCorrect: boolean, userAnswer?: string, attempts: number = 1): Promise<LearningRecord> => {
  const response = await request<{ success: boolean; data: LearningRecord }>({
    method: 'POST',
    url: `/word-plans/${planId}/learning-records`,
    data: {
      wordId,
      isCorrect,
      userAnswer,
      attempts
    }
  })
  return response.data
}

// 获取错误单词列表
export const getErrorWords = async (planId: number): Promise<ErrorWord[]> => {
  const response = await request<{ success: boolean; data: ErrorWord[] }>({
    method: 'GET',
    url: `/word-plans/${planId}/error-words`
  })
  return response.data
}

// 获取学习记录
export const getLearningRecords = async (planId: number, limit: number = 50): Promise<LearningRecord[]> => {
  const response = await request<{ success: boolean; data: LearningRecord[] }>({
    method: 'GET',
    url: `/word-plans/${planId}/learning-records`,
    params: { limit }
  })
  return response.data
}

// 获取活跃计划（当前启用的计划）
export const getActiveWordPlan = async (): Promise<WordPlan | null> => {
  try {
    const response = await request<{ success: boolean; data: WordPlan }>({
      method: 'GET',
      url: '/word-plans/active'
    })
    return response.data
  } catch (error) {
    return null
  }
}