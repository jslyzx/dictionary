export interface WordPlan {
  id: number
  name: string
  description?: string | null
  mode: 'flash-card' | 'spelling'
  status: 'active' | 'inactive'
  targetWordCount: number
  dailyWordCount: number
  createdAt: string
  updatedAt: string
  // 统计相关字段
  word_count?: number
  learned_words?: number
  correct_rate?: number
}

export interface WordPlanWord {
  id: number
  planId: number
  wordId: number
  orderIndex: number
  addedAt: string
  word?: {
    id: number
    word: string
    phonetic: string
    meaning: string
    hasImage: boolean
    imageType: 'url' | 'iconfont' | 'emoji' | null
    imageValue: string | null
    difficulty: number
    isMastered: boolean
    sentence?: string | null
    notes?: string | null
  }
  // 学习状态相关字段
  isLearned?: boolean
  isCorrect?: boolean
  attempts?: number
  errorCount?: number
}

export interface LearningRecord {
  id: number
  planId: number
  wordId: number
  userAnswer?: string | null
  isCorrect: boolean
  attempts: number
  learnedAt: string
}

export interface ErrorWord {
  id: number
  planId: number
  wordId: number
  errorCount: number
  lastErrorAt: string
  word?: {
    id: number
    word: string
    phonetic: string
    meaning: string
  }
}

export interface LearningProgress {
  id: number
  planId: number
  totalWords: number
  learnedWords: number
  correctWords: number
  errorWords: number
  lastStudiedAt: string
}

export interface CreateWordPlanPayload {
  name: string
  description?: string | null
  mode: 'flash-card' | 'spelling'
  targetWordCount: number
  dailyWordCount: number
  wordIds: number[]
}

export interface UpdateWordPlanPayload {
  name?: string
  description?: string | null
  mode?: 'flash-card' | 'spelling'
  targetWordCount?: number
  dailyWordCount?: number
  status?: 'active' | 'inactive'
}

export interface WordPlanStats {
  totalWords: number
  learnedWords: number
  remainingWords: number
  correctRate: number
  errorWords: number
  dailyProgress: number
  correct_words?: number
}
