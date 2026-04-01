import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAddressSuggestion, createPlace } from '../../tests/fixtures'
import { AddPlaceModal } from './AddPlaceModal'

const mockUseAddressAutocomplete = vi.fn()

vi.mock('../hooks/useAddressAutocomplete', () => ({
  useAddressAutocomplete: (...args: unknown[]) =>
    mockUseAddressAutocomplete(...args),
}))

describe('AddPlaceModal', () => {
  beforeEach(() => {
    mockUseAddressAutocomplete.mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: '',
      suppressNextSearch: vi.fn(),
    })
  })

  it('submits a normalized place draft and closes the modal', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSavePlace = vi.fn().mockResolvedValue(undefined)

    render(
      <AddPlaceModal
        isOpen={true}
        mode="add"
        onClose={onClose}
        onSavePlace={onSavePlace}
      />,
    )

    await user.type(screen.getByLabelText('Name'), '  Holybelly  ')
    await user.type(
      screen.getByLabelText('Address'),
      ' 5 Rue Lucien Sampaix, Paris ',
    )
    await user.type(screen.getByLabelText('Tags'), ' brunch, coffee ,  date spot ')
    await user.type(screen.getByLabelText('Latitude'), '48.8701')
    await user.type(screen.getByLabelText('Longitude'), '2.3652')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(onSavePlace).toHaveBeenCalledWith({
        name: 'Holybelly',
        address: '5 Rue Lucien Sampaix, Paris',
        tags: ['brunch', 'coffee', 'date spot'],
        position: [48.8701, 2.3652],
      })
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('fills the form from an address suggestion', async () => {
    const user = userEvent.setup()
    const suggestion = createAddressSuggestion()
    const suppressNextSearch = vi.fn()

    mockUseAddressAutocomplete.mockReturnValue({
      suggestions: [suggestion],
      isLoading: false,
      error: '',
      suppressNextSearch,
    })

    render(
      <AddPlaceModal
        isOpen={true}
        mode="add"
        onClose={vi.fn()}
        onSavePlace={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    await user.type(screen.getByLabelText('Address'), 'hol')
    await user.click(
      screen.getByRole('button', {
        name: /Holybelly.*75010 Paris/i,
      }),
    )

    expect(suppressNextSearch).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Name')).toHaveValue(suggestion.name)
    expect(screen.getByLabelText('Address')).toHaveValue(suggestion.label)
    expect(screen.getByLabelText('Latitude')).toHaveValue(suggestion.position[0])
    expect(screen.getByLabelText('Longitude')).toHaveValue(suggestion.position[1])
  })

  it('deletes a place after confirmation in edit mode', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onDeletePlace = vi.fn().mockResolvedValue(undefined)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const place = createPlace()

    render(
      <AddPlaceModal
        isOpen={true}
        mode="edit"
        place={place}
        onClose={onClose}
        onSavePlace={vi.fn().mockResolvedValue(undefined)}
        onDeletePlace={onDeletePlace}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Delete place' }))

    await waitFor(() => {
      expect(onDeletePlace).toHaveBeenCalledWith(place.id)
    })
    expect(onClose).toHaveBeenCalledOnce()
    expect(confirmSpy).toHaveBeenCalledWith(`Delete "${place.name}"?`)

    confirmSpy.mockRestore()
  })
})
