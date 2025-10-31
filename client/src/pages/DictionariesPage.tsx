import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApiError } from '../services/apiClient'
import {
  fetchDictionaries,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  type Dictionary,
  type CreateDictionaryPayload,
  type UpdateDictionaryPayload,
} from '../services/dictionaries'
import Modal from '../components/common/Modal'
import DictionaryForm from '../components/DictionaryForm'
import ConfirmDialog from '../components/ConfirmDialog'

type FlashMessage = {
  type: 'success' | 'error'
  message: string
}

type FormData = {
  name: string
  description?: string
  isEnabled?: boolean
  isMastered?: boolean
}

const DictionariesPage = () => {
  const navigate = useNavigate()
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<FlashMessage | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDictionary, setEditingDictionary] = useState<Dictionary | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingDictionary, setDeletingDictionary] = useState<Dictionary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!flash) {
      return
    }

    const timer = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(timer)
  }, [flash])

  const fetchDictionariesData = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchDictionaries()
      setDictionaries(data)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message ?? 'Unable to load dictionaries.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDictionariesData()
  }, [])

  const handleCreateDictionary = async (formData: FormData) => {
    setSubmitting(true)
    try {
      await createDictionary({
        name: formData.name,
        description: formData.description,
      })
      setShowCreateModal(false)
      setFlash({ type: 'success', message: 'Dictionary created successfully!' })
      fetchDictionariesData()
    } catch (err) {
      const apiError = err as ApiError
      setFlash({ type: 'error', message: apiError.message ?? 'Failed to create dictionary.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditDictionary = async (formData: FormData) => {
    if (!editingDictionary) return

    setSubmitting(true)
    try {
      await updateDictionary(editingDictionary.id, {
        name: formData.name,
        description: formData.description,
        isEnabled: formData.isEnabled,
        isMastered: formData.isMastered,
      })
      setShowEditModal(false)
      setEditingDictionary(null)
      setFlash({ type: 'success', message: 'Dictionary updated successfully!' })
      fetchDictionariesData()
    } catch (err) {
      const apiError = err as ApiError
      setFlash({ type: 'error', message: apiError.message ?? 'Failed to update dictionary.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDictionary = async () => {
    if (!deletingDictionary) return

    setDeleting(true)
    try {
      await deleteDictionary(deletingDictionary.id)
      setShowDeleteDialog(false)
      setDeletingDictionary(null)
      setFlash({ type: 'success', message: 'Dictionary deleted successfully!' })
      fetchDictionariesData()
    } catch (err) {
      const apiError = err as ApiError
      setFlash({ type: 'error', message: apiError.message ?? 'Failed to delete dictionary.' })
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (dictionary: Dictionary) => {
    setEditingDictionary(dictionary)
    setShowEditModal(true)
  }

  const openDeleteDialog = (dictionary: Dictionary) => {
    setDeletingDictionary(dictionary)
    setShowDeleteDialog(true)
  }

  const navigateToDictionary = (id: number) => {
    navigate(`/dictionaries/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dictionaries</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Explore, create, and manage your dictionaries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          New dictionary
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
          <h2 className="text-lg font-medium text-slate-900">Your dictionaries</h2>
          <p className="text-sm text-slate-500">Manage your dictionary collection.</p>
        </div>

        <div className="px-6 py-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading && !dictionaries.length ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100/60"
                />
              ))}
            </div>
          ) : null}

          {!loading && !error && dictionaries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No dictionaries found</h3>
              <p className="mt-2 text-sm text-slate-600">
                Create your first dictionary to get started.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Create dictionary
              </button>
            </div>
          ) : null}

          {dictionaries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Name
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
                      Words
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Created
                    </th>
                    <th
                      scope="col"
                      className="relative px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dictionaries.map((dictionary) => (
                    <tr key={dictionary.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{dictionary.name}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-600">
                          {dictionary.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-600">
                          {dictionary.wordCount || 0} words
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              dictionary.isEnabled
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {dictionary.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                          {dictionary.isMastered && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              Mastered
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-600">
                          {new Date(dictionary.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigateToDictionary(dictionary.id)}
                            className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(dictionary)}
                            className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(dictionary)}
                            className="rounded-md border border-rose-200 px-3 py-1 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      {/* Create Dictionary Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Dictionary"
        description="Add a new dictionary to organize your vocabulary."
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-dictionary-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Dictionary'}
            </button>
          </div>
        }
      >
        <DictionaryForm
          formId="create-dictionary-form"
          onSubmit={handleCreateDictionary}
          isSubmitting={submitting}
        />
      </Modal>

      {/* Edit Dictionary Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingDictionary(null)
        }}
        title="Edit Dictionary"
        description="Update the details of your dictionary."
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false)
                setEditingDictionary(null)
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-dictionary-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Dictionary'}
            </button>
          </div>
        }
      >
        <DictionaryForm
          formId="edit-dictionary-form"
          initialData={editingDictionary || undefined}
          onSubmit={handleEditDictionary}
          isSubmitting={submitting}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingDictionary && (
        <ConfirmDialog
          title="Delete Dictionary"
          message={`Are you sure you want to delete "${deletingDictionary.name}"? This action cannot be undone and will remove all associated words.`}
          confirmLabel="Delete Dictionary"
          cancelLabel="Cancel"
          onConfirm={handleDeleteDictionary}
          onCancel={() => {
            setShowDeleteDialog(false)
            setDeletingDictionary(null)
          }}
          isProcessing={deleting}
        />
      )}
    </div>
  )
}

export default DictionariesPage