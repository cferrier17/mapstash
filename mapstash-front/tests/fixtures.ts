import type { AddressSuggestion } from '../src/types/geocoding'
import type { Place } from '../src/types/place'

export function createPlace(overrides: Partial<Place> = {}): Place {
  return {
    id: 1,
    name: 'Holybelly',
    address: '5 Rue Lucien Sampaix, Paris',
    tags: ['brunch', 'coffee'],
    position: [48.8701, 2.3652],
    ...overrides,
  }
}

export function createAddressSuggestion(
  overrides: Partial<AddressSuggestion> = {},
): AddressSuggestion {
  return {
    id: 'suggestion-1',
    name: 'Holybelly',
    label: '5 Rue Lucien Sampaix, 75010 Paris',
    position: [48.8701, 2.3652],
    ...overrides,
  }
}
