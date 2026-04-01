import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createPlace as createPlaceFixture } from '../tests/fixtures'
import type { PlaceDraft } from './types/place'
import { PlacesApiError } from './services/places'

const placeServiceMocks = vi.hoisted(() => ({
  fetchPlaces: vi.fn(),
  createPlace: vi.fn(),
  updatePlace: vi.fn(),
  deletePlace: vi.fn(),
}))

const modalDraft: PlaceDraft = {
  name: 'Du Pain et des Idees',
  address: '34 Rue Yves Toudic, Paris',
  tags: ['bakery', 'breakfast'],
  position: [48.872, 2.3639],
}

vi.mock('./services/places', () => ({
  fetchPlaces: placeServiceMocks.fetchPlaces,
  createPlace: placeServiceMocks.createPlace,
  updatePlace: placeServiceMocks.updatePlace,
  deletePlace: placeServiceMocks.deletePlace,
  PlacesApiError: class PlacesApiError extends Error {
    status?: number
    code: 'network' | 'http'

    constructor(
      message: string,
      options: {
        code: 'network' | 'http'
        status?: number
      },
    ) {
      super(message)
      this.name = 'PlacesApiError'
      this.code = options.code
      this.status = options.status
    }
  },
}))

vi.mock('./components/FiltersPanel', () => ({
  FiltersPanel: ({
    search,
    selectedTags,
    allTags,
    setSearch,
    toggleTag,
    resetFilters,
  }: {
    search: string
    selectedTags: string[]
    allTags: string[]
    setSearch: (value: string) => void
    toggleTag: (tag: string) => void
    resetFilters: () => void
  }) => (
    <section data-testid="filters-panel">
      <p data-testid="filters-search">{search || 'empty'}</p>
      <p data-testid="filters-selected-tags">{selectedTags.join('|') || 'none'}</p>
      <p data-testid="filters-all-tags">{allTags.join('|') || 'none'}</p>
      <button type="button" onClick={() => setSearch('holy')}>
        Search holy
      </button>
      <button type="button" onClick={() => toggleTag('coffee')}>
        Toggle coffee
      </button>
      <button type="button" onClick={resetFilters}>
        Reset filters
      </button>
    </section>
  ),
}))

vi.mock('./components/PlacesList', () => ({
  PlacesList: ({
    isLoading,
    places,
    selectedPlace,
    onSelectPlace,
    onEditPlace,
  }: {
    isLoading?: boolean
    places: Array<{ id: number; name: string }>
    selectedPlace: { id: number; name: string } | null
    onSelectPlace: (placeId: number) => void
    onEditPlace: (placeId: number) => void
  }) => (
    <section data-testid="places-list">
      <p data-testid="places-loading">{String(isLoading)}</p>
      <p data-testid="places-list-names">{places.map((place) => place.name).join('|')}</p>
      <p data-testid="places-selected">{selectedPlace?.name ?? 'none'}</p>
      {places.map((place) => (
        <div key={place.id}>
          <button type="button" onClick={() => onSelectPlace(place.id)}>
            Select {place.name}
          </button>
          <button type="button" onClick={() => onEditPlace(place.id)}>
            Edit {place.name}
          </button>
        </div>
      ))}
    </section>
  ),
}))

vi.mock('./components/MapView', () => ({
  MapView: ({
    isLoading,
    selectedPlace,
    places,
  }: {
    isLoading?: boolean
    selectedPlace: { name: string } | null
    places: Array<{ name: string }>
  }) => (
    <section data-testid="map-view">
      <p data-testid="map-loading">{String(isLoading)}</p>
      <p data-testid="map-selected">{selectedPlace?.name ?? 'none'}</p>
      <p data-testid="map-place-names">{places.map((place) => place.name).join('|')}</p>
    </section>
  ),
}))

