import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import type { ApiError } from '../services/apiClient'
import { createWord, deleteWord, listWords, updateWord, type ListWordsParams, type Word } from '../services/words'

type DifficultyFilterValue = 'all' | '0' | '1' | '2'
type MasteryFilterValue = 'all' | 'mastered' | 'unmastered'

type FlashMessage = {
  type: 'success' | 'error'
  message: string
}

interface FiltersState {
  search: string
  difficulty: DifficultyFilterValue
  mastery: MasteryFilterValue
}

interface WordFormValues {
  word: string
  phonetic: string
  meaning: string
  pronunciationUrl: string
  difficulty: number
  isMastered: boolean
}

type WordFormErrors = Partial<{
  word: string
  phonetic: string
  meaning: string
}>

const defaultFilters: FiltersState = {
  search: '',
  difficulty: 'all',
  mastery: 'all',
}

const limitOptions = [10, 20, 50]

const masteryOptions: Array<{ value: MasteryFilterValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'mastered', label: 'Mastered' },
  { value: 'unmastered', label: 'In progress' },
]

const difficultyMetadata: Record<0 | 1 | 2, { label: string; className: string }> = {
  0: { label: 'Easy', className: 'bg-emerald-50 text-emerald-700' },
  1: { label: 'Medium', className: 'bg-amber-50 text-amber-700' },
  2: { label: 'Hard', className: 'bg-rose-50 text-rose-700' },
}

const difficultyFilterOptions: Array<{ value: DifficultyFilterValue; label: string }> = [
  { value: 'all', label: 'All difficulties' },
  { value: '0', label: difficultyMetadata[0].label },
  { value: '1', label: difficultyMetadata[1].label },
  { value: '2', label: difficultyMetadata[2].label },
]

const getDifficultyMeta = (difficulty: number | null | undefined) => {
  if (difficulty === 0 || difficulty === 1 || difficulty === 2) {
    return difficultyMetadata[difficulty]
  }
  return { label: 'Unknown', className: 'bg-slate-100 text-slate-600' }
}

const WORD_FORM_ID = 'word-form'

