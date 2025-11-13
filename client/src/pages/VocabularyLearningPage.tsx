import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LearningService } from '../services/learning'
import type { LearningSettings, LearningMode } from '../types/learning'
import type { Word } from '../types/word'
import MultipleChoiceMode from '../components/learning/MultipleChoiceMode'
import SpellingMode from '../components/learning/SpellingMode'
import FlashCardMode from '../components/learning/FlashCardMode'
import LearningSettingsModal from '../components/learning/LearningSettingsModal'
import LearningProgress from '../components/learning/LearningProgress'

const VocabularyLearningPage = () => {
  const navigate = useNavigate()
  const [learningService] = useState(() => new LearningService())
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [learningMode, setLearningMode] = useState<LearningMode>('multiple-choice')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [settings, setSettings] = useState<LearningSettings>({
    mode: 'multiple-choice',
    wordCount: 10,
    difficultyFilter: [],
    masteryStatusFilter: 'unmastered',
    includePronunciation: true,
    includeImages: true,
    autoPlayAudio: false
  })

  useEffect(() => {
    if (sessionStarted) {
      const current = learningService.getSessionManager().getCurrentWord()
      if (current) {
        setCurrentWord({
          id: current.id,
          word: current.word,
          phonetic: current.phonetic,
          meaning: current.meaning,
          pronunciation1: current.pronunciation1 ?? null,
          pronunciation2: current.pronunciation2 ?? null,
          pronunciation3: current.pronunciation3 ?? null,
          notes: null,
          createdAt: new Date().toISOString(),
          difficulty: current.difficulty as 0 | 1 | 2 | null,
          isMastered: current.isMastered,
          pronunciationRules: [],
          hasImage: current.hasImage,
          imageType: current.imageType,
          imageValue: current.imageValue,
        })
      }
    }
  }, [sessionStarted, learningService])

  const handleStartSession = async (newSettings: LearningSettings) => {
    setIsLoading(true)
    setSettings(newSettings)
    setLearningMode(newSettings.mode)
    
    try {
      const success = await learningService.startLearningSession(newSettings)
      
      if (success) {
        setSessionStarted(true)
        setShowSettings(false)
        
        const current = learningService.getSessionManager().getCurrentWord()
        if (current) {
          setCurrentWord({
            id: current.id,
            word: current.word,
            phonetic: current.phonetic,
            meaning: current.meaning,
            pronunciation1: current.pronunciation1 ?? null,
            pronunciation2: current.pronunciation2 ?? null,
            pronunciation3: current.pronunciation3 ?? null,
            notes: null,
            createdAt: new Date().toISOString(),
            difficulty: current.difficulty as 0 | 1 | 2 | null,
            isMastered: current.isMastered,
            pronunciationRules: [],
            hasImage: current.hasImage,
            imageType: current.imageType,
            imageValue: current.imageValue,
          })
        }
      } else {
        setFeedback({ type: 'error', message: '当前设置下没有可学习的单词' })
      }
    } catch (error) {
      setFeedback({ type: 'error', message: '启动学习会话失败' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSubmit = async (answer: string) => {
    try {
      const result = await learningService.submitAnswer(answer)
      
      if (result.isCorrect) {
        setFeedback({ type: 'success', message: '答对了！' })
      } else {
        const currentWord = learningService.getSessionManager().getCurrentWord()
        setFeedback({ 
          type: 'error', 
          message: `不正确。正确答案是：${currentWord?.meaning || currentWord?.word}` 
        })
      }

      // Clear feedback after 2 seconds
      setTimeout(() => setFeedback(null), 2000)

      // Move to next word or end session
      if (!result.nextWord) {
        // Session completed
        const stats = learningService.getSessionStats()
        alert(`学习完成！正确率：${stats.accuracy}%`)
        navigate('/words')
      } else {
        setCurrentWord(result.nextWord)
      }
    } catch (error) {
      setFeedback({ type: 'error', message: '提交答案失败' })
    }
  }

  const handleEndSession = () => {
    if (confirm('确定要结束本次学习吗？')) {
      learningService.endSession()
      navigate('/words')
    }
  }

  const progress = learningService.getCurrentProgress()
  const stats = learningService.getSessionStats()

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LearningSettingsModal
          settings={settings}
          onStart={handleStartSession}
          onCancel={() => navigate('/words')}
          isLoading={isLoading}
        />
      </div>
    )
  }

  if (!sessionStarted || !currentWord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在准备学习...</p>
        </div>
      </div>
    )
  }

  const renderLearningMode = () => {
    const commonProps = {
      word: currentWord,
      onAnswer: handleAnswerSubmit,
      onSkip: () => handleAnswerSubmit(''),
      onEnd: handleEndSession,
      settings: settings,
      progress: progress,
      stats: stats,
      feedback: feedback
    }

    switch (learningMode) {
      case 'multiple-choice':
        return <MultipleChoiceMode {...commonProps} />
      case 'spelling':
        return <SpellingMode {...commonProps} />
      case 'flash-card':
        return <FlashCardMode {...commonProps} />
      default:
        return <MultipleChoiceMode {...commonProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleEndSession}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← 结束学习
              </button>
              <div className="text-sm text-gray-500">
                模式：{(() => {
                  const map: Record<string, string> = {
                    'multiple-choice': '选择题',
                    'spelling': '拼写',
                    'flash-card': '闪卡',
                  }
                  return map[learningMode] || learningMode
                })()}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                答对：{stats.correct} | 答错：{stats.incorrect}
              </div>
              <div className="text-sm font-medium text-blue-600">
                正确率：{stats.accuracy}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <LearningProgress progress={progress} />

      {/* Learning Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderLearningMode()}
      </div>
    </div>
  )
}

export default VocabularyLearningPage
