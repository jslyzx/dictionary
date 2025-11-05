import { request } from './apiClient'

export interface PronunciationRule {
  id: number
  letterCombination: string
  pronunciation: string
  ruleDescription?: string | null
  createdAt: string
  updatedAt: string
  wordCount?: number
}

export interface WordPronunciationRule {
  id: number
  letterCombination: string
  pronunciation: string
  ruleDescription?: string | null
  positionInWord?: number | null
  ruleAssociatedAt: string
}

interface PronunciationRuleApiResponse {
  id: number
  letter_combination: string
  pronunciation: string
  rule_description?: string | null
  created_at: string
  updated_at: string
  word_count?: number
}

interface WordPronunciationRuleApiResponse {
  id: number
  letter_combination: string
  pronunciation: string
  rule_description?: string | null
  position_in_word?: number | null
  rule_associated_at: string
}

interface PronunciationRuleListApiResponse {
  items: PronunciationRuleApiResponse[]
  total: number
  page: number
  limit: number
}

export interface ListPronunciationRulesParams {
  page?: number
  limit?: number
  search?: string
}

export interface PronunciationRuleListResult {
  items: PronunciationRule[]
  total: number
  page: number
  limit: number
}

export interface CreatePronunciationRulePayload {
  letterCombination: string
  pronunciation: string
  ruleDescription?: string | null
}

export interface UpdatePronunciationRulePayload {
  letterCombination?: string
  pronunciation?: string
  ruleDescription?: string | null
}

export interface AddWordPronunciationRulesPayload {
  pronunciationRuleIds: number[]
  positionInWord?: number | null
}

const mapPronunciationRule = (rule: PronunciationRuleApiResponse): PronunciationRule => ({
  id: rule.id,
  letterCombination: rule.letter_combination,
  pronunciation: rule.pronunciation,
  ruleDescription: rule.rule_description ?? null,
  createdAt: rule.created_at,
  updatedAt: rule.updated_at,
  wordCount: rule.word_count ?? 0,
})

const mapWordPronunciationRule = (rule: WordPronunciationRuleApiResponse): WordPronunciationRule => ({
  id: rule.id,
  letterCombination: rule.letter_combination,
  pronunciation: rule.pronunciation,
  ruleDescription: rule.rule_description ?? null,
  positionInWord: rule.position_in_word ?? null,
  ruleAssociatedAt: rule.rule_associated_at,
})

const adaptCreatePayload = (payload: CreatePronunciationRulePayload) => {
  const data: Record<string, unknown> = {
    letter_combination: payload.letterCombination,
    pronunciation: payload.pronunciation,
  }

  if (payload.ruleDescription !== undefined) {
    data.rule_description = payload.ruleDescription ? payload.ruleDescription : null
  }

  return data
}

const adaptUpdatePayload = (payload: UpdatePronunciationRulePayload) => {
  const data: Record<string, unknown> = {}

  if (payload.letterCombination !== undefined) {
    data.letter_combination = payload.letterCombination
  }

  if (payload.pronunciation !== undefined) {
    data.pronunciation = payload.pronunciation
  }

  if (payload.ruleDescription !== undefined) {
    data.rule_description = payload.ruleDescription ? payload.ruleDescription : null
  }

  return data
}

