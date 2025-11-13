import { useState, useEffect } from 'react'
import type { Word } from '../../types/word'
import type { LearningSettings, MultipleChoiceOption } from '../../types/learning'
import WordImage from './WordImage'
import PronunciationButton from './PronunciationButton'

interface MultipleChoiceModeProps {
  word: Word
  onAnswer: (answer: string) => void
  onSkip: () => void
  onEnd: () => void
  settings: LearningSettings
  progress: { current: number; total: number; percentage: number }
  stats: { correct: number; incorrect: number; accuracy: number }
  feedback: { type: 'success' | 'error'; message: string } | null
}

const MultipleChoiceMode = ({
  word,
  onAnswer,
  onSkip,
  settings,
  progress,
  feedback
}: MultipleChoiceModeProps) => {
  const [options, setOptions] = useState<MultipleChoiceOption[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    // Generate multiple choice options
    const generatedOptions = generateOptions(word)
    setOptions(generatedOptions)
    setSelectedOption(null)
    setShowResult(false)
  }, [word])

  const generateOptions = (currentWord: Word): MultipleChoiceOption[] => {
    // This is a simplified version - in a real app, you'd get these from the learning service
    const correctOption: MultipleChoiceOption = {
      id: 'correct',
      text: currentWord.meaning,
      isCorrect: true
    }

    // Generate some plausible incorrect options based on the word's meaning
    const incorrectOptions = generateIncorrectOptions(currentWord.meaning)
    
    const allOptions = [correctOption, ...incorrectOptions]
    return allOptions.sort(() => Math.random() - 0.5)
  }

  const generateIncorrectOptions = (correctMeaning: string): MultipleChoiceOption[] => {
    // This is a simplified implementation
    // In a real app, you might want to get these from a database or API
    const commonMeanings = [
      '早上，上午',
      '下午',
      '晚上',
      '夜晚',
      '今天',
      '明天',
      '昨天',
      '时间',
      '天气',
      '食物',
      '水',
      '火',
      '土地',
      '空气',
      '人',
      '家庭',
      '朋友',
      '工作',
      '学校',
      '家'
    ]

    const filtered = commonMeanings.filter(meaning => meaning !== correctMeaning)
    const shuffled = filtered.sort(() => Math.random() - 0.5)
    
    return shuffled.slice(0, 3).map((meaning, index) => ({
      id: `incorrect_${index}`,
      text: meaning,
      isCorrect: false
    }))
  }

  const handleOptionSelect = (optionId: string) => {
    if (showResult) return
    
    setSelectedOption(optionId)
    const selectedOption = options.find(opt => opt.id === optionId)
    
    if (selectedOption) {
      setShowResult(true)
      onAnswer(selectedOption.text)
    }
  }

  const handleNext = () => {
    setSelectedOption(null)
    setShowResult(false)
  }

  const getOptionStyle = (option: MultipleChoiceOption) => {
    let baseStyle = 'w-full p-4 rounded-lg border-2 text-left transition-all duration-200 '
    
    if (!showResult) {
      baseStyle += 'border-gray-200 bg-white hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer'
    } else {
      if (option.id === selectedOption) {
        if (option.isCorrect) {
          baseStyle += 'border-green-500 bg-green-50 text-green-800'
        } else {
          baseStyle += 'border-red-500 bg-red-50 text-red-800'
        }
      } else if (option.isCorrect) {
        baseStyle += 'border-green-500 bg-green-50 text-green-800'
      } else {
        baseStyle += 'border-gray-200 bg-gray-50 text-gray-500'
      }
    }
    
    return baseStyle
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

          {/* 单词与音标 */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {word.word}
            </h1>
            <div className="text-xl text-gray-600 mb-4">
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

      {/* 选择题选项 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-3">
          {options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={showResult}
              className={getOptionStyle(option)}
            >
              <div className="flex items-center">
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold mr-3">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-lg">{option.text}</span>
              </div>
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        {showResult && (
          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              下一个单词
            </button>
            <button
              onClick={onSkip}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              跳过
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultipleChoiceMode
