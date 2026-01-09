import { useState, useEffect } from "react";
import {
  fetchDictionaries,
  fetchDictionaryWordAssociations,
} from "../services/dictionaries";
import { listWords } from "../services/words";
import type { Dictionary } from "../types/dictionary";
import type { Word } from "../types/word";

interface EnhancedWordSelectorProps {
  selectedWordIds: Set<number>;
  onWordSelect: (wordId: number) => void;
  onWordsBulkSelect: (wordIds: number[]) => void;
  onClose: () => void;
  onConfirm: () => void;
}

interface FilterOptions {
  search: string;
  difficulty: number | null;
  masteryStatus: number | null;
  dictionaryId: number | null;
}

interface WordItem {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  difficulty: number;
  isMastered: boolean;
  sentence?: string | null;
}

const EnhancedWordSelector = ({
  selectedWordIds,
  onWordSelect,
  onWordsBulkSelect,
  onClose,
  onConfirm,
}: EnhancedWordSelectorProps) => {
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    difficulty: null,
    masteryStatus: null,
    dictionaryId: null,
  });
  const [viewMode, setViewMode] = useState<"search" | "dictionary">("search");

  const pageSize = 20;

  useEffect(() => {
    fetchDictionariesList();
  }, []);

  useEffect(() => {
    if (viewMode === "search") {
      fetchWords();
    } else {
      fetchDictionaryWords();
    }
  }, [filters, page, viewMode]);

  const fetchDictionariesList = async () => {
    try {
      const data = await fetchDictionaries();
      setDictionaries(data);
    } catch (error) {
      console.error("获取词典列表失败:", error);
    }
  };

  const fetchWords = async () => {
    setLoading(true);
    try {
      const result = await listWords({
        page,
        limit: pageSize,
        search: filters.search || undefined,
        difficulty: filters.difficulty || undefined,
        masteryStatus: filters.masteryStatus || undefined,
      });
      const wordItems: WordItem[] = result.items.map((item) => ({
        id: item.id,
        word: item.word,
        phonetic: item.phonetic,
        meaning: item.meaning,
        difficulty: (item.difficulty as number) ?? 0,
        isMastered: (item.isMastered as boolean) ?? false,
        sentence: item.sentence,
      }));
      setWords(wordItems);
      setTotal(result.total);
    } catch (error) {
      console.error("获取单词失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDictionaryWords = async () => {
    setLoading(true);
    try {
      if (!filters.dictionaryId) {
        setWords([]);
        setTotal(0);
        return;
      }

      const associationsResult = await fetchDictionaryWordAssociations(
        filters.dictionaryId
      );
      console.log("切换词典后加载单词：", {
        dictionaryId: filters.dictionaryId,
        count: associationsResult.items.length,
      });

      let wordItemsAll: WordItem[] = associationsResult.items.map((a: any) => ({
        id: a.word.id,
        word: a.word.word,
        phonetic: a.word.phonetic,
        meaning: a.word.meaning,
        difficulty: (a.word.difficulty as number) ?? 0,
        isMastered: (a.word.isMastered as boolean) ?? false,
        sentence: (a.word as Word).sentence ?? null,
      }));

      if (filters.search) {
        const s = filters.search.toLowerCase();
        wordItemsAll = wordItemsAll.filter(
          (w) =>
            w.word.toLowerCase().includes(s) ||
            (w.meaning ?? "").includes(filters.search)
        );
      }
      if (filters.difficulty !== null && filters.difficulty !== undefined) {
        wordItemsAll = wordItemsAll.filter(
          (w) => w.difficulty === filters.difficulty
        );
      }
      if (
        filters.masteryStatus !== null &&
        filters.masteryStatus !== undefined
      ) {
        const flag = filters.masteryStatus === 1;
        wordItemsAll = wordItemsAll.filter((w) => w.isMastered === flag);
      }

      const start = (page - 1) * pageSize;
      const pagedItems = wordItemsAll.slice(start, start + pageSize);
      setWords(pagedItems);
      setTotal(wordItemsAll.length);
    } catch (error) {
      console.error("获取词典单词失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDictionarySelect = (dictionaryId: number | null) => {
    handleFilterChange("dictionaryId", dictionaryId);
  };

  const handleSelectAll = () => {
    const allWordIds = words.map((word) => word.id);
    onWordsBulkSelect(allWordIds);
  };

  const handleDeselectAll = () => {
    const allWordIds = words.map((word) => word.id);
    const newSelectedIds = new Set(selectedWordIds);
    allWordIds.forEach((id) => newSelectedIds.delete(id));
    onWordsBulkSelect(Array.from(newSelectedIds));
  };

  const handleSelectByDifficulty = (difficulty: number) => {
    const difficultyWords = words.filter(
      (word) => word.difficulty === difficulty
    );
    const wordIds = difficultyWords.map((word) => word.id);
    onWordsBulkSelect(wordIds);
  };

  const handleSelectByMastery = (isMastered: boolean) => {
    const masteryWords = words.filter((word) => word.isMastered === isMastered);
    const wordIds = masteryWords.map((word) => word.id);
    onWordsBulkSelect(wordIds);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">选择单词</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 视图模式切换 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("search")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === "search"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              搜索模式
            </button>
            <button
              onClick={() => setViewMode("dictionary")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === "dictionary"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              词典浏览
            </button>
          </div>

          {/* 筛选器 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="搜索单词..."
              className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.difficulty ?? ""}
              onChange={(e) =>
                handleFilterChange(
                  "difficulty",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有难度</option>
              <option value="1">简单</option>
              <option value="2">中等</option>
              <option value="3">困难</option>
            </select>

            <select
              value={filters.masteryStatus ?? ""}
              onChange={(e) =>
                handleFilterChange(
                  "masteryStatus",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有状态</option>
              <option value="0">未掌握</option>
              <option value="1">已掌握</option>
            </select>

            {viewMode === "dictionary" && (
              <select
                value={filters.dictionaryId ?? ""}
                onChange={(e) =>
                  handleDictionarySelect(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择词典</option>
                {dictionaries.map((dict) => (
                  <option key={dict.id} value={dict.id}>
                    {dict.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 批量操作 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              全选当前页
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
            >
              取消全选
            </button>
            <button
              onClick={() => handleSelectByDifficulty(1)}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
            >
              选择简单
            </button>
            <button
              onClick={() => handleSelectByDifficulty(2)}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
            >
              选择中等
            </button>
            <button
              onClick={() => handleSelectByDifficulty(3)}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              选择困难
            </button>
            <button
              onClick={() => handleSelectByMastery(false)}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
            >
              选择未掌握
            </button>
            <button
              onClick={() => handleSelectByMastery(true)}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
            >
              选择已掌握
            </button>
          </div>

          {/* 单词列表 */}
          <div className="overflow-y-auto max-h-96 mb-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto"></div>
              </div>
            ) : (
              <div className="grid gap-2">
                {words.map((word) => (
                  <div
                    key={word.id}
                    onClick={() => onWordSelect(word.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedWordIds.has(word.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {word.word}
                          </span>
                          <span className="text-sm text-slate-500">
                            {word.phonetic}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              word.difficulty === 1
                                ? "bg-green-100 text-green-700"
                                : word.difficulty === 2
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {word.difficulty === 1
                              ? "简单"
                              : word.difficulty === 2
                              ? "中等"
                              : "困难"}
                          </span>
                          {word.isMastered && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                              已掌握
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600">
                          {word.meaning}
                        </div>
                        {word.sentence && (
                          <div className="text-xs text-slate-500 mt-1">
                            例句: {word.sentence as string}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedWordIds.has(word.id)}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-slate-600">
                第 {page} 页，共 {totalPages} 页，总计 {total} 个单词
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              已选择 {selectedWordIds.size} 个单词
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWordSelector;
