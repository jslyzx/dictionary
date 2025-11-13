import { useState, useEffect } from 'react'
import type { Word } from '../../types/word'
import type { LearningSettings } from '../../types/learning'
import WordImage from './WordImage'
import PronunciationButton from './PronunciationButton'

interface SpellingModeProps {
  word: Word
  onAnswer: (answer: string) => void
  onSkip: () => void
  onEnd: () => void
  settings: LearningSettings
  progress: { current: number; total: number; percentage: number }
  stats: { correct: number; incorrect: number; accuracy: number }
  feedback: { type: 'success' | 'error'; message: string } | null
}

const SpellingMode = ({
  word,
  onAnswer,
  onSkip,
  settings,
  progress,
  feedback
}: SpellingModeProps) => {
  const [userAnswer, setUserAnswer] = useState('')
  const [availableLetters, setAvailableLetters] = useState<string[]>([])
  const [usedLetters, setUsedLetters] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    // Generate available letters for spelling
    const letters = generateSpellingLetters(word.word)
    setAvailableLetters(letters)
    setUsedLetters([])
    setUserAnswer('')
    setShowResult(false)
  }, [word])

  const generateSpellingLetters = (word: string): string[] => {
    const letters = word.toLowerCase().split('')
    const shuffled = [...letters].sort(() => Math.random() - 0.5)
    
    // Add some distractor letters
    const distractors = 'abcdefghijklmnopqrstuvwxyz'.split('')
    const randomDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3)
    
    return [...shuffled, ...randomDistractors].sort(() => Math.random() - 0.5)
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

  const handleUsedLetterClick = (letter: string) => {
    if (showResult) return
    
    const letterIndex = usedLetters.indexOf(letter)
    if (letterIndex > -1) {
      setUsedLetters(usedLetters.filter((_, index) => index !== letterIndex))
      setAvailableLetters([...availableLetters, letter])
      setUserAnswer(userAnswer.replace(letter, ''))
    }
  }

  const handleClear = () => {
    if (showResult) return
    
    setAvailableLetters(generateSpellingLetters(word.word))
    setUsedLetters([])
    setUserAnswer('')
  }

  const handleSubmit = () => {
    if (userAnswer.trim()) {
      setShowResult(true)
      onAnswer(userAnswer.trim())
    }
  }

  const handleNext = () => {
    setAvailableLetters(generateSpellingLetters(word.word))
    setUsedLetters([])
    setUserAnswer('')
    setShowResult(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 单词展示 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center">
          {/* 进度信息 */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              {progress.current} / {progress.total}
            </div>
            <div className="text-sm text-gray-500">
              需学习{progress.total - progress.current + 1}词
            </div>
          </div>

          {/* 中文释义与音标 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {word.meaning}
            </h2>
            <div className="text-lg text-gray-600 mb-4">
              {word.phonetic}
            </div>
            
            {/* 发音按钮 */}
            {settings.includePronunciation && (
              <div className="mb-4">
                <PronunciationButton 
                  word={word.word}
                  pronunciationUrl={word.pronunciation1}
                  autoPlay={settings.autoPlayAudio}
                />
              </div>
            )}

            {/* 单词图片 */}
            {settings.includeImages && word.hasImage && (
              <div className="mb-6">
                <WordImage 
                  word={word.word}
                  imageType={word.imageType}
                  imageValue={word.imageValue}
                />
              </div>
            )}
          </div>

          {/* 用户答案显示 */}
          <div className="mb-6">
            <div className="text-3xl font-bold text-blue-600 mb-2 min-h-[40px]">
              {userAnswer || '...'}
            </div>
            <div className="text-sm text-gray-500">
              用下面的字母拼写该单词
            </div>
          </div>

          {/* 反馈信息 */}
          {feedback && (
            <div className={`p-3 rounded-lg mb-4 ${
              feedback.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {/* 已选择的字母 */}
      {usedLetters.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">已选择的字母</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {usedLetters.map((letter, index) => (
              <button
                key={index}
                onClick={() => handleUsedLetterClick(letter)}
                disabled={showResult}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-colors"
              >
                {letter}
              </button>
            ))}
          </div>
          <button
            onClick={handleClear}
            disabled={showResult}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            清空
          </button>
        </div>
      )}

      {/* 可选字母 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">可选字母</h3>
        <div className="grid grid-cols-6 gap-3">
          {availableLetters.map((letter, index) => (
            <button
              key={index}
              onClick={() => handleLetterClick(letter)}
              disabled={showResult}
              className="w-12 h-12 bg-yellow-100 hover:bg-yellow-200 rounded-lg flex items-center justify-center text-lg font-bold text-gray-700 transition-colors border-2 border-yellow-300"
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center space-x-4">
        {!showResult ? (
          <>
            <button
              onClick={handleSubmit}
              disabled={userAnswer.trim().length === 0}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              提交答案
            </button>
            <button
              onClick={onSkip}
              className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              跳过
            </button>
          </>
        ) : (
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            下一个单词
          </button>
        )}
      </div>
    </div>
  )
}

export default SpellingMode
