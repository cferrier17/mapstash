import { useEffect, useMemo, useState } from 'react'
import { AddPlaceModal } from './components/AddPlaceModal'
import { FiltersPanel } from './components/FiltersPanel'
import { MapView } from './components/MapView'
import { PlacesList } from './components/PlacesList'
import {
  createPlace as createPlaceRequest,
  deletePlace as deletePlaceRequest,
  fetchPlaces,
  PlacesApiError,
  updatePlace as updatePlaceRequest,
} from './services/places'
import type { Place, PlaceDraft } from './types/place'

type EditorState =
  | {
      mode: 'add'
    }
  | {
      mode: 'edit'
      placeId: number
    }

function App() {
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null)
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true)
  const [placesError, setPlacesError] = useState('')
  const [isSubmittingPlace, setIsSubmittingPlace] = useState(false)
  const [placesReloadToken, setPlacesReloadToken] = useState(0)

  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const getPlacesErrorMessage = (error: unknown) => {
    if (error instanceof PlacesApiError) {
      return error.message
    }

    return 'Unable to load saved places from the server.'
  }

  const getPlaceActionErrorMessage = (
    error: unknown,
    fallbackMessage: string,
  ) => {
    if (error instanceof PlacesApiError) {
      return error.message
    }

    return fallbackMessage
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadPlaces = async () => {
      setIsLoadingPlaces(true)
      setPlacesError('')

      try {
        const nextPlaces = await fetchPlaces(controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setPlaces(nextPlaces)
        setSelectedPlaceId((currentSelectedPlaceId) =>
          currentSelectedPlaceId !== null &&
          nextPlaces.some((place) => place.id === currentSelectedPlaceId)
            ? currentSelectedPlaceId
            : nextPlaces[0]?.id ?? null,
        )
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error(error)
        setPlaces([])
        setPlacesError(getPlacesErrorMessage(error))
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPlaces(false)
        }
      }
    }

    void loadPlaces()

    return () => {
      controller.abort()
    }
  }, [placesReloadToken])

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

  const handleAddPlace = async (newPlace: PlaceDraft) => {
    setIsSubmittingPlace(true)

    try {
      const createdPlace = await createPlaceRequest(newPlace)
      setPlaces((prev) => [createdPlace, ...prev])
      setSelectedPlaceId(createdPlace.id)
    } catch (error) {
      console.error(error)
      alert(
        getPlaceActionErrorMessage(error, 'Unable to save this place right now.'),
      )
      throw error
    } finally {
      setIsSubmittingPlace(false)
    }
  }

  const handleUpdatePlace = async (placeId: number, updatedPlace: PlaceDraft) => {
    setIsSubmittingPlace(true)

    try {
      const savedPlace = await updatePlaceRequest(placeId, updatedPlace)
      setPlaces((prev) =>
        prev.map((place) => (place.id === savedPlace.id ? savedPlace : place)),
      )
      setSelectedPlaceId((currentId) =>
        currentId === savedPlace.id ? savedPlace.id : currentId,
      )
    } catch (error) {
      console.error(error)
      alert(
        getPlaceActionErrorMessage(error, 'Unable to update this place right now.'),
      )
      throw error
    } finally {
      setIsSubmittingPlace(false)
    }
  }

  const handleDeletePlace = async (placeId: number) => {
    setIsSubmittingPlace(true)

    try {
      await deletePlaceRequest(placeId)

      const nextPlaces = places.filter((place) => place.id !== placeId)
      setPlaces(nextPlaces)
      setSelectedPlaceId((currentId) =>
        currentId === placeId ? nextPlaces[0]?.id ?? null : currentId,
      )
      setEditorState((currentState) => {
        if (currentState?.mode === 'edit' && currentState.placeId === placeId) {
          return null
        }

        return currentState
      })
    } catch (error) {
      console.error(error)
      alert(
        getPlaceActionErrorMessage(error, 'Unable to delete this place right now.'),
      )
      throw error
    } finally {
      setIsSubmittingPlace(false)
    }
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
          {placesError ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
              <p>{placesError}</p>
              <button
                type="button"
                onClick={() => setPlacesReloadToken((current) => current + 1)}
                className="mt-3 underline"
              >
                Try again
              </button>
            </section>
          ) : null}

          <FiltersPanel
            search={search}
            selectedTags={selectedTags}
            allTags={allTags}
            setSearch={setSearch}
            toggleTag={toggleTag}
            resetFilters={resetFilters}
          />

          <PlacesList
            isLoading={isLoadingPlaces}
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlaceId}
            onEditPlace={(placeId) => setEditorState({ mode: 'edit', placeId })}
          />
        </aside>

        <MapView
          isLoading={isLoadingPlaces}
          selectedPlace={selectedPlace}
          places={filteredPlaces}
        />
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
        isPending={isSubmittingPlace}
        mode={editorState?.mode ?? 'add'}
        place={editingPlace}
        onClose={() => setEditorState(null)}
        onSavePlace={(place) =>
          editorState?.mode === 'edit' && editingPlace
            ? handleUpdatePlace(editingPlace.id, place)
            : handleAddPlace(place)
        }
        onDeletePlace={editorState?.mode === 'edit' ? handleDeletePlace : undefined}
      />
    </div>
  )
}

export default App
