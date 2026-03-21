type FiltersPanelProps = {
  search: string
  selectedTags: string[]
  allTags: string[]
  setSearch: (value: string) => void
  toggleTag: (tag: string) => void
  resetFilters: () => void
}

export function FiltersPanel({
  search,
  selectedTags,
  allTags,
  setSearch,
  toggleTag,
  resetFilters,
}: FiltersPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Recherche et filtres</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Recherche</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Nom ou tag"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Tags</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = selectedTags.includes(tag)

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    isActive
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="text-sm text-gray-500 underline hover:text-black"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </section>
  )
}