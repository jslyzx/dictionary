import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ApiError } from "../services/apiClient";
import { deleteWord, listWords, type ListWordsParams } from "../services/words";
import {
  fetchDictionaries,
  batchAddWordsToDictionary,
} from "../services/dictionaries";
import type { Dictionary } from "../types/dictionary";
import { type Word, difficultyMetadata } from "../types/word";
import Modal from "../components/common/Modal";
import { WordFormModal } from "../components/words/WordFormModal";
const SpeakerWaveIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
    />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-1.343 3-3s-1.343-3-3-3m0 6c-1.657 0-3-1.343-3-3s1.343-3 3-3m-9 0a9 9 0 019-9"
    />
  </svg>
);

type DifficultyFilterValue = "all" | "0" | "1" | "2";
type MasteryFilterValue = "all" | "mastered" | "unmastered";

type FlashMessage = {
  type: "success" | "error";
  message: string;
};

interface FiltersState {
  search: string;
  difficulty: DifficultyFilterValue;
  mastery: MasteryFilterValue;
}

type PronunciationAudioStatus = "idle" | "loading" | "playing" | "error";

interface PronunciationAudioState {
  wordId: number | null;
  status: PronunciationAudioStatus;
  errorMessage: string | null;
}

const defaultFilters: FiltersState = {
  search: "",
  difficulty: "all",
  mastery: "all",
};

const limitOptions = [10, 20, 50];

const masteryOptions: Array<{ value: MasteryFilterValue; label: string }> = [
  { value: "all", label: "全部" },
  { value: "mastered", label: "已掌握" },
  { value: "unmastered", label: "学习中" },
];

const difficultyFilterOptions: Array<{
  value: DifficultyFilterValue;
  label: string;
}> = [
  { value: "all", label: "全部难度" },
  { value: "0", label: difficultyMetadata[0].label },
  { value: "1", label: difficultyMetadata[1].label },
  { value: "2", label: difficultyMetadata[2].label },
];

const getDifficultyMeta = (difficulty: number | null | undefined) => {
  if (difficulty === 0 || difficulty === 1 || difficulty === 2) {
    return difficultyMetadata[difficulty as 0 | 1 | 2];
  }
  return { label: "未知", className: "bg-slate-100 text-slate-600" };
};

