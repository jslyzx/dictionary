import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../components/common/Modal'
import {
  addWordToDictionary,
  fetchDictionary,
  fetchDictionaryWordAssociations,
  removeDictionaryWord,
  updateDictionaryWordAssociation,
} from '../services/dictionaries'
import type { ApiError } from '../services/apiClient'
import { fetchWords } from '../services/words'
import type {
  Dictionary,
  DictionaryWordAssociation,
  DictionaryWordAssociationPayload,
  DictionaryWordAssociationUpdatePayload,
} from '../types/dictionary'
import type { Word, WordDifficulty } from '../types/word'

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
type MasterySelection = 'unset' | 'mastered' | 'in-progress'

const difficultySelectOptions: Array<{ value: DifficultySelection; label: string }> = [
  { value: 'unset', label: 'Not set' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const masterySelectOptions: Array<{ value: MasterySelection; label: string }> = [
  { value: 'unset', label: 'Not set' },
  { value: 'mastered', label: 'Mastered' },
  { value: 'in-progress', label: 'In progress' },
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

const getDifficultyDisplay = (difficulty: WordDifficulty): BadgeDisplay => {
  switch (difficulty) {
    case 0:
      return { label: 'Easy', className: 'bg-emerald-50 text-emerald-700' }
    case 1:
      return { label: 'Medium', className: 'bg-amber-50 text-amber-700' }
    case 2:
      return { label: 'Hard', className: 'bg-rose-50 text-rose-700' }
    default:
      return { label: 'Not set', className: 'bg-slate-100 text-slate-600' }
  }
}

const getMasteryDisplay = (value: boolean | null): BadgeDisplay => {
  if (value === true) {
    return { label: 'Mastered', className: 'bg-primary-50 text-primary-700' }
  }

  if (value === false) {
    return { label: 'In progress', className: 'bg-slate-200 text-slate-600' }
  }

  return { label: 'Not set', className: 'bg-slate-100 text-slate-600' }
}

const mapDifficultyToSelection = (value: WordDifficulty): DifficultySelection => {
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

const mapSelectionToDifficulty = (selection: DifficultySelection): WordDifficulty => {
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
    return 'mastered'
  }
  if (value === false) {
    return 'in-progress'
  }
  return 'unset'
}

const mapSelectionToMastery = (selection: MasterySelection): boolean | null => {
  if (selection === 'mastered') {
    return true
  }
  if (selection === 'in-progress') {
    return false
  }
  return null
}

interface AddDictionaryWordModalProps {
  dictionaryId: number
  existingWordIds: number[]
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
  onFeedback: (type: FeedbackType, message: string) => void
}

const AddDictionaryWordModal = ({
  dictionaryId,
  existingWordIds,
  isOpen,
  onClose,
  onAdded,
  onFeedback,
}: AddDictionaryWordModalProps) => {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultySelection>('unset')
  const [mastery, setMastery] = useState<MasterySelection>('unset')
  const [notes, setNotes] = useState('')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const excludedIds = useMemo(() => new Set(existingWordIds), [existingWordIds])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setSearch('')
    setSelectedWordId(null)
    setDifficulty('unset')
    setMastery('unset')
    setNotes('')
    setFetchError(null)
    setSubmitError(null)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let ignore = false

    const loadWords = async () => {
      setLoading(true)
      setFetchError(null)

      try {
        const response = await fetchWords({
          search: search.trim() ? search.trim() : undefined,
          limit: 20,
        })

        if (ignore) {
          return
        }

        const filtered = response.items.filter((word) => !excludedIds.has(word.id))
        setResults(filtered)

        if (selectedWordId && !filtered.some((word) => word.id === selectedWordId)) {
          setSelectedWordId(null)
        }
      } catch (error) {
        if (ignore) {
          return
        }

        const apiError = error as ApiError
        setFetchError(apiError.message ?? 'Unable to load available words right now.')
        setResults([])
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(loadWords, 250)

    return () => {
      ignore = true
      window.clearTimeout(timeoutId)
    }
  }, [isOpen, search, excludedIds, selectedWordId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedWordId) {
      setSubmitError('Please select a word to add to the dictionary.')
      return
    }

    setSubmitError(null)
    setSubmitting(true)

    try {
      const payload: DictionaryWordAssociationPayload = {
        wordId: selectedWordId,
      }

      const difficultyValue = mapSelectionToDifficulty(difficulty)
      if (difficultyValue !== null) {
        payload.difficulty = difficultyValue
      }

      const masteryValue = mapSelectionToMastery(mastery)
      if (masteryValue !== null) {
        payload.isMastered = masteryValue
      }

      const trimmedNotes = notes.trim()
      if (trimmedNotes) {
        payload.notes = trimmedNotes
      }

      await addWordToDictionary(dictionaryId, payload)
      const addedWord = results.find((word) => word.id === selectedWordId)
      onFeedback('success', addedWord ? `Added "${addedWord.word}" to the dictionary.` : 'Word added to the dictionary.')
      onAdded()
      onClose()
    } catch (error) {
      const apiError = error as ApiError
      const message = apiError.message ?? 'Unable to add the selected word.'
      setSubmitError(message)
      onFeedback('error', message)
    } finally {
      setSubmitting(false)
    }
  }

  const hasResults = results.length > 0
  const noResultsMessage = search.trim()
    ? 'No words match your search. Try a different keyword.'
    : 'All matching words are already in this dictionary.'

  return (
    <Modal
      description="Find and add existing words to this dictionary without creating duplicates."
      footer={
        <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            form="add-dictionary-word-form"
            type="submit"
            disabled={submitting || !selectedWordId}
          >
            {submitting ? 'Adding…' : 'Add word'}
          </button>
        </>
      }
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      size="lg"
      title="Add word to dictionary"
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
                const isSelected = selectedWordId === word.id
                return (
                  <li key={word.id}>
                    <button
                      className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        isSelected ? 'bg-primary-50/80' : ''
                      }`}
                      onClick={() => setSelectedWordId(word.id)}
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
              Dictionary difficulty (optional)
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
              Mastery status (optional)
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
            Notes (optional)
          </label>
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-add-word-notes"
            maxLength={255}
            onChange={(event) => setNotes(event.target.value)}
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

interface EditDictionaryWordModalProps {
  association: DictionaryWordAssociation | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
  onFeedback: (type: FeedbackType, message: string) => void
}

const EditDictionaryWordModal = ({
  association,
  isOpen,
  onClose,
  onUpdated,
  onFeedback,
}: EditDictionaryWordModalProps) => {
  const [difficulty, setDifficulty] = useState<DifficultySelection>('unset')
  const [mastery, setMastery] = useState<MasterySelection>('unset')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !association) {
      return
    }

    setDifficulty(mapDifficultyToSelection(association.difficulty))
    setMastery(mapMasteryToSelection(association.isMastered))
    setNotes(association.notes ?? '')
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
      const payload: DictionaryWordAssociationUpdatePayload = {
        difficulty: mapSelectionToDifficulty(difficulty),
        isMastered: mapSelectionToMastery(mastery),
        notes: notes.trim() ? notes.trim() : null,
      }

      await updateDictionaryWordAssociation(association.id, payload)
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
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            form="edit-dictionary-word-form"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      size="md"
      title={association ? `Edit settings for "${association.word.word}"` : 'Edit association'}
    >
      <form className="space-y-5" id="edit-dictionary-word-form" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="dictionary-edit-difficulty">
            Dictionary difficulty
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
            Mastery status
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
            Notes
          </label>
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            id="dictionary-edit-notes"
            maxLength={255}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Share any dictionary-specific context for this word."
            rows={3}
            value={notes}
          />
          <p className="mt-2 text-xs text-slate-500">Leave blank to remove existing notes.</p>
        </div>
        {submitError ? <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
      </form>
    </Modal>
  )
}

interface RemoveDictionaryWordDialogProps {
  association: DictionaryWordAssociation | null
  dictionaryId: number
  isOpen: boolean
  onClose: () => void
  onRemoved: () => void
  onFeedback: (type: FeedbackType, message: string) => void
}

const RemoveDictionaryWordDialog = ({
  association,
  dictionaryId,
  isOpen,
  onClose,
  onRemoved,
  onFeedback,
}: RemoveDictionaryWordDialogProps) => {
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
      await removeDictionaryWord(dictionaryId, association.wordId)
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
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleConfirm}
            type="button"
            disabled={submitting}
          >
            {submitting ? 'Removing…' : 'Remove word'}
          </button>
        </>
      }
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      size="sm"
      title={association ? `Remove "${association.word.word}"?` : 'Remove association'}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Are you sure you want to remove <span className="font-semibold text-slate-900">{association?.word.word}</span> from
          this dictionary? You can re-add it later without losing the word itself.
        </p>
        {submitError ? <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
      </div>
    </Modal>
  )
}

const DictionaryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const dictionaryId = Number(id)

  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [associations, setAssociations] = useState<DictionaryWordAssociation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [associationToEdit, setAssociationToEdit] = useState<DictionaryWordAssociation | null>(null)
  const [associationToRemove, setAssociationToRemove] = useState<DictionaryWordAssociation | null>(null)

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
          fetchDictionary(dictionaryId),
          fetchDictionaryWordAssociations(dictionaryId),
        ])

        if (ignore) {
          return
        }

        setDictionary(dictionaryResponse)
        setAssociations(associationsResponse)
      } catch (err) {
        if (ignore) {
          return
        }

        const apiError = err as ApiError
        if (apiError.status === 404) {
          setNotFound(true)
          setDictionary(null)
          setAssociations([])
        } else {
          setError(apiError.message ?? 'Unable to load dictionary details.')
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

  const existingWordIds = useMemo(() => associations.map((association) => association.wordId), [associations])

  const totalWords = associations.length
  const masteredCount = associations.filter((association) => association.isMastered === true).length
  const inProgressCount = associations.filter((association) => association.isMastered === false).length
  const masteryUnknownCount = totalWords - masteredCount - inProgressCount
  const masteryPercent = totalWords ? Math.round((masteredCount / totalWords) * 100) : 0

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
        <h2 className="text-xl font-semibold text-slate-900">Invalid dictionary</h2>
        <p className="mt-2 text-sm text-slate-500">The requested dictionary id is not valid.</p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          to="/dictionaries"
        >
          Back to dictionaries
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
        <h2 className="text-xl font-semibold text-slate-900">Dictionary not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The dictionary you are looking for may have been removed or never existed.
        </p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          to="/dictionaries"
        >
          Back to dictionaries
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
          Try again
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
          <p className="text-xs uppercase tracking-wide text-slate-500">Dictionary</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{dictionary.name}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {dictionary.description || 'No description provided for this dictionary yet.'}
          </p>
        </div>
        <Link
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          to="/dictionaries"
        >
          Back to list
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              dictionary.isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {dictionary.isEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <p className="mt-4 text-xs text-slate-500">Created {formatDateTime(dictionary.createdAt)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dictionary mastery</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              dictionary.isMastered ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {dictionary.isMastered ? 'Mastered' : 'In progress'}
          </span>
          <p className="mt-4 text-xs text-slate-500">Last updated {formatDateTime(dictionary.updatedAt)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total words</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totalWords}</p>
          <p className="mt-3 text-xs text-slate-500">
            {masteredCount} mastered · {inProgressCount} in progress · {masteryUnknownCount} not set
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Mastery progress</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{masteryPercent}%</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${masteryPercent}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">Easy: {difficultyBreakdown.easy}</span>
            <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">Medium: {difficultyBreakdown.medium}</span>
            <span className="rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-700">Hard: {difficultyBreakdown.hard}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">Unset: {difficultyBreakdown.unset}</span>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Dictionary words</h2>
            <p className="text-sm text-slate-500">Manage the words associated with this dictionary, including custom difficulty and mastery state.</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add words
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
                  <th className="px-4 py-3 text-left font-semibold">Word</th>
                  <th className="px-4 py-3 text-left font-semibold">Dictionary difficulty</th>
                  <th className="px-4 py-3 text-left font-semibold">Mastery</th>
                  <th className="px-4 py-3 text-left font-semibold">Notes</th>
                  <th className="px-4 py-3 text-left font-semibold">Added</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {associations.map((association) => {
                  const difficultyDisplay = getDifficultyDisplay(association.difficulty)
                  const masteryDisplay = getMasteryDisplay(association.isMastered)

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
              Add words from your global catalog to start building this dictionary.
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

      <AddDictionaryWordModal
        dictionaryId={dictionaryId}
        existingWordIds={existingWordIds}
        isOpen={isAddModalOpen}
        onAdded={refreshData}
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
    </div>
  )
}

export default DictionaryDetailPage