const WordsPage = () => {
  const [words, setWords] = useState<Word[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(limitOptions[0])
  const [loading, setLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<FiltersState>(defaultFilters)

  const [flash, setFlash] = useState<FlashMessage | null>(null)

  const [formState, setFormState] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    word: Word | null
  }>({ open: false, mode: 'create', word: null })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [wordPendingDeletion, setWordPendingDeletion] = useState<Word | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!flash) {
      return
    }

    const timer = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(timer)
  }, [flash])

  const fetchWords = useCallback(async () => {
    setLoading(true)
    setFetchError(null)

    try {
      const params: ListWordsParams = {
        page,
        limit,
      }

      if (filters.search) {
        params.search = filters.search
      }

      if (filters.difficulty !== 'all') {
        params.difficulty = Number(filters.difficulty)
      }

      if (filters.mastery !== 'all') {
        params.masteryStatus = filters.mastery === 'mastered' ? 1 : 0
      }

      const response = await listWords(params)
      setWords(response.items)
      setTotal(response.total)
      setHasFetched(true)

      if (response.total === 0) {
        if (page !== 1) {
          setPage(1)
        }
        return
      }

      const totalPages = Math.max(1, Math.ceil(response.total / limit))
      if (page > totalPages) {
        setPage(totalPages)
      }
    } catch (error) {
      const apiError = error as ApiError
      setFetchError(apiError.message ?? 'Unable to load words.')
      setWords([])
      setTotal(0)
      setHasFetched(true)
    } finally {
      setLoading(false)
    }
  }, [filters.difficulty, filters.mastery, filters.search, limit, page])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  const totalPages = useMemo(() => (total === 0 ? 1 : Math.ceil(total / limit)), [limit, total])

  const hasVisibleWords = words.length > 0
  const showingFrom = hasVisibleWords ? (page - 1) * limit + 1 : 0
  const showingTo = hasVisibleWords ? Math.min(total, showingFrom + words.length - 1) : 0

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = searchInput.trim()
    setFilters((prev) => ({ ...prev, search: trimmed }))
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters(defaultFilters)
    setSearchInput('')
    setPage(1)
  }

  const handleDifficultyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as DifficultyFilterValue
    setFilters((prev) => ({ ...prev, difficulty: value }))
    setPage(1)
  }

  const handleMasteryChange = (value: MasteryFilterValue) => {
    setFilters((prev) => ({ ...prev, mastery: value }))
    setPage(1)
  }

  const handleLimitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLimit = Number(event.target.value)
    setLimit(nextLimit)
    setPage(1)
  }

  const openCreateForm = () => {
    setFormState({ open: true, mode: 'create', word: null })
    setFormError(null)
  }

  const openEditForm = (word: Word) => {
    setFormState({ open: true, mode: 'edit', word })
    setFormError(null)
  }

  const closeForm = () => {
    setFormState({ open: false, mode: 'create', word: null })
    setFormError(null)
  }

  const handleSubmitWord = async (values: WordFormValues) => {
    const { mode, word } = formState

    setFormSubmitting(true)
    setFormError(null)

    const payload = {
      word: values.word,
      phonetic: values.phonetic,
      meaning: values.meaning,
      difficulty: values.difficulty,
      isMastered: values.isMastered,
      pronunciationUrl: values.pronunciationUrl ? values.pronunciationUrl : null,
    }

    try {
      if (mode === 'edit' && word) {
        await updateWord(word.id, payload)
        setFlash({ type: 'success', message: 'Word updated successfully.' })
      } else {
        await createWord(payload)
        setFlash({ type: 'success', message: 'Word created successfully.' })
      }

      closeForm()

      if (mode === 'create') {
        if (page === 1) {
          await fetchWords()
        } else {
          setPage(1)
        }
      } else {
        await fetchWords()
      }
    } catch (error) {
      const apiError = error as ApiError
      setFormError(apiError.message ?? 'Unable to save word.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const confirmDelete = (word: Word) => {
    setWordPendingDeletion(word)
  }

  const handleDeleteWord = async () => {
    if (!wordPendingDeletion) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteWord(wordPendingDeletion.id)
      setFlash({ type: 'success', message: 'Word deleted successfully.' })
      setWordPendingDeletion(null)
      await fetchWords()
    } catch (error) {
      const apiError = error as ApiError
      setFlash({ type: 'error', message: apiError.message ?? 'Unable to delete word.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const appliedPronunciation = (word: Word) =>
    word.pronunciation1 || word.pronunciation2 || word.pronunciation3 || ''

  const hasActiveFilters =
    filters.search !== '' || filters.difficulty !== 'all' || filters.mastery !== 'all'

  const formInitialValues = useMemo<WordFormValues | undefined>(() => {
    if (!formState.word) {
      return undefined
    }

    const pronunciation =
      formState.word.pronunciation1 ||
      formState.word.pronunciation2 ||
      formState.word.pronunciation3 ||
      ''

    return {
      word: formState.word.word,
      phonetic: formState.word.phonetic,
      meaning: formState.word.meaning,
      pronunciationUrl: pronunciation,
      difficulty: formState.word.difficulty ?? 0,
      isMastered: formState.word.isMastered,
    }
  }, [formState.word])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Words</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Search, create, and curate your word list. Use filters to focus on specific
            difficulty levels or mastery states.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          New word
        </button>
      </div>

      {flash ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
            flash.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
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
              <span className="sr-only">Dismiss message</span>
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-slate-700">
                Search
              </label>
              <div className="mt-1 flex gap-3">
                <input
                  id="search"
                  name="search"
                  type="search"
                  placeholder="Search by word or meaning"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
                />
                <button
                  type="submit"
                  className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 lg:block"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:w-48">
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-slate-700"
              >
                Difficulty
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
              <span className="text-sm font-medium text-slate-700">Mastery</span>
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {masteryOptions.map((option) => {
                  const isActive = filters.mastery === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleMasteryChange(option.value)}
                      className={`flex-1 rounded-full px-3 py-1 text-sm font-medium transition ${
                        isActive
                          ? 'bg-slate-900 text-white shadow'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 lg:justify-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 lg:hidden"
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                disabled={!hasActiveFilters}
              >
                Reset
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
              <h3 className="text-lg font-semibold text-slate-900">No words found</h3>
              <p className="mt-2 text-sm text-slate-600">
                Adjust your filters or add a new word to get started.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Add word
              </button>
            </div>
          ) : null}

          {words.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Word
                    </th>
                    <th
                      scope="col"
                      className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 lg:table-cell"
                    >
                      Phonetic
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Pronunciation
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Difficulty
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Mastery
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                  {words.map((word) => {
                    const difficultyMeta = getDifficultyMeta(word.difficulty)
                    const pronunciation = appliedPronunciation(word)
                    const pronunciationIsLink = /^https?:/i.test(pronunciation)
                    return (
                      <tr key={word.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{word.word}</div>
                          <div className="mt-0.5 text-xs text-slate-500 lg:hidden">
                            {word.phonetic || '—'}
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 align-top text-slate-600 lg:table-cell">
                          {word.phonetic || '—'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {pronunciation ? (
                            pronunciationIsLink ? (
                              <a
                                href={pronunciation}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Listen
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-sm text-slate-600">{pronunciation}</span>
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-600">
                          <p className="text-sm leading-relaxed">{word.meaning}</p>
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
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {word.isMastered ? 'Mastered' : 'In progress'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <div className="flex justify-end gap-3 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => openEditForm(word)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(word)}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-rose-600 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            {hasVisibleWords ? (
              <span>
                Showing <span className="font-semibold text-slate-900">{showingFrom}</span> -{' '}
                <span className="font-semibold text-slate-900">{showingTo}</span> of{' '}
                <span className="font-semibold text-slate-900">{total}</span> words
              </span>
            ) : hasFetched && !loading ? (
              <span>No words to display.</span>
            ) : (
              <span>Loading…</span>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span>Rows per page</span>
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
                Previous
              </button>
              <span className="text-sm font-medium text-slate-700">
                Page {total === 0 ? 0 : page} of {total === 0 ? 0 : totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages || total === 0 || loading}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {formState.open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {formState.mode === 'edit' ? 'Edit word' : 'Add word'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="px-6 py-6">
              {formError ? (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}
              <WordForm
                key={formState.word ? formState.word.id : 'new'}
                formId={WORD_FORM_ID}
                mode={formState.mode}
                initialValues={formInitialValues}
                submitting={formSubmitting}
                onSubmit={handleSubmitWord}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form={WORD_FORM_ID}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={formSubmitting}
              >
                {formSubmitting
                  ? formState.mode === 'edit'
                    ? 'Saving…'
                    : 'Creating…'
                  : formState.mode === 'edit'
                    ? 'Save changes'
                    : 'Create word'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {wordPendingDeletion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete word</h3>
            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete “
              <span className="font-semibold text-slate-900">{wordPendingDeletion.word}</span>”? This
              action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setWordPendingDeletion(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWord}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-400"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface WordFormProps {
  formId: string
  mode: 'create' | 'edit'
  initialValues?: WordFormValues
  submitting: boolean
  onSubmit: (values: WordFormValues) => Promise<void>
}

const emptyFormValues: WordFormValues = {
  word: '',
  phonetic: '',
  meaning: '',
  pronunciationUrl: '',
  difficulty: 0,
  isMastered: false,
}

const WordForm = ({ formId, mode, initialValues, submitting, onSubmit }: WordFormProps) => {
  const [values, setValues] = useState<WordFormValues>(initialValues ?? emptyFormValues)
  const [errors, setErrors] = useState<WordFormErrors>({})

  useEffect(() => {
    setValues(initialValues ?? emptyFormValues)
    setErrors({})
  }, [initialValues])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target
    const checked = type === 'checkbox' || type === 'radio' ? (event.target as HTMLInputElement).checked : undefined
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'difficulty' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedWord = values.word.trim()
    const trimmedPhonetic = values.phonetic.trim()
    const trimmedMeaning = values.meaning.trim()
    const trimmedPronunciation = values.pronunciationUrl.trim()

    const nextErrors: WordFormErrors = {}

    if (!trimmedWord) {
      nextErrors.word = 'Word is required.'
    }

    if (!trimmedPhonetic) {
      nextErrors.phonetic = 'Phonetics are required.'
    }

    if (!trimmedMeaning) {
      nextErrors.meaning = 'Description is required.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    await onSubmit({
      word: trimmedWord,
      phonetic: trimmedPhonetic,
      meaning: trimmedMeaning,
      pronunciationUrl: trimmedPronunciation,
      difficulty: values.difficulty,
      isMastered: values.isMastered,
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="word" className="block text-sm font-medium text-slate-700">
            Word<span className="text-rose-500">*</span>
          </label>
          <input
            id="word"
            name="word"
            type="text"
            value={values.word}
            onChange={handleChange}
            placeholder="e.g. Serendipity"
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 ${
              errors.word ? 'border-rose-400 focus:ring-rose-500/60' : 'border-slate-300'
            }`}
            disabled={submitting}
            autoFocus={mode === 'create'}
          />
          {errors.word ? <p className="mt-1 text-sm text-rose-600">{errors.word}</p> : null}
        </div>
        <div>
          <label htmlFor="phonetic" className="block text-sm font-medium text-slate-700">
            Phonetics<span className="text-rose-500">*</span>
          </label>
          <input
            id="phonetic"
            name="phonetic"
            type="text"
            value={values.phonetic}
            onChange={handleChange}
            placeholder="e.g. /ˌser.ənˈdɪp.ə.ti/"
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 ${
              errors.phonetic ? 'border-rose-400 focus:ring-rose-500/60' : 'border-slate-300'
            }`}
            disabled={submitting}
          />
          {errors.phonetic ? (
            <p className="mt-1 text-sm text-rose-600">{errors.phonetic}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="meaning" className="block text-sm font-medium text-slate-700">
          Description<span className="text-rose-500">*</span>
        </label>
        <textarea
          id="meaning"
          name="meaning"
          rows={4}
          value={values.meaning}
          onChange={handleChange}
          placeholder="Provide a concise explanation for this word."
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 ${
            errors.meaning ? 'border-rose-400 focus:ring-rose-500/60' : 'border-slate-300'
          }`}
          disabled={submitting}
        />
        {errors.meaning ? <p className="mt-1 text-sm text-rose-600">{errors.meaning}</p> : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="pronunciationUrl"
            className="block text-sm font-medium text-slate-700"
          >
            Pronunciation link
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
          <p className="mt-1 text-xs text-slate-500">
            Optional. Provide an audio URL or reference for pronunciation.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700">
              Difficulty
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
              <span className="font-medium text-slate-800">Mastered</span>
              <p className="text-xs text-slate-500">
                Mark this word as mastered when learners have fully grasped it.
              </p>
            </div>
          </label>
        </div>
      </div>
    </form>
  )
}

export default WordsPage