vi.mock('./components/AddPlaceModal', () => ({
  AddPlaceModal: ({
    isOpen,
    isPending,
    mode,
    place,
    onClose,
    onSavePlace,
    onDeletePlace,
  }: {
    isOpen: boolean
    isPending?: boolean
    mode: 'add' | 'edit'
    place?: { id: number; name: string } | null
    onClose: () => void
    onSavePlace: (place: PlaceDraft) => Promise<void>
    onDeletePlace?: (placeId: number) => Promise<void>
  }) =>
    isOpen ? (
      <section data-testid="add-place-modal">
        <p data-testid="modal-mode">{mode}</p>
        <p data-testid="modal-place">{place?.name ?? 'none'}</p>
        <p data-testid="modal-pending">{String(isPending)}</p>
        <button
          type="button"
          onClick={async () => {
            await onSavePlace(modalDraft)
            onClose()
          }}
        >
          Save place
        </button>
        {onDeletePlace ? (
          <button
            type="button"
            onClick={async () => {
              await onDeletePlace(place?.id ?? -1)
              onClose()
            }}
          >
            Delete place
          </button>
        ) : null}
        <button type="button" onClick={onClose}>
          Close modal
        </button>
      </section>
    ) : (
      <p data-testid="modal-closed">closed</p>
    ),
}))

