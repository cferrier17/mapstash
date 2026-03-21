import type { Place } from '../types/place'

type PlacesListProps = {
  places: Place[]
  selectedPlace: Place
  onSelectPlace: (place: Place) => void
}

export function PlacesList({
  places,
  selectedPlace,
  onSelectPlace,
}: PlacesListProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mes lieux</h2>
        <span className="text-sm text-gray-500">{places.length}</span>
      </div>

      <div className="space-y-3">
        {places.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Aucun lieu ne correspond aux filtres.
          </div>
        ) : (
          places.map((place) => {
            const isActive = selectedPlace.id === place.id

            return (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelectPlace(place)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isActive
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium">{place.name}</h3>

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
            )
          })
        )}
      </div>
    </section>
  )
}