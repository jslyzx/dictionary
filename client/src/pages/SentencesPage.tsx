import React, { useState } from 'react';
import { SentenceTokenizer } from '../components/SentenceTokenizer';
import { SentenceList } from '../components/SentenceList';
import { SentenceDetail } from '../components/SentenceDetail';
import type { Sentence } from '../types/sentence';

/**
 * 句子管理页面
 * 包含句子创建、列表查看、详情编辑功能
 */
export const SentencesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  /**
   * 处理句子创建成功
   */
  const handleSentenceCreated = (sentence: Sentence) => {
    // 创建成功后返回列表，并显示详情
    setActiveTab('list');
    setSelectedSentence(sentence);
    setShowDetail(true);
  };

  /**
   * 处理查看句子详情
   */
  const handleSentenceSelect = (sentence: Sentence) => {
    setSelectedSentence(sentence);
    setShowDetail(true);
  };

  /**
   * 处理关闭详情
   */
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedSentence(null);
  };

  return (
    <div className="sentences-page max-w-6xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">句子管理</h1>
          <p className="text-gray-600">
            管理和学习英语句子，支持自动分词和单词关联
          </p>
        </div>
        <div>
          {activeTab === 'list' ? (
            <button
              onClick={() => setActiveTab('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              创建句子
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('list')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回列表
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：创建或列表 */}
        <div className="space-y-6">
          {activeTab === 'create' ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">创建新句子</h2>
              <SentenceTokenizer onSentenceCreated={handleSentenceCreated} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">句子列表</h2>
              <SentenceList onSentenceSelect={handleSentenceSelect} />
            </div>
          )}
        </div>

        {/* 右侧：详情或说明 */}
        <div className="space-y-6">
          {showDetail && selectedSentence ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">句子详情</h2>
                <button
                  onClick={handleCloseDetail}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <SentenceDetail
                sentenceId={selectedSentence.id}
                onClose={handleCloseDetail}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">使用说明</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <div>
                    <p className="font-medium text-gray-900">输入完整句子</p>
                    <p>点击"创建句子"按钮，输入完整的英文句子，系统会自动进行分词</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <div>
                    <p className="font-medium text-gray-900">关联单词</p>
                    <p>点击蓝色分词可以关联到已有的单词，绿色表示已关联</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <div>
                    <p className="font-medium text-gray-900">查看和管理</p>
                    <p>在列表页面可以查看所有句子，点击可查看详情和编辑关联</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</div>
                  <div>
                    <p className="font-medium text-gray-900">双向查询</p>
                    <p>可以通过单词查询包含该单词的所有句子</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">示例句子</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Hello, world! How are you today?</p>
                  <p>• I love learning English vocabulary.</p>
                  <p>• The quick brown fox jumps over the lazy dog.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};