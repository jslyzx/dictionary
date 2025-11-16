import React, { useState, useCallback } from 'react';
import { sentenceService } from '../services/sentenceService';
import type { SentenceToken, TokenizeResponse } from '../types/sentence';
import { WordSelector } from './WordSelector';

interface SentenceTokenizerProps {
  onSentenceCreated?: (sentence: any) => void;
}

/**
 * 句子分词组件
 * 支持输入完整英文句子，自动分词并关联单词
 */
export const SentenceTokenizer: React.FC<SentenceTokenizerProps> = ({ onSentenceCreated }) => {
  const [text, setText] = useState('');
  const [tokens, setTokens] = useState<SentenceToken[]>([]);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [showWordSelector, setShowWordSelector] = useState(false);

  /**
   * 处理文本输入变化，自动进行分词
   */
  const handleTextChange = useCallback(async (newText: string) => {
    setText(newText);
    
    if (newText.trim()) {
      setIsTokenizing(true);
      try {
        const response: TokenizeResponse = await sentenceService.tokenize({ text: newText });
        setTokens(response.tokens);
      } catch (error) {
        console.error('分词失败:', error);
      } finally {
        setIsTokenizing(false);
      }
    } else {
      setTokens([]);
    }
  }, []);

  /**
   * 处理创建句子
   */
  const handleCreateSentence = async () => {
    if (!text.trim() || tokens.length === 0) return;

    setIsCreating(true);
    try {
      const sentence = await sentenceService.createSentence({ text, tokens });
      onSentenceCreated?.(sentence);
      // 清空表单
      setText('');
      setTokens([]);
    } catch (error) {
      console.error('创建句子失败:', error);
      alert('创建句子失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * 处理分词点击，打开单词选择器
   */
  const handleTokenClick = (position: number, token: SentenceToken) => {
    if (token.type !== 'word') return; // 只有单词类型的分词才能关联
    
    setSelectedToken(position);
    setShowWordSelector(true);
  };

  /**
   * 处理单词选择
   */
  const handleWordSelect = async (wordId: number) => {
    if (selectedToken === null) return;

    try {
      // 更新本地状态
      const newTokens = [...tokens];
      newTokens[selectedToken] = {
        ...newTokens[selectedToken],
        word_id: wordId
      };
      setTokens(newTokens);
      
      setShowWordSelector(false);
      setSelectedToken(null);
    } catch (error) {
      console.error('关联单词失败:', error);
    }
  };

  /**
   * 处理取消关联
   */
  const handleUnlinkWord = () => {
    if (selectedToken === null) return;

    const newTokens = [...tokens];
    newTokens[selectedToken] = {
      ...newTokens[selectedToken],
      word_id: null
    };
    setTokens(newTokens);
    setShowWordSelector(false);
    setSelectedToken(null);
  };

  return (
    <div className="sentence-tokenizer">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          输入英文句子：
        </label>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="请输入完整的英文句子，例如：Hello, world! How are you?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isTokenizing}
        />
        {isTokenizing && (
          <div className="mt-2 text-sm text-blue-600">正在分词...</div>
        )}
      </div>

      {tokens.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分词结果（点击单词可关联）：
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
            {tokens.map((token, index) => (
              <span
                key={index}
                onClick={() => handleTokenClick(index, token)}
                className={`
                  px-2 py-1 rounded text-sm cursor-pointer transition-all
                  ${
                    token.type === 'word'
                      ? token.word_id
                        ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }
                `}
                title={
                  token.type === 'word'
                    ? token.word_id
                      ? '已关联单词，点击可重新选择'
                      : '点击关联单词'
                    : '标点符号'
                }
              >
                {token.text}
                {token.type === 'word' && token.word_id && (
                  <span className="ml-1 text-xs">✓</span>
                )}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            💡 提示：点击蓝色单词可关联到已有单词，绿色表示已关联
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCreateSentence}
          disabled={!text.trim() || tokens.length === 0 || isCreating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCreating ? '创建中...' : '创建句子'}
        </button>
        <button
          onClick={() => {
            setText('');
            setTokens([]);
          }}
          disabled={isCreating}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:cursor-not-allowed"
        >
          清空
        </button>
      </div>

      {/* 单词选择器弹窗 */}
      {showWordSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">选择要关联的单词</h3>
              <button
                onClick={() => setShowWordSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto max-h-80">
              <WordSelector
                onWordSelect={handleWordSelect}
                onCancel={() => setShowWordSelector(false)}
                allowUnlink
                onUnlink={handleUnlinkWord}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};