import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DictionaryForm from '../components/DictionaryForm.jsx';
import Modal from '../components/Modal.jsx';
import {
  fetchDictionaries,
  createDictionary,
  updateDictionary,
  deleteDictionary
} from '../services/dictionaries';

const FORM_ID = 'dictionary-form';

function DictionariesList() {
  const [dictionaries, setDictionaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeDictionary, setActiveDictionary] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dictionaryToDelete, setDictionaryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDictionaries = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchDictionaries();
      setDictionaries(data);
      setHasFetched(true);
    } catch (error) {
      console.error(error);
      const message = error?.message || '无法加载词典列表。';
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDictionaries();
  }, [loadDictionaries]);

  const openCreateForm = () => {
    setActiveDictionary(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const openEditForm = (dictionary) => {
    setActiveDictionary(dictionary);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setActiveDictionary(null);
  };

  const handleSubmitForm = async (payload) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && activeDictionary) {
        const updated = await updateDictionary(activeDictionary.id, payload);
        toast.success('词典更新成功。');
        setDictionaries((prev) =>
          prev.map((dictionary) =>
            dictionary.id === updated.id ? { ...dictionary, ...updated } : dictionary
          )
        );
      } else {
        const created = await createDictionary(payload);
        toast.success('词典创建成功。');
        setDictionaries((prev) => [created, ...prev]);
      }
      closeForm();
      await loadDictionaries();
    } catch (error) {
      console.error(error);
      const message = error?.message || '无法保存词典。';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteDictionary = (dictionary) => {
    setDictionaryToDelete(dictionary);
  };

  const handleDelete = async () => {
    if (!dictionaryToDelete) return;
    setIsDeleting(true);
    try {
      const deletedId = dictionaryToDelete.id;
      await deleteDictionary(deletedId);
      toast.success('词典已删除。');
      setDictionaries((prev) =>
        prev.filter((dictionary) => dictionary.id !== deletedId)
      );
      setDictionaryToDelete(null);
      await loadDictionaries();
    } catch (error) {
      console.error(error);
      const message = error?.message || '无法删除词典。';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">词典管理</h1>
          <p className="text-sm text-slate-500">
            管理您的词典集合，更新设置，浏览详情。
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          新建词典
        </button>
      </div>

      {loadError && !hasFetched ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {isLoading && !hasFetched ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white/60"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && hasFetched && dictionaries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900">暂无词典</h3>
          <p className="mt-2 text-sm text-slate-500">
            创建您的第一个词典，开始整理单词集合。
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            创建词典
          </button>
        </div>
      ) : null}

      {dictionaries.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {dictionaries.map((dictionary) => (
            <div
              key={dictionary.id}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {dictionary.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {dictionary.description || '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs font-medium">
                    <span
                      className={`rounded-full px-2 py-1 ${
                        dictionary.isEnabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {dictionary.isEnabled ? '已启用' : '已禁用'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 ${
                        dictionary.isMastered
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {dictionary.isMastered ? '已掌握' : '进行中'}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600 shadow-inner">
                  单词数：<span className="font-semibold text-slate-900">—</span>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to={`/dictionaries/${dictionary.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  查看详情
                </Link>
                <button
                  type="button"
                  onClick={() => openEditForm(dictionary)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteDictionary(dictionary)}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isFormOpen ? (
        <Modal
          title={formMode === 'edit' ? '编辑词典' : '新建词典'}
          onClose={closeForm}
          footer={[
            <button
              key="cancel"
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              disabled={isSubmitting}
            >
              取消
            </button>,
            <button
              key="submit"
              type="submit"
              form={FORM_ID}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? formMode === 'edit'
                  ? '保存中…'
                  : '创建中…'
                : formMode === 'edit'
                  ? '保存更改'
                  : '创建词典'
              }
            </button>
          ]}
        >
          <DictionaryForm
            key={activeDictionary ? activeDictionary.id : 'new'}
            initialData={activeDictionary}
            onSubmit={handleSubmitForm}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
          />
        </Modal>
      ) : null}

      {dictionaryToDelete ? (
        <ConfirmDialog
          title="删除词典"
          message={`确定要删除"${dictionaryToDelete.name}"吗？此操作无法撤销。`}
          confirmLabel="删除"
          cancelLabel="取消"
          onCancel={() => setDictionaryToDelete(null)}
          onConfirm={handleDelete}
          isProcessing={isDeleting}
        />
      ) : null}
    </div>
  );
}

export default DictionariesList;
