import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createPlace } from '../../tests/fixtures'
import { PlacesList } from './PlacesList'

describe('PlacesList', () => {
  it('shows a loading empty state when places are still loading', () => {
    render(
      <PlacesList
        isLoading={true}
        places={[]}
        selectedPlace={null}
        onSelectPlace={vi.fn()}
        onEditPlace={vi.fn()}
      />,
    )

    expect(screen.getByText('Loading saved places...')).toBeInTheDocument()
  })

  it('selects and edits a place from the list', async () => {
    const user = userEvent.setup()
    const onSelectPlace = vi.fn()
    const onEditPlace = vi.fn()
    const place = createPlace()

    render(
      <PlacesList
        places={[place]}
        selectedPlace={place}
        onSelectPlace={onSelectPlace}
        onEditPlace={onEditPlace}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: /Holybelly.*Rue Lucien Sampaix/i,
      }),
    )
    await user.click(screen.getByRole('button', { name: `Edit ${place.name}` }))

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(onSelectPlace).toHaveBeenCalledWith(place.id)
    expect(onEditPlace).toHaveBeenCalledWith(place.id)
  })
})
