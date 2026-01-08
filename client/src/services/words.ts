import { request } from './apiClient'

export interface Word {
  id: number
  word: string
  phonetic: string
  meaning: string
  pronunciation1: string | null
  pronunciation2: string | null
  pronunciation3: string | null
  difficulty: number
  isMastered: boolean
  createdAt: string | null
  notes: string | null
  sentence: string | null
  pronunciationRules?: Array<{ id: number; letterCombination: string; pronunciation: string }>
  hasImage: boolean
  imageType: 'url' | 'iconfont' | 'emoji' | null
  imageValue: string | null
}

interface WordApiResponse {
  id: number
  word: string
  phonetic: string
  meaning: string
  pronunciation1: string | null
  pronunciation2: string | null
  pronunciation3: string | null
  notes: string | null
  sentence: string | null
  difficulty: number | null
  isMastered: boolean
  createdAt: string | null
  pronunciationRules?: Array<{ id: number; letterCombination: string; pronunciation: string }>
  hasImage: boolean
  imageType: 'url' | 'iconfont' | 'emoji' | null
  imageValue: string | null
}

interface WordListApiResponse {
  items: WordApiResponse[]
  total: number
  page: number
  limit: number
}

export interface ListWordsParams {
  page?: number
  limit?: number
  search?: string
  difficulty?: number
  masteryStatus?: number
  excludeDictionaryId?: number
}

export interface WordListResult {
  items: Word[]
  total: number
  page: number
  limit: number
}

export interface UpsertWordPayload {
  word: string
  phonetic: string
  meaning: string
  difficulty: number
  isMastered: boolean
  pronunciationUrl?: string | null
  pronunciation2?: string | null
  pronunciation3?: string | null
  notes?: string | null
  sentence?: string | null
  hasImage?: boolean
  imageType?: 'url' | 'iconfont' | 'emoji' | null
  imageValue?: string | null
}

const mapWord = (word: WordApiResponse): Word => {
  const d = (word.difficulty ?? 1) as number
  const normalized = d === 0 ? 1 : d
  return {
    id: word.id,
    word: word.word,
    phonetic: word.phonetic,
    meaning: word.meaning,
    pronunciation1: word.pronunciation1 ?? null,
    pronunciation2: word.pronunciation2 ?? null,
    pronunciation3: word.pronunciation3 ?? null,
    notes: word.notes ?? null,
    sentence: word.sentence ?? null,
    difficulty: normalized,
    isMastered: word.isMastered,
    createdAt: word.createdAt ?? null,
    pronunciationRules: word.pronunciationRules ?? [],
    hasImage: word.hasImage ?? false,
    imageType: word.imageType ?? null,
    imageValue: word.imageValue ?? null,
  }
}

const adaptUpsertPayload = (payload: UpsertWordPayload) => {
  const data: Record<string, unknown> = {
    word: payload.word,
    phonetic: payload.phonetic,
    meaning: payload.meaning,
    difficulty: payload.difficulty,
    isMastered: payload.isMastered,
  }

  if (payload.pronunciationUrl !== undefined) {
    data.pronunciation1 = payload.pronunciationUrl ? payload.pronunciationUrl : null
  }

  if (payload.pronunciation2 !== undefined) {
    data.pronunciation2 = payload.pronunciation2 ? payload.pronunciation2 : null
  }

  if (payload.pronunciation3 !== undefined) {
    data.pronunciation3 = payload.pronunciation3 ? payload.pronunciation3 : null
  }

  if (payload.notes !== undefined) {
    data.notes = payload.notes ? payload.notes : null
  }

  if (payload.sentence !== undefined) {
    data.sentence = payload.sentence ? payload.sentence : null
  }

  if (payload.hasImage !== undefined) {
    data.hasImage = payload.hasImage
  }

  if (payload.imageType !== undefined) {
    data.imageType = payload.imageType
  }

  if (payload.imageValue !== undefined) {
    data.imageValue = payload.imageValue ? payload.imageValue : null
  }

  return data
}

export const listWords = async (params: ListWordsParams): Promise<WordListResult> => {
  const response = await request<{ success: boolean; data: WordListApiResponse }>({
    method: 'GET',
    url: '/words',
    params,
  })
  return {
    items: response.data.items.map(mapWord),
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
  }
}

export const createWord = async (payload: UpsertWordPayload): Promise<Word> => {
  const response = await request<{ success: boolean; data: WordApiResponse }>({
    method: 'POST',
    url: '/words',
    data: adaptUpsertPayload(payload),
  })

  return mapWord(response.data)
}

export const updateWord = async (id: number, payload: UpsertWordPayload): Promise<Word> => {
  if (!id || typeof id !== 'number' || id <= 0) {
    throw new Error('Valid word ID is required for update');
  }
  
  const response = await request<{ success: boolean; data: WordApiResponse }>({
    method: 'PUT',
    url: `/words/${id}`,
    data: adaptUpsertPayload(payload),
  })

  return mapWord(response.data)
}

export const deleteWord = async (id: number): Promise<void> => {
  await request<{ success: boolean; data: { message: string } }>({
    method: 'DELETE',
    url: `/words/${id}`,
  })
}

export const getById = async (id: number): Promise<Word & { pronunciation_rules?: Array<{ id: number; letterCombination: string; pronunciation: string; ruleDescription?: string | null }>; dictionaries?: Array<{ id: number; name: string; isMastered: boolean }> }> => {
  const response = await request<Word & { pronunciation_rules?: Array<{ id: number; letterCombination: string; pronunciation: string; ruleDescription?: string | null }>; dictionaries?: Array<{ id: number; name: string; isMastered: boolean }> }>({
    method: 'GET',
    url: `/words/${id}`,
  })
  
  return response
}

// Added for compatibility with existing components
export const fetchWords = async (params: ListWordsParams): Promise<{
  items: import('../types/word').Word[]
  total: number
  page: number
  limit: number
}> => {
  const result = await listWords(params)
  
  // Transform results to be compatible with types/word.ts interface
  return {
    ...result,
    items: result.items.map(item => ({
      ...item,
      createdAt: item.createdAt || new Date().toISOString(), // Ensure non-null string
      difficulty: item.difficulty as import('../types/word').WordDifficulty, // Ensure correct difficulty type
      isMastered: item.isMastered as boolean | null, // Ensure boolean | null type
      hasImage: item.hasImage || false, // Ensure boolean
      imageType: item.imageType || null, // Ensure proper type
      imageValue: item.imageValue || null, // Ensure proper type
    }))
  }
}
