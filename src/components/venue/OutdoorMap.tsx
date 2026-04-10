import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { VenueSpace } from '../../lib/types'

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface Props {
  centerLat?: number | null
  centerLon?: number | null
  spaces?: VenueSpace[]
  editable?: boolean
  onPinPlace?: (lat: number, lon: number) => void
  editLat?: number | null
  editLon?: number | null
  pinLat?: number | null
  pinLon?: number | null
  height?: number
  venueName?: string
}

export default function OutdoorMap({
  centerLat, centerLon, spaces = [], editable = false,
  onPinPlace, editLat, editLon, pinLat, pinLon, height = 350,
  venueName,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const editMarker = useRef<L.Marker | null>(null)
  const [ready, setReady] = useState(false)
  const [movedAway, setMovedAway] = useState(false)

  const center: [number, number] = [centerLat || 55.6761, centerLon || 12.5683]
  const zoom = centerLat ? 15 : 7

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    mapInstance.current = map
    setReady(true)

    // Track if user moved away from center
    if (centerLat && centerLon) {
      const initialZoom = zoom
      function checkMoved() {
        const c = map.getCenter()
        const dist = map.distance(c, L.latLng(centerLat!, centerLon!))
        const zoomDiff = Math.abs(map.getZoom() - initialZoom)
        setMovedAway(dist > 200 || zoomDiff > 2)
      }
      map.on('moveend', checkMoved)
      map.on('zoomend', checkMoved)
    }

    return () => { map.remove(); mapInstance.current = null }
  }, [])

  function returnToCenter() {
    const map = mapInstance.current
    if (!map) return
    map.setView(center, zoom)
    setMovedAway(false)
  }

  // Add space markers
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready) return

    const markers: L.Marker[] = []
    spaces.filter(s => s.lat && s.lon).forEach(s => {
      const m = L.marker([s.lat!, s.lon!]).addTo(map)
      m.bindPopup(`<b>${s.name}</b>${s.note ? `<br/>${s.note}` : ''}`)
      markers.push(m)
    })

    return () => { markers.forEach(m => m.remove()) }
  }, [spaces, ready])

  // Static pin (read-only display)
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready || editable) return
    if (!pinLat || !pinLon) return

    const marker = L.marker([pinLat, pinLon]).addTo(map)
    return () => { marker.remove() }
  }, [pinLat, pinLon, ready, editable])

  // Editable pin
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready || !editable) return

    if (editLat && editLon) {
      if (editMarker.current) {
        editMarker.current.setLatLng([editLat, editLon])
      } else {
        editMarker.current = L.marker([editLat, editLon], { draggable: true }).addTo(map)
        editMarker.current.on('dragend', () => {
          const pos = editMarker.current!.getLatLng()
          onPinPlace?.(pos.lat, pos.lng)
        })
      }
      map.setView([editLat, editLon], Math.max(map.getZoom(), 14))
    }

    function handleClick(e: L.LeafletMouseEvent) {
      onPinPlace?.(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handleClick)
    return () => { map.off('click', handleClick) }
  }, [editable, editLat, editLon, ready])

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%', height, borderRadius: 'var(--r)',
          overflow: 'hidden', border: '1px solid var(--border)',
        }}
      />
      {movedAway && centerLat && (
        <button
          onClick={returnToCenter}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1000,
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 'var(--r)', padding: '6px 14px', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Retur til {venueName || 'placering'}
        </button>
      )}
    </div>
  )
}
