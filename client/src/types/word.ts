export type WordDifficulty = 0 | 1 | 2 | null

export interface Word {
  id: number
  word: string
  phonetic: string
  meaning: string
  pronunciation1: string | null
  pronunciation2: string | null
  pronunciation3: string | null
  notes: string | null
  createdAt: string
  difficulty: WordDifficulty
  isMastered: boolean | null
  pronunciationRules?: Array<{ id: number; letterCombination: string; pronunciation: string }>
  hasImage: boolean
  imageType: 'url' | 'iconfont' | 'emoji' | null
  imageValue: string | null
}
