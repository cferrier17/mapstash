import { useEffect, type ComponentType, type ReactNode } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { Place } from '../types/place'

type ChangeMapViewProps = {
  center: [number, number]
  zoom: number
}

function ChangeMapView({ center, zoom }: ChangeMapViewProps) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 })
  }, [center, map, zoom])

  return null
}

type MapViewProps = {
  selectedPlace: Place | null
  places: Place[]
}

type CompatibleMapContainerProps = {
  center: [number, number]
  zoom: number
  scrollWheelZoom: boolean
  className?: string
  children?: ReactNode
}

type CompatibleTileLayerProps = {
  attribution: string
  url: string
}

const CompatibleMapContainer =
  MapContainer as ComponentType<CompatibleMapContainerProps>
const CompatibleTileLayer = TileLayer as ComponentType<CompatibleTileLayerProps>

export function MapView({ selectedPlace, places }: MapViewProps) {
  if (!selectedPlace) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Map</h2>
          <p className="text-sm text-gray-500">
            Add your first place to start exploring it on the map
          </p>
        </div>

        <div className="flex h-[700px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm text-gray-500">
          No saved place is selected right now.
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Map</h2>
        <p className="text-sm text-gray-500">
          Click a place or add a new one
        </p>
      </div>

      <div className="h-[700px] overflow-hidden rounded-2xl">
        <CompatibleMapContainer
          center={selectedPlace.position}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <CompatibleTileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ChangeMapView center={selectedPlace.position} zoom={15} />

          {places.map((place) => (
            <Marker key={place.id} position={place.position}>
              <Popup>
                <div>
                  <strong>{place.name}</strong>
                  <br />
                </div>
              </Popup>
            </Marker>
          ))}
        </CompatibleMapContainer>
      </div>
    </section>
  )
}
