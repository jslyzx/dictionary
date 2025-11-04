import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../components/common/Modal'
import {
  add单词To词典,
  fetch词典,
  fetch词典单词Associations,
  remove词典单词,
  update词典单词Association,
} from '../services/dictionaries'
import type { ApiError } from '../services/apiClient'
import { fetch单词s } from '../services/words'
import type {
  词典,
  词典单词Association,
  词典单词AssociationPayload,
  词典单词AssociationUpdatePayload,
} from '../types/dictionary'
import type { 单词, 单词Difficulty } from '../types/word'

type FeedbackType = 'success' | 'error'

interface Feedback {
  type: FeedbackType
  message: string
}

interface BadgeDisplay {
  label: string
  className: string
}

type DifficultySelection = 'unset' | 'easy' | 'medium' | 'hard'
type MasterySelection = 'unset' | '已掌握' | 'in-progress'

const difficultySelectOptions: Array<{ value: DifficultySelection; label: string }> = [
  { value: 'unset', label: '未设置' },
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]

const masterySelectOptions: Array<{ value: MasterySelection; label: string }> = [
  { value: 'unset', label: '未设置' },
  { value: '已掌握', label: '已掌握' },
  { value: 'in-progress', label: '学习中' },
]

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

const getDifficultyDisplay = (difficulty: 单词Difficulty): BadgeDisplay => {
  switch (difficulty) {
    case 0:
      return { label: '简单', className: 'bg-emerald-50 text-emerald-700' }
    case 1:
      return { label: '中等', className: 'bg-amber-50 text-amber-700' }
    case 2:
      return { label: '困难', className: 'bg-rose-50 text-rose-700' }
    default:
      return { label: '未设置', className: 'bg-slate-100 text-slate-600' }
  }
}

const getMasteryDisplay = (value: boolean | null): BadgeDisplay => {
  if (value === true) {
    return { label: '已掌握', className: 'bg-primary-50 text-primary-700' }
  }

  if (value === false) {
    return { label: '学习中', className: 'bg-slate-200 text-slate-600' }
  }

  return { label: '未设置', className: 'bg-slate-100 text-slate-600' }
}

const mapDifficultyToSelection = (value: 单词Difficulty): DifficultySelection => {
  if (value === 0) {
    return 'easy'
  }
  if (value === 1) {
    return 'medium'
  }
  if (value === 2) {
    return 'hard'
  }
  return 'unset'
}

const mapSelectionToDifficulty = (selection: DifficultySelection): 单词Difficulty => {
  if (selection === 'easy') {
    return 0
  }
  if (selection === 'medium') {
    return 1
  }
  if (selection === 'hard') {
    return 2
  }
  return null
}

const mapMasteryToSelection = (value: boolean | null): MasterySelection => {
  if (value === true) {
    return '已掌握'
  }
  if (value === false) {
    return 'in-progress'
  }
  return 'unset'
}

const mapSelectionToMastery = (selection: MasterySelection): boolean | null => {
  if (selection === '已掌握') {
    return true
  }
  if (selection === 'in-progress') {
    return false
  }
  return null
}

interface Add词典单词ModalProps {
  dictionaryId: number
  existing单词Ids: number[]
  isOpen: boolean
  onClose: () => void
  on添加时间: () => void
  onFeedback: (type: FeedbackType, message: string) => void
}

