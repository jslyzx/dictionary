import React, { useState, useEffect } from 'react';
import { listWords } from '../services/words';
import { sentenceService } from '../services/sentenceService';
import type { Sentence, SentenceToken } from '../types/sentence';
import { WordSelector } from './WordSelector';

interface SentenceDetailProps {
  sentenceId: number;
  onClose?: () => void;
}

/**
 * 句子详情组件
 * 显示句子分词详情，支持编辑关联
 */
export const SentenceDetail: React.FC<SentenceDetailProps> = ({ sentenceId, onClose }) => {
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [showWordSelector, setShowWordSelector] = useState(false);
  const [updatingToken, setUpdatingToken] = useState<number | null>(null);

  useEffect(() => {
    loadSentence();
  }, [sentenceId]);

  /**
   * 加载句子详情
   */
  const loadSentence = async () => {
    try {
      setLoading(true);
      const data = await sentenceService.getSentence(sentenceId);
      setSentence(data);
    } catch (error) {
      console.error('加载句子详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理分词点击
   */
  const handleTokenClick = async (position: number, token: SentenceToken) => {
    if (token.type !== 'word') return;
    if (!sentence) return;

    // 自动尝试精确关联（不区分大小写）
    const candidateText = token.text.trim();
    if (candidateText) {
      try {
        const result = await listWords({ page: 1, limit: 1, search: candidateText });
        const exact = result.items.find(w => w.word.toLowerCase() === candidateText.toLowerCase());
        if (exact) {
          setUpdatingToken(position);
          const updatedToken = await sentenceService.updateTokenWord(
            sentenceId,
            position,
            { word_id: exact.id }
          );
          const newTokens = [...sentence.tokens];
          newTokens[position] = {
            ...newTokens[position],
            word_id: updatedToken.word_id,
            word: updatedToken.word_id ? {
              word_id: updatedToken.word_id,
              word: updatedToken.word || '',
              meaning: updatedToken.meaning || '',
              phonetic: updatedToken.phonetic
            } : null
          };
          setSentence({ ...sentence, tokens: newTokens });
          setUpdatingToken(null);
          return; // 自动关联成功，不弹选择器
        }
      } catch (e) {
        // 自动关联失败时进入手动选择
      }
    }
    setSelectedToken(position);
    setShowWordSelector(true);
  };

  /**
   * 处理单词选择
   */
  const handleWordSelect = async (wordId: number) => {
    if (selectedToken === null || !sentence) return;

    setUpdatingToken(selectedToken);
    try {
      const updatedToken = await sentenceService.updateTokenWord(
        sentenceId,
        selectedToken,
        { word_id: wordId }
      );

      // 更新本地状态
      const newTokens = [...sentence.tokens];
      newTokens[selectedToken] = {
        ...newTokens[selectedToken],
        word_id: updatedToken.word_id,
        word: updatedToken.word_id ? {
          word_id: updatedToken.word_id,
          word: updatedToken.word || '',
          meaning: updatedToken.meaning || '',
          phonetic: updatedToken.phonetic
        } : null
      };

      setSentence({
        ...sentence,
        tokens: newTokens
      });

      setShowWordSelector(false);
      setSelectedToken(null);
    } catch (error) {
      console.error('更新分词关联失败:', error);
      alert('更新失败，请重试');
    } finally {
      setUpdatingToken(null);
    }
  };

  /**
   * 处理取消关联
   */
  const handleUnlinkWord = async () => {
    if (selectedToken === null || !sentence) return;

    setUpdatingToken(selectedToken);
    try {
      const updatedToken = await sentenceService.updateTokenWord(
        sentenceId,
        selectedToken,
        { word_id: null }
      );

      // 更新本地状态
      const newTokens = [...sentence.tokens];
      newTokens[selectedToken] = {
        ...newTokens[selectedToken],
        word_id: null,
        word: null
      };

      setSentence({
        ...sentence,
        tokens: newTokens
      });

      setShowWordSelector(false);
      setSelectedToken(null);
    } catch (error) {
      console.error('取消分词关联失败:', error);
      alert('操作失败，请重试');
    } finally {
      setUpdatingToken(null);
    }
  };

  /**
   * 渲染分词
   */
  const renderTokens = () => {
    if (!sentence || !sentence.tokens) return null;

    return (
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-md">
        {sentence.tokens.map((token, index) => (
          <span
            key={index}
            onClick={() => handleTokenClick(index, token)}
            className={`
              px-3 py-2 rounded cursor-pointer transition-all text-sm
              ${updatingToken === index ? 'opacity-50' : ''}
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
                  ? `已关联单词: ${token.word?.word || ''}`
                  : '点击关联单词'
                : '标点符号'
            }
          >
            <span className="font-medium">{token.text}</span>
            {token.type === 'word' && token.word && (
              <div className="text-xs mt-1 text-gray-600">
                <div>{token.word.word}</div>
                {token.word.phonetic && (
                  <div className="text-gray-500">{token.word.phonetic}</div>
                )}
                {token.word.meaning && (
                  <div className="text-gray-700 mt-1">{token.word.meaning}</div>
                )}
              </div>
            )}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!sentence) {
    return (
      <div className="text-center text-gray-500 py-8">
        句子不存在或加载失败
      </div>
    );
  }

  return (
    <div className="sentence-detail">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{sentence.text}</h2>
          <p className="text-sm text-gray-500">
            创建时间: {new Date(sentence.created_at).toLocaleString()}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            关闭
          </button>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">分词详情</h3>
        {renderTokens()}
        <div className="mt-3 text-sm text-gray-600">
          <p>💡 提示：点击蓝色单词可关联到已有单词，绿色表示已关联</p>
          <p>共 {sentence.tokens.length} 个分词，其中 {sentence.tokens.filter(t => t.type === 'word').length} 个单词</p>
        </div>
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
                allowUnlink={selectedToken !== null && sentence.tokens[selectedToken]?.word_id !== null}
                onUnlink={handleUnlinkWord}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};