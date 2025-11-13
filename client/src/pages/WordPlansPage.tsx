import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WordPlan, CreateWordPlanPayload } from '../types/wordPlan'
import { getWordPlans, createWordPlan, deleteWordPlan, activateWordPlan } from '../services/wordPlans'
import { listWords } from '../services/words'
import type { Word } from '../types/word'
import EnhancedWordSelector from '../components/EnhancedWordSelector'

const WordPlansPage = () => {
  const navigate = useNavigate()
  const [wordPlans, setWordPlans] = useState<WordPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddWordsModal, setShowAddWordsModal] = useState(false)
  // const [selectedPlan, setSelectedPlan] = useState<WordPlan | null>(null)
  const [availableWords, setAvailableWords] = useState<Word[]>([])
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set())
  const [searchTerm] = useState('')  // 保留这个状态用于向后兼容性

  // 表单状态
  const [formData, setFormData] = useState<CreateWordPlanPayload>({
    name: '',
    description: '',
    mode: 'flash-card',
    targetWordCount: 10,
    dailyWordCount: 5,
    wordIds: []
  })

  useEffect(() => {
    fetchWordPlans()
  }, [])

  useEffect(() => {
    if (showAddWordsModal) {
      fetchAvailableWords()
    }
  }, [showAddWordsModal])

  const fetchWordPlans = async () => {
    setLoading(true)
    try {
      const plans = await getWordPlans()
      if (Array.isArray(plans)) {
        setWordPlans(plans)
      } else {
        console.error('获取到的数据不是数组:', plans)
        setWordPlans([])
      }
    } catch (error) {
      console.error('获取单词计划失败:', error)
      setWordPlans([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableWords = async () => {
    try {
      const result = await listWords({
        page: 1,
        limit: 50,
        search: searchTerm
      })
      setAvailableWords(result.items as Word[])
      // setWordTotal(result.total)
    } catch (error) {
      console.error('获取可用单词失败:', error)
    }
  }

  const handleCreatePlan = async () => {
    if (!formData.name.trim()) {
      alert('请输入计划名称')
      return
    }

    if (selectedWordIds.size === 0) {
      alert('请至少选择一个单词')
      return
    }

    try {
      const payload: CreateWordPlanPayload = {
        name: formData.name,
        description: formData.description,
        mode: formData.mode,
        targetWordCount: formData.targetWordCount,
        dailyWordCount: formData.dailyWordCount,
        wordIds: Array.from(selectedWordIds)
      }
      
      await createWordPlan(payload)
      setShowCreateModal(false)
      setShowAddWordsModal(false)
      setSelectedWordIds(new Set())
      setFormData({
        name: '',
        description: '',
        mode: 'flash-card',
        targetWordCount: 10,
        dailyWordCount: 5,
        wordIds: []
      })
      fetchWordPlans()
    } catch (error) {
      console.error('创建单词计划失败:', error)
      alert('创建单词计划失败')
    }
  }

  const handleActivatePlan = async (planId: number) => {
    if (!confirm('确定要激活这个单词计划吗？激活后将禁用其他计划。')) {
      return
    }

    try {
      await activateWordPlan(planId)
      fetchWordPlans()
    } catch (error) {
      console.error('激活单词计划失败:', error)
      alert('激活单词计划失败')
    }
  }

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('确定要删除这个单词计划吗？')) {
      return
    }

    try {
      await deleteWordPlan(planId)
      fetchWordPlans()
    } catch (error) {
      console.error('删除单词计划失败:', error)
      alert('删除单词计划失败')
    }
  }

  const handleWordSelect = (wordId: number) => {
    const newSelectedIds = new Set(selectedWordIds)
    if (newSelectedIds.has(wordId)) {
      newSelectedIds.delete(wordId)
    } else {
      newSelectedIds.add(wordId)
    }
    setSelectedWordIds(newSelectedIds)
  }

  const handleWordsBulkSelect = (wordIds: number[]) => {
    const newSelectedIds = new Set(selectedWordIds)
    wordIds.forEach(id => {
      newSelectedIds.add(id)
    })
    setSelectedWordIds(newSelectedIds)
  }

  const handleStartLearning = (planId: number) => {
    // 打开新窗口进行学习
    const learningWindow = window.open(`/learning?planId=${planId}`, '_blank', 'width=1200,height=800')
    if (learningWindow) {
      learningWindow.focus()
    }
  }

  // 移除未使用的filteredWords变量和相关代码

  // const totalPages = Math.ceil(wordTotal / 20)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">单词计划</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            创建和管理单词学习计划，按计划的节奏进行学习
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          创建计划
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">加载中...</p>
        </div>
      ) : !wordPlans || wordPlans.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">还没有单词计划</h3>
          <p className="text-slate-600 mb-6">创建你的第一个单词学习计划，开始系统化的学习吧！</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            创建计划
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wordPlans && wordPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {plan.status === 'active' ? '活跃' : '未激活'}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">模式：</span>
                    <span className="text-slate-900">
                      {plan.mode === 'flash-card' ? '闪卡' : '拼写'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">目标单词：</span>
                    <span className="text-slate-900">{plan.targetWordCount || 0} 个</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">每日学习：</span>
                    <span className="text-slate-900">{plan.dailyWordCount || 0} 个</span>
                  </div>
                  {plan.word_count && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">已添加：</span>
                      <span className="text-slate-900">{plan.word_count} 个单词</span>
                    </div>
                  )}
                  {plan.learned_words !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">已学习：</span>
                      <span className="text-slate-900">{plan.learned_words} 个</span>
                    </div>
                  )}
                  {plan.correct_rate !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">正确率：</span>
                      <span className="text-slate-900">{plan.correct_rate}%</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {plan.status !== 'active' && (
                    <button
                      type="button"
                      onClick={() => handleActivatePlan(plan.id)}
                      className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                    >
                      激活
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStartLearning(plan.id)}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    开始学习
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/word-plans/${plan.id}`)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    管理
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建计划模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">创建单词计划</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    计划名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：基础词汇计划"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    计划描述
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="描述这个计划的学习目标和内容"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      学习模式
                    </label>
                    <select
                      value={formData.mode}
                      onChange={(e) => setFormData({...formData, mode: e.target.value as 'flash-card' | 'spelling'})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="flash-card">闪卡模式</option>
                      <option value="spelling">拼写模式</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      目标单词数量
                    </label>
                    <input
                      type="number"
                      value={formData.targetWordCount || 10}
                      onChange={(e) => setFormData({...formData, targetWordCount: parseInt(e.target.value) || 10})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="5"
                      max="1000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    每日学习数量
                  </label>
                  <input
                    type="number"
                    value={formData.dailyWordCount || 5}
                    onChange={(e) => setFormData({...formData, dailyWordCount: parseInt(e.target.value) || 5})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      选择单词 ({selectedWordIds.size} 个已选择)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddWordsModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      添加单词
                    </button>
                  </div>
                  
                  {selectedWordIds.size > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm text-slate-600 mb-2">已选择的单词：</div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedWordIds).map(wordId => {
                          const word = availableWords.find(w => w.id === wordId)
                          return word ? (
                            <span key={wordId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {word.word}
                              <button
                                type="button"
                                onClick={() => handleWordSelect(wordId)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleCreatePlan}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  创建计划
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加单词模态框 - 使用增强版单词选择器 */}
      {showAddWordsModal && (
        <EnhancedWordSelector
          selectedWordIds={selectedWordIds}
          onWordSelect={handleWordSelect}
          onWordsBulkSelect={handleWordsBulkSelect}
          onClose={() => setShowAddWordsModal(false)}
          onConfirm={() => setShowAddWordsModal(false)}
        />
      )}
    </div>
  )
}

export default WordPlansPage