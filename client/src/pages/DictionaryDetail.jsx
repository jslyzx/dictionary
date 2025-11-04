import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { ApiError, apiClient } from '../lib/apiClient.js';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

function DictionaryDetail() {
  const { id } = useParams();
  const [dictionary, setDictionary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchDictionary = async () => {
      setIsLoading(true);
      setNotFound(false);
      try {
        const data = await apiClient.getDictionary(id);
        setDictionary(data);
      } catch (error) {
        console.error(error);
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          toast.error('无法加载词典详情。');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDictionary();
  }, [id]);

  const summaryStats = useMemo(() => {
    if (!dictionary) return [];
    return [
      {
        label: '状态',
        value: dictionary.isEnabled ? '已启用' : '已禁用',
        accent: dictionary.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
      },
      {
        label: '掌握状态',
        value: dictionary.isMastered ? '已掌握' : '进行中',
        accent: dictionary.isMastered
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-slate-200 text-slate-600'
      },
      { label: '创建时间', value: formatDateTime(dictionary.createdAt) },
      { label: '最后更新', value: formatDateTime(dictionary.updatedAt) }
    ];
  }, [dictionary]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center">
        <h2 className="text-xl font-semibold text-slate-900">词典未找到</h2>
        <p className="mt-2 text-sm text-slate-500">
          您寻找的词典可能已被移除或从未存在。
        </p>
        <Link
          to="/dictionaries"
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          返回词典列表
        </Link>
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
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{dictionary.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {dictionary.description || '此词典暂无描述。'}
          </p>
        </div>
        <Link
          to="/dictionaries"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          返回列表
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            {stat.accent ? (
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${stat.accent}`}>
                {stat.value}
              </span>
            ) : (
              <p className="mt-3 text-lg font-semibold text-slate-900">{stat.value}</p>
            )}
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            单词数
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">—</p>
          <p className="mt-2 text-sm text-slate-500">单词管理功能启用后将显示单词数。</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">词典单词</h2>
        <p className="mt-2 text-sm text-slate-500">
          此词典的单词管理工具将在即将发布的更新中提供。
        </p>
      </div>
    </div>
  );
}

export default DictionaryDetail;
