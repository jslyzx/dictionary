import { useParams } from 'react-router-dom'

const DictionaryDetailPage = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dictionary details</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          This section will display the details for dictionary <span className="font-medium text-slate-900">{id}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <p className="text-sm text-slate-500">
          Populate this view with dictionary metadata, pronunciation guides, and activity.
        </p>
      </div>
    </div>
  )
}

export default DictionaryDetailPage
