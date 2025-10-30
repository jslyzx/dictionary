import type {
  Dictionary,
  DictionaryWordAssociation,
  DictionaryWordAssociationPayload,
  DictionaryWordAssociationUpdatePayload,
} from '../types/dictionary'
import { request } from './apiClient'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface ApiMessageResponse {
  success: boolean
  message: string
}

export const fetchDictionary = async (id: number): Promise<Dictionary> => {
  const response = await request<ApiResponse<Dictionary>>({
    method: 'GET',
    url: `/api/dictionaries/${id}`,
  })

  return response.data
}

export const fetchDictionaryWordAssociations = async (
  dictionaryId: number,
): Promise<DictionaryWordAssociation[]> => {
  const response = await request<ApiResponse<DictionaryWordAssociation[]>>({
    method: 'GET',
    url: `/api/dictionaries/${dictionaryId}/words`,
  })

  return response.data
}

export const addWordToDictionary = async (
  dictionaryId: number,
  payload: DictionaryWordAssociationPayload,
): Promise<DictionaryWordAssociation> => {
  const response = await request<ApiResponse<DictionaryWordAssociation>>({
    method: 'POST',
    url: `/api/dictionaries/${dictionaryId}/words`,
    data: payload,
  })

  return response.data
}

export const updateDictionaryWordAssociation = async (
  associationId: number,
  payload: DictionaryWordAssociationUpdatePayload,
): Promise<DictionaryWordAssociation> => {
  const response = await request<ApiResponse<DictionaryWordAssociation>>({
    method: 'PUT',
    url: `/api/dictionary-word-associations/${associationId}`,
    data: payload,
  })

  return response.data
}

export const removeDictionaryWord = async (
  dictionaryId: number,
  wordId: number,
): Promise<string> => {
  const response = await request<ApiMessageResponse>({
    method: 'DELETE',
    url: `/api/dictionaries/${dictionaryId}/words/${wordId}`,
  })

  return response.message
}
