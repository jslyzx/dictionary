import { useState, useEffect } from 'react'
import { pronunciationRuleService, type PronunciationRule, type CreatePronunciationRulePayload, type UpdatePronunciationRulePayload } from '../services/pronunciationRules'

interface PronunciationRuleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rule: PronunciationRule) => void
  ruleId?: number | null
}

const PronunciationRuleFormModal: React.FC<PronunciationRuleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ruleId,
}) => {
  const [formData, setFormData] = useState({
    letterCombination: '',
    pronunciation: '',
    ruleDescription: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (ruleId) {
      setIsEditing(true)
      loadPronunciationRule(ruleId)
    } else {
      setIsEditing(false)
      setFormData({
        letterCombination: '',
        pronunciation: '',
        ruleDescription: '',
      })
    }
  }, [ruleId])

  const loadPronunciationRule = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const rule = await pronunciationRuleService.getById(id)
      setFormData({
        letterCombination: rule.letterCombination,
        pronunciation: rule.pronunciation,
        ruleDescription: rule.ruleDescription || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载发音规则失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.letterCombination.trim()) {
      setError('字母组合不能为空')
      return
    }
    
    if (!formData.pronunciation.trim()) {
      setError('发音不能为空')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let savedRule: PronunciationRule

      if (isEditing && ruleId) {
        const updatePayload: UpdatePronunciationRulePayload = {
          letterCombination: formData.letterCombination.trim(),
          pronunciation: formData.pronunciation.trim(),
          ruleDescription: formData.ruleDescription.trim() || null,
        }
        savedRule = await pronunciationRuleService.update(ruleId, updatePayload)
      } else {
        const createPayload: CreatePronunciationRulePayload = {
          letterCombination: formData.letterCombination.trim(),
          pronunciation: formData.pronunciation.trim(),
          ruleDescription: formData.ruleDescription.trim() || null,
        }
        savedRule = await pronunciationRuleService.create(createPayload)
      }

      onSubmit(savedRule)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存发音规则失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      letterCombination: '',
      pronunciation: '',
      ruleDescription: '',
    })
    setError(null)
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    if (error) {
      setError(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* 背景遮罩 */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* 居中对话框 */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {isEditing ? '编辑发音规则' : '新建发音规则'}
                  </h3>

                  {/* 错误提示 */}
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* 字母组合 */}
                    <div>
                      <label htmlFor="letterCombination" className="block text-sm font-medium text-gray-700">
                        字母组合 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="letterCombination"
                        value={formData.letterCombination}
                        onChange={(e) => handleInputChange('letterCombination', e.target.value)}
                        placeholder="如：tion, ea, ough"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                        maxLength={50}
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        字母组合，如 "tion", "ea", "ough"
                      </p>
                    </div>

                    {/* 发音 */}
                    <div>
                      <label htmlFor="pronunciation" className="block text-sm font-medium text-gray-700">
                        发音 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="pronunciation"
                        value={formData.pronunciation}
                        onChange={(e) => handleInputChange('pronunciation', e.target.value)}
                        placeholder="如：/ʃən/, /iː/"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border font-mono"
                        maxLength={100}
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        国际音标，如 "/ʃən/", "/iː/"
                      </p>
                    </div>

                    {/* 规则说明 */}
                    <div>
                      <label htmlFor="ruleDescription" className="block text-sm font-medium text-gray-700">
                        规则说明
                      </label>
                      <textarea
                        id="ruleDescription"
                        value={formData.ruleDescription}
                        onChange={(e) => handleInputChange('ruleDescription', e.target.value)}
                        placeholder="描述该发音规则的使用条件和示例..."
                        rows={4}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        可选：描述该发音规则的使用条件和示例
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </>
                ) : (
                  isEditing ? '更新' : '保存'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PronunciationRuleFormModal