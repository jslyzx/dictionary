import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import type { ApiError } from "../../services/apiClient";
import { createWord, updateWord } from "../../services/words";
import type { Word, WordDifficulty } from "../../types/word";
import { difficultyMetadata } from "../../types/word";
import {
  pronunciationRuleService,
  type PronunciationRule,
} from "../../services/pronunciationRules";
import Modal from "../common/Modal";

export interface WordFormValues {
  word: string;
  phonetic: string;
  meaning: string;
  pronunciationUrl: string;
  difficulty: number;
  isMastered: boolean;
  notes: string;
  sentence: string;
  pronunciationRules: number[];
  hasImage: boolean;
  imageType: "url" | "iconfont" | "emoji" | null;
  imageValue: string | null;
}

export type WordFormErrors = Partial<{
  word: string;
  phonetic: string;
  meaning: string;
  imageType: string;
  imageValue: string;
}>;

const emptyFormValues: WordFormValues = {
  word: "",
  phonetic: "",
  meaning: "",
  pronunciationUrl: "",
  difficulty: 0,
  isMastered: false,
  notes: "",
  sentence: "",
  pronunciationRules: [],
  hasImage: false,
  imageType: null,
  imageValue: null,
};

interface WordFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  word: Word | null;
  onClose: () => void;
  onSuccess: (word: Word, mode: "create" | "edit") => void;
}

const WORD_FORM_ID = "word-form-common";

/**
 * 统一的单词编辑弹窗组件
 */
