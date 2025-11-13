import { useState, useEffect } from 'react'
import type { WordPlanWord } from '../../types/wordPlan'


interface FlashCardModeProps {
  word: WordPlanWord
  onAnswer: (isCorrect: boolean) => void
  onSkip: () => void
  progress: { current: number; total: number; percentage: number }
}

const FlashCardMode = ({ word, onAnswer }: FlashCardModeProps) => {
  const [currentStep, setCurrentStep] = useState<'card' | 'quiz'>('card')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [options, setOptions] = useState<string[]>([])

  // 生成选择题选项
  const generateOptions = () => {
    const correctAnswer = word.word?.meaning || '测试'
    const options = [correctAnswer]
    
    // 添加一些常见的中文释义作为干扰项
    const distractors = [
      '时间', '地点', '人物', '事件', '物品', '概念', '动作', '状态',
      '性质', '关系', '过程', '结果', '原因', '目的', '方法', '工具'
    ]
    
    // 随机选择3个干扰项
    const shuffled = distractors.sort(() => Math.random() - 0.5)
    const selectedDistractors = shuffled.slice(0, 3)
    
    options.push(...selectedDistractors)
    
    return options.sort(() => Math.random() - 0.5)
  }

  useEffect(() => {
    setOptions(generateOptions())
    setCurrentStep('card')
    setSelectedAnswer(null)
    setShowResult(false)
    setIsPlaying(false)
  }, [word])

  const handleCardClick = () => {
    if (currentStep === 'card') {
      // 2秒后自动进入答题模式
      setTimeout(() => {
        setCurrentStep('quiz')
      }, 2000)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return
    
    setSelectedAnswer(answer)
    const isCorrect = answer === (word.word?.meaning || '测试')
    setShowResult(true)
    
    // 播放音效
    playSound(isCorrect)
    
    // 延迟提交答案
    setTimeout(() => {
      onAnswer(isCorrect)
    }, 1000)
  }

  const playSound = (isCorrect: boolean) => {
    // 创建简单的音效
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    if (isCorrect) {
      // 正确答案音效 - 高音
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
    } else {
      // 错误答案音效 - 低音
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.1)
    }
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const playPronunciation = async () => {
    if (!word.word?.word) return
    
    setIsPlaying(true)
    
    try {
      // 使用Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.word.word)
        utterance.lang = 'en-US'
        utterance.rate = 0.8
        utterance.pitch = 1
        
        utterance.onend = () => {
          setIsPlaying(false)
        }
        
        speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error('播放发音失败:', error)
      setIsPlaying(false)
    }
  }

  const handleNext = () => {
    setCurrentStep('card')
    setSelectedAnswer(null)
    setShowResult(false)
  }

  if (currentStep === 'card') {
    return (
      <div className="flash-card" onClick={handleCardClick}>
        <div className="word-display">
          <div className="word-text">{word.word?.word}</div>
          <div className="phonetic-text">{word.word?.phonetic}</div>
        </div>
        
        <button
          className="pronunciation-button"
          onClick={(e) => {
            e.stopPropagation()
            playPronunciation()
          }}
          disabled={isPlaying}
        >
          {isPlaying ? '🔊' : '🔈'}
        </button>
        
        {word.word?.hasImage && word.word?.imageValue && (
          <div className="word-image">
            {word.word.imageType === 'emoji' ? (
              <span style={{ fontSize: '4rem' }}>{word.word.imageValue}</span>
            ) : word.word.imageType === 'url' ? (
              <img src={word.word.imageValue} alt={word.word.word} />
            ) : (
              <div className="text-4xl">📚</div>
            )}
          </div>
        )}
        
        <div style={{ marginTop: '2rem', color: '#718096', fontSize: '1rem' }}>
          点击查看释义
        </div>
      </div>
    )
  }

  return (
    <div className="flash-card">
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {/* 左侧：单词信息 */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className="word-text">{word.word?.word}</div>
          <div className="phonetic-text">{word.word?.phonetic}</div>
          
          <button
            className="pronunciation-button"
            onClick={playPronunciation}
            disabled={isPlaying}
            style={{ margin: '1rem 0' }}
          >
            {isPlaying ? '🔊' : '🔈'}
          </button>
          
          {word.word?.hasImage && word.word?.imageValue && (
            <div className="word-image">
              {word.word.imageType === 'emoji' ? (
                <span style={{ fontSize: '4rem' }}>{word.word.imageValue}</span>
              ) : word.word.imageType === 'url' ? (
                <img src={word.word.imageValue} alt={word.word.word} />
              ) : (
                <div className="text-4xl">📚</div>
              )}
            </div>
          )}
        </div>
        
        {/* 右侧：选择题 */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#2d3748', textAlign: 'left' }}>
            选择正确的中文释义：
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {options.map((option, index) => {
              let buttonStyle: React.CSSProperties = {
                width: '100%',
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                background: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }
              
              if (showResult) {
                if (option === (word.word?.meaning || '测试')) {
                  // 正确答案
                  buttonStyle = {
                    ...buttonStyle,
                    borderColor: '#48bb78',
                    backgroundColor: '#f0fff4',
                    color: '#22543d'
                  }
                } else if (option === selectedAnswer && option !== (word.word?.meaning || '测试')) {
                  // 用户选择的错误答案
                  buttonStyle = {
                    ...buttonStyle,
                    borderColor: '#f56565',
                    backgroundColor: '#fff5f5',
                    color: '#742a2a'
                  }
                } else {
                  // 其他选项
                  buttonStyle = {
                    ...buttonStyle,
                    opacity: 0.6
                  }
                }
              } else {
                // 非结果状态，保持基础样式
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  style={buttonStyle}
                >
                  <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              )
            })}
          </div>
          
          {showResult && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={handleNext}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                继续
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FlashCardMode
