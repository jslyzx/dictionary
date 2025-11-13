import { useState } from 'react'
import type { LearningSettings, LearningMode } from '../../types/learning'

interface LearningSettingsModalProps {
  settings: LearningSettings
  onStart: (settings: LearningSettings) => void
  onCancel: () => void
  isLoading?: boolean
}

const LearningSettingsModal = ({
  settings,
  onStart,
  onCancel,
  isLoading = false
}: LearningSettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<LearningSettings>(settings)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStart(localSettings)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">背单词</h2>
          <p className="text-gray-600">设置学习参数</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 学习模式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              学习模式
            </label>
            <select
              value={localSettings.mode}
              onChange={(e) => setLocalSettings({...localSettings, mode: e.target.value as LearningMode})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="multiple-choice">选择题</option>
              <option value="spelling">拼写</option>
              <option value="flash-card">闪卡</option>
            </select>
          </div>

          {/* 学习单词数量 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              学习单词数量：{localSettings.wordCount}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={localSettings.wordCount}
              onChange={(e) => setLocalSettings({...localSettings, wordCount: parseInt(e.target.value)})}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5</span>
              <span>50</span>
            </div>
          </div>

          {/* 单词筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              单词筛选
            </label>
            <select
              value={localSettings.masteryStatusFilter}
              onChange={(e) => setLocalSettings({...localSettings, masteryStatusFilter: e.target.value as any})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部单词</option>
              <option value="unmastered">仅未掌握</option>
              <option value="mastered">仅已掌握</option>
            </select>
          </div>

          {/* 其他设置 */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includePronunciation"
                checked={localSettings.includePronunciation}
                onChange={(e) => setLocalSettings({...localSettings, includePronunciation: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includePronunciation" className="ml-2 text-sm text-gray-700">
                包含发音
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeImages"
                checked={localSettings.includeImages}
                onChange={(e) => setLocalSettings({...localSettings, includeImages: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeImages" className="ml-2 text-sm text-gray-700">
                显示图片
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoPlayAudio"
                checked={localSettings.autoPlayAudio}
                onChange={(e) => setLocalSettings({...localSettings, autoPlayAudio: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoPlayAudio" className="ml-2 text-sm text-gray-700">
                自动播放音频
              </label>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? '正在开始...' : '开始学习'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LearningSettingsModal