export const WordFormModal = ({
  isOpen,
  mode,
  word,
  onClose,
  onSuccess,
}: WordFormModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [values, setValues] = useState<WordFormValues>(emptyFormValues);
  const [errors, setErrors] = useState<WordFormErrors>({});
  const [pronunciationRules, setPronunciationRules] = useState<
    PronunciationRule[]
  >([]);
  const [pronunciationRulesLoading, setPronunciationRulesLoading] =
    useState(false);
  const [pronunciationRulesError, setPronunciationRulesError] = useState<
    string | null
  >(null);

  // Initialize form values when word or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && word) {
        setValues({
          word: word.word,
          phonetic: word.phonetic,
          meaning: word.meaning,
          pronunciationUrl: word.pronunciation1 || "",
          difficulty: (word.difficulty as number) ?? 0,
          isMastered: (word.isMastered as boolean) ?? false,
          notes: word.notes || "",
          sentence: word.sentence || "",
          pronunciationRules:
            word.pronunciationRules?.map((r: { id: number }) => r.id) || [],
          hasImage: word.hasImage || false,
          imageType: word.imageType || null,
          imageValue: word.imageValue || null,
        });
      } else {
        setValues(emptyFormValues);
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, mode, word]);

  // Fetch pronunciation rules when form opens
  useEffect(() => {
    if (isOpen) {
      const fetchPronunciationRulesData = async () => {
        try {
          setPronunciationRulesLoading(true);
          setPronunciationRulesError(null);
          const result = await pronunciationRuleService.getAll({ limit: 1000 });
          setPronunciationRules(result.items);
        } catch (error) {
          const apiError = error as ApiError;
          setPronunciationRulesError(
            apiError.message ?? "无法加载发音规则列表。"
          );
        } finally {
          setPronunciationRulesLoading(false);
        }
      };
      fetchPronunciationRulesData();
    }
  }, [isOpen]);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = event.target;
    const checked =
      type === "checkbox" || type === "radio"
        ? (event.target as HTMLInputElement).checked
        : undefined;
    setValues((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "difficulty"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const trimmedWord = values.word.trim();
    const trimmedPhonetic = values.phonetic.trim();
    const trimmedMeaning = values.meaning.trim();
    const trimmedPronunciation = values.pronunciationUrl.trim();
    const trimmedNotes = values.notes.trim();
    const trimmedSentence = values.sentence.trim();
    const trimmedImageValue = values.imageValue
      ? values.imageValue.trim()
      : null;

    const nextErrors: WordFormErrors = {};

    if (!trimmedWord) {
      nextErrors.word = "单词为必填项。";
    }

    if (!trimmedPhonetic) {
      nextErrors.phonetic = "音标为必填项。";
    }

    if (!trimmedMeaning) {
      nextErrors.meaning = "描述为必填项。";
    }

    // Image validation
    if (values.hasImage) {
      if (!values.imageType) {
        nextErrors.imageType = "请选择图片类型。";
      }
      if (!trimmedImageValue) {
        nextErrors.imageValue = "请输入图片内容。";
      } else {
        if (values.imageType === "url") {
          const urlPattern =
            /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
          if (!urlPattern.test(trimmedImageValue)) {
            nextErrors.imageValue =
              "请输入有效的图片URL（必须以.jpg、.png、.gif等结尾）。";
          }
        } else if (values.imageType === "iconfont") {
          const iconClassPattern = /^[a-zA-Z0-9_-]+$/;
          if (!iconClassPattern.test(trimmedImageValue)) {
            nextErrors.imageValue =
              "图标字体类名只能包含字母、数字、下划线和横线。";
          }
        } else if (values.imageType === "emoji") {
          if (trimmedImageValue.length > 50) {
            nextErrors.imageValue = "emoji内容不能超过50个字符。";
          }
        }
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        word: trimmedWord,
        phonetic: trimmedPhonetic,
        meaning: trimmedMeaning,
        pronunciationUrl: trimmedPronunciation,
        difficulty: values.difficulty as WordDifficulty,
        isMastered: values.isMastered,
        notes: trimmedNotes,
        sentence: trimmedSentence,
        pronunciationRules: values.pronunciationRules,
        hasImage: values.hasImage,
        imageType: values.hasImage ? values.imageType : null,
        imageValue: values.hasImage ? trimmedImageValue : null,
      };

      let result: Word;
      if (mode === "create") {
        result = await createWord(payload);
      } else {
        if (!word) throw new Error("未指定要编辑的单词。");
        result = await updateWord(word.id, payload);
      }

      onSuccess(result, mode);
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      setSubmitError(
        apiError.message ??
          (mode === "create" ? "创建单词失败。" : "保存更改失败。")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      title={mode === "create" ? "添加新单词" : "编辑单词"}
      description={
        mode === "create"
          ? "向您的个人词库添加一个新单词。"
          : `更新 "${word?.word}" 的信息。`
      }
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="submit"
            form={WORD_FORM_ID}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting
              ? "保存中..."
              : mode === "create"
              ? "添加单词"
              : "保存更改"}
          </button>
        </div>
      }
    >
      <form id={WORD_FORM_ID} onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        <div className="grid gap-5 gap-y-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="word"
              className="block text-sm font-medium text-slate-700"
            >
              单词<span className="text-rose-500">*</span>
            </label>
            <input
              id="word"
              name="word"
              type="text"
              value={values.word}
              onChange={handleChange}
              placeholder="例如：Serendipity"
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 ${
                errors.word
                  ? "border-rose-400 focus:ring-rose-500/60"
                  : "border-slate-300"
              }`}
              disabled={submitting}
              autoFocus={mode === "create"}
            />
            {errors.word ? (
              <p className="mt-1 text-sm text-rose-600">{errors.word}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="phonetic"
              className="block text-sm font-medium text-slate-700"
            >
              音标<span className="text-rose-500">*</span>
            </label>
            <input
              id="phonetic"
              name="phonetic"
              type="text"
              value={values.phonetic}
              onChange={handleChange}
              placeholder="例如：/ˌser.ənˈdɪp.ə.ti/"
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 ${
                errors.phonetic
                  ? "border-rose-400 focus:ring-rose-500/60"
                  : "border-slate-300"
              }`}
              disabled={submitting}
            />
            {errors.phonetic ? (
              <p className="mt-1 text-sm text-rose-600">{errors.phonetic}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="meaning"
            className="block text-sm font-medium text-slate-700"
          >
            描述<span className="text-rose-500">*</span>
          </label>
          <textarea
            id="meaning"
            name="meaning"
            rows={3}
            value={values.meaning}
            onChange={handleChange}
            placeholder="为这个单词提供简洁的解释。"
            className={`mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 ${
              errors.meaning
                ? "border-rose-400 focus:ring-rose-500/60"
                : "border-slate-300"
            }`}
            disabled={submitting}
          />
          {errors.meaning ? (
            <p className="mt-1 text-sm text-rose-600">{errors.meaning}</p>
          ) : null}
        </div>

        <div className="grid gap-5 gap-y-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-slate-700"
            >
              笔记
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={values.notes}
              onChange={handleChange}
              placeholder="记录学习笔记、记忆技巧等..."
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor="sentence"
              className="block text-sm font-medium text-slate-700"
            >
              例句
            </label>
            <textarea
              id="sentence"
              name="sentence"
              rows={4}
              value={values.sentence}
              onChange={handleChange}
              placeholder="提供例句帮助理解单词用法..."
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid gap-5 gap-y-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="pronunciationUrl"
              className="block text-sm font-medium text-slate-700"
            >
              发音链接
            </label>
            <input
              id="pronunciationUrl"
              name="pronunciationUrl"
              type="url"
              value={values.pronunciationUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
              disabled={submitting}
            />
          </div>
          <div className="grid gap-4 gap-y-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-slate-700"
              >
                难度
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={values.difficulty}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
                disabled={submitting}
              >
                <option value={0}>{difficultyMetadata[0].label}</option>
                <option value={1}>{difficultyMetadata[1].label}</option>
                <option value={2}>{difficultyMetadata[2].label}</option>
              </select>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <input
                id="isMastered"
                name="isMastered"
                type="checkbox"
                checked={values.isMastered}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                disabled={submitting}
              />
              <div>
                <span className="font-medium text-slate-800">已掌握</span>
                <p className="text-xs text-slate-500">标记为已掌握。</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            关联发音规则
          </label>
          <div className="mt-1">
            {pronunciationRulesLoading ? (
              <div className="flex items-center text-sm text-slate-500 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                加载发音规则中...
              </div>
            ) : pronunciationRulesError ? (
              <div className="text-sm text-rose-600 py-2">
                {pronunciationRulesError}
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-300 rounded-lg p-2">
                {pronunciationRules.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-2">
                    暂无发音规则
                  </div>
                ) : (
                  pronunciationRules.map((rule) => (
                    <label
                      key={rule.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={values.pronunciationRules.includes(rule.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setValues((prev) => ({
                            ...prev,
                            pronunciationRules: checked
                              ? [...prev.pronunciationRules, rule.id]
                              : prev.pronunciationRules.filter(
                                  (id) => id !== rule.id
                                ),
                          }));
                        }}
                        disabled={submitting}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="flex-1">
                        <span className="font-medium text-slate-900">
                          {rule.letterCombination}
                        </span>
                        <span className="mx-2 text-slate-400">-</span>
                        <span className="font-mono text-slate-700">
                          {rule.pronunciation}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <input
              id="hasImage"
              name="hasImage"
              type="checkbox"
              checked={values.hasImage}
              onChange={(e) => {
                const checked = e.target.checked;
                setValues((prev) => ({
                  ...prev,
                  hasImage: checked,
                  imageType: checked ? prev.imageType || "url" : null,
                  imageValue: checked ? prev.imageValue : null,
                }));
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              disabled={submitting}
            />
            <div className="flex-1">
              <span className="font-medium text-slate-800">有图片</span>
              <p className="text-xs text-slate-500">
                为这个单词添加图片、图标或emoji来帮助记忆。
              </p>
            </div>
          </label>

          {values.hasImage && (
            <div className="mt-4 space-y-4 pl-7">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  图片类型
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: "url", label: "URL链接" },
                    { value: "iconfont", label: "图标字体" },
                    { value: "emoji", label: "Emoji" },
                  ].map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="imageType"
                        value={type.value}
                        checked={values.imageType === type.value}
                        onChange={(e) => {
                          setValues((prev) => ({
                            ...prev,
                            imageType: e.target.value as
                              | "url"
                              | "iconfont"
                              | "emoji",
                            imageValue: null,
                          }));
                        }}
                        disabled={submitting}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>{type.label}</span>
                    </label>
                  ))}
                </div>
                {errors.imageType && (
                  <p className="mt-1 text-sm text-rose-600">
                    {errors.imageType}
                  </p>
                )}
              </div>

              {values.imageType && (
                <div>
                  <label
                    htmlFor="imageValue"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    {values.imageType === "url" && "图片URL"}
                    {values.imageType === "iconfont" && "图标字体类名"}
                    {values.imageType === "emoji" && "Emoji内容"}
                  </label>
                  <input
                    id="imageValue"
                    name="imageValue"
                    type="text"
                    value={values.imageValue || ""}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        imageValue: e.target.value,
                      }))
                    }
                    placeholder={
                      values.imageType === "url"
                        ? "https://example.com/image.png"
                        : values.imageType === "iconfont"
                        ? "icon-home"
                        : "🏠"
                    }
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 ${
                      errors.imageValue
                        ? "border-rose-400 focus:ring-rose-500/60"
                        : "border-slate-300"
                    }`}
                    disabled={submitting}
                  />
                  {errors.imageValue && (
                    <p className="mt-1 text-sm text-rose-600">
                      {errors.imageValue}
                    </p>
                  )}
                </div>
              )}

              {values.imageType && values.imageValue && (
                <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-center w-16 h-16 bg-white rounded border border-slate-200 overflow-hidden">
                    {values.imageType === "url" && (
                      <img
                        src={values.imageValue}
                        alt="预览"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    )}
                    {values.imageType === "url" && (
                      <div className="hidden text-center text-xs text-slate-500">
                        加载失败
                      </div>
                    )}
                    {values.imageType === "iconfont" && (
                      <i
                        className={`iconfont ${values.imageValue} text-3xl text-slate-600`}
                      ></i>
                    )}
                    {values.imageType === "emoji" && (
                      <span className="text-2xl">{values.imageValue}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
