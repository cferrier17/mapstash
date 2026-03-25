import { useEffect } from 'react'
import type { Place } from '../types/place'

type AddPlaceModalProps = {
  isOpen: boolean
  onClose: () => void
  onAddPlace: (place: Place) => void
  name: string
  address: string
  tags: string
  lat: string
  lng: string
  setName: (value: string) => void
  setAddress: (value: string) => void
  setTags: (value: string) => void
  setLat: (value: string) => void
  setLng: (value: string) => void
  resetForm: () => void
}

export function AddPlaceModal({
  isOpen,
  onClose,
  onAddPlace,
  name,
  address,
  tags,
  lat,
  lng,
  setName,
  setAddress,
  setTags,
  setLat,
  setLng,
  resetForm,
}: AddPlaceModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        resetForm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, resetForm])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const parsedLat = Number(lat)
    const parsedLng = Number(lng)

    if (
      !name.trim() ||
      !address.trim() ||
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng)
    ) {
      alert('Please enter a valid name, address, latitude, and longitude.')
      return
    }

    const newPlace: Place = {
      id: Date.now(),
      name: name.trim(),
      address: address.trim(),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      position: [parsedLat, parsedLng],
    }

    onAddPlace(newPlace)
    resetForm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        onClose()
        resetForm()
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Add a place</h2>
            <p className="text-sm text-gray-500">
              Fill in the details for your new spot
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose()
              resetForm()
            }}
            className="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-black"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Ex: Holybelly"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              type="text"
              placeholder="Ex: 5 Rue Lucien Sampaix, Paris"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              type="text"
              placeholder="E.g. brunch, coffee, to try"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Latitude</label>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                type="number"
                step="any"
                placeholder="48.8566"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Longitude</label>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                type="number"
                step="any"
                placeholder="2.3522"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                resetForm()
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