const WordsPage = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(limitOptions[0]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);

  const [flash, setFlash] = useState<FlashMessage | null>(null);

  const [formState, setFormState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    word: Word | null;
  }>({ open: false, mode: "create", word: null });

  const [wordPendingDeletion, setWordPendingDeletion] = useState<Word | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioListenersRef = useRef<
    Array<{ type: keyof HTMLMediaElementEventMap; handler: EventListener }>
  >([]);
  const [audioState, setAudioState] = useState<PronunciationAudioState>({
    wordId: null,
    status: "idle",
    errorMessage: null,
  });

  // Bulk selection state
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);

  // Dictionary selection modal state
  const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false);
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [selectedDictionary, setSelectedDictionary] = useState<number | null>(
    null
  );
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkAddError, setBulkAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) {
      return;
    }

    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const params: ListWordsParams = {
        page,
        limit,
      };

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.difficulty !== "all") {
        params.difficulty = Number(filters.difficulty);
      }

      if (filters.mastery !== "all") {
        params.masteryStatus = filters.mastery === "mastered" ? 1 : 0;
      }

      const response = await listWords(params);
      setWords(response.items);
      setTotal(response.total);
      setHasFetched(true);

      if (response.total === 0) {
        if (page !== 1) {
          setPage(1);
        }
        return;
      }

      const totalPages = Math.max(1, Math.ceil(response.total / limit));
      if (page > totalPages) {
        setPage(totalPages);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setFetchError(apiError.message ?? "无法加载单词列表。");
      setWords([]);
      setTotal(0);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  }, [filters.difficulty, filters.mastery, filters.search, limit, page]);

  const fetchDictionariesData = useCallback(async () => {
    try {
      const dictionariesData = await fetchDictionaries();
      setDictionaries(dictionariesData);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setBulkAddError(apiError.message ?? "无法加载词典列表。");
    }
  }, []);

  useEffect(() => {
    fetchWords();
    fetchDictionariesData();
  }, [fetchWords, fetchDictionariesData]);

  // Fetch dictionaries when modal opens
  useEffect(() => {
    if (dictionaryModalOpen) {
      fetchDictionariesData();
    }
  }, [dictionaryModalOpen, fetchDictionariesData]);

  // Handle select all functionality
  useEffect(() => {
    if (selectAll) {
      const allWordIds = new Set(words.map((word: Word) => word.id));
      setSelectedWordIds(allWordIds);
    } else {
      setSelectedWordIds(new Set());
    }
  }, [selectAll, words]);

  // Update selectAll state when individual selections change
  useEffect(() => {
    if (words.length > 0) {
      setSelectAll(selectedWordIds.size === words.length && words.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [selectedWordIds, words]);

  const totalPages = useMemo(
    () => (total === 0 ? 1 : Math.ceil(total / limit)),
    [limit, total]
  );

  const hasVisibleWords = words.length > 0;
  const showingFrom = hasVisibleWords ? (page - 1) * limit + 1 : 0;
  const showingTo = hasVisibleWords
    ? Math.min(total, showingFrom + words.length - 1)
    : 0;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    setFilters((prev) => ({ ...prev, search: trimmed }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setSearchInput("");
    setPage(1);
  };

  const handleDifficultyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as DifficultyFilterValue;
    setFilters((prev) => ({ ...prev, difficulty: value }));
    setPage(1);
  };

  const handleMasteryChange = (value: MasteryFilterValue) => {
    setFilters((prev) => ({ ...prev, mastery: value }));
    setPage(1);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLimit = Number(event.target.value);
    setLimit(nextLimit);
    setPage(1);
  };

  const openCreateForm = () => {
    setFormState({ open: true, mode: "create", word: null });
  };

  const openEditForm = (word: Word) => {
    if (!word || !word.id || typeof word.id !== "number" || word.id <= 0) {
      setFlash({ type: "error", message: "无法编辑单词：缺少有效的单词ID" });
      return;
    }

    setFormState({ open: true, mode: "edit", word });
  };

  const closeForm = () => {
    setFormState({ open: false, mode: "create", word: null });
  };

  const handleFormSuccess = async (_word: Word, mode: "create" | "edit") => {
    setFlash({
      type: "success",
      message: mode === "create" ? "单词创建成功。" : "单词更新成功。",
    });

    if (mode === "create") {
      if (page === 1) {
        await fetchWords();
      } else {
        setPage(1);
      }
    } else {
      await fetchWords();
    }
  };

  const confirmDeletion = (word: Word) => {
    setWordPendingDeletion(word);
  };

  const handleDeleteWord = async () => {
    if (!wordPendingDeletion) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteWord(wordPendingDeletion.id);
      setFlash({ type: "success", message: "单词删除成功。" });
      setWordPendingDeletion(null);
      await fetchWords();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setFlash({
        type: "error",
        message: apiError.message ?? "删除单词失败。",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWordSelection = (wordId: number, checked: boolean) => {
    setSelectedWordIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(wordId);
      } else {
        newSet.delete(wordId);
      }
      return newSet;
    });
  };

  const openDictionaryModal = () => {
    if (selectedWordIds.size === 0) {
      setFlash({ type: "error", message: "请先选择要添加的单词。" });
      return;
    }
    setDictionaryModalOpen(true);
    setSelectedDictionary(null);
    setBulkAddError(null);
  };

  const closeDictionaryModal = () => {
    setDictionaryModalOpen(false);
    setSelectedDictionary(null);
    setBulkAddError(null);
  };

  const handleBulkAddToDictionary = async () => {
    if (!selectedDictionary || selectedWordIds.size === 0) {
      return;
    }

    setBulkAdding(true);
    setBulkAddError(null);

    try {
      const result = await batchAddWordsToDictionary(selectedDictionary, {
        wordIds: Array.from(selectedWordIds),
      });

      let message = `成功添加 ${result.created} 个单词到词典`;
      if (result.skipped > 0) {
        message += `，跳过 ${result.skipped} 个已存在的单词`;
      }
      if (result.duplicates > 0) {
        message += `，忽略 ${result.duplicates} 个重复的单词`;
      }

      setFlash({ type: "success", message });
      closeDictionaryModal();
      setSelectedWordIds(new Set());
      setSelectAll(false);

      // Refresh words list to update any potential changes
      await fetchWords();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setBulkAddError(apiError.message ?? "批量添加单词失败。");
    } finally {
      setBulkAdding(false);
    }
  };

  const appliedPronunciation = (word: Word) =>
    word.pronunciation1 || word.pronunciation2 || word.pronunciation3 || "";

  const detachAudioListeners = useCallback(
    (audioElement?: HTMLAudioElement | null) => {
      const target = audioElement ?? audioRef.current;
      if (!target) {
        audioListenersRef.current = [];
        return;
      }
      audioListenersRef.current.forEach(({ type, handler }) => {
        target.removeEventListener(type, handler);
      });
      audioListenersRef.current = [];
    },
    []
  );

  const stopCurrentAudio = useCallback(() => {
    const current = audioRef.current;
    if (current) {
      current.pause();
      current.currentTime = 0;
      detachAudioListeners(current);
    } else {
      detachAudioListeners();
    }
    audioRef.current = null;
    setAudioState({ wordId: null, status: "idle", errorMessage: null });
  }, [detachAudioListeners]);

  const handleTogglePronunciation = useCallback(
    (word: Word, url: string) => {
      if (!url) {
        return;
      }

      const normalizedUrl = url.trim();
      if (!/^https?:/i.test(normalizedUrl)) {
        return;
      }

      if (audioRef.current && audioState.wordId === word.id) {
        stopCurrentAudio();
        return;
      }

      stopCurrentAudio();

      const audio = new Audio(normalizedUrl);
      audioRef.current = audio;
      setAudioState({ wordId: word.id, status: "loading", errorMessage: null });

      const handlePlaying: EventListener = () => {
        setAudioState((prev) =>
          prev.wordId === word.id ? { ...prev, status: "playing" } : prev
        );
      };

      const handleEnded: EventListener = () => {
        detachAudioListeners(audio);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setAudioState({ wordId: null, status: "idle", errorMessage: null });
      };

      const handleError: EventListener = () => {
        detachAudioListeners(audio);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setAudioState({
          wordId: word.id,
          status: "error",
          errorMessage: "音频播放失败，请稍后重试。",
        });
      };

      const handleWaiting: EventListener = () => {
        setAudioState((prev) =>
          prev.wordId === word.id ? { ...prev, status: "loading" } : prev
        );
      };

      audioListenersRef.current = [
        { type: "playing", handler: handlePlaying },
        { type: "ended", handler: handleEnded },
        { type: "error", handler: handleError },
        { type: "waiting", handler: handleWaiting },
        { type: "stalled", handler: handleWaiting },
      ];

      audioListenersRef.current.forEach(({ type, handler }) => {
        audio.addEventListener(type, handler);
      });

      void audio.play().catch(() => {
        handleError(new Event("error"));
      });
    },
    [audioState.wordId, detachAudioListeners, stopCurrentAudio]
  );

  useEffect(() => {
    return () => {
      const current = audioRef.current;
      if (current) {
        detachAudioListeners(current);
        current.pause();
      } else {
        detachAudioListeners();
      }
      audioRef.current = null;
    };
  }, [detachAudioListeners]);

  useEffect(() => {
    if (audioState.wordId === null) {
      return;
    }
    const activeWord = words.find(
      (wordItem) => wordItem.id === audioState.wordId
    );
    if (!activeWord) {
      stopCurrentAudio();
      return;
    }
    const currentPronunciation = (
      activeWord.pronunciation1 ||
      activeWord.pronunciation2 ||
      activeWord.pronunciation3 ||
      ""
    ).trim();
    if (!/^https?:/i.test(currentPronunciation)) {
      stopCurrentAudio();
    }
  }, [audioState.wordId, stopCurrentAudio, words]);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.difficulty !== "all" ||
    filters.mastery !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">单词库</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            搜索、创建和管理您的单词列表。使用筛选器专注于特定的难度级别或掌握状态。
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            新建单词
          </button>
          <button
            type="button"
            onClick={() => navigate("/learning")}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            开始背单词
          </button>
        </div>
      </div>

      {flash ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
            flash.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{flash.message}</span>
            <button
              type="button"
              onClick={() => setFlash(null)}
              className="rounded-md p-1 text-slate-500 transition hover:bg-white/60 hover:text-slate-700"
            >
              <span aria-hidden="true">&times;</span>
              <span className="sr-only">关闭消息</span>
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-4 lg:flex-row lg:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-slate-700"
              >
                搜索
              </label>
              <div className="mt-1 flex gap-3">
                <input
                  id="search"
                  name="search"
                  type="search"
                  placeholder="按单词或含义搜索"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
                />
                <button
                  type="submit"
                  className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 lg:block"
                >
                  应用
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:w-48">
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-slate-700"
              >
                难度
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={filters.difficulty}
                onChange={handleDifficultyChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
              >
                {difficultyFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 lg:w-56">
              <span className="text-sm font-medium text-slate-700">
                掌握状态
              </span>
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {masteryOptions.map((option) => {
                  const isActive = filters.mastery === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleMasteryChange(option.value)}
                      className={`flex-1 rounded-full px-3 py-1 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow"
                          : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 lg:justify-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 lg:hidden"
              >
                应用筛选器
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                disabled={!hasActiveFilters}
              >
                重置
              </button>
            </div>
          </form>
        </div>

        <div className="px-6 py-6">
          {fetchError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {fetchError}
            </div>
          ) : null}

          {!fetchError && loading && !hasFetched ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-100/60"
                />
              ))}
            </div>
          ) : null}

          {!loading && hasFetched && words.length === 0 && !fetchError ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                未找到单词
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                调整您的筛选器或添加新单词以开始使用。
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                添加单词
              </button>
            </div>
          ) : null}

          {words.length > 0 ? (
            <div>
              {/* Bulk action toolbar */}
              <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-500/60"
                    />
                    全选
                  </label>
                  {selectedWordIds.size > 0 && (
                    <span className="text-sm text-slate-600">
                      已选择 {selectedWordIds.size} 个单词
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openDictionaryModal}
                  disabled={selectedWordIds.size === 0}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  批量添加到词典
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 w-12"
                      >
                        <span className="sr-only">选择</span>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        单词
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 w-20"
                      >
                        图片
                      </th>
                      <th
                        scope="col"
                        className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 lg:table-cell"
                      >
                        音标
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        发音
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        描述
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        发音规则
                      </th>
                      <th
                        scope="col"
                        className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 lg:table-cell"
                      >
                        笔记
                      </th>
                      <th
                        scope="col"
                        className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 lg:table-cell"
                      >
                        例句
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        难度
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        掌握状态
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                    {words.map((word) => {
                      const difficultyMeta = getDifficultyMeta(word.difficulty);
                      const rawPronunciation = appliedPronunciation(word);
                      const pronunciation = (rawPronunciation ?? "").trim();
                      const pronunciationIsLink = /^https?:/i.test(
                        pronunciation
                      );
                      const hasPronunciation = pronunciation !== "";
                      const isActiveWord = audioState.wordId === word.id;
                      const isLoadingAudio =
                        isActiveWord && audioState.status === "loading";
                      const isPlayingAudio =
                        isActiveWord && audioState.status === "playing";
                      const audioErrorMessage =
                        isActiveWord && audioState.status === "error"
                          ? audioState.errorMessage
                          : null;
                      const audioButtonLabel = (() => {
                        if (!pronunciationIsLink) {
                          return `播放单词“${word.word}”的发音`;
                        }
                        if (isActiveWord) {
                          if (isPlayingAudio) {
                            return `停止播放单词“${word.word}”的发音`;
                          }
                          if (isLoadingAudio) {
                            return `正在加载单词“${word.word}”的发音`;
                          }
                          if (audioErrorMessage) {
                            return `重新播放单词“${word.word}”的发音`;
                          }
                        }
                        return `播放单词“${word.word}”的发音`;
                      })();

                      return (
                        <tr key={word.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedWordIds.has(word.id)}
                              onChange={(e) =>
                                handleWordSelection(word.id, e.target.checked)
                              }
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-500/60"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/words/${word.id}`}
                              className="font-medium text-slate-900 hover:text-blue-600 hover:underline transition-colors"
                            >
                              {word.word}
                            </Link>
                            <div className="mt-0.5 text-xs text-slate-500 lg:hidden">
                              {word.phonetic || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {word.hasImage &&
                            word.imageType &&
                            word.imageValue ? (
                              <div className="flex items-center justify-center">
                                {word.imageType === "url" ? (
                                  <img
                                    src={word.imageValue}
                                    alt={word.word}
                                    className="w-8 h-8 object-cover rounded border border-slate-200"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.nextElementSibling?.classList.remove(
                                        "hidden"
                                      );
                                    }}
                                  />
                                ) : word.imageType === "iconfont" ? (
                                  <i
                                    className={`${word.imageValue} text-lg text-slate-600`}
                                  ></i>
                                ) : word.imageType === "emoji" ? (
                                  <span className="text-lg">
                                    {word.imageValue}
                                  </span>
                                ) : null}
                                {word.imageType === "url" && (
                                  <div className="hidden text-center text-xs text-slate-400">
                                    —
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 align-top text-slate-600 lg:table-cell">
                            {word.phonetic || "—"}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {hasPronunciation ? (
                              pronunciationIsLink ? (
                                <div className="flex flex-col items-start gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleTogglePronunciation(
                                        word,
                                        pronunciation
                                      )
                                    }
                                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-base shadow-sm transition transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                                      isActiveWord
                                        ? isPlayingAudio
                                          ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                                          : audioErrorMessage
                                          ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                          : "border-slate-900 bg-slate-100 text-slate-900 hover:bg-slate-200"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                                    aria-label={audioButtonLabel}
                                    title={audioButtonLabel}
                                    aria-pressed={
                                      isActiveWord && isPlayingAudio
                                    }
                                    aria-busy={isLoadingAudio}
                                  >
                                    {isLoadingAudio ? (
                                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : isPlayingAudio ? (
                                      <StopIcon className="h-4 w-4" />
                                    ) : (
                                      <SpeakerWaveIcon
                                        className={`h-5 w-5 ${
                                          isActiveWord && !audioErrorMessage
                                            ? "animate-pulse"
                                            : ""
                                        }`}
                                      />
                                    )}
                                  </button>
                                  {audioErrorMessage ? (
                                    <p
                                      aria-live="polite"
                                      role="status"
                                      className="text-xs text-rose-500"
                                    >
                                      {audioErrorMessage}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-600">
                                  {pronunciation}
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-slate-600">
                            <p className="text-sm leading-relaxed">
                              {word.meaning}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {word.pronunciationRules &&
                            word.pronunciationRules.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {word.pronunciationRules
                                  .slice(0, 2)
                                  .map(
                                    (rule: {
                                      id: number;
                                      letterCombination: string;
                                      pronunciation: string;
                                    }) => (
                                      <span
                                        key={rule.id}
                                        className="inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                                      >
                                        {rule.letterCombination}
                                      </span>
                                    )
                                  )}
                                {word.pronunciationRules.length > 2 && (
                                  <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                    +{word.pronunciationRules.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 align-top lg:table-cell">
                            {word.notes ? (
                              <p
                                className="max-w-xs truncate text-sm text-slate-600"
                                title={word.notes}
                              >
                                {word.notes}
                              </p>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 align-top lg:table-cell">
                            {word.sentence ? (
                              <p
                                className="max-w-xs truncate text-sm text-slate-600"
                                title={word.sentence}
                              >
                                {word.sentence}
                              </p>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${difficultyMeta.className}`}
                            >
                              {difficultyMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                word.isMastered
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {word.isMastered ? "已掌握" : "学习中"}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            <div className="flex justify-end gap-3 text-xs font-semibold">
                              <Link
                                to={`/words/${word.id}`}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
                              >
                                详情
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEditForm(word)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDeletion(word)}
                                className="rounded-lg bg-rose-50 px-3 py-1.5 text-rose-600 transition hover:bg-rose-100"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            {hasVisibleWords ? (
              <span>
                显示第{" "}
                <span className="font-semibold text-slate-900">
                  {showingFrom}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-slate-900">
                  {showingTo}
                </span>{" "}
                条，共{" "}
                <span className="font-semibold text-slate-900">{total}</span>{" "}
                个单词
              </span>
            ) : hasFetched && !loading ? (
              <span>无单词显示。</span>
            ) : (
              <span>加载中…</span>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span>每页显示</span>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
              >
                {limitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm font-medium text-slate-700">
                第 {total === 0 ? 0 : page} 页，共{" "}
                {total === 0 ? 0 : totalPages} 页
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages || total === 0 || loading}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </section>

      {wordPendingDeletion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">删除单词</h3>
            <p className="mt-3 text-sm text-slate-600">
              确定要删除 “
              <span className="font-semibold text-slate-900">
                {wordPendingDeletion.word}
              </span>
              ”? This 操作无法撤销.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setWordPendingDeletion(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteWord}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-400"
                disabled={isDeleting}
              >
                {isDeleting ? "删除中…" : "删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Dictionary Selection Modal */}
      <Modal
        isOpen={dictionaryModalOpen}
        onClose={closeDictionaryModal}
        title="选择词典"
        description={`将 ${selectedWordIds.size} 个单词添加到选定的词典`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeDictionaryModal}
              disabled={bulkAdding}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleBulkAddToDictionary}
              disabled={bulkAdding || !selectedDictionary}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {bulkAdding ? "添加中..." : "添加到词典"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {bulkAddError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {bulkAddError}
            </div>
          ) : null}

          {dictionaries.length === 0 && !bulkAddError ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600">暂无可用词典</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dictionaries.map((dictionary) => (
                <label
                  key={dictionary.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name="dictionary"
                    value={dictionary.id}
                    checked={selectedDictionary === dictionary.id}
                    onChange={(e) =>
                      setSelectedDictionary(Number(e.target.value))
                    }
                    disabled={bulkAdding}
                    className="mt-1 rounded border-slate-300 text-slate-900 focus:ring-slate-500/60"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      {dictionary.name}
                    </div>
                    {dictionary.description ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {dictionary.description}
                      </p>
                    ) : null}
                    <div className="mt-2 text-xs text-slate-500">
                      创建于{" "}
                      {new Date(dictionary.createdAt).toLocaleDateString()}
                      {dictionary.wordCount !== undefined ? (
                        <span> • {dictionary.wordCount} 个单词</span>
                      ) : null}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <WordFormModal
        isOpen={formState.open}
        mode={formState.mode}
        word={formState.word}
        onClose={closeForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default WordsPage;
