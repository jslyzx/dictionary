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
}

interface WordApiResponse {
  word_id: number
  word: string
  phonetic: string
  meaning: string
  pronunciation1: string | null
  pronunciation2: string | null
  pronunciation3: string | null
  notes: string | null
  difficulty: number | null
  is_mastered: 0 | 1 | null
  created_at: string | null
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
}

const mapWord = (word: WordApiResponse): Word => ({
  id: word.word_id,
  word: word.word,
  phonetic: word.phonetic,
  meaning: word.meaning,
  pronunciation1: word.pronunciation1 ?? null,
  pronunciation2: word.pronunciation2 ?? null,
  pronunciation3: word.pronunciation3 ?? null,
  notes: word.notes ?? null,
  difficulty: word.difficulty ?? 0,
  isMastered: Boolean(word.is_mastered),
  createdAt: word.created_at ?? null,
})

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

  return data
}

export const listWords = async (params: ListWordsParams): Promise<WordListResult> => {
  const response = await request<WordListApiResponse>({
    method: 'GET',
    url: '/api/words',
    params,
  })

  return {
    items: response.items.map(mapWord),
    total: response.total,
    page: response.page,
    limit: response.limit,
  }
}

export const createWord = async (payload: UpsertWordPayload): Promise<Word> => {
  const response = await request<{ item: WordApiResponse }>({
    method: 'POST',
    url: '/api/words',
    data: adaptUpsertPayload(payload),
  })

  return mapWord(response.item)
}

export const updateWord = async (id: number, payload: UpsertWordPayload): Promise<Word> => {
  const response = await request<{ item: WordApiResponse }>({
    method: 'PUT',
    url: `/api/words/${id}`,
    data: adaptUpsertPayload(payload),
  })

  return mapWord(response.item)
}

export const deleteWord = async (id: number): Promise<void> => {
  await request<{ message: string }>({
    method: 'DELETE',
    url: `/api/words/${id}`,
  })
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
      createdAt: item.createdAt || '', // Ensure non-null string
      difficulty: item.difficulty as import('../types/word').WordDifficulty, // Ensure correct difficulty type
      isMastered: item.isMastered as boolean | null // Ensure boolean | null type
    }))
  }
}
