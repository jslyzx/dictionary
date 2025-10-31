import type { Word, WordDifficulty } from './word'

export interface Dictionary {
  id: number
  name: string
  description: string | null
  isEnabled: boolean
  isMastered: boolean
  createdAt: string
  updatedAt: string
  wordCount?: number
}

export interface DictionaryWordAssociation {
  id: number
  dictionaryId: number
  wordId: number
  difficulty: WordDifficulty
  isMastered: boolean | null
  notes: string | null
  addedAt: string
  word: Word
}

export interface DictionaryWordAssociationPayload {
  wordId: number
  difficulty?: WordDifficulty
  isMastered?: boolean | null
  notes?: string | null
}

export interface DictionaryWordAssociationUpdatePayload {
  difficulty?: WordDifficulty
  isMastered?: boolean | null
  notes?: string | null
}
