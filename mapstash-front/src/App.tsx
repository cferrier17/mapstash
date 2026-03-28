import { useMemo, useState } from 'react'
import { AddPlaceModal } from './components/AddPlaceModal'
import { FiltersPanel } from './components/FiltersPanel'
import { MapView } from './components/MapView'
import { PlacesList } from './components/PlacesList'
import { initialPlaces } from './data/places'
import type { Place } from './types/place'

function App() {
  const [places, setPlaces] = useState<Place[]>(initialPlaces)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(
    initialPlaces[0] ?? null,
  )

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)

  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    return Array.from(new Set(places.flatMap((place) => place.tags))).sort((a, b) =>
      a.localeCompare(b),
    )
  }, [places])

  const filteredPlaces = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return places.filter((place) => {
      const matchesSearch =
        normalizedSearch === '' ||
        place.name.toLowerCase().includes(normalizedSearch) ||
        place.address.toLowerCase().includes(normalizedSearch) ||
        place.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((selectedTag) => place.tags.includes(selectedTag))

      return matchesSearch && matchesTags
    })
  }, [places, search, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((currentTag) => currentTag !== tag)
        : [...prev, tag],
    )
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedTags([])
  }

  const handleAddPlace = (newPlace: Place) => {
    setPlaces((prev) => [newPlace, ...prev])
    setSelectedPlace(newPlace)
  }

  const handleUpdatePlace = (updatedPlace: Place) => {
    setPlaces((prev) =>
      prev.map((place) => (place.id === updatedPlace.id ? updatedPlace : place)),
    )
    setSelectedPlace((current) =>
      current?.id === updatedPlace.id ? updatedPlace : current,
    )
  }

  const handleDeletePlace = (placeId: number) => {
    const remainingPlaces = places.filter((place) => place.id !== placeId)

    setPlaces(remainingPlaces)
    setSelectedPlace((current) => {
      if (!current) {
        return remainingPlaces[0] ?? null
      }

      return current.id === placeId ? remainingPlaces[0] ?? null : current
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">Mapstr Killer</h1>
            <p className="text-sm text-gray-500">
              Save and explore your favorite places
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Add a place
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <FiltersPanel
            search={search}
            selectedTags={selectedTags}
            allTags={allTags}
            setSearch={setSearch}
            toggleTag={toggleTag}
            resetFilters={resetFilters}
          />

          <PlacesList
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
            onEditPlace={setEditingPlace}
          />
        </aside>

        <MapView selectedPlace={selectedPlace} places={filteredPlaces} />
      </main>

      <AddPlaceModal
        key={isAddModalOpen ? 'add-open' : 'add-closed'}
        isOpen={isAddModalOpen}
        mode="add"
        onClose={() => setIsAddModalOpen(false)}
        onSavePlace={handleAddPlace}
      />

      <AddPlaceModal
        key={`edit-${editingPlace?.id ?? 'closed'}`}
        isOpen={editingPlace !== null}
        mode="edit"
        place={editingPlace}
        onClose={() => setEditingPlace(null)}
        onSavePlace={handleUpdatePlace}
        onDeletePlace={handleDeletePlace}
      />
    </div>
  )
}

export default App
