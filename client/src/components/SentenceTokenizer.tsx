import React, { useState, useCallback, useRef, useEffect } from "react";
import { listWords, getById } from "../services/words";
import type { Word } from "../types/word";
import { sentenceService } from "../services/sentenceService";
import type {
  SentenceToken,
  TokenizeResponse,
  Sentence,
} from "../types/sentence";
import { WordSelector } from "./WordSelector";
// modal detail view instead of route navigation

interface SentenceTokenizerProps {
  onSentenceCreated?: (sentence: Sentence) => void;
}

/**
 * 句子分词组件
 * 支持输入完整英文句子，自动分词并关联单词
 */
export const SentenceTokenizer: React.FC<SentenceTokenizerProps> = ({
  onSentenceCreated,
}) => {
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState<SentenceToken[]>([]);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [showWordSelector, setShowWordSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const seqRef = useRef(0);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewTokens, setReviewTokens] = useState<SentenceToken[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [detailWordId, setDetailWordId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailWord, setDetailWord] = useState<Word | null>(null);
  const wordMatchCache = useRef<Map<string, number | null>>(new Map());

  useEffect(() => {
    // 初次渲染自动聚焦
    textareaRef.current?.focus();
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /**
   * 处理文本输入变化，自动进行分词
   */
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!newText.trim()) {
      setTokens([]);
      setIsTokenizing(false);
      return;
    }
    setIsTokenizing(true);
    const currentSeq = ++seqRef.current;
    debounceRef.current = window.setTimeout(async () => {
      try {
        const response: TokenizeResponse = await sentenceService.tokenize({
          text: newText,
        });
        // 仅应用最新一次结果，防止旧响应覆盖
        if (currentSeq === seqRef.current) {
          const autoTokens: SentenceToken[] = response.tokens.map((t) => ({
            ...t,
          }));
          for (let i = 0; i < autoTokens.length; i++) {
            const t = autoTokens[i];
            if (t.type === "word" && !t.word_id) {
              const key = t.text.trim().toLowerCase();
              if (!key) continue;
              if (wordMatchCache.current.has(key)) {
                const cached = wordMatchCache.current.get(key);
                if (cached && cached > 0)
                  autoTokens[i] = { ...t, word_id: cached };
              } else {
                try {
                  const res = await listWords({
                    page: 1,
                    limit: 3,
                    search: t.text.trim(),
                  });
                  const m = res.items.find(
                    (w: Word) => w.word.toLowerCase() === key
                  );
                  if (m) {
                    wordMatchCache.current.set(key, m.id);
                    autoTokens[i] = { ...t, word_id: m.id };
                  } else {
                    wordMatchCache.current.set(key, null);
                  }
                } catch {
                  wordMatchCache.current.set(key, null);
                }
              }
            }
          }
          setTokens(autoTokens);
        }
      } catch (error) {
        if (currentSeq === seqRef.current) {
          console.error("分词失败:", error);
        }
      } finally {
        if (currentSeq === seqRef.current) {
          setIsTokenizing(false);
        }
      }
    }, 250);
  }, []);

  /**
   * 处理创建句子
   */
  const handleCreateSentence = async () => {
    if (!text.trim() || tokens.length === 0) return;
    setReviewLoading(true);
    const next: SentenceToken[] = tokens.map((t) => ({ ...t }));
    for (let i = 0; i < next.length; i++) {
      const t = next[i];
      if (t.type === "word") {
        const s = t.text.trim();
        if (s) {
          try {
            const res = await listWords({ page: 1, limit: 3, search: s });
            const m = res.items.find(
              (w: Word) => w.word.toLowerCase() === s.toLowerCase()
            );
            if (m) next[i] = { ...t, word_id: m.id };
          } catch (err) {
            void err;
          }
        }
      }
    }
    setReviewTokens(next);
    setReviewLoading(false);
    setReviewVisible(true);
  };

  const handleConfirmSave = async () => {
    if (!text.trim() || reviewTokens.length === 0) return;
    setIsCreating(true);
    try {
      const sentence = await sentenceService.createSentence({
        text,
        tokens: reviewTokens,
      });
      setReviewVisible(false);
      onSentenceCreated?.(sentence);
      setText("");
      setTokens([]);
      setReviewTokens([]);
      setShowWordSelector(false);
      setSelectedToken(null);
      setTimeout(() => textareaRef.current?.focus(), 0);
    } catch {
      alert("创建句子失败");
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * 处理分词点击，打开单词选择器
   */
  const handleTokenClick = async (position: number, token: SentenceToken) => {
    if (token.type !== "word") return;
    if (token.word_id) {
      setDetailWordId(token.word_id);
      setDetailLoading(true);
      try {
        const w = await getById(token.word_id);
        setDetailWord(w);
      } catch {
        setDetailWord(null);
      } finally {
        setDetailLoading(false);
      }
      return;
    }
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
        word_id: wordId,
      };
      setTokens(newTokens);

      setShowWordSelector(false);
      setSelectedToken(null);
    } catch (error) {
      console.error("关联单词失败:", error);
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
      word_id: null,
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
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleCreateSentence();
            }
          }}
          placeholder="请输入完整的英文句子，例如：Hello, world! How are you?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          ref={textareaRef}
          autoFocus
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
                    token.type === "word"
                      ? token.word_id
                        ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                        : "bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-600 border border-gray-300"
                  }
                `}
                title={
                  token.type === "word"
                    ? token.word_id
                      ? "已关联单词，点击可重新选择"
                      : "点击关联单词"
                    : "标点符号"
                }
              >
                {token.text}
                {token.type === "word" && token.word_id && (
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
          {isCreating ? "创建中..." : "创建句子"}
        </button>
        <button
          onClick={() => {
            setText("");
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
                onWordSelect={(wordId) => {
                  if (reviewVisible && selectedToken !== null) {
                    const arr = [...reviewTokens];
                    arr[selectedToken] = {
                      ...arr[selectedToken],
                      word_id: wordId,
                    };
                    setReviewTokens(arr);
                    setShowWordSelector(false);
                    setSelectedToken(null);
                  } else {
                    handleWordSelect(wordId);
                  }
                }}
                onCancel={() => setShowWordSelector(false)}
                allowUnlink
                onUnlink={() => {
                  if (reviewVisible && selectedToken !== null) {
                    const arr = [...reviewTokens];
                    arr[selectedToken] = {
                      ...arr[selectedToken],
                      word_id: null,
                    };
                    setReviewTokens(arr);
                    setShowWordSelector(false);
                    setSelectedToken(null);
                  } else {
                    handleUnlinkWord();
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {reviewVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">确认自动关联结果</h3>
              <button
                onClick={() => setReviewVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {reviewLoading ? (
              <div className="text-center py-6">正在自动关联...</div>
            ) : (
              <div className="space-y-2">
                {reviewTokens.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border rounded px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{t.text}</span>
                      {t.type === "word" && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            t.word_id
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {t.word_id ? "已关联" : "未关联"}
                        </span>
                      )}
                    </div>
                    {t.type === "word" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedToken(idx);
                            setShowWordSelector(true);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          选择单词
                        </button>
                        {t.word_id !== null && (
                          <button
                            onClick={() => {
                              const arr = [...reviewTokens];
                              arr[idx] = { ...arr[idx], word_id: null };
                              setReviewTokens(arr);
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            取消关联
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setReviewVisible(false)}
                className="px-4 py-2 rounded border"
              >
                返回
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isCreating}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {isCreating ? "保存中..." : "确认并保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailWordId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">单词详情</h3>
              <button
                onClick={() => {
                  setDetailWordId(null);
                  setDetailWord(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {detailLoading ? (
              <div className="py-6 text-center">加载中...</div>
            ) : detailWord ? (
              <div className="space-y-3">
                <div className="text-2xl font-bold text-gray-800">
                  {detailWord.word}
                </div>
                <div className="text-gray-600">{detailWord.phonetic}</div>
                <div className="text-gray-700">{detailWord.meaning}</div>
                {detailWord.notes && (
                  <div className="text-gray-700">笔记：{detailWord.notes}</div>
                )}
                {detailWord.sentence && (
                  <div className="text-gray-700">
                    例句：{detailWord.sentence}
                  </div>
                )}
                {detailWord.hasImage && detailWord.imageValue && (
                  <div className="mt-2">
                    {detailWord.imageType === "emoji" ? (
                      <span style={{ fontSize: "3rem" }}>
                        {detailWord.imageValue}
                      </span>
                    ) : detailWord.imageType === "url" ? (
                      <img
                        src={detailWord.imageValue || ""}
                        alt={detailWord.word}
                        className="max-w-sm rounded"
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-gray-500">
                未找到单词详情
              </div>
            )}
            <div className="mt-4 text-right">
              <button
                onClick={() => {
                  setDetailWordId(null);
                  setDetailWord(null);
                }}
                className="px-4 py-2 rounded border"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
