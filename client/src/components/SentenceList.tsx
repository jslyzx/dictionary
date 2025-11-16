import React, { useState, useEffect } from 'react';
import { sentenceService } from '../services/sentenceService';
import type { Sentence, SentenceListParams, PaginatedResponse } from '../types/sentence';

interface SentenceListProps {
  onSentenceSelect?: (sentence: Sentence) => void;
}

/**
 * 句子列表组件
 * 显示所有句子，支持搜索和分页
 */
export const SentenceList: React.FC<SentenceListProps> = ({ onSentenceSelect }) => {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadSentences();
  }, [pagination.page, searchTerm]);

  /**
   * 加载句子列表
   */
  const loadSentences = async () => {
    try {
      setLoading(true);
      const params: SentenceListParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchTerm
      };
      
      const response: PaginatedResponse<Sentence> = await sentenceService.listSentences(params);
      setSentences(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      }));
    } catch (error) {
      console.error('加载句子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  /**
   * 处理分页
   */
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  /**
   * 处理删除句子
   */
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个句子吗？')) return;

    try {
      await sentenceService.deleteSentence(id);
      // 重新加载列表
      loadSentences();
    } catch (error) {
      console.error('删除句子失败:', error);
      alert('删除失败，请重试');
    }
  };

  /**
   * 渲染分词预览
   */
  const renderTokensPreview = (tokens: Sentence['tokens']) => {
    if (!tokens || tokens.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {tokens.slice(0, 10).map((token, index) => (
          <span
            key={index}
            className={`
              px-2 py-1 rounded text-xs
              ${
                token.type === 'word'
                  ? token.word_id
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }
            `}
          >
            {token.text}
          </span>
        ))}
        {tokens.length > 10 && (
          <span className="px-2 py-1 text-xs text-gray-500">...</span>
        )}
      </div>
    );
  };

  if (loading && sentences.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="sentence-list">
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索句子..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {sentences.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {searchTerm ? '未找到匹配的句子' : '暂无句子'}
        </div>
      ) : (
        <div className="space-y-4">
          {sentences.map((sentence) => (
            <div
              key={sentence.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-gray-900 mb-2">{sentence.text}</p>
                  <p className="text-sm text-gray-500">
                    创建时间: {new Date(sentence.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onSentenceSelect?.(sentence)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    查看
                  </button>
                  <button
                    onClick={() => handleDelete(sentence.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    删除
                  </button>
                </div>
              </div>
              
              {renderTokensPreview(sentence.tokens)}
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          
          <span className="px-3 py-1 text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};