import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { Place } from '../types/place'

type ChangeMapViewProps = {
  center: [number, number]
  zoom: number
}

function ChangeMapView({ center, zoom }: ChangeMapViewProps) {
  const map = useMap()
  map.flyTo(center, zoom, { duration: 1.2 })

  return null
}

type MapViewProps = {
  selectedPlace: Place
  places: Place[]
}

export function MapView({ selectedPlace, places }: MapViewProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Carte</h2>
        <p className="text-sm text-gray-500">
          Clique sur un lieu ou ajoute-en un nouveau
        </p>
      </div>

      <div className="h-[700px] overflow-hidden rounded-2xl">
        <MapContainer
          center={selectedPlace.position}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
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
        </MapContainer>
      </div>
    </section>
  )
}