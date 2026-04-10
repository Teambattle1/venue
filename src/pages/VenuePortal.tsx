import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Location } from '../lib/types'
import TekniskService from '../components/venue/TekniskService'
import FloorPlanSection from '../components/venue/FloorPlanSection'
import ContactsSection from '../components/venue/ContactsSection'
import VenueLocationMap from '../components/venue/VenueLocationMap'
import SessionsSection from '../components/venue/SessionsSection'

export default function VenuePortal() {
  const { code } = useParams<{ code: string }>()
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      if (!supabase || !code) return
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('venue_code', code.toUpperCase())
        .single()
      if (data) {
        setLocation(data as Location)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [code])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>Indlæser venue...</p>
      </div>
    )
  }

  if (notFound || !location) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
        <h2 style={{ fontSize: 28, color: 'var(--text)' }}>Venue ikke fundet</h2>
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>Koden "{code}" matcher ingen venue.</p>
        <Link to="/" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', marginTop: 16, textDecoration: 'none' }}>
          &larr; Tilbage til oversigt
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <Link to="/" style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', textDecoration: 'none' }}>
        &larr; Alle venues
      </Link>
      <div style={{ marginTop: 8, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>{location.name}</h1>
          {location.venue_code && (
            <span style={{
              fontFamily: 'monospace', fontSize: 14, background: 'var(--surface)',
              padding: '4px 12px', borderRadius: 'var(--r)', color: 'var(--accent)',
              fontWeight: 600, border: '1px solid var(--border)',
            }}>
              {location.venue_code}
            </span>
          )}
        </div>
        {location.address && (
          <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 15, marginTop: 8 }}>
            {location.address}
          </p>
        )}
        {/* Venue type toggle */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {(['inde', 'ude', 'begge'] as const).map(t => (
            <button
              key={t}
              onClick={async () => {
                if (!supabase) return
                await supabase.from('locations').update({ venue_type: t }).eq('id', location.id)
                setLocation({ ...location, venue_type: t })
              }}
              style={{
                padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
                background: (location.venue_type || 'begge') === t ? 'var(--accent)' : 'var(--surface2)',
                color: (location.venue_type || 'begge') === t ? '#fff' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              {t === 'inde' ? 'Kun inde' : t === 'ude' ? 'Kun ude' : 'Inde & Ude'}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div style={{ marginBottom: 24 }}>
        <SessionsSection locationName={location.name} />
      </div>

      {/* Placering på kort */}
      <div style={{ marginBottom: 24 }}>
        <VenueLocationMap
          locationId={location.id}
          lat={location.lat}
          lon={location.lon}
          venueName={location.name}
          onSave={(lat, lon) => setLocation({ ...location, lat, lon })}
        />
      </div>

      {/* Lokaleplan */}
      <div style={{ marginBottom: 24 }}>
        <FloorPlanSection
          locationId={location.id}
          venueLat={location.lat}
          venueLon={location.lon}
          venueName={location.name}
          venueType={location.venue_type || 'begge'}
        />
      </div>

      {/* Kontakter */}
      <div style={{ marginBottom: 24 }}>
        <ContactsSection
          locationId={location.id}
          contacts={location.contacts || []}
          onSave={(contacts) => setLocation({ ...location, contacts })}
        />
      </div>

      {/* Teknisk Service */}
      <div style={{ marginBottom: 24 }}>
        <TekniskService
          locationId={location.id}
          name={location.teknisk_service_name}
          phone={location.teknisk_service_phone}
          onSave={(name, phone) => setLocation({ ...location, teknisk_service_name: name, teknisk_service_phone: phone })}
        />
      </div>
    </div>
  )
}