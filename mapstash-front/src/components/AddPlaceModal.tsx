import { useEffect, useState } from 'react'
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete'
import {
  MIN_ADDRESS_AUTOCOMPLETE_QUERY_LENGTH,
  type AddressSuggestion,
} from '../types/geocoding'
import type { Place } from '../types/place'

type AddPlaceModalProps = {
  isOpen: boolean
  mode: 'add' | 'edit'
  place?: Place | null
  onClose: () => void
  onSavePlace: (place: Place) => void
  onDeletePlace?: (placeId: number) => void
}

type PlaceFormState = {
  name: string
  address: string
  tags: string
  lat: string
  lng: string
}

function getInitialFormState(place?: Place | null): PlaceFormState {
  return {
    name: place?.name ?? '',
    address: place?.address ?? '',
    tags: place?.tags.join(', ') ?? '',
    lat: String(place?.position[0] ?? ''),
    lng: String(place?.position[1] ?? ''),
  }
}

export function AddPlaceModal({
  isOpen,
  mode,
  place,
  onClose,
  onSavePlace,
  onDeletePlace,
}: AddPlaceModalProps) {
  const [formState, setFormState] = useState<PlaceFormState>(() =>
    getInitialFormState(place),
  )
  const [isAddressSuggestionsOpen, setIsAddressSuggestionsOpen] = useState(false)
  const {
    suggestions: addressSuggestions,
    isLoading: isSearchingAddresses,
    error: addressSearchError,
    suppressNextSearch,
  } = useAddressAutocomplete({
    enabled: isOpen && isAddressSuggestionsOpen,
    query: formState.address,
  })

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isEditing = mode === 'edit' && place != null
  const title = isEditing ? 'Edit place' : 'Add a place'
  const description = isEditing
    ? 'Update the details for this saved spot'
    : 'Fill in the details for your new spot'
  const submitLabel = isEditing ? 'Save changes' : 'Add'

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    suppressNextSearch()
    setIsAddressSuggestionsOpen(false)
    setFormState((current) => ({
      ...current,
      address: suggestion.label,
      lat: String(suggestion.position[0]),
      lng: String(suggestion.position[1]),
      name: current.name.trim() ? current.name : suggestion.name,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const parsedLat = Number(formState.lat)
    const parsedLng = Number(formState.lng)

    if (
      !formState.name.trim() ||
      !formState.address.trim() ||
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng)
    ) {
      alert('Please enter a valid name, address, latitude, and longitude.')
      return
    }

    const nextPlace: Place = {
      id: isEditing ? place!.id : Date.now(),
      name: formState.name.trim(),
      address: formState.address.trim(),
      tags: formState.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      position: [parsedLat, parsedLng],
    }

    onSavePlace(nextPlace)
    onClose()
  }

  const handleDelete = () => {
    if (!isEditing || !place || !onDeletePlace) return

    const shouldDelete = window.confirm(`Delete "${place.name}"?`)
    if (!shouldDelete) return

    onDeletePlace(place.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-black"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              value={formState.name}
              onChange={(e) =>
                setFormState((current) => ({ ...current, name: e.target.value }))
              }
              type="text"
              placeholder="Ex: Holybelly"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>
            <div className="relative">
              <input
                value={formState.address}
                onChange={(e) => {
                  const nextAddress = e.target.value
                  setFormState((current) => ({
                    ...current,
                    address: nextAddress,
                  }))
                  setIsAddressSuggestionsOpen(
                    nextAddress.trim().length >=
                      MIN_ADDRESS_AUTOCOMPLETE_QUERY_LENGTH,
                  )
                }}
                onFocus={() => {
                  setIsAddressSuggestionsOpen(
                    formState.address.trim().length >=
                      MIN_ADDRESS_AUTOCOMPLETE_QUERY_LENGTH,
                  )
                }}
                type="text"
                placeholder="Ex: 5 Rue Lucien Sampaix, Paris"
                autoComplete="off"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />

              {isAddressSuggestionsOpen &&
                (formState.address.trim().length >=
                  MIN_ADDRESS_AUTOCOMPLETE_QUERY_LENGTH ||
                  addressSearchError) && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {isSearchingAddresses ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Looking up addresses...
                    </div>
                  ) : null}

                  {!isSearchingAddresses && addressSearchError ? (
                    <div className="px-3 py-2 text-sm text-red-600">
                      {addressSearchError}
                    </div>
                  ) : null}

                  {!isSearchingAddresses &&
                  !addressSearchError &&
                  formState.address.trim().length >=
                    MIN_ADDRESS_AUTOCOMPLETE_QUERY_LENGTH &&
                  addressSuggestions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No address matches found.
                    </div>
                  ) : null}

                  {!isSearchingAddresses &&
                    !addressSearchError &&
                    addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleSelectAddressSuggestion(suggestion)}
                        className="block w-full border-t border-gray-100 px-3 py-2 text-left transition first:border-t-0 hover:bg-gray-50"
                      >
                        <span className="block text-sm font-medium text-gray-900">
                          {suggestion.name}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {suggestion.label}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tags</label>
            <input
              value={formState.tags}
              onChange={(e) =>
                setFormState((current) => ({ ...current, tags: e.target.value }))
              }
              type="text"
              placeholder="E.g. brunch, coffee, to try"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Latitude</label>
              <input
                value={formState.lat}
                onChange={(e) =>
                  setFormState((current) => ({ ...current, lat: e.target.value }))
                }
                type="number"
                step="any"
                placeholder="48.8566"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Longitude</label>
              <input
                value={formState.lng}
                onChange={(e) =>
                  setFormState((current) => ({ ...current, lng: e.target.value }))
                }
                type="number"
                step="any"
                placeholder="2.3522"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="mr-auto rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50"
              >
                Delete place
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