const Add词典单词Modal = ({
  dictionaryId,
  existing单词Ids,
  isOpen,
  onClose,
  on添加时间,
  onFeedback,
}: Add词典单词ModalProps) => {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<单词[]>([])
  const [loading, setLoading] = useState(false)
  const [selected单词Id, setSelected单词Id] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultySelection>('unset')
  const [mastery, setMastery] = useState<MasterySelection>('unset')
  const [notes, set笔记] = useState('')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const excludedIds = useMemo(() => new Set(existing单词Ids), [existing单词Ids])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setSearch('')
    setSelected单词Id(null)
    setDifficulty('unset')
    setMastery('unset')
    set笔记('')
    setFetchError(null)
    setSubmitError(null)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let ignore = false

    const load单词s = async () => {
      setLoading(true)
      setFetchError(null)

      try {
        const response = await fetch单词s({
          search: search.trim() ? search.trim() : undefined,
          limit: 20,
        })

        if (ignore) {
          return
        }

        const filtered = response.items.filter((word) => !excludedIds.has(word.id))
        setResults(filtered)

        if (selected单词Id && !filtered.some((word) => word.id === selected单词Id)) {
          setSelected单词Id(null)
        }
      } catch (error) {
        if (ignore) {
          return
        }

        const apiError = error as ApiError
        setFetchError(apiError.message ?? '目前无法加载可用单词。')
        setResults([])
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(load单词s, 250)

    return () => {
      ignore = true
      window.clearTimeout(timeoutId)
    }
  }, [isOpen, search, excludedIds, selected单词Id])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selected单词Id) {
      setSubmitError('请选择要添加到词典的单词。')
      return
    }

    setSubmitError(null)
    setSubmitting(true)

    try {
      const payload: 词典单词AssociationPayload = {
        wordId: selected单词Id,
      }

      const difficultyValue = mapSelectionToDifficulty(difficulty)
      if (difficultyValue !== null) {
        payload.difficulty = difficultyValue
      }

      const masteryValue = mapSelectionToMastery(mastery)
      if (masteryValue !== null) {
        payload.is已掌握 = masteryValue
      }

      const trimmed笔记 = notes.trim()
      if (trimmed笔记) {
        payload.notes = trimmed笔记
      }

      await add单词To词典(dictionaryId, payload)
      const added单词 = results.find((word) => word.id === selected单词Id)
      onFeedback('success', added单词 ? `已将单词添加到词典。')
      on添加时间()
      onClose()
    } catch (error) {
      const apiError = error as ApiError
      const message = apiError.message ?? '无法添加选中的单词。'
      setSubmitError(message)
      onFeedback('error', message)
    } finally {
      setSubmitting(false)
    }
  }

  const hasResults = results.length > 0
  const noResultsMessage = search.trim()
    ? '没有匹配的单词。请尝试其他关键词。'
    : '所有匹配的单词都已经在词典中。'

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
            disabled={submitting || !selected单词Id}
          >
            {submitting ? '添加中…' : '添加单词'}
          </button>
        </>
      }
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      size="lg"
      title="添加单词 to dictionary"
    >
      <form className="space-y-5" id="add-dictionary-word-form" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="dictionary-add-word-search">
            Search words
          </label>
          <input
            autoFocus
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-add-word-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type a word, phonetic spelling, or meaning"
            type="search"
            value={search}
          />
          <p className="mt-2 text-xs text-slate-500">Only words not already associated with this dictionary are shown.</p>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : fetchError ? (
            <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {fetchError}
            </div>
          ) : hasResults ? (
            <ul className="max-h-60 overflow-y-auto rounded-lg border border-slate-200">
              {results.map((word) => {
                const isSelected = selected单词Id === word.id
                return (
                  <li key={word.id}>
                    <button
                      className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        isSelected ? 'bg-primary-50/80' : ''
                      }`}
                      onClick={() => setSelected单词Id(word.id)}
                      type="button"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{word.word}</p>
                        <p className="text-xs text-slate-500">{word.phonetic}</p>
                        <p className="mt-1 text-xs text-slate-500">{word.meaning}</p>
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        ID: {word.id}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              {noResultsMessage}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="dictionary-add-word-difficulty">
              词典难度 (optional)
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              id="dictionary-add-word-difficulty"
              onChange={(event) => setDifficulty(event.target.value as DifficultySelection)}
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
            <label className="block text-sm font-medium text-slate-700" htmlFor="dictionary-add-word-mastery">
              掌握状态 (optional)
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              id="dictionary-add-word-mastery"
              onChange={(event) => setMastery(event.target.value as MasterySelection)}
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

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="dictionary-add-word-notes">
            笔记 (optional)
          </label>
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-add-word-notes"
            maxLength={255}
            onChange={(event) => set笔记(event.target.value)}
            placeholder="Add any context for why this word belongs to the dictionary."
            rows={3}
            value={notes}
          />
        </div>

        {submitError ? <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
      </form>
    </Modal>
  )
}

interface Edit词典单词ModalProps {
  association: 词典单词Association | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
  onFeedback: (type: FeedbackType, message: string) => void
}

