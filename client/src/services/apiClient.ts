import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { Word } from '../types/word'

export interface ApiError {
  message: string
  status?: number
  details?: unknown
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message ?? error.message,
      status: error.response?.status,
      details: error.response?.data?.details ?? error.response?.data,
    }

    return Promise.reject(apiError)
  },
)

export const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<T>(config)
  return response.data
}


export interface PaginatedResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

export interface WordStats {
  total: number
  masteredCount: number
  unmasteredCount: number
  masteredPercentage: number
  unmasteredPercentage: number
  difficulty: {
    easy: number
    medium: number
    hard: number
  }
}

export interface Dictionary {
  id: number
  name: string
  description: string | null
  isEnabled: boolean
  isMastered: boolean
  createdAt: string
  updatedAt: string
}

export interface DictionaryStats {
  dictionaryId: number
  name: string
  total: number
  masteredCount: number
  unmasteredCount: number
  masteredPercentage: number
  unmasteredPercentage: number
  difficulty: {
    easy: number
    medium: number
    hard: number
  }
}

export interface DictionaryWordRelation {
  id: number
  dictionaryId: number
  dictionaryName?: string
  wordId: number
  createdAt: string
  word: Word
}

export interface ImportSummary {
  totalRows: number
  created: number
  updated?: number
  skipped?: number
}

export const fetchWords = (params?: Record<string, unknown>) =>
  request<{ success: boolean; data: PaginatedResult<Word> }>({
    url: '/words',
    method: 'GET',
    params,
  })

export const fetchWordStats = (params?: Record<string, unknown>) =>
  request<{ success: boolean; data: WordStats }>({
    url: '/words/stats',
    method: 'GET',
    params,
  })

export const exportWordsCsv = (params?: Record<string, unknown>) =>
  apiClient.get<Blob>('/words/export', {
    params,
    responseType: 'blob',
  })

export const importWordsCsv = async (file: File): Promise<{ success: boolean; data: ImportSummary }> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<{ success: boolean; data: ImportSummary }>(
    '/words/import',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}

export const fetchDictionaries = () =>
  request<{ success: boolean; data: Dictionary[] }>({
    url: '/dictionaries',
    method: 'GET',
  })

export const fetchDictionary = (id: number) =>
  request<{ success: boolean; data: Dictionary }>({
    url: `/dictionaries/${id}`,
    method: 'GET',
  })

export const fetchDictionaryStats = (id: number) =>
  request<{ success: boolean; data: DictionaryStats }>({
    url: `/dictionaries/${id}/stats`,
    method: 'GET',
  })

export const fetchDictionaryWords = (params?: Record<string, unknown>) =>
  request<{ success: boolean; data: DictionaryWordRelation[] }>({
    url: '/dictionary-words',
    method: 'GET',
    params,
  })

export const exportDictionaryWordsCsv = (params?: Record<string, unknown>) =>
  apiClient.get<Blob>('/dictionary-words/export', {
    params,
    responseType: 'blob',
  })

export const importDictionaryWordsCsv = async (
  file: File,
  options?: { dictionaryId?: number },
): Promise<{ success: boolean; data: ImportSummary }> => {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.dictionaryId) {
    formData.append('dictionaryId', String(options.dictionaryId))
  }

  const response = await apiClient.post<{ success: boolean; data: ImportSummary }>(
    '/dictionary-words/import',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}

export default apiClient