describe('App', () => {
  beforeEach(() => {
    placeServiceMocks.fetchPlaces.mockReset()
    placeServiceMocks.createPlace.mockReset()
    placeServiceMocks.updatePlace.mockReset()
    placeServiceMocks.deletePlace.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('loads places and coordinates selection plus filters across children', async () => {
    const user = userEvent.setup()
    const holybelly = createPlaceFixture({
      id: 1,
      name: 'Holybelly',
      tags: ['coffee', 'brunch'],
    })
    const septime = createPlaceFixture({
      id: 2,
      name: 'Septime',
      address: '80 Rue de Charonne, Paris',
      tags: ['french'],
    })

    placeServiceMocks.fetchPlaces.mockResolvedValue([holybelly, septime])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('places-list-names')).toHaveTextContent(
        'Holybelly|Septime',
      )
    })

    expect(screen.getByTestId('filters-all-tags')).toHaveTextContent(
      'brunch|coffee|french',
    )
    expect(screen.getByTestId('places-selected')).toHaveTextContent('Holybelly')
    expect(screen.getByTestId('map-selected')).toHaveTextContent('Holybelly')

    await user.click(screen.getByRole('button', { name: 'Select Septime' }))

    expect(screen.getByTestId('places-selected')).toHaveTextContent('Septime')
    expect(screen.getByTestId('map-selected')).toHaveTextContent('Septime')

    await user.click(screen.getByRole('button', { name: 'Search holy' }))

    expect(screen.getByTestId('filters-search')).toHaveTextContent('holy')
    expect(screen.getByTestId('places-list-names')).toHaveTextContent('Holybelly')
    expect(screen.getByTestId('map-selected')).toHaveTextContent('Holybelly')

    await user.click(screen.getByRole('button', { name: 'Reset filters' }))

    expect(screen.getByTestId('filters-search')).toHaveTextContent('empty')
    expect(screen.getByTestId('places-list-names')).toHaveTextContent(
      'Holybelly|Septime',
    )
  })

  it('retries loading places after an API error', async () => {
    const user = userEvent.setup()
    const holybelly = createPlaceFixture()

    placeServiceMocks.fetchPlaces
      .mockRejectedValueOnce(
        new PlacesApiError('Saved places backend is unavailable.', {
          code: 'network',
        }),
      )
      .mockResolvedValueOnce([holybelly])

    render(<App />)

    expect(
      await screen.findByText('Saved places backend is unavailable.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => {
      expect(placeServiceMocks.fetchPlaces).toHaveBeenCalledTimes(2)
    })
    expect(screen.getByTestId('places-list-names')).toHaveTextContent('Holybelly')
  })

  it('creates a place from the add modal and selects it', async () => {
    const user = userEvent.setup()
    const holybelly = createPlaceFixture()
    const newPlace = createPlaceFixture({
      id: 99,
      name: 'Du Pain et des Idees',
      address: modalDraft.address,
      tags: modalDraft.tags,
      position: modalDraft.position,
    })

    placeServiceMocks.fetchPlaces.mockResolvedValue([holybelly])
    placeServiceMocks.createPlace.mockResolvedValue(newPlace)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('places-list-names')).toHaveTextContent('Holybelly')
    })

    await user.click(screen.getByRole('button', { name: 'Add a place' }))

    expect(screen.getByTestId('modal-mode')).toHaveTextContent('add')
    expect(screen.getByTestId('modal-place')).toHaveTextContent('none')

    await user.click(screen.getByRole('button', { name: 'Save place' }))

    await waitFor(() => {
      expect(placeServiceMocks.createPlace).toHaveBeenCalledWith(modalDraft)
    })
    expect(screen.getByTestId('places-list-names')).toHaveTextContent(
      'Du Pain et des Idees|Holybelly',
    )
    expect(screen.getByTestId('map-selected')).toHaveTextContent(
      'Du Pain et des Idees',
    )
    expect(screen.getByTestId('modal-closed')).toHaveTextContent('closed')
  })

  it('updates an existing place from edit mode', async () => {
    const user = userEvent.setup()
    const holybelly = createPlaceFixture()
    const septime = createPlaceFixture({
      id: 2,
      name: 'Septime',
      address: '80 Rue de Charonne, Paris',
      tags: ['french'],
    })
    const updatedSeptime = {
      ...septime,
      name: 'Septime Renovated',
      address: modalDraft.address,
      tags: modalDraft.tags,
      position: modalDraft.position,
    }

    placeServiceMocks.fetchPlaces.mockResolvedValue([holybelly, septime])
    placeServiceMocks.updatePlace.mockResolvedValue(updatedSeptime)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('places-list-names')).toHaveTextContent(
        'Holybelly|Septime',
      )
    })

    await user.click(screen.getByRole('button', { name: 'Select Septime' }))
    await user.click(screen.getByRole('button', { name: 'Edit Septime' }))

    expect(screen.getByTestId('modal-mode')).toHaveTextContent('edit')
    expect(screen.getByTestId('modal-place')).toHaveTextContent('Septime')

    await user.click(screen.getByRole('button', { name: 'Save place' }))

    await waitFor(() => {
      expect(placeServiceMocks.updatePlace).toHaveBeenCalledWith(2, modalDraft)
    })
    expect(screen.getByTestId('places-list-names')).toHaveTextContent(
      'Holybelly|Septime Renovated',
    )
    expect(screen.getByTestId('places-selected')).toHaveTextContent(
      'Septime Renovated',
    )
    expect(screen.getByTestId('modal-closed')).toHaveTextContent('closed')
  })

  it('deletes the edited place and falls back to the remaining selection', async () => {
    const user = userEvent.setup()
    const holybelly = createPlaceFixture()
    const septime = createPlaceFixture({
      id: 2,
      name: 'Septime',
      address: '80 Rue de Charonne, Paris',
      tags: ['french'],
    })

    placeServiceMocks.fetchPlaces.mockResolvedValue([holybelly, septime])
    placeServiceMocks.deletePlace.mockResolvedValue(undefined)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('places-list-names')).toHaveTextContent(
        'Holybelly|Septime',
      )
    })

    await user.click(screen.getByRole('button', { name: 'Select Septime' }))
    await user.click(screen.getByRole('button', { name: 'Edit Septime' }))
    await user.click(screen.getByRole('button', { name: 'Delete place' }))

    await waitFor(() => {
      expect(placeServiceMocks.deletePlace).toHaveBeenCalledWith(2)
    })
    expect(screen.getByTestId('places-list-names')).toHaveTextContent('Holybelly')
    expect(screen.getByTestId('places-selected')).toHaveTextContent('Holybelly')
    expect(screen.getByTestId('map-selected')).toHaveTextContent('Holybelly')
    expect(screen.getByTestId('modal-closed')).toHaveTextContent('closed')
  })
})
