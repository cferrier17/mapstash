import { defaultPlaces } from '../../../shared/default-places'
import type { Place } from '../types/place'

export const initialPlaces: Place[] = defaultPlaces.map((place, index) => ({
  id: index + 1,
  ...place,
}))
