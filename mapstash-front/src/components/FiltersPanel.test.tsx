import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FiltersPanel } from './FiltersPanel'

describe('FiltersPanel', () => {
  it('updates the search value and toggles tags', async () => {
    const user = userEvent.setup()
    const setSearch = vi.fn()
    const toggleTag = vi.fn()
    const resetFilters = vi.fn()

    render(
      <FiltersPanel
        search=""
        selectedTags={['coffee']}
        allTags={['brunch', 'coffee']}
        setSearch={setSearch}
        toggleTag={toggleTag}
        resetFilters={resetFilters}
      />,
    )

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'paris' },
    })
    await user.click(screen.getByRole('button', { name: 'brunch' }))
    await user.click(screen.getByRole('button', { name: 'Reset filters' }))

    expect(setSearch).toHaveBeenCalledWith('paris')
    expect(toggleTag).toHaveBeenCalledWith('brunch')
    expect(resetFilters).toHaveBeenCalledOnce()
  })
})
