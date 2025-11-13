import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getActiveWordPlan, recordLearning } from './services/wordPlans'
import { type WordPlan, type WordPlanWord } from './types/wordPlan'
import FlashCardModeNew from './components/learning/FlashCardModeNew'
import SpellingModeNew from './components/learning/SpellingModeNew'
import './styles/learning.css'

const LearningApp = () => {
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('planId')
  
  const [wordPlan, setWordPlan] = useState<WordPlan | null>(null)
  const [currentWords, setCurrentWords] = useState<WordPlanWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorData, setErrorData] = useState<{ word: string; correctAnswer: string } | null>(null)

  useEffect(() => {
    loadActivePlan()
  }, [planId])

  const loadActivePlan = async () => {
    try {
      setLoading(true)
      
      if (planId) {
        // 如果有指定的计划ID，加载该计划
        const response = await fetch(`/api/word-plans/${planId}`)
        const data = await response.json()
        if (data.success) {
          setWordPlan(data.data)
          setCurrentWords(data.data.words || [])
        } else {
          throw new Error('无法加载指定计划')
        }
      } else {
        // 否则加载活跃计划
        const activePlan = await getActiveWordPlan()
        if (activePlan) {
          setWordPlan(activePlan)
          // 这里需要获取计划的单词，暂时使用模拟数据
          setCurrentWords([]) // 需要在API中添加获取计划单词的端点
        } else {
          throw new Error('没有激活的单词计划')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSubmit = async (isCorrect: boolean, userAnswer?: string) => {
    if (!wordPlan || !currentWords[currentIndex]) return

    const currentWord = currentWords[currentIndex]
    
    try {
      await recordLearning(
        wordPlan.id,
        currentWord.wordId,
        isCorrect,
        userAnswer
      )

      if (!isCorrect) {
        if (wordPlan.mode === 'flash-card') {
          setErrorData({
            word: currentWord.word?.word || '',
            correctAnswer: currentWord.word?.meaning || ''
          })
          setShowErrorModal(true)
        }
      } else {
        // 正确的话直接进入下一题
        nextWord()
      }
    } catch (err) {
      console.error('记录学习结果失败:', err)
    }
  }

  const nextWord = () => {
    if (currentIndex < currentWords.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowErrorModal(false)
      setErrorData(null)
    } else {
      // 学习完成
      alert('恭喜！本轮学习完成！')
      // 可以回到计划页面或重新开始
      window.close()
    }
  }

  const handleErrorModalClose = () => {
    setShowErrorModal(false)
    setErrorData(null)
    nextWord()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">正在加载学习计划...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="loading-container">
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠️</div>
        <div>{error}</div>
        <button 
          onClick={() => window.close()}
          style={{ marginTop: '2rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'white', color: '#667eea', border: 'none', cursor: 'pointer' }}
        >
          关闭窗口
        </button>
      </div>
    )
  }

  if (!wordPlan || currentWords.length === 0) {
    return (
      <div className="loading-container">
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📚</div>
        <div>暂无学习内容</div>
      </div>
    )
  }

  const currentWord = currentWords[currentIndex]
  const progress = {
    current: currentIndex + 1,
    total: currentWords.length,
    percentage: Math.round(((currentIndex + 1) / currentWords.length) * 100)
  }

  return (
    <div className="learning-container">
      {/* 头部 */}
      <div className="learning-header">
        <h1>{wordPlan.name}</h1>
        <div className="learning-progress">
          <span>{progress.current} / {progress.total}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* 学习内容 */}
      <div className="learning-content">
        {wordPlan.mode === 'flash-card' ? (
          <FlashCardModeNew
            word={currentWord}
            onAnswer={handleAnswerSubmit}
            onSkip={nextWord}
            progress={progress}
          />
        ) : (
          <SpellingModeNew
            word={currentWord}
            onAnswer={handleAnswerSubmit}
            onSkip={nextWord}
            progress={progress}
          />
        )}
      </div>

      {/* 错误提示模态框 */}
      {showErrorModal && errorData && (
        <div className="error-modal">
          <div className="error-content">
            <div className="error-icon">❌</div>
            <div className="error-message">回答错误</div>
            <div className="error-correct">
              正确答案是：<strong>{errorData.correctAnswer}</strong>
            </div>
            <button
              onClick={handleErrorModalClose}
              className="btn btn-primary"
            >
              继续
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LearningApp