export const pronunciationRuleService = {
  // 获取发音规则列表
  getAll: async (params: ListPronunciationRulesParams): Promise<PronunciationRuleListResult> => {
    const response = await request<{ success: boolean; data: PronunciationRuleListApiResponse }>({
      method: 'GET',
      url: '/api/pronunciation-rules',
      params,
    })
    return {
      items: response.data.items.map(mapPronunciationRule),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
    }
  },

  // 根据ID获取单个发音规则
  getById: async (id: number): Promise<PronunciationRule> => {
    const response = await request<{ success: boolean; data: PronunciationRuleApiResponse }>({
      method: 'GET',
      url: `/api/pronunciation-rules/${id}`,
    })
    return mapPronunciationRule(response.data)
  },

  // 根据字母组合获取发音规则
  getByCombination: async (letterCombination: string): Promise<PronunciationRule[]> => {
    const response = await request<{ success: boolean; data: PronunciationRuleApiResponse[] }>({
      method: 'GET',
      url: `/api/pronunciation-rules/by-combination/${encodeURIComponent(letterCombination)}`,
    })
    return response.data.map(mapPronunciationRule)
  },

  // 获取使用指定发音规则的单词列表
  getWordsUsingRule: async (id: number, params?: { page?: number; limit?: number }): Promise<{
    items: Array<{
      wordId: number
      word: string
      phonetic: string
      meaning: string
      difficulty: number
      isMastered: boolean
      positionInWord?: number | null
      ruleAddedAt: string
    }>
    total: number
    page: number
    limit: number
  }> => {
    const response = await request<{ success: boolean; data: {
      items: Array<{
        word_id: number
        word: string
        phonetic: string
        meaning: string
        difficulty: number
        is_mastered: boolean
        position_in_word?: number | null
        rule_added_at: string
      }>
      total: number
      page: number
      limit: number
    } }>({
      method: 'GET',
      url: `/api/pronunciation-rules/${id}/words`,
      params,
    })
    
    // Transform the response data to match the expected interface
    return {
      items: response.data.items.map(item => ({
        wordId: item.word_id,
        word: item.word,
        phonetic: item.phonetic,
        meaning: item.meaning,
        difficulty: item.difficulty,
        isMastered: Boolean(item.is_mastered),
        positionInWord: item.position_in_word,
        ruleAddedAt: item.rule_added_at,
      })),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
    }
  },

  // 创建发音规则
  create: async (payload: CreatePronunciationRulePayload): Promise<PronunciationRule> => {
    const response = await request<{ success: boolean; data: PronunciationRuleApiResponse }>({
      method: 'POST',
      url: '/api/pronunciation-rules',
      data: adaptCreatePayload(payload),
    })
    return mapPronunciationRule(response.data)
  },

  // 更新发音规则
  update: async (id: number, payload: UpdatePronunciationRulePayload): Promise<PronunciationRule> => {
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new Error('Valid pronunciation rule ID is required for update');
    }
    
    const response = await request<{ success: boolean; data: PronunciationRuleApiResponse }>({
      method: 'PUT',
      url: `/api/pronunciation-rules/${id}`,
      data: adaptUpdatePayload(payload),
    })
    return mapPronunciationRule(response.data)
  },

  // 删除发音规则
  delete: async (id: number): Promise<void> => {
    await request<{ success: boolean; data: { message: string } }>({
      method: 'DELETE',
      url: `/api/pronunciation-rules/${id}`,
    })
  },

  // 获取单词的发音规则
  getWordPronunciationRules: async (wordId: number): Promise<WordPronunciationRule[]> => {
    const response = await request<{ success: boolean; data: WordPronunciationRuleApiResponse[] }>({
      method: 'GET',
      url: `/api/pronunciation-rules/words/${wordId}/pronunciation-rules`,
    })
    return response.data.map(mapWordPronunciationRule)
  },

  // 为单词添加发音规则关联
  addWordPronunciationRules: async (wordId: number, payload: AddWordPronunciationRulesPayload): Promise<{
    message: string
    items: WordPronunciationRule[]
  }> => {
    const response = await request<{ success: boolean; data: {
      message: string
      items: Array<{
        id: number
        letter_combination: string
        pronunciation: string
        rule_description?: string | null
        position_in_word?: number | null
        rule_associated_at: string
      }>
    } }>({
      method: 'POST',
      url: `/api/pronunciation-rules/words/${wordId}/pronunciation-rules`,
      data: payload,
    })
    
    // Transform the response data to match the expected interface
    return {
      message: response.data.message,
      items: response.data.items.map(item => ({
        id: item.id,
        letterCombination: item.letter_combination,
        pronunciation: item.pronunciation,
        ruleDescription: item.rule_description,
        positionInWord: item.position_in_word,
        ruleAssociatedAt: item.rule_associated_at,
      })),
    }
  },

  // 移除单词的发音规则关联
  removeWordPronunciationRule: async (wordId: number, ruleId: number): Promise<void> => {
    await request<{ success: boolean; data: { message: string } }>({
      method: 'DELETE',
      url: `/api/pronunciation-rules/words/${wordId}/pronunciation-rules/${ruleId}`,
    })
  },
}