import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { WordPlan, WordPlanWord } from '../types/wordPlan'
import { getWordPlan, removeWordFromPlan, addWordToPlan } from '../services/wordPlans'
import EnhancedWordSelector from '../components/EnhancedWordSelector'

const WordPlanDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [wordPlan, setWordPlan] = useState<WordPlan | null>(null)
  const [words, setWords] = useState<WordPlanWord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'learned' | 'unlearned'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddWordsModal, setShowAddWordsModal] = useState(false)
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchWordPlanDetail()
  }, [id])

  const fetchWordPlanDetail = async () => {
    if (!id) return
    
    try {
      // 强制刷新，清除任何缓存数据
      setWords([])
      setWordPlan(null)
      
      const plan = await getWordPlan(parseInt(id))
      console.log('API返回的计划数据:', plan)
      console.log('计划中的单词数据:', plan.words)
      if (plan.words && plan.words.length > 0) {
        console.log('第一个单词的完整结构:', plan.words[0])
        console.log('第一个单词的word字段:', plan.words[0].word)
      }
      setWordPlan(plan)
      setWords(plan.words || [])
    } catch (error) {
      console.error('获取计划详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveWord = async (wordId: number) => {
    if (!confirm('确定要从计划中移除这个单词吗？')) {
      return
    }

    if (!id) return

    try {
      await removeWordFromPlan(parseInt(id), wordId)
      fetchWordPlanDetail()
    } catch (error) {
      console.error('移除单词失败:', error)
      alert('移除单词失败')
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

  const handleAddWords = async () => {
    if (!id || selectedWordIds.size === 0) return

    try {
      // 逐个添加单词
      for (const wordId of selectedWordIds) {
        await addWordToPlan(parseInt(id), wordId)
      }
      setShowAddWordsModal(false)
      setSelectedWordIds(new Set())
      fetchWordPlanDetail()
    } catch (error) {
      console.error('添加单词失败:', error)
      alert('添加单词失败')
    }
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">无效的访问</h1>
          <Link to="/word-plans" className="text-blue-600 hover:text-blue-700">
            返回计划列表
          </Link>
        </div>
      </div>
    )
  }

  const handleStartLearning = () => {
    if (!id) return
    const learningWindow = window.open(`/learning?planId=${id}`, '_blank', 'width=1200,height=800')
    if (learningWindow) {
      learningWindow.focus()
    }
  }

  const filteredWords = words.filter(word => {
    console.log('过滤单词:', word)
    console.log('单词word字段:', word.word)
    const matchesSearch = !searchTerm || 
                         word.word?.word?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.word?.meaning?.includes(searchTerm)
    
    const matchesFilter = filter === 'all' ||
                         (filter === 'learned' && word.isLearned) ||
                         (filter === 'unlearned' && !word.isLearned)
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!wordPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">计划不存在</h1>
          <Link to="/word-plans" className="text-blue-600 hover:text-blue-700">
            返回计划列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/word-plans" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
                ← 返回计划列表
              </Link>
              <h1 className="text-3xl font-bold text-slate-900">{wordPlan.name}</h1>
              {wordPlan.description && (
                <p className="text-slate-600 mt-2">{wordPlan.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleStartLearning}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                开始学习
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600">总单词数</div>
              <div className="text-2xl font-bold text-slate-900">{words.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600">已学习</div>
              <div className="text-2xl font-bold text-slate-900">
                {wordPlan.learned_words || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600">正确率</div>
              <div className="text-2xl font-bold text-slate-900">
                {wordPlan.correct_rate || 0}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600">错误单词</div>
              <div className="text-2xl font-bold text-slate-900">
                {wordPlan.word_count || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">计划单词</h2>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索单词..."
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'learned' | 'unlearned')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部单词</option>
                  <option value="learned">已学习</option>
                  <option value="unlearned">未学习</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddWordsModal(true)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  添加单词
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredWords.map((word) => (
              <div key={word.id} className="p-4 hover:bg-slate-50">
                {console.log('渲染单词项:', word)}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-medium text-slate-900">{word.word?.word}</div>
                      <div className="text-slate-500">{word.word?.phonetic}</div>
                      {word.isLearned !== undefined && word.isLearned && (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          已学习
                        </span>
                      )}
                      {word.isCorrect !== undefined && word.isCorrect && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          正确
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 mt-1">{word.word?.meaning}</div>
                    {word.errorCount !== undefined && word.errorCount > 0 && (
                      <div className="text-red-600 text-sm mt-1">
                        错误次数：{word.errorCount}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/words/${word.wordId}`)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      详情
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(word.wordId || 0)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredWords.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p>没有找到匹配的单词</p>
            </div>
          )}
        </div>
      </div>

      {/* 添加单词模态框 */}
      {showAddWordsModal && (
        <EnhancedWordSelector
          selectedWordIds={selectedWordIds}
          onWordSelect={handleWordSelect}
          onWordsBulkSelect={handleWordsBulkSelect}
          onClose={() => setShowAddWordsModal(false)}
          onConfirm={handleAddWords}
        />
      )}
    </div>
  )
}

export default WordPlanDetailPage