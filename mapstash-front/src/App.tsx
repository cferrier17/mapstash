import { useMemo, useState } from 'react'
import { AddPlaceModal } from './components/AddPlaceModal'
import { FiltersPanel } from './components/FiltersPanel'
import { MapView } from './components/MapView'
import { PlacesList } from './components/PlacesList'
import { initialPlaces } from './data/places'
import type { Place } from './types/place'

type EditorState =
  | {
      mode: 'add'
    }
  | {
      mode: 'edit'
      placeId: number
    }

function App() {
  const [places, setPlaces] = useState<Place[]>(initialPlaces)
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(
    initialPlaces[0]?.id ?? null,
  )
  const [editorState, setEditorState] = useState<EditorState | null>(null)

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

  const selectedPlace = useMemo(
    () =>
      filteredPlaces.find((place) => place.id === selectedPlaceId) ??
      filteredPlaces[0] ??
      null,
    [filteredPlaces, selectedPlaceId],
  )

  const editingPlace = useMemo(() => {
    if (editorState?.mode !== 'edit') {
      return null
    }

    return places.find((place) => place.id === editorState.placeId) ?? null
  }, [editorState, places])

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
    setSelectedPlaceId(newPlace.id)
  }

  const handleUpdatePlace = (updatedPlace: Place) => {
    setPlaces((prev) =>
      prev.map((place) => (place.id === updatedPlace.id ? updatedPlace : place)),
    )
    setSelectedPlaceId((currentId) =>
      currentId === updatedPlace.id ? updatedPlace.id : currentId,
    )
  }

  const handleDeletePlace = (placeId: number) => {
    setPlaces((prev) => prev.filter((place) => place.id !== placeId))
    setSelectedPlaceId((currentId) => (currentId === placeId ? null : currentId))
    setEditorState((currentState) => {
      if (currentState?.mode === 'edit' && currentState.placeId === placeId) {
        return null
      }

      return currentState
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
            onClick={() => setEditorState({ mode: 'add' })}
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
            onSelectPlace={setSelectedPlaceId}
            onEditPlace={(placeId) => setEditorState({ mode: 'edit', placeId })}
          />
        </aside>

        <MapView selectedPlace={selectedPlace} places={filteredPlaces} />
      </main>

      <AddPlaceModal
        key={
          editorState?.mode === 'edit'
            ? `edit-${editorState.placeId}`
            : editorState?.mode === 'add'
              ? 'add-open'
              : 'closed'
        }
        isOpen={editorState !== null}
        mode={editorState?.mode ?? 'add'}
        place={editingPlace}
        onClose={() => setEditorState(null)}
        onSavePlace={editorState?.mode === 'edit' ? handleUpdatePlace : handleAddPlace}
        onDeletePlace={editorState?.mode === 'edit' ? handleDeletePlace : undefined}
      />
    </div>
  )
}

export default App
