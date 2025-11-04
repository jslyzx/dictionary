import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { pronunciationRuleService, type PronunciationRule } from '../services/pronunciationRules'

const PronunciationRuleDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [pronunciationRule, setPronunciationRule] = useState<PronunciationRule | null>(null)
  const [sameCombinationRules, setSameCombinationRules] = useState<PronunciationRule[]>([])
  const [wordsUsingRule, setWordsUsingRule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wordsLoading, setWordsLoading] = useState(false)
  const [wordsPage, setWordsPage] = useState(1)
  const [totalWords, setTotalWords] = useState(0)
  const [wordsPerPage] = useState(20)

  const loadPronunciationRule = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const rule = await pronunciationRuleService.getById(Number(id))
      setPronunciationRule(rule)

      // 加载相同字母组合的其他发音规则
      const sameRules = await pronunciationRuleService.getByCombination(rule.letterCombination)
      setSameCombinationRules(sameRules.filter(r => r.id !== rule.id))

      // 加载使用该规则的单词
      loadWordsUsingRule(Number(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载发音规则失败')
    } finally {
      setLoading(false)
    }
  }

  const loadWordsUsingRule = async (ruleId: number, page: number = 1) => {
    try {
      setWordsLoading(true)
      const result = await pronunciationRuleService.getWordsUsingRule(ruleId, {
        page,
        limit: wordsPerPage,
      })
      setWordsUsingRule(result.items)
      setTotalWords(result.total)
      setWordsPage(page)
    } catch (err) {
      console.error('加载单词失败:', err)
    } finally {
      setWordsLoading(false)
    }
  }

  useEffect(() => {
    loadPronunciationRule()
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const totalPages = Math.ceil(totalWords / wordsPerPage)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !pronunciationRule) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error || '发音规则不存在'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/pronunciation-rules"
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            返回列表
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">发音规则详情</h1>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/pronunciation-rules/${pronunciationRule.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            编辑
          </Link>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            基本信息
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            发音规则的详细信息
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">字母组合</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {pronunciationRule.letterCombination}
                </span>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">发音</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono text-lg">
                {pronunciationRule.pronunciation}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">规则说明</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {pronunciationRule.ruleDescription || '-'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">关联单词数</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {pronunciationRule.wordCount || 0} 个单词
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">创建时间</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(pronunciationRule.createdAt)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">更新时间</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(pronunciationRule.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 相同字母组合的其他发音 */}
      {sameCombinationRules.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              字母组合 '{pronunciationRule.letterCombination}' 的其他发音规则
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              同一个字母组合可能有多种发音方式
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sameCombinationRules.map((rule) => (
                <div key={rule.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <Link
                    to={`/pronunciation-rules/${rule.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rule.letterCombination}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {rule.wordCount || 0} 单词
                      </span>
                    </div>
                    <div className="font-mono text-lg text-gray-900 mb-2">
                      {rule.pronunciation}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {rule.ruleDescription || '暂无说明'}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 使用该规则的单词列表 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            使用该规则的单词
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            共 {totalWords} 个单词使用了这个发音规则
          </p>
        </div>
        <div className="border-t border-gray-200">
          {wordsLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">加载中...</p>
            </div>
          ) : wordsUsingRule.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              暂无单词使用该发音规则
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      单词
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      音标
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      释义
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      位置
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      难度
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      掌握状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wordsUsingRule.map((word) => (
                    <tr key={word.wordId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/words/${word.wordId}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {word.word}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {word.phonetic}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={word.meaning}>
                          {word.meaning}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {word.positionInWord || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          word.difficulty === 0 ? 'bg-green-100 text-green-800' :
                          word.difficulty === 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {word.difficulty === 0 ? '简单' : word.difficulty === 1 ? '中等' : '困难'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          word.isMastered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {word.isMastered ? '已掌握' : '未掌握'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => loadWordsUsingRule(Number(id), Math.max(1, wordsPage - 1))}
                  disabled={wordsPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => loadWordsUsingRule(Number(id), Math.min(totalPages, wordsPage + 1))}
                  disabled={wordsPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    显示第 <span className="font-medium">{(wordsPage - 1) * wordsPerPage + 1}</span> 至{' '}
                    <span className="font-medium">{Math.min(wordsPage * wordsPerPage, totalWords)}</span> 条，
                    共 <span className="font-medium">{totalWords}</span> 条记录
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => loadWordsUsingRule(Number(id), Math.max(1, wordsPage - 1))}
                      disabled={wordsPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">上一页</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {/* 页码 */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (wordsPage <= 3) {
                        pageNum = i + 1
                      } else if (wordsPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = wordsPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => loadWordsUsingRule(Number(id), pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            wordsPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => loadWordsUsingRule(Number(id), Math.min(totalPages, wordsPage + 1))}
                      disabled={wordsPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">下一页</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PronunciationRuleDetailPage