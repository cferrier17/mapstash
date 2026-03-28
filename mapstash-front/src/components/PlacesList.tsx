import type { Place } from '../types/place'

type PlacesListProps = {
  places: Place[]
  selectedPlace: Place | null
  onSelectPlace: (place: Place) => void
  onEditPlace: (place: Place) => void
}

export function PlacesList({
  places,
  selectedPlace,
  onSelectPlace,
  onEditPlace,
}: PlacesListProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My places</h2>
        <span className="text-sm text-gray-500">{places.length}</span>
      </div>

      <div className="space-y-3">
        {places.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            No places match the current filters.
          </div>
        ) : (
          places.map((place) => {
            const isActive = selectedPlace?.id === place.id

            return (
              <article
                key={place.id}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isActive
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectPlace(place)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <h3 className="font-medium">{place.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{place.address}</p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {place.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditPlace(place)}
                    aria-label={`Edit ${place.name}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-white hover:text-black"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="m16.5 3.5 4 4L7 21l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
