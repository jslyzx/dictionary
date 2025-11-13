import { useState, useEffect } from 'react'
import type { WordPlanWord } from '../../types/wordPlan'

interface SpellingModeProps {
  word: WordPlanWord
  onAnswer: (isCorrect: boolean, userAnswer: string) => void
  onSkip: () => void
  progress: { current: number; total: number; percentage: number }
}

const SpellingMode = ({ word, onAnswer, onSkip }: SpellingModeProps) => {
  const [userAnswer, setUserAnswer] = useState('')
  const [availableLetters, setAvailableLetters] = useState<string[]>([])
  const [usedLetters, setUsedLetters] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const targetWord = word.word?.word || 'testword'
  const correctAnswer = targetWord.toLowerCase()

  useEffect(() => {
    // 生成可用字母
    const letters = generateSpellingLetters(targetWord)
    setAvailableLetters(letters)
    setUsedLetters([])
    setUserAnswer('')
    setShowResult(false)
    setIsCorrect(null)
  }, [targetWord])

  const generateSpellingLetters = (word: string): string[] => {
    const letters = word.toLowerCase().split('')
    const baseSet: string[] = [...letters]
    const distractorsPool = 'abcdefghijklmnopqrstuvwxyz'.split('')
    // 过滤掉目标词已有字母，避免无意义重复
    const filteredPool = distractorsPool.filter(ch => !letters.includes(ch))
    // 目标总按钮数量（根据参考 UI，约 10-12 个）
    const targetCount = Math.max(10, Math.min(12, letters.length + 8))
    while (baseSet.length < targetCount && filteredPool.length > 0) {
      const idx = Math.floor(Math.random() * filteredPool.length)
      baseSet.push(filteredPool.splice(idx, 1)[0])
    }
    return baseSet.sort(() => Math.random() - 0.5)
  }

  const handleLetterClick = (letter: string) => {
    if (showResult) return
    
    const letterIndex = availableLetters.indexOf(letter)
    if (letterIndex > -1) {
      setAvailableLetters(availableLetters.filter((_, index) => index !== letterIndex))
      setUsedLetters([...usedLetters, letter])
      setUserAnswer(userAnswer + letter)
    }
  }

  const handleBackspace = () => {
    if (showResult) return
    if (usedLetters.length === 0) return
    const last = usedLetters[usedLetters.length - 1]
    setUsedLetters(usedLetters.slice(0, -1))
    setAvailableLetters([last, ...availableLetters])
    setUserAnswer(userAnswer.slice(0, -1))
  }

  const handleClear = () => {
    if (showResult) return
    
    setAvailableLetters(generateSpellingLetters(targetWord))
    setUsedLetters([])
    setUserAnswer('')
  }

  const handleSubmit = () => {
    if (userAnswer.trim()) {
      const correct = userAnswer.trim().toLowerCase() === correctAnswer
      setIsCorrect(correct)
      setShowResult(true)
      
      // 播放音效
      playSound(correct)
      
      // 延迟提交答案
      setTimeout(() => {
        onAnswer(correct, userAnswer.trim())
      }, 1000)
    }
  }

  const playSound = (isCorrect: boolean) => {
    // 创建简单的音效
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    if (isCorrect) {
      // 正确答案音效 - 上升音调
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)
    } else {
      // 错误答案音效 - 下降音调
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.2)
    }
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const playPronunciation = async () => {
    if (!targetWord) return
    
    setIsPlaying(true)
    
    try {
      // 使用Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(targetWord)
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

  const nextWord = () => {
    setAvailableLetters(generateSpellingLetters(targetWord))
    setUsedLetters([])
    setUserAnswer('')
    setShowResult(false)
    setIsCorrect(null)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      width: '100%'
    }}>
      <div style={{ 
        display: 'flex', 
        gap: '3rem', 
        alignItems: 'center',
        width: '100%',
        maxWidth: '900px',
        padding: '0 2rem'
      }}>
        {/* 左侧：输入区域 */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ 
            background: '#fffbeb',
            border: '1px solid #f6e05e',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#2d3748',
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              {targetWord.split('').map((_, index: number) => (
                <div
                  key={index}
                  style={{
                    width: '40px',
                    height: '50px',
                    borderBottom: '3px solid #f6e05e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: userAnswer[index] ? '#2d3748' : '#a0aec0'
                  }}
                >
                  {userAnswer[index] || ''}
                </div>
              ))}
              <button
                onClick={handleBackspace}
                disabled={showResult || userAnswer.length === 0}
                style={{
                  marginLeft: '0.75rem',
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  border: '2px solid #d69e2e',
                  background: '#f6e05e',
                  color: '#1a202c',
                  fontWeight: 700,
                  cursor: userAnswer.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            {!showResult && (
              <>
                <div style={{ fontSize: '1.375rem', color: '#1f2937', marginBottom: '1rem', fontWeight: 600 }}>
                  {word.word?.meaning || '测试释义'}
                </div>
                <div style={{ fontSize: '1.125rem', color: '#374151', marginBottom: '1rem' }}>
                  {word.word?.phonetic || '/tɛst/'}
                </div>
              </>
            )}
            
            <button
              onClick={playPronunciation}
              disabled={isPlaying}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                margin: '0 auto'
              }}
            >
              {isPlaying ? '🔊' : '🔈'}
            </button>
          </div>
          
          {showResult && isCorrect && (
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              margin: '1rem 0',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
              color: 'white'
            }}>
              ✓ 正确！
            </div>
          )}
          {showResult && isCorrect === false && (
            <div style={{ textAlign: 'left' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                margin: '0 0 1rem 0',
                background: 'white',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2d3748' }}>{word.word?.word}</div>
                <div style={{ fontSize: '1rem', color: '#718096', marginTop: '0.25rem' }}>{word.word?.phonetic}</div>
                <button
                  onClick={playPronunciation}
                  disabled={isPlaying}
                  style={{
                    marginTop: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isPlaying ? '🔊' : '🔈'}
                </button>
                {word.word?.hasImage && word.word?.imageValue && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {word.word.imageType === 'emoji' ? (
                      <span style={{ fontSize: '3rem' }}>{word.word.imageValue}</span>
                    ) : word.word.imageType === 'url' ? (
                      <img src={word.word.imageValue || ''} alt={word.word?.word || ''} style={{ maxWidth: '200px', borderRadius: '8px' }} />
                    ) : null}
                  </div>
                )}
                <div style={{ fontSize: '1.125rem', color: '#4a5568', marginTop: '0.75rem' }}>{word.word?.meaning}</div>
                {word.word?.sentence && (
                  <div style={{ fontSize: '0.95rem', color: '#4a5568', marginTop: '0.5rem' }}>例句：{word.word.sentence}</div>
                )}
                {word.word?.notes && (
                  <div style={{ fontSize: '0.95rem', color: '#4a5568', marginTop: '0.5rem' }}>笔记：{word.word.notes}</div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={onSkip}
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
                  继续做题
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧：字母按钮 */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
              选择字母拼写单词：
            </div>
            
            
            
            <div>
              <div style={{ fontSize: '0.875rem', color: '#4a5568', marginBottom: '0.5rem' }}>可选字母：</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {availableLetters.map((letter, index) => (
                  <button
                    key={index}
                    onClick={() => handleLetterClick(letter)}
                    disabled={showResult}
                    style={{
                      width: '50px',
                      height: '50px',
                      background: '#f6e05e',
                      border: '2px solid #d69e2e',
                      borderRadius: '10px',
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#1a202c',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 0 #d69e2e'
                    }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {!showResult && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleSubmit}
                disabled={userAnswer.trim().length === 0}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: userAnswer.trim().length === 0 ? 0.6 : 1
                }}
              >
                提交答案
              </button>
            </div>
          )}
          
          {showResult && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={nextWord}
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
                下一个单词
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpellingMode
