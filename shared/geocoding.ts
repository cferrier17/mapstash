export const MIN_ADDRESS_AUTOCOMPLETE_QUERY_LENGTH = 3

export type AddressSuggestion = {
  id: string
  label: string
  name: string
  position: [number, number]
}
