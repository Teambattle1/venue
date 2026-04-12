import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Location } from '../lib/types'
import FloorPlanSection from '../components/venue/FloorPlanSection'
import ContactsSection from '../components/venue/ContactsSection'
import VenueLocationMap from '../components/venue/VenueLocationMap'

export default function ClientVenuePortal() {
  const { code } = useParams<{ code: string }>()
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Auth state
  const sessionKey = `venue_client_${code?.toUpperCase()}`
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(sessionKey) === '1')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  // Venue note editing
  const [editingVenueNote, setEditingVenueNote] = useState(false)
  const [venueNoteVal, setVenueNoteVal] = useState('')

  useEffect(() => {
    async function load() {
      if (!supabase || !code) { setLoading(false); return }
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('venue_code', code.toUpperCase())
        .single()
      if (data) {
        setLocation(data as Location)
        setVenueNoteVal(data.venue_note || '')
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [code])

  function handleLogin() {
    if (!location) return
    if (pin.toUpperCase() === (location.venue_access_code || '').toUpperCase()) {
      sessionStorage.setItem(sessionKey, '1')
      setAuthed(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  async function updateField(field: string, value: any) {
    if (!supabase || !location) return
    await supabase.from('locations').update({ [field]: value }).eq('id', location.id)
    setLocation({ ...location, [field]: value })
  }

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
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>Koden &ldquo;{code}&rdquo; matcher ingen venue.</p>
      </div>
    )
  }

  // PIN login popup
  if (!authed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: 20,
      }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--r)', padding: 32,
          maxWidth: 360, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {location.logo_url && (
            <img src={location.logo_url} alt="" style={{
              width: 64, height: 64, objectFit: 'contain', borderRadius: 'var(--r)',
              margin: '0 auto 16px',
            }} />
          )}
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>{location.name}</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginBottom: 24 }}>
            Indtast din adgangskode for at fortsætte
          </p>

          <input
            value={pin}
            onChange={e => { setPin(e.target.value.toUpperCase().slice(0, 4)); setPinError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="KODE"
            maxLength={4}
            autoFocus
            style={{
              width: '100%', padding: '16px', borderRadius: 'var(--r)',
              border: `2px solid ${pinError ? 'var(--red, #c03030)' : 'var(--border)'}`,
              background: 'var(--surface2)', color: 'var(--text)',
              fontFamily: 'monospace', fontSize: 28, fontWeight: 700,
              textAlign: 'center', letterSpacing: '0.3em',
              outline: 'none', textTransform: 'uppercase',
            }}
          />

          {pinError && (
            <p style={{ color: 'var(--red, #c03030)', fontSize: 12, marginTop: 8, fontFamily: 'Outfit, sans-serif' }}>
              Forkert kode
            </p>
          )}

          <button onClick={handleLogin} disabled={pin.length < 4} style={{
            width: '100%', padding: '14px', borderRadius: 'var(--r)',
            background: 'var(--accent)', border: 'none', color: '#fff',
            fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', marginTop: 16, minHeight: 48,
            opacity: pin.length < 4 ? 0.5 : 1,
          }}>
            Log ind
          </button>
        </div>
      </div>
    )
  }

  // Authenticated: show limited portal
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          {location.logo_url && (
            <img src={location.logo_url} alt="" style={{
              width: 48, height: 48, objectFit: 'contain', borderRadius: 'var(--r)',
            }} />
          )}
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>{location.name}</h1>
            {location.address && (
              <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>
                {location.address}{location.postal_code ? `, ${location.postal_code}` : ''}
              </p>
            )}
          </div>
        </div>
        {(location.phone || location.website) && (
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontFamily: 'Outfit, sans-serif' }}>
            {location.phone && <span style={{ color: 'var(--muted)' }}>{location.phone}</span>}
            {location.website && (
              <a href={location.website.startsWith('http') ? location.website : `https://${location.website}`}
                target="_blank" rel="noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                {location.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Venue Note (editable by venue) */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--r)', padding: '16px 20px',
          boxShadow: 'var(--shadow)', borderLeft: '3px solid var(--accent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
              Note fra venue
            </h3>
            {!editingVenueNote && (
              <button onClick={() => setEditingVenueNote(true)} style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11, padding: 0,
              }}>
                Rediger
              </button>
            )}
          </div>
          {editingVenueNote ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={venueNoteVal} onChange={e => setVenueNoteVal(e.target.value)}
                placeholder="Skriv en note til os..."
                rows={4}
                style={{
                  padding: '10px 12px', borderRadius: 'var(--r)',
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: 14,
                  outline: 'none', width: '100%', resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditingVenueNote(false); setVenueNoteVal(location.venue_note || '') }}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 'var(--r)', padding: '6px 14px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 12 }}>
                  Annuller
                </button>
                <button onClick={() => { updateField('venue_note', venueNoteVal.trim() || null); setEditingVenueNote(false) }}
                  style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 'var(--r)', padding: '6px 14px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500 }}>
                  Gem
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: location.venue_note ? 'var(--text)' : 'var(--muted)', fontFamily: 'Outfit, sans-serif', whiteSpace: 'pre-wrap', fontStyle: location.venue_note ? 'normal' : 'italic' }}>
              {location.venue_note || 'Ingen note endnu — klik "Rediger" for at tilføje...'}
            </p>
          )}
        </div>

        {/* Contacts */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', padding: '16px 20px', boxShadow: 'var(--shadow)' }}>
          <ContactsSection
            locationId={location.id}
            contacts={location.contacts || []}
            onSave={(contacts) => setLocation({ ...location, contacts })}
          />
        </div>

        {/* Map (read-only) */}
        {(location.lat || location.lon) && (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', padding: '16px 20px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
              Placering
            </h3>
            <VenueLocationMap
              locationId={location.id}
              lat={location.lat} lon={location.lon}
              venueName={location.name}
              onSave={(lat, lon) => setLocation({ ...location, lat, lon })}
            />
          </div>
        )}

        {/* Spaces (FloorPlanSection) */}
        <FloorPlanSection
          locationId={location.id}
          venueLat={location.lat}
          venueLon={location.lon}
          venueName={location.name}
          venueType={location.venue_type || 'begge'}
          adgangNote={location.adgang_note}
          onAdgangSave={(note) => setLocation({ ...location, adgang_note: note })}
        />
      </div>
    </div>
  )
}
