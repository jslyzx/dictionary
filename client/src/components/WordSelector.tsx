import React, { useState, useEffect } from 'react';
import { fetchWords } from '../services/words';
import type { Word } from '../types/word';

interface WordSelectorProps {
  onWordSelect: (wordId: number) => void;
  onCancel: () => void;
  allowUnlink?: boolean;
  onUnlink?: () => void;
}

/**
 * 单词选择器组件
 * 用于为分词选择关联的单词
 */
export const WordSelector: React.FC<WordSelectorProps> = ({
  onWordSelect,
  onCancel,
  allowUnlink = false,
  onUnlink
}) => {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  useEffect(() => {
    loadWords();
  }, []);

  /**
   * 加载单词列表
   */
  const loadWords = async () => {
    try {
      setLoading(true);
      const result = await fetchWords({ page: 1, limit: 100 });
      setWords(result.items);
    } catch (error) {
      console.error('加载单词失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 搜索单词
   */
  const handleSearch = (term: string) => {
    setSearchTerm(term.toLowerCase());
  };

  /**
   * 过滤单词
   */
  const filteredWords = words.filter(word => {
    if (!searchTerm) return true;
    return (
      word.word.toLowerCase().includes(searchTerm) ||
      (word.meaning && word.meaning.toLowerCase().includes(searchTerm))
    );
  });

  /**
   * 确认选择
   */
  const handleConfirm = () => {
    if (selectedWordId !== null) {
      onWordSelect(selectedWordId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="word-selector">
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索单词..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
        {filteredWords.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? '未找到匹配的单词' : '暂无单词'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                onClick={() => setSelectedWordId(word.id)}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedWordId === word.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{word.word}</div>
                    {word.phonetic && (
                      <div className="text-sm text-gray-500">{word.phonetic}</div>
                    )}
                    {word.meaning && (
                      <div className="text-sm text-gray-600 mt-1">{word.meaning}</div>
                    )}
                  </div>
                  {selectedWordId === word.id && (
                    <div className="text-blue-600">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={selectedWordId === null}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          确认选择
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          取消
        </button>
        {allowUnlink && onUnlink && (
          <button
            onClick={onUnlink}
            className="px-4 py-2 bg-orange-300 text-orange-700 rounded-md hover:bg-orange-400"
          >
            取消关联
          </button>
        )}
      </div>
    </div>
  );
};