import type { LearningSession, LearningWord, LearningMode, MultipleChoiceOption } from '../types/learning'
import type { Word } from '../types/word'

export class LearningSessionManager {
  private currentSession: LearningSession | null = null

  startSession(words: Word[], mode: LearningMode): LearningSession {
    const learningWords: LearningWord[] = words.map(word => ({
      id: word.id,
      word: word.word,
      phonetic: word.phonetic,
      meaning: word.meaning,
      pronunciation1: word.pronunciation1,
      pronunciation2: word.pronunciation2,
      pronunciation3: word.pronunciation3,
      hasImage: word.hasImage,
      imageType: word.imageType,
      imageValue: word.imageValue,
      difficulty: word.difficulty ?? 0,
      isMastered: word.isMastered ?? false,
      attempts: 0
    }))

    this.currentSession = {
      id: Date.now().toString(),
      words: learningWords,
      currentIndex: 0,
      mode,
      status: 'active',
      startTime: new Date(),
      correctCount: 0,
      incorrectCount: 0
    }

    return this.currentSession
  }

  getCurrentSession(): LearningSession | null {
    return this.currentSession
  }

  getCurrentWord(): LearningWord | null {
    if (!this.currentSession) return null
    return this.currentSession.words[this.currentSession.currentIndex] || null
  }

  submitAnswer(answer: string): boolean {
    if (!this.currentSession) return false
    
    const currentWord = this.getCurrentWord()
    if (!currentWord) return false

    currentWord.userAnswer = answer
    currentWord.attempts++
    
    const isCorrect = this.checkAnswer(currentWord, answer)
    currentWord.isCorrect = isCorrect

    if (isCorrect) {
      this.currentSession.correctCount++
    } else {
      this.currentSession.incorrectCount++
    }

    return isCorrect
  }

  private checkAnswer(word: LearningWord, answer: string): boolean {
    // For multiple choice, compare with the correct meaning
    // For spelling, compare with the word itself
    return answer.toLowerCase().trim() === word.meaning.toLowerCase().trim() || 
           answer.toLowerCase().trim() === word.word.toLowerCase().trim()
  }

  nextWord(): LearningWord | null {
    if (!this.currentSession) return null
    
    if (this.currentSession.currentIndex < this.currentSession.words.length - 1) {
      this.currentSession.currentIndex++
      return this.getCurrentWord()
    } else {
      this.completeSession()
      return null
    }
  }

  previousWord(): LearningWord | null {
    if (!this.currentSession) return null
    
    if (this.currentSession.currentIndex > 0) {
      this.currentSession.currentIndex--
      return this.getCurrentWord()
    }
    
    return this.getCurrentWord()
  }

  private completeSession(): void {
    if (this.currentSession) {
      this.currentSession.status = 'completed'
      this.currentSession.endTime = new Date()
    }
  }

  getProgress(): { current: number; total: number; percentage: number } {
    if (!this.currentSession) return { current: 0, total: 0, percentage: 0 }
    
    const current = this.currentSession.currentIndex + 1
    const total = this.currentSession.words.length
    const percentage = Math.round((current / total) * 100)
    
    return { current, total, percentage }
  }

  getStats(): { correct: number; incorrect: number; accuracy: number } {
    if (!this.currentSession) return { correct: 0, incorrect: 0, accuracy: 0 }
    
    const total = this.currentSession.correctCount + this.currentSession.incorrectCount
    const accuracy = total > 0 ? Math.round((this.currentSession.correctCount / total) * 100) : 0
    
    return {
      correct: this.currentSession.correctCount,
      incorrect: this.currentSession.incorrectCount,
      accuracy
    }
  }

  generateMultipleChoiceOptions(currentWord: LearningWord, allWords: LearningWord[]): MultipleChoiceOption[] {
    const correctOption: MultipleChoiceOption = {
      id: 'correct',
      text: currentWord.meaning,
      isCorrect: true
    }

    // Get 3 random incorrect options from other words
    const otherWords = allWords.filter(w => w.id !== currentWord.id)
    const shuffled = otherWords.sort(() => Math.random() - 0.5)
    const incorrectOptions = shuffled.slice(0, 3).map((word, index) => ({
      id: `incorrect_${index}`,
      text: word.meaning,
      isCorrect: false
    }))

    const allOptions = [correctOption, ...incorrectOptions]
    return allOptions.sort(() => Math.random() - 0.5)
  }

  generateSpellingLetters(word: string): string[] {
    const letters = word.toLowerCase().split('')
    const shuffled = [...letters].sort(() => Math.random() - 0.5)
    
    // Add some distractor letters
    const distractors = 'abcdefghijklmnopqrstuvwxyz'.split('')
    const randomDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3)
    
    return [...shuffled, ...randomDistractors].sort(() => Math.random() - 0.5)
  }

  endSession(): void {
    this.currentSession = null
  }
}