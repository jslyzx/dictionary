import { LearningSessionManager } from '../utils/learningSessionManager'
import type { Word } from '../types/word'

// Mock words for testing
const mockWords: Word[] = [
  {
    id: 1,
    word: 'morning',
    phonetic: '/ˈmɔːrnɪŋ/',
    meaning: '早晨，上午',
    pronunciation1: null,
    pronunciation2: null,
    pronunciation3: null,
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    difficulty: 0,
    isMastered: false,
    pronunciationRules: [],
    hasImage: false,
    imageType: null,
    imageValue: null,
  },
  {
    id: 2,
    word: 'afternoon',
    phonetic: '/ˌæftərˈnuːn/',
    meaning: '下午',
    pronunciation1: null,
    pronunciation2: null,
    pronunciation3: null,
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    difficulty: 0,
    isMastered: false,
    pronunciationRules: [],
    hasImage: false,
    imageType: null,
    imageValue: null,
  },
  {
    id: 3,
    word: 'evening',
    phonetic: '/ˈiːvnɪŋ/',
    meaning: '晚上',
    pronunciation1: null,
    pronunciation2: null,
    pronunciation3: null,
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    difficulty: 0,
    isMastered: false,
    pronunciationRules: [],
    hasImage: false,
    imageType: null,
    imageValue: null,
  }
]

function testLearningSessionManager() {
  console.log('🧪 Testing LearningSessionManager...')
  
  const manager = new LearningSessionManager()
  
  // Test starting a session
  const session = manager.startSession(mockWords, 'multiple-choice')
  console.log('✅ Session started:', session.id)
  console.log('📚 Words in session:', session.words.length)
  
  // Test getting current word
  const currentWord = manager.getCurrentWord()
  console.log('📝 Current word:', currentWord?.word)
  
  // Test submitting correct answer
  if (currentWord) {
    const isCorrect = manager.submitAnswer(currentWord.meaning)
    console.log('✅ Answer submitted, correct:', isCorrect)
  }
  
  // Test progress
  const progress = manager.getProgress()
  console.log('📈 Progress:', progress)
  
  // Test stats
  const stats = manager.getStats()
  console.log('📊 Stats:', stats)
  
  // Test next word
  const nextWord = manager.nextWord()
  console.log('➡️ Next word:', nextWord?.word || 'Session completed')
  
  console.log('🎉 LearningSessionManager tests completed!')
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testLearningSessionManager()
}

export { testLearningSessionManager }
