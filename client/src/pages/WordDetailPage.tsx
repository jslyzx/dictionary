import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getById, deleteWord } from "../services/words";
import type { Word } from "../types/word";

interface WordDetail extends Word {
  pronunciation_rules?: Array<{
    id: number;
    letterCombination: string;
    pronunciation: string;
    ruleDescription?: string | null;
  }>;
  dictionaries?: Array<{
    id: number;
    name: string;
    isMastered: boolean;
  }>;
  hasImage: boolean;
  imageType: "url" | "iconfont" | "emoji" | null;
  imageValue: string | null;
}

const WordDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [word, setWord] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadWord = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const wordData = await getById(Number(id));
      setWord(wordData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载单词详情失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!word || !id) return;

    if (!confirm(`确定要删除单词 "${word.word}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteWord(Number(id));
      navigate("/words");
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    loadWord();
  }, [id, loadWord]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("zh-CN");
  };

  const getDifficultyDisplay = (difficulty: number | null) => {
    switch (difficulty) {
      case 0:
        return { label: "简单", className: "bg-emerald-50 text-emerald-700" };
      case 1:
        return { label: "中等", className: "bg-amber-50 text-amber-700" };
      case 2:
        return { label: "困难", className: "bg-rose-50 text-rose-700" };
      default:
        return { label: "未设置", className: "bg-slate-100 text-slate-600" };
    }
  };

  const getMasteryDisplay = (isMastered: boolean | null) => {
    return isMastered
      ? { label: "已掌握", className: "bg-primary-50 text-primary-700" }
      : { label: "学习中", className: "bg-slate-200 text-slate-600" };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !word) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error || "单词不存在"}</p>
          </div>
        </div>
      </div>
    );
  }

  const difficultyDisplay = getDifficultyDisplay(word.difficulty);
  const masteryDisplay = getMasteryDisplay(word.isMastered);

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <Link
          to="/words"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回单词列表
        </Link>

        <div className="flex items-center space-x-3">
          <Link
            to={`/words/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            编辑
          </Link>

          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                删除中...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                删除
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 主内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 单词基本信息 */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <div className="flex items-start gap-6 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {word.word}
                  </h1>
                  {word.phonetic && (
                    <p className="text-lg text-gray-600 mb-4">
                      [{word.phonetic}]
                    </p>
                  )}
                </div>

                {/* Image Display */}
                {word.hasImage && word.imageType && word.imageValue && (
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-20 h-20 bg-gray-50 rounded-lg border border-gray-200">
                      {word.imageType === "url" ? (
                        <img
                          src={word.imageValue}
                          alt={word.word}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : word.imageType === "iconfont" ? (
                        <i
                          className={`iconfont ${word.imageValue} text-4xl cursor-pointer text-gray-600 hover:text-6xl transition-all`}
                        ></i>
                      ) : word.imageType === "emoji" ? (
                        <span className="text-4xl">{word.imageValue}</span>
                      ) : null}
                      {word.imageType === "url" && (
                        <div className="hidden text-center text-sm text-gray-400">
                          加载失败
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 mb-4">
                {word.pronunciation1 && (
                  <button
                    onClick={() => {
                      const audio = new Audio(word.pronunciation1!);
                      audio.play().catch(console.error);
                    }}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                    播放发音
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">释义</h3>
                <p className="text-gray-900">{word.meaning}</p>
              </div>

              {word.sentence && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    例句
                  </h3>
                  <p className="text-gray-900 italic">{word.sentence}</p>
                </div>
              )}

              {word.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    笔记
                  </h3>
                  <p className="text-gray-900">{word.notes}</p>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    难度
                  </h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${difficultyDisplay.className}`}
                  >
                    {difficultyDisplay.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    掌握状态
                  </h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${masteryDisplay.className}`}
                  >
                    {masteryDisplay.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 发音规则 */}
          {word.pronunciation_rules && word.pronunciation_rules.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                关联的发音规则
              </h2>
              <div className="space-y-3">
                {word.pronunciation_rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {rule.letterCombination}
                      </h3>
                      <span className="text-sm text-gray-600">
                        {rule.pronunciation}
                      </span>
                    </div>
                    {rule.ruleDescription && (
                      <p className="text-sm text-gray-600">
                        {rule.ruleDescription}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧边栏 */}
        <div className="space-y-6">
          {/* 学习信息 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">学习信息</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">创建时间</p>
                <p className="text-sm text-gray-900">
                  {formatDate(word.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">难度等级</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${difficultyDisplay.className}`}
                >
                  {difficultyDisplay.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">掌握状态</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${masteryDisplay.className}`}
                >
                  {masteryDisplay.label}
                </span>
              </div>
            </div>
          </div>

          {/* 所属词典 */}
          {word.dictionaries && word.dictionaries.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                所属词典
              </h2>
              <div className="space-y-2">
                {word.dictionaries.map((dict) => (
                  <Link
                    key={dict.id}
                    to={`/dictionaries/${dict.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {dict.name}
                      </span>
                      {dict.isMastered && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700">
                          已掌握
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 其他发音 */}
          {(word.pronunciation2 || word.pronunciation3) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                其他发音
              </h2>
              <div className="space-y-2">
                {word.pronunciation2 && (
                  <button
                    onClick={() => {
                      const audio = new Audio(word.pronunciation2!);
                      audio.play().catch(console.error);
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                    美式发音
                  </button>
                )}
                {word.pronunciation3 && (
                  <button
                    onClick={() => {
                      const audio = new Audio(word.pronunciation3!);
                      audio.play().catch(console.error);
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                    例句发音
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordDetailPage;
