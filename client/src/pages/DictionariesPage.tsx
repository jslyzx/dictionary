const DictionariesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dictionaries</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Explore, create, and manage your dictionaries. This placeholder screen will be replaced with
          live data and actions as the project evolves.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">Recently updated</h2>
          <p className="text-sm text-slate-500">A snapshot of your latest dictionary activity.</p>
        </div>
        <div className="px-6 py-8 text-sm text-slate-500">
          Connect the frontend to the API to display dictionaries here.
        </div>
      </section>
    </div>
  )
}

export default DictionariesPage
