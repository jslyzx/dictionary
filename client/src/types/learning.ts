export interface LearningSession {
  id: string
  words: LearningWord[]
  currentIndex: number
  mode: LearningMode
  status: 'active' | 'completed' | 'paused'
  startTime: Date
  endTime?: Date
  correctCount: number
  incorrectCount: number
}

export interface LearningWord {
  id: number
  word: string
  phonetic: string
  meaning: string
  pronunciation1?: string | null
  pronunciation2?: string | null
  pronunciation3?: string | null
  hasImage: boolean
  imageType: 'url' | 'iconfont' | 'emoji' | null
  imageValue: string | null
  difficulty: number
  isMastered: boolean
  userAnswer?: string
  isCorrect?: boolean
  attempts: number
}

export type LearningMode = 'multiple-choice' | 'spelling' | 'flash-card'

export interface MultipleChoiceOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface LearningProgress {
  totalWords: number
  learnedWords: number
  remainingWords: number
  correctRate: number
}

export interface LearningSettings {
  mode: LearningMode
  wordCount: number
  difficultyFilter?: number[]
  masteryStatusFilter?: 'all' | 'unmastered' | 'mastered'
  includePronunciation: boolean
  includeImages: boolean
  autoPlayAudio: boolean
}