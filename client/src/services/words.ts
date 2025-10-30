import type { Word } from '../types/word'
import { request } from './apiClient'

interface WordsListResponse {
  items: Word[]
  page: number
  limit: number
  total: number
}

interface WordsApiResponse {
  success: boolean
  data: WordsListResponse
}

export interface WordsQueryParams {
  search?: string
  page?: number
  limit?: number
}

export const fetchWords = async (
  params: WordsQueryParams = {},
): Promise<WordsListResponse> => {
  const response = await request<WordsApiResponse>({
    method: 'GET',
    url: '/api/words',
    params,
  })

  return response.data
}
