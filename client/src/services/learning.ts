import { LearningSessionManager } from '../utils/learningSessionManager'
import type { LearningSettings } from '../types/learning'
import type { Word } from '../types/word'
import { listWords } from './words'

export class LearningService {
  private sessionManager: LearningSessionManager

  constructor() {
    this.sessionManager = new LearningSessionManager()
  }

  async startLearningSession(settings: LearningSettings): Promise<boolean> {
    try {
      // Fetch words based on settings
      const words = await this.fetchWordsForLearning(settings)
      
      if (words.length === 0) {
        return false
      }

      // Start the learning session
      this.sessionManager.startSession(words, settings.mode)
      return true
    } catch (error) {
      console.error('Failed to start learning session:', error)
      return false
    }
  }

  private async fetchWordsForLearning(settings: LearningSettings): Promise<import('../types/word').Word[]> {
    const params: any = {
      limit: settings.wordCount,
      page: 1
    }

    // Add filters based on settings
    if (settings.difficultyFilter && settings.difficultyFilter.length > 0) {
      // This would need to be implemented in the backend
      // For now, we'll fetch all and filter client-side
    }

    if (settings.masteryStatusFilter && settings.masteryStatusFilter !== 'all') {
      params.masteryStatus = settings.masteryStatusFilter === 'mastered' ? 1 : 0
    }

    const result = await listWords(params)
    let words = result.items

    // Apply difficulty filter if specified
    if (settings.difficultyFilter && settings.difficultyFilter.length > 0) {
      words = words.filter(word => 
        settings.difficultyFilter!.includes(word.difficulty ?? 0)
      )
    }

    // Map service Word type to types/word Word type
    const mappedWords: import('../types/word').Word[] = words.map(word => ({
      ...word,
      createdAt: word.createdAt || new Date().toISOString(),
      difficulty: word.difficulty as 0 | 1 | 2 | null,
      isMastered: word.isMastered as boolean | null,
      hasImage: word.hasImage || false,
      imageType: word.imageType || null,
      imageValue: word.imageValue || null,
    }))

    // Shuffle words for variety
    return mappedWords.sort(() => Math.random() - 0.5)
  }

  getSessionManager(): LearningSessionManager {
    return this.sessionManager
  }

  async submitAnswer(answer: string): Promise<{ isCorrect: boolean; nextWord?: Word | null }> {
    const isCorrect = this.sessionManager.submitAnswer(answer)
    const nextWord = this.sessionManager.nextWord()
    
    return {
      isCorrect,
      nextWord: nextWord ? this.mapLearningWordToWord(nextWord) : null
    }
  }

  private mapLearningWordToWord(learningWord: any): import('../types/word').Word {
    return {
      id: learningWord.id,
      word: learningWord.word,
      phonetic: learningWord.phonetic,
      meaning: learningWord.meaning,
      pronunciation1: learningWord.pronunciation1,
      pronunciation2: learningWord.pronunciation2,
      pronunciation3: learningWord.pronunciation3,
      notes: learningWord.notes || null,
      createdAt: learningWord.createdAt || new Date().toISOString(),
      difficulty: (learningWord.difficulty ?? 0) as 0 | 1 | 2 | null,
      isMastered: learningWord.isMastered,
      pronunciationRules: learningWord.pronunciationRules || [],
      hasImage: learningWord.hasImage || false,
      imageType: learningWord.imageType || null,
      imageValue: learningWord.imageValue || null,
    }
  }

  getCurrentProgress() {
    return this.sessionManager.getProgress()
  }

  getSessionStats() {
    return this.sessionManager.getStats()
  }

  endSession() {
    this.sessionManager.endSession()
  }

  getMultipleChoiceOptions() {
    const session = this.sessionManager.getCurrentSession()
    const currentWord = this.sessionManager.getCurrentWord()
    
    if (!session || !currentWord) return []
    
    return this.sessionManager.generateMultipleChoiceOptions(currentWord, session.words)
  }

  getSpellingLetters() {
    const currentWord = this.sessionManager.getCurrentWord()
    
    if (!currentWord) return []
    
    return this.sessionManager.generateSpellingLetters(currentWord.word)
  }
}