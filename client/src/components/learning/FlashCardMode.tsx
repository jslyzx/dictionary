import { useState } from 'react'
import type { Word } from '../../types/word'
import type { LearningSettings } from '../../types/learning'
import WordImage from './WordImage'
import PronunciationButton from './PronunciationButton'

interface FlashCardModeProps {
  word: Word
  onAnswer: (answer: string) => void
  onSkip: () => void
  onEnd: () => void
  settings: LearningSettings
  progress: { current: number; total: number; percentage: number }
  stats: { correct: number; incorrect: number; accuracy: number }
  feedback: { type: 'success' | 'error'; message: string } | null
}

const FlashCardMode = ({
  word,
  onAnswer,
  onSkip,
  settings,
  progress,
  stats,
  feedback
}: FlashCardModeProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const handleFlip = () => {
    if (!showResult) {
      setIsFlipped(!isFlipped)
    }
  }

  const handleKnow = () => {
    if (!isFlipped) return
    setShowResult(true)
    onAnswer(word.meaning)
  }

  const handleDontKnow = () => {
    if (!isFlipped) return
    setShowResult(true)
    onAnswer('')
  }

  const handleNext = () => {
    setIsFlipped(false)
    setShowResult(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 进度信息 */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {progress.current} / {progress.total}
        </div>
        <div className="text-sm text-gray-500">
          需学习{progress.total - progress.current + 1}词
        </div>
      </div>

      {/* 闪卡 */}
      <div className="relative mb-8">
        <div 
          className={`bg-white rounded-xl shadow-lg p-8 cursor-pointer transition-transform duration-500 ${
            isFlipped ? 'transform rotateY-180' : ''
          }`}
          onClick={handleFlip}
          style={{ minHeight: '400px' }}
        >
          {!isFlipped ? (
            /* 卡片正面 - 显示单词 */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  {word.word}
                </h1>
                <div className="text-xl text-gray-600 mb-4">
                  {word.phonetic}
                </div>
              </div>

              {/* 发音按钮 */}
              {settings.includePronunciation && (
                <div className="mb-6">
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

              <div className="text-sm text-gray-500 mt-4">
                点击查看释义
              </div>
          </div>
        ) : (
            /* 卡片背面 - 显示释义 */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  {word.meaning}
                </h2>
                <div className="text-lg text-gray-600 mb-2">
                  {word.word}
                </div>
                <div className="text-md text-gray-500">
                  {word.phonetic}
                </div>
              </div>

              {!showResult && (
                <div className="text-sm text-gray-500 mb-6">
                  这个单词你认识吗？
                </div>
              )}
          </div>
        )}
      </div>

      {/* 闪卡标签 */}
      <div className="absolute right-0 top-4 bg-blue-500 text-white px-3 py-1 rounded-l-lg text-sm font-medium">
          闪卡
      </div>
      </div>

      {/* 反馈信息 */}
      {feedback && (
        <div className={`p-4 rounded-lg mb-6 text-center ${
          feedback.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* 操作按钮 */}
      {!showResult ? (
        <div className="flex justify-center space-x-4">
          {isFlipped && (
            <>
              <button
                onClick={handleKnow}
                className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                认识 ✓
              </button>
              <button
                onClick={handleDontKnow}
                className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                不认识 ✗
              </button>
            </>
          )}
          {!isFlipped && (
            <button
              onClick={onSkip}
              className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              跳过
            </button>
          )}
        </div>
      ) : (
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            下一张卡片
          </button>
        </div>
      )}

      {/* 统计 */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>答对：{stats.correct}</div>
          <div>答错：{stats.incorrect}</div>
          <div className="font-medium text-blue-600">正确率：{stats.accuracy}%</div>
        </div>
      </div>
    </div>
  )
}

export default FlashCardMode