const Edit词典单词Modal = ({
  association,
  isOpen,
  onClose,
  onUpdated,
  onFeedback,
}: Edit词典单词ModalProps) => {
  const [difficulty, setDifficulty] = useState<DifficultySelection>('unset')
  const [mastery, setMastery] = useState<MasterySelection>('unset')
  const [notes, set笔记] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !association) {
      return
    }

    setDifficulty(mapDifficultyToSelection(association.difficulty))
    setMastery(mapMasteryToSelection(association.is已掌握))
    set笔记(association.notes ?? '')
    setSubmitError(null)
  }, [isOpen, association])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!association) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload: 词典单词AssociationUpdatePayload = {
        difficulty: mapSelectionToDifficulty(difficulty),
        is已掌握: mapSelectionToMastery(mastery),
        notes: notes.trim() ? notes.trim() : null,
      }

      await update词典单词Association(association.id, payload)
      onFeedback('success', `Updated settings for "${association.word.word}".`)
      onUpdated()
      onClose()
    } catch (error) {
      const apiError = error as ApiError
      const message = apiError.message ?? 'Unable to update the association.'
      setSubmitError(message)
      onFeedback('error', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      description={
        association
          ? `Adjust dictionary-specific settings for ${association.word.word}.`
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
            {submitting ? '保存中…' : '保存更改'}
          </button>
        </>
      }
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      size="md"
      title={association ? `编辑设置 "${association.word.word}"` : '编辑关联'}
    >
      <form className="space-y-5" id="edit-dictionary-word-form" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="dictionary-edit-difficulty">
            词典难度
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-edit-difficulty"
            onChange={(event) => setDifficulty(event.target.value as DifficultySelection)}
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
          <label className="block text-sm font-medium text-slate-700" htmlFor="dictionary-edit-mastery">
            掌握状态
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-edit-mastery"
            onChange={(event) => setMastery(event.target.value as MasterySelection)}
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
          <label className="block text-sm font-medium text-slate-700" htmlFor="dictionary-edit-notes">
            笔记
          </label>
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-edit-notes"
            maxLength={255}
            onChange={(event) => set笔记(event.target.value)}
            placeholder="分享此单词在词典中的特定上下文。"
            rows={3}
            value={notes}
          />
          <p className="mt-2 text-xs text-slate-500">留空以移除现有笔记。</p>
        </div>
        {submitError ? <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
      </form>
    </Modal>
  )
}

interface Remove词典单词DialogProps {
  association: 词典单词Association | null
  dictionaryId: number
  isOpen: boolean
  onClose: () => void
  onRemoved: () => void
  onFeedback: (type: FeedbackType, message: string) => void
}

const Remove词典单词Dialog = ({
  association,
  dictionaryId,
  isOpen,
  onClose,
  onRemoved,
  onFeedback,
}: Remove词典单词DialogProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setSubmitError(null)
    setSubmitting(false)
  }, [isOpen])

  const handleConfirm = async () => {
    if (!association) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await remove词典单词(dictionaryId, association.wordId)
      onFeedback('success', `Removed "${association.word.word}" from the dictionary.`)
      onRemoved()
      onClose()
    } catch (error) {
      const apiError = error as ApiError
      const message = apiError.message ?? 'Unable to remove this word from the dictionary.'
      setSubmitError(message)
      onFeedback('error', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      description={
        association
          ? `Removing this association will keep the word in the global word list but detach it from this dictionary.`
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
            {submitting ? '移除中…' : '移除单词'}
          </button>
        </>
      }
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      size="sm"
      title={association ? `Remove "${association.word.word}"?` : '移除关联'}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          确定要移除 <span className="font-semibold text-slate-900">{association?.word.word}</span> from
          this dictionary? You can re-add it later without losing the word itself.
        </p>
        {submitError ? <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
      </div>
    </Modal>
  )
}

const 词典DetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const dictionaryId = Number(id)

  const [dictionary, set词典] = useState<词典 | null>(null)
  const [associations, setAssociations] = useState<词典单词Association[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [associationToEdit, setAssociationToEdit] = useState<词典单词Association | null>(null)
  const [associationToRemove, setAssociationToRemove] = useState<词典单词Association | null>(null)

  const refreshData = useCallback(() => {
    setRefreshIndex((index) => index + 1)
  }, [])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [feedback])

  useEffect(() => {
    if (!Number.isFinite(dictionaryId) || dictionaryId <= 0) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let ignore = false

    const load = async () => {
      setLoading(true)
      setError(null)
      setNotFound(false)

      try {
        const [dictionaryResponse, associationsResponse] = await Promise.all([
          fetch词典(dictionaryId),
          fetch词典单词Associations(dictionaryId),
        ])

        if (ignore) {
          return
        }

        set词典(dictionaryResponse)
        setAssociations(associationsResponse)
      } catch (err) {
        if (ignore) {
          return
        }

        const apiError = err as ApiError
        if (apiError.status === 404) {
          setNotFound(true)
          set词典(null)
          setAssociations([])
        } else {
          setError(apiError.message ?? '无法加载词典详情。')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [dictionaryId, refreshIndex])

  const showFeedback = useCallback((type: FeedbackType, message: string) => {
    setFeedback({ type, message })
  }, [])

  const existing单词Ids = useMemo(() => associations.map((association) => association.wordId), [associations])

  const total单词s = associations.length
  const 已掌握Count = associations.filter((association) => association.is已掌握 === true).length
  const inProgressCount = associations.filter((association) => association.is已掌握 === false).length
  const masteryUnknownCount = total单词s - 已掌握Count - inProgressCount
  const masteryPercent = total单词s ? Math.round((已掌握Count / total单词s) * 100) : 0

  const difficultyBreakdown = useMemo(() => {
    const accumulator = {
      easy: 0,
      medium: 0,
      hard: 0,
      unset: 0,
    }

    associations.forEach((association) => {
      if (association.difficulty === 0) {
        accumulator.easy += 1
      } else if (association.difficulty === 1) {
        accumulator.medium += 1
      } else if (association.difficulty === 2) {
        accumulator.hard += 1
      } else {
        accumulator.unset += 1
      }
    })

    return accumulator
  }, [associations])

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
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    )
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
    )
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
    )
  }

  if (!dictionary) {
    return null
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">词典</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{dictionary.name}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {dictionary.description || '此词典暂无描述。'}
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
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">状态</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              dictionary.is启用 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {dictionary.is启用 ? '启用' : '禁用'}
          </span>
          <p className="mt-4 text-xs text-slate-500">创建时间 {formatDateTime(dictionary.createdAt)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">词典 mastery</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              dictionary.is已掌握 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {dictionary.is已掌握 ? '已掌握' : 'In progress'}
          </span>
          <p className="mt-4 text-xs text-slate-500">最后更新 {formatDateTime(dictionary.updatedAt)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">总单词数</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{total单词s}</p>
          <p className="mt-3 text-xs text-slate-500">
            {已掌握Count} 已掌握 · {inProgressCount} 学习中 · {masteryUnknownCount} 未设置
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">掌握进度</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{masteryPercent}%</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${masteryPercent}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">简单: {difficultyBreakdown.easy}</span>
            <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">中等: {difficultyBreakdown.medium}</span>
            <span className="rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-700">困难: {difficultyBreakdown.hard}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">Unset: {difficultyBreakdown.unset}</span>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">词典 words</h2>
            <p className="text-sm text-slate-500">管理与此词典关联的单词，包括自定义难度和掌握状态。</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            添加单词s
          </button>
        </div>

        {feedback ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        {associations.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">单词</th>
                  <th className="px-4 py-3 text-left font-semibold">词典难度</th>
                  <th className="px-4 py-3 text-left font-semibold">Mastery</th>
                  <th className="px-4 py-3 text-left font-semibold">笔记</th>
                  <th className="px-4 py-3 text-left font-semibold">添加时间</th>
                  <th className="px-4 py-3 text-left font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {associations.map((association) => {
                  const difficultyDisplay = getDifficultyDisplay(association.difficulty)
                  const masteryDisplay = getMasteryDisplay(association.is已掌握)

                  return (
                    <tr key={association.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{association.word.word}</p>
                          <p className="text-xs text-slate-500">{association.word.phonetic}</p>
                          <p className="text-xs text-slate-500">{association.word.meaning}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${difficultyDisplay.className}`}>
                          {difficultyDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${masteryDisplay.className}`}>
                          {masteryDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {association.notes ? (
                          <p className="max-w-xs whitespace-pre-wrap break-words">{association.notes}</p>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">{formatDateTime(association.addedAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                            onClick={() => setAssociationToEdit(association)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                            onClick={() => setAssociationToRemove(association)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">No words yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              添加单词s from your global catalog to start building this dictionary.
            </p>
            <button
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              onClick={() => setIsAddModalOpen(true)}
              type="button"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add your first word
            </button>
          </div>
        )}
      </section>

      <Add词典单词Modal
        dictionaryId={dictionaryId}
        existing单词Ids={existing单词Ids}
        isOpen={isAddModalOpen}
        on添加时间={refreshData}
        onClose={() => setIsAddModalOpen(false)}
        onFeedback={showFeedback}
      />

      <Edit词典单词Modal
        association={associationToEdit}
        isOpen={Boolean(associationToEdit)}
        onClose={() => setAssociationToEdit(null)}
        onFeedback={showFeedback}
        onUpdated={refreshData}
      />

      <Remove词典单词Dialog
        association={associationToRemove}
        dictionaryId={dictionaryId}
        isOpen={Boolean(associationToRemove)}
        onClose={() => setAssociationToRemove(null)}
        onFeedback={showFeedback}
        onRemoved={refreshData}
      />
    </div>
  )
}

export default 词典DetailPage
