import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getCurrentPosition, filterNearby, type NearbyLocation } from '../../lib/geo'
import type { Location } from '../../lib/types'
import InstructorShell from './InstructorShell'

type LocationRow = Pick<Location, 'id' | 'name' | 'lat' | 'lon' | 'logo_url' | 'address' | 'venue_code' | 'venue_type'>

interface Props {
  onSelectVenue: (location: LocationRow) => void
  onCreateVenue: (lat: number, lon: number) => void
}

export default function NearbyScreen({ onSelectVenue, onCreateVenue }: Props) {
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLon, setUserLon] = useState<number | null>(null)
  const [allLocations, setAllLocations] = useState<LocationRow[]>([])
  const [nearby, setNearby] = useState<NearbyLocation<LocationRow>[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLocations()
    detectGps()
  }, [])

  async function loadLocations() {
    if (!supabase) return
    const { data } = await supabase
      .from('locations')
      .select('id, name, lat, lon, logo_url, address, venue_code, venue_type')
      .order('name')
    if (data) setAllLocations(data as LocationRow[])
    setLoading(false)
  }

  async function detectGps() {
    try {
      const pos = await getCurrentPosition()
      setUserLat(pos.lat)
      setUserLon(pos.lon)
      setGpsStatus('ok')
    } catch {
      setGpsStatus('error')
    }
  }

  useEffect(() => {
    if (userLat != null && userLon != null && allLocations.length > 0) {
      setNearby(filterNearby(allLocations, userLat, userLon, 5))
    }
  }, [userLat, userLon, allLocations])

  const filtered = search.trim()
    ? allLocations.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.address || '').toLowerCase().includes(search.toLowerCase())
      )
    : []

  const showNearby = gpsStatus === 'ok' && !search.trim()
  const showSearch = gpsStatus === 'error' || search.trim()

  return (
    <InstructorShell title="Instruktør">
      <div style={{ padding: 16 }}>
        {/* GPS status */}
        {gpsStatus === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 14 }}>
            Finder din placering...
          </div>
        )}

        {gpsStatus === 'error' && !search.trim() && (
          <div style={{
            background: 'var(--surface2)', borderRadius: 'var(--r)', padding: 16,
            marginBottom: 16, textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
              GPS ikke tilgængelig — søg efter venue i stedet
            </p>
          </div>
        )}

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg venue..."
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 'var(--r)',
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: 15,
            outline: 'none', marginBottom: 20,
          }}
        />

        {/* Nearby venues */}
        {showNearby && (
          <>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600 }}>
              Venues i nærheden ({nearby.length})
            </p>
            {nearby.length === 0 && !loading && (
              <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                Ingen venues fundet inden for 5 km
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {nearby.map(({ location: l, distance }) => (
                <VenueCard key={l.id} location={l} distance={distance} onClick={() => onSelectVenue(l)} />
              ))}
            </div>
          </>
        )}

        {/* Search results */}
        {showSearch && search.trim() && (
          <>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600 }}>
              Søgeresultater ({filtered.length})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {filtered.slice(0, 20).map(l => (
                <VenueCard key={l.id} location={l} onClick={() => onSelectVenue(l)} />
              ))}
            </div>
          </>
        )}

        {/* Create new venue */}
        <button
          onClick={() => onCreateVenue(userLat || 55.6761, userLon || 12.5683)}
          style={{
            width: '100%', padding: '16px', borderRadius: 'var(--r)',
            border: '2px dashed var(--border)', background: 'transparent',
            color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            fontSize: 15, fontWeight: 500, minHeight: 56,
          }}
        >
          + Opret nyt venue
        </button>
      </div>
    </InstructorShell>
  )
}

function VenueCard({ location: l, distance, onClick }: {
  location: Pick<Location, 'id' | 'name' | 'logo_url' | 'address'>
  distance?: number
  onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: 16, borderRadius: 'var(--r)', border: '1px solid var(--border)',
      background: 'var(--surface2)', cursor: 'pointer', textAlign: 'center',
      minHeight: 120,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
        background: 'var(--surface)', border: '2px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {l.logo_url ? (
          <img src={l.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
            {l.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
        {l.name}
      </span>
      {distance != null && (
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>
          {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
        </span>
      )}
    </button>
  )
}
