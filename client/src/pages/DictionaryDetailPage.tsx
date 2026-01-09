import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { WordFormModal } from "../components/words/WordFormModal";
import { Link, useParams } from "react-router-dom";
import Modal from "../components/common/Modal";
import {
  addWordToDictionary,
  batchAddWordsToDictionary,
  fetchDictionary,
  fetchDictionaryWordAssociations,
  removeDictionaryWord,
  updateDictionaryWordAssociation,
} from "../services/dictionaries";
import type { ApiError } from "../services/apiClient";
import { fetchWords } from "../services/words";
import type {
  Dictionary,
  DictionaryWordAssociation,
  DictionaryWordAssociationPayload,
  DictionaryWordAssociationUpdatePayload,
} from "../types/dictionary";
import type { Word, WordDifficulty } from "../types/word";

type FeedbackType = "success" | "error";

interface Feedback {
  type: FeedbackType;
  message: string;
}

interface BadgeDisplay {
  label: string;
  className: string;
}

type DifficultySelection = "unset" | "easy" | "medium" | "hard";
type MasterySelection = "unset" | "mastered" | "in-progress";

const difficultySelectOptions: Array<{
  value: DifficultySelection;
  label: string;
}> = [
  { value: "unset", label: "未设置" },
  { value: "easy", label: "简单" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困难" },
];

const masterySelectOptions: Array<{ value: MasterySelection; label: string }> =
  [
    { value: "unset", label: "未设置" },
    { value: "mastered", label: "已掌握" },
    { value: "in-progress", label: "学习中" },
  ];

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getDifficultyDisplay = (difficulty: WordDifficulty): BadgeDisplay => {
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

const getMasteryDisplay = (value: boolean | null): BadgeDisplay => {
  if (value === true) {
    return { label: "已掌握", className: "bg-primary-50 text-primary-700" };
  }

  if (value === false) {
    return { label: "学习中", className: "bg-slate-200 text-slate-600" };
  }

  return { label: "未设置", className: "bg-slate-100 text-slate-600" };
};

const mapDifficultyToSelection = (
  value: WordDifficulty
): DifficultySelection => {
  if (value === 0) {
    return "easy";
  }
  if (value === 1) {
    return "medium";
  }
  if (value === 2) {
    return "hard";
  }
  return "unset";
};

const mapSelectionToDifficulty = (
  selection: DifficultySelection
): WordDifficulty => {
  if (selection === "easy") {
    return 0;
  }
  if (selection === "medium") {
    return 1;
  }
  if (selection === "hard") {
    return 2;
  }
  return 0; // Default or fallback
};

const mapMasteryToSelection = (value: boolean | null): MasterySelection => {
  if (value === true) {
    return "mastered";
  }
  if (value === false) {
    return "in-progress";
  }
  return "unset";
};

const mapSelectionToMastery = (selection: MasterySelection): boolean | null => {
  if (selection === "mastered") {
    return true;
  }
  if (selection === "in-progress") {
    return false;
  }
  return null; // Default or fallback
};

interface AddDictionaryWordModalProps {
  dictionaryId: number;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onFeedback: (type: FeedbackType, message: string) => void;
}

const AddDictionaryWordModal = ({
  dictionaryId,
  isOpen,
  onClose,
  onRefresh,
  onFeedback,
}: AddDictionaryWordModalProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(
    new Set()
  );
  const [difficulty, setDifficulty] = useState<DifficultySelection>("unset");
  const [mastery, setMastery] = useState<MasterySelection>("unset");
  const [notes, setNotes] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSearch("");
    setSelectedWordIds(new Set());
    setDifficulty("unset");
    setMastery("unset");
    setNotes("");
    setFetchError(null);
    setSubmitError(null);
    setPage(1);
    setResults([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let ignore = false;

    const loadWords = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const response = await fetchWords({
          search: search.trim() ? search.trim() : undefined,
          limit: 20,
          page: page,
          excludeDictionaryId: dictionaryId,
        });

        if (ignore) {
          return;
        }

        if (page === 1) {
          setResults(response.items);
        } else {
          setResults((prev) => [...prev, ...response.items]);
        }

        setHasMore(response.items.length === 20);

        // Remove IDs from selection that are no longer in the results if needed?
        // Actually, it's better to keep selection across search if we want true bulk,
        // but since the exclusion filter is active, if we search again, the previous words
        // might not be there anymore. Let's just keep the Set as is.
      } catch (error) {
        if (ignore) {
          return;
        }

        const apiError = error as ApiError;
        setFetchError(apiError.message ?? "目前无法加载可用单词。");
        if (page === 1) setResults([]);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(loadWords, page === 1 ? 250 : 0);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, search, dictionaryId, page]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleWordToggle = (wordId: number) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedWordIds.size === 0) {
      setSubmitError("请至少选择一个要添加到词典的单词。");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const idsArray = Array.from(selectedWordIds);

      if (idsArray.length === 1) {
        // Single add
        const payload: DictionaryWordAssociationPayload = {
          wordId: idsArray[0],
        };

        const difficultyValue = mapSelectionToDifficulty(difficulty);
        if (difficultyValue !== null) {
          payload.difficulty = difficultyValue;
        }

        const masteryValue = mapSelectionToMastery(mastery);
        if (masteryValue !== null) {
          payload.isMastered = masteryValue;
        }

        const trimmedNotes = notes.trim();
        if (trimmedNotes) {
          payload.notes = trimmedNotes;
        }

        await addWordToDictionary(dictionaryId, payload);
        const addedWord = results.find((word) => word.id === idsArray[0]);
        onFeedback("success", `已将单词 "${addedWord?.word}" 添加到词典。`);
      } else {
        // Batch add
        await batchAddWordsToDictionary(dictionaryId, {
          wordIds: idsArray,
        });
        onFeedback(
          "success",
          `已成功将 ${idsArray.length} 个单词批量添加到词典。`
        );
      }

      onRefresh();
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      const message = apiError.message ?? "无法添加选中的单词。";
      setSubmitError(message);
      onFeedback("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasResults = results.length > 0;
  const noResultsMessage = search.trim()
    ? "没有匹配的单词。请尝试其他关键词。"
    : "所有匹配的单词都已经在词典中。";

  return (
    <Modal
      description="查找并添加现有单词到词典，无需创建重复项。"
      footer={
        <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
            disabled={submitting}
          >
            取消
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            form="add-dictionary-word-form"
            type="submit"
            disabled={submitting || selectedWordIds.size === 0}
          >
            {submitting
              ? "添加中…"
              : selectedWordIds.size > 1
              ? `批量添加 (${selectedWordIds.size})`
              : "添加单词"}
          </button>
        </>
      }
      isOpen={isOpen}
      maxHeight={true}
      onClose={submitting ? () => {} : onClose}
      size="lg"
      title="添加单词到词典"
    >
      <form
        className="space-y-5"
        id="add-dictionary-word-form"
        onSubmit={handleSubmit}
      >
        <div>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="dictionary-add-word-search"
          >
            搜索单词
          </label>
          <input
            autoFocus
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-add-word-search"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="输入单词、音标或释义"
            type="search"
            value={search}
          />
          <p className="mt-2 text-xs text-slate-500">
            只显示尚未与此词典关联的单词。
          </p>
        </div>

        <div className="space-y-3">
          {loading && page === 1 ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-lg bg-slate-200"
                />
              ))}
            </div>
          ) : fetchError ? (
            <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {fetchError}
            </div>
          ) : hasResults ? (
            <div className="space-y-3">
              <ul className="max-h-60 overflow-y-auto rounded-lg border border-slate-200">
                {results.map((word) => {
                  const isSelected = selectedWordIds.has(word.id);
                  return (
                    <li key={word.id}>
                      <button
                        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                          isSelected ? "bg-primary-50/80" : ""
                        }`}
                        onClick={() => handleWordToggle(word.id)}
                        type="button"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                              isSelected
                                ? "border-primary-600 bg-primary-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="h-3 w-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {word.word}
                            </p>
                            <p className="text-xs text-slate-500">
                              {word.phonetic}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {word.meaning}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1 text-xs font-medium text-slate-500">
                          ID: {word.id}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-2"
                >
                  {loading ? "加载中..." : "加载更多"}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              {noResultsMessage}
            </div>
          )}
        </div>

        <div
          className={`grid gap-4 md:grid-cols-2 transition-opacity ${
            selectedWordIds.size > 1 ? "opacity-40 pointer-events-none" : ""
          }`}
        >
          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="dictionary-add-word-difficulty"
            >
              词典难度
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              id="dictionary-add-word-difficulty"
              onChange={(event) =>
                setDifficulty(event.target.value as DifficultySelection)
              }
              value={difficulty}
            >
              {difficultySelectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="dictionary-add-word-mastery"
            >
              掌握状态
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              id="dictionary-add-word-mastery"
              onChange={(event) =>
                setMastery(event.target.value as MasterySelection)
              }
              value={mastery}
            >
              {masterySelectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className={`transition-opacity ${
            selectedWordIds.size > 1 ? "opacity-40 pointer-events-none" : ""
          }`}
        >
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="dictionary-add-word-notes"
          >
            笔记
          </label>
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-add-word-notes"
            maxLength={255}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="添加此单词属于该词典的任何上下文说明。"
            rows={3}
            value={notes}
          />
          <p className="mt-2 text-xs text-amber-600 font-medium">
            提示：批量添加模式下暂不支持自定义难度、掌握状态和笔记。
          </p>
        </div>

        {submitError ? (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}
      </form>
    </Modal>
  );
};

interface EditDictionaryWordModalProps {
  association: DictionaryWordAssociation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onFeedback: (type: FeedbackType, message: string) => void;
}

const EditDictionaryWordModal = ({
  association,
  isOpen,
  onClose,
  onUpdated,
  onFeedback,
}: EditDictionaryWordModalProps) => {
  const [difficulty, setDifficulty] = useState<DifficultySelection>("unset");
  const [mastery, setMastery] = useState<MasterySelection>("unset");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !association) {
      return;
    }

    setDifficulty(mapDifficultyToSelection(association.difficulty));
    setMastery(mapMasteryToSelection(association.isMastered));
    setNotes(association.notes ?? "");
    setSubmitError(null);
  }, [isOpen, association]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!association) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: DictionaryWordAssociationUpdatePayload = {
        difficulty: mapSelectionToDifficulty(difficulty),
        isMastered: mapSelectionToMastery(mastery),
        notes: notes.trim() ? notes.trim() : null,
      };

      await updateDictionaryWordAssociation(association.id, payload);
      onFeedback("success", `Updated settings for "${association.word.word}".`);
      onUpdated();
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      const message = apiError.message ?? "Unable to update the association.";
      setSubmitError(message);
      onFeedback("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      description={
        association
          ? `调整单词 "${association.word.word}" 的词典特定设置。`
          : undefined
      }
      footer={
        <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
            disabled={submitting}
          >
            取消
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            form="edit-dictionary-word-form"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "保存中…" : "保存更改"}
          </button>
        </>
      }
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      size="md"
      title={
        association ? `编辑设置 "${association.word.word}"` : "编辑关联设置"
      }
    >
      <form
        className="space-y-5"
        id="edit-dictionary-word-form"
        onSubmit={handleSubmit}
      >
        <div>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="dictionary-edit-difficulty"
          >
            词典难度
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-edit-difficulty"
            onChange={(event) =>
              setDifficulty(event.target.value as DifficultySelection)
            }
            value={difficulty}
          >
            {difficultySelectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="dictionary-edit-mastery"
          >
            掌握状态
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-edit-mastery"
            onChange={(event) =>
              setMastery(event.target.value as MasterySelection)
            }
            value={mastery}
          >
            {masterySelectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="dictionary-edit-notes"
          >
            笔记
          </label>
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-edit-notes"
            maxLength={255}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="分享此单词在词典中的特定上下文。"
            rows={3}
            value={notes}
          />
          <p className="mt-2 text-xs text-slate-500">留空以移除现有笔记。</p>
        </div>
        {submitError ? (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}
      </form>
    </Modal>
  );
};

interface RemoveDictionaryWordDialogProps {
  association: DictionaryWordAssociation | null;
  dictionaryId: number;
  isOpen: boolean;
  onClose: () => void;
  onRemoved: () => void;
  onFeedback: (type: FeedbackType, message: string) => void;
}

const RemoveDictionaryWordDialog = ({
  association,
  dictionaryId,
  isOpen,
  onClose,
  onRemoved,
  onFeedback,
}: RemoveDictionaryWordDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSubmitError(null);
    setSubmitting(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!association) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await removeDictionaryWord(dictionaryId, association.wordId);
      onFeedback("success", `已从词典中移除 "${association.word.word}"。`);
      onRemoved();
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      const message = apiError.message ?? "无法从词典中移除这个单词。";
      setSubmitError(message);
      onFeedback("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      description={
        association
          ? `移除此关联将保留该单词在全局单词列表中，但会将其与此词典分离。`
          : undefined
      }
      footer={
        <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
            disabled={submitting}
          >
            取消
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleConfirm}
            type="button"
            disabled={submitting}
          >
            {submitting ? "移除中…" : "移除单词"}
          </button>
        </>
      }
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      size="sm"
      title={association ? `Remove "${association.word.word}"?` : "移除关联"}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          确定要移除{" "}
          <span className="font-semibold text-slate-900">
            {association?.word.word}
          </span>{" "}
          from this dictionary? You can re-add it later without losing the word
          itself.
        </p>
        {submitError ? (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

const DictionaryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dictionaryId = Number(id);

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [associations, setAssociations] = useState<DictionaryWordAssociation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [associationToEdit, setAssociationToEdit] =
    useState<DictionaryWordAssociation | null>(null);
  const [associationToRemove, setAssociationToRemove] =
    useState<DictionaryWordAssociation | null>(null);

  // Pagination and search state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [wordToEdit, setWordToEdit] = useState<Word | null>(null);

  const refreshData = useCallback(() => {
    setRefreshIndex((index) => index + 1);
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (!Number.isFinite(dictionaryId) || dictionaryId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const [dictionaryResponse, associationsResponse] = await Promise.all([
          fetchDictionary(dictionaryId),
          fetchDictionaryWordAssociations(dictionaryId, {
            page,
            limit,
            search: search.trim() || undefined,
          }),
        ]);

        if (ignore) {
          return;
        }

        setDictionary(dictionaryResponse);
        setAssociations(associationsResponse.items);
        setTotal(associationsResponse.total);
      } catch (err) {
        if (ignore) {
          return;
        }

        const apiError = err as ApiError;
        if (apiError.status === 404) {
          setNotFound(true);
          setDictionary(null);
          setAssociations([]);
          setTotal(0);
        } else {
          setError(apiError.message ?? "无法加载词典详情。");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    // Debounce search
    const timeoutId = setTimeout(load, search ? 300 : 0);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [dictionaryId, refreshIndex, page, limit, search]);

  const showFeedback = useCallback((type: FeedbackType, message: string) => {
    setFeedback({ type, message });
  }, []);

  const totalWords = total;
  const totalPages = Math.ceil(total / limit);
  const stats = useMemo(() => {
    // Basic defense
    if (!Array.isArray(associations)) {
      return {
        masteredCount: 0,
        inProgressCount: 0,
        masteryUnknownCount: 0,
        masteryPercent: 0,
      };
    }

    const masteredCount = associations.filter(
      (association) => association.isMastered === true
    ).length;
    const inProgressCount = associations.filter(
      (association) => association.isMastered === false
    ).length;
    const masteryUnknownCount = totalWords - masteredCount - inProgressCount;
    const masteryPercent = totalWords
      ? Math.round((masteredCount / totalWords) * 100)
      : 0;

    return {
      masteredCount,
      inProgressCount,
      masteryUnknownCount,
      masteryPercent,
    };
  }, [associations, totalWords]);

  const {
    masteredCount,
    inProgressCount,
    masteryUnknownCount,
    masteryPercent,
  } = stats;

  const difficultyBreakdown = useMemo(() => {
    const accumulator = {
      easy: 0,
      medium: 0,
      hard: 0,
      unset: 0,
    };

    if (!Array.isArray(associations)) {
      return accumulator;
    }

    associations.forEach((association) => {
      if (association.difficulty === 0) {
        accumulator.easy += 1;
      } else if (association.difficulty === 1) {
        accumulator.medium += 1;
      } else if (association.difficulty === 2) {
        accumulator.hard += 1;
      } else {
        accumulator.unset += 1;
      }
    });

    return accumulator;
  }, [associations]);

  if (!Number.isFinite(dictionaryId) || dictionaryId <= 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center">
        <h2 className="text-xl font-semibold text-slate-900">无效的词典</h2>
        <p className="mt-2 text-sm text-slate-500">请求的词典ID无效。</p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          to="/dictionaries"
        >
          返回词典列表
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center">
        <h2 className="text-xl font-semibold text-slate-900">未找到词典</h2>
        <p className="mt-2 text-sm text-slate-500">
          您查找的词典可能已被删除或从未存在。
        </p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          to="/dictionaries"
        >
          返回词典列表
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-5 text-sm text-rose-700">
          {error}
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          onClick={refreshData}
          type="button"
        >
          重试
        </button>
      </div>
    );
  }

  if (!dictionary) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">词典</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            {dictionary.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {dictionary.description || "此词典暂无描述。"}
          </p>
        </div>
        <Link
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          to="/dictionaries"
        >
          返回列表
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            状态
          </p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              dictionary.isEnabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {dictionary.isEnabled ? "启用" : "禁用"}
          </span>
          <p className="mt-4 text-xs text-slate-500">
            创建时间 {formatDateTime(dictionary.createdAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            掌握状态统计
          </p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              dictionary.isMastered
                ? "bg-indigo-50 text-indigo-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {dictionary.isMastered ? "已掌握" : "学习中"}
          </span>
          <p className="mt-4 text-xs text-slate-500">
            最后更新 {formatDateTime(dictionary.updatedAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            总单词数
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {totalWords}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            {masteredCount} 已掌握 · {inProgressCount} 学习中 ·{" "}
            {masteryUnknownCount} 未设置
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            掌握进度
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {masteryPercent}%
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
              简单: {difficultyBreakdown.easy}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">
              中等: {difficultyBreakdown.medium}
            </span>
            <span className="rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-700">
              困难: {difficultyBreakdown.hard}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">
              未设置: {difficultyBreakdown.unset}
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="搜索词典中的单词..."
              className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 4v16m8-8H4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            添加单词
          </button>
        </div>

        {feedback ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        {Array.isArray(associations) && associations.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">单词</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      词典难度
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      掌握情况
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">笔记</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      添加时间
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {associations.map((association) => {
                    const difficultyDisplay = getDifficultyDisplay(
                      association.difficulty
                    );
                    const masteryDisplay = getMasteryDisplay(
                      association.isMastered
                    );

                    return (
                      <tr key={association.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900">
                              {association.word.word}
                            </p>
                            <p className="text-xs text-slate-500">
                              {association.word.phonetic}
                            </p>
                            <p className="text-xs text-slate-500">
                              {association.word.meaning}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${difficultyDisplay.className}`}
                          >
                            {difficultyDisplay.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${masteryDisplay.className}`}
                          >
                            {masteryDisplay.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600">
                          {association.notes ? (
                            <p className="max-w-xs whitespace-pre-wrap break-words">
                              {association.notes}
                            </p>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {formatDateTime(association.addedAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                              onClick={() => setAssociationToEdit(association)}
                              type="button"
                            >
                              关联
                            </button>
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                              onClick={() => setWordToEdit(association.word)}
                              type="button"
                            >
                              编辑单词
                            </button>
                            <button
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                              onClick={() =>
                                setAssociationToRemove(association)
                              }
                              type="button"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl mt-4 text-slate-700">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm">
                      显示第{" "}
                      <span className="font-medium">
                        {(page - 1) * limit + 1}
                      </span>{" "}
                      到第{" "}
                      <span className="font-medium">
                        {Math.min(page * limit, total)}
                      </span>{" "}
                      条结果，共 <span className="font-medium">{total}</span> 条
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }).map(
                        (_, i) => {
                          let pageNum = page;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === pageNum
                                  ? "z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                  : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={() =>
                          setPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        disabled={page === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              {search ? "未找到匹配结果" : "暂无单词"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "尝试调整您的搜索关键词。"
                : "从全局单词目录添加单词以开始构建词典。"}
            </p>
            {!search && (
              <button
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                onClick={() => setIsAddModalOpen(true)}
                type="button"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 4v16m8-8H4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                添加第一个单词
              </button>
            )}
            {search && (
              <button
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={() => setSearch("")}
                type="button"
              >
                清除搜索
              </button>
            )}
          </div>
        )}
      </section>

      <AddDictionaryWordModal
        dictionaryId={dictionaryId}
        isOpen={isAddModalOpen}
        onRefresh={refreshData}
        onClose={() => setIsAddModalOpen(false)}
        onFeedback={showFeedback}
      />

      <EditDictionaryWordModal
        association={associationToEdit}
        isOpen={Boolean(associationToEdit)}
        onClose={() => setAssociationToEdit(null)}
        onFeedback={showFeedback}
        onUpdated={refreshData}
      />

      <RemoveDictionaryWordDialog
        association={associationToRemove}
        dictionaryId={dictionaryId}
        isOpen={Boolean(associationToRemove)}
        onClose={() => setAssociationToRemove(null)}
        onFeedback={showFeedback}
        onRemoved={refreshData}
      />

      <WordFormModal
        isOpen={Boolean(wordToEdit)}
        mode="edit"
        word={wordToEdit}
        onClose={() => setWordToEdit(null)}
        onSuccess={(word, _mode) => {
          refreshData();
          showFeedback("success", `单词“${word.word}”定义更新成功。`);
        }}
      />
    </div>
  );
};

export default DictionaryDetailPage;
