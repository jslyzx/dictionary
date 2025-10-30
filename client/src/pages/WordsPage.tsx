const WordsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Words</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Review, tag, and curate words across your dictionaries. This page is ready for API-backed data.
        </p>
      </div>

      <section className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          Hook this screen up to your backend services to list and manage words.
        </p>
      </section>
    </div>
  )
}

export default WordsPage
