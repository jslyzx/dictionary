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
      setError(apiError.message ?? '无法加载词典列表。')
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
      setFlash({ type: 'success', message: '词典创建成功！' })
      fetchDictionariesData()
    } catch (err) {
      const apiError = err as ApiError
      setFlash({ type: 'error', message: apiError.message ?? '创建词典失败。' })
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
      setFlash({ type: 'success', message: '词典更新成功！' })
      fetchDictionariesData()
    } catch (err) {
      const apiError = err as ApiError
      setFlash({ type: 'error', message: apiError.message ?? '更新词典失败。' })
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
      setFlash({ type: 'success', message: '词典删除成功！' })
      fetchDictionariesData()
    } catch (err) {
      const apiError = err as ApiError
      setFlash({ type: 'error', message: apiError.message ?? '删除词典失败。' })
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
          <h1 className="text-2xl font-semibold text-slate-900">词典管理</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            浏览、创建和管理您的词典。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          新建词典
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
              <span className="sr-only">关闭消息</span>
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-medium text-slate-900">您的词典</h2>
          <p className="text-sm text-slate-500">管理您的词典集合。</p>
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
              <h3 className="text-lg font-semibold text-slate-900">暂无词典</h3>
              <p className="mt-2 text-sm text-slate-600">
                创建您的第一个词典以开始使用。
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                创建词典
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
                      名称
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
                      单词数
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      状态
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      创建时间
                    </th>
                    <th
                      scope="col"
                      className="relative px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      操作
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
                          {dictionary.description || '暂无描述'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-600">
                          {dictionary.wordCount || 0} 个单词
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
                            {dictionary.isEnabled ? '启用' : '禁用'}
                          </span>
                          {dictionary.isMastered && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              已掌握
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
                            查看
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(dictionary)}
                            className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(dictionary)}
                            className="rounded-md border border-rose-200 px-3 py-1 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            删除
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
        title="创建新词典"
        description="添加新词典来整理您的词汇。"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              form="create-dictionary-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={submitting}
            >
              {submitting ? '创建中...' : '创建词典'}
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
        title="编辑词典"
        description="更新您的词典详情。"
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
              取消
            </button>
            <button
              type="submit"
              form="edit-dictionary-form"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={submitting}
            >
              {submitting ? '更新中...' : '更新词典'}
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
          title="删除词典"
          message={`确定要删除"${deletingDictionary.name}"吗？此操作无法撤销，并将删除所有相关单词。`}
          confirmLabel="删除词典"
          cancelLabel="取消"
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