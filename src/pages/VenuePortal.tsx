import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Location } from '../lib/types'
import { STATUS_COLORS } from '../lib/types'
import TekniskService from '../components/venue/TekniskService'
import FloorPlanSection from '../components/venue/FloorPlanSection'
import ContactsSection from '../components/venue/ContactsSection'
import VenueLocationMap from '../components/venue/VenueLocationMap'
import SessionsSection from '../components/venue/SessionsSection'
import VenueTodos from '../components/venue/VenueTodos'

export default function VenuePortal() {
  const { code } = useParams<{ code: string }>()
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesVal, setNotesVal] = useState('')
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
        setNotesVal(data.notes || '')
        setVenueNoteVal(data.venue_note || '')
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
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>Indl\u00e6ser venue...</p>
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

  async function updateField(field: string, value: any) {
    if (!supabase || !location) return
    await supabase.from('locations').update({ [field]: value }).eq('id', location.id)
    setLocation({ ...location, [field]: value })
  }

  const statusColor = STATUS_COLORS[location.crm_status] || '#8a8578'

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '16px 20px 80px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Link to="/" style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', textDecoration: 'none' }}>
          &larr; Alle venues
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>{location.name}</h1>
          {location.venue_code && (
            <span style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--surface)', padding: '3px 10px', borderRadius: 'var(--r)', color: 'var(--accent)', fontWeight: 600, border: '1px solid var(--border)' }}>
              {location.venue_code}
            </span>
          )}
          {location.venue_access_code && (
            <span title="Client adgangskode" style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--surface)', padding: '3px 8px', borderRadius: 'var(--r)', color: '#9f7aea', fontWeight: 600, border: '1px solid var(--border)' }}>
              {location.venue_access_code}
            </span>
          )}
          {location.venue_code && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/c/${location.venue_code}`
                navigator.clipboard.writeText(url).catch(() => {})
              }}
              title="Kopiér client link"
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)',
              }}
            >
              /c/{location.venue_code} &#128203;
            </button>
          )}
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0 }} title={location.crm_status} />
          <span style={{ fontSize: 11, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
            {location.crm_status}
          </span>
        </div>
        {/* Venue type toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['inde', 'ude', 'begge'] as const).map(t => (
            <button key={t} onClick={() => updateField('venue_type', t)} style={{
              padding: '3px 12px', borderRadius: 16, border: 'none', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 500,
              background: (location.venue_type || 'begge') === t ? 'var(--accent)' : 'var(--surface2)',
              color: (location.venue_type || 'begge') === t ? '#fff' : 'var(--muted)',
              transition: 'all 0.2s',
            }}>
              {t === 'inde' ? 'Kun inde' : t === 'ude' ? 'Kun ude' : 'Inde & Ude'}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 50%', gap: 16, alignItems: 'start' }}>

        {/* === KOLONNE 1: Venue Info === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Stamdata */}
          <Section title="Venue Info">
            {location.logo_url && (
              <img src={location.logo_url} alt="" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 'var(--r)', marginBottom: 8 }} />
            )}
            <InfoRow label="Adresse" value={location.address} field="address" onSave={updateField} />
            <InfoRow label="Postnr" value={location.postal_code} field="postal_code" onSave={updateField} />
            <InfoRow label="By" value={location.city} field="city" onSave={updateField} />
            <InfoRow label="Region" value={location.region} field="region" onSave={updateField} />
            <InfoRow label="Telefon" value={location.phone} field="phone" onSave={updateField} link={location.phone ? `tel:${location.phone}` : undefined} />
            <InfoRow label="Website" value={location.website} field="website" onSave={updateField} link={location.website} />

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {location.linkedin && (
                <SocialIcon href={location.linkedin} title="LinkedIn" svg={<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />} />
              )}
              {location.instagram && (
                <SocialIcon href={location.instagram.startsWith('http') ? location.instagram : `https://instagram.com/${location.instagram.replace('@','')}`} title="Instagram" svg={<><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>} />
              )}
              {location.facebook && (
                <SocialIcon href={location.facebook} title="Facebook" svg={<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />} />
              )}
            </div>

            {/* Flags */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <FlagBadge label="Bureau" active={!!location.is_bureau} onClick={() => updateField('is_bureau', !location.is_bureau)} />
              <FlagBadge label="Lead" active={!!location.is_lead} onClick={() => updateField('is_lead', !location.is_lead)} />
            </div>

            {/* Kategorier */}
            {location.ef_venue_category && location.ef_venue_category.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={labelSm}>Kategorier</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                  {location.ef_venue_category.map(c => (
                    <span key={c} style={{ fontSize: 10, background: 'var(--surface2)', padding: '2px 8px', borderRadius: 4, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Aktivitetslog - kompakte datofelter */}
            <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <DateField
                label="Senest kontaktet"
                date={location.last_contacted_at}
                note={location.last_contacted_note}
                onSave={(date, note) => { updateField('last_contacted_at', date); updateField('last_contacted_note', note) }}
              />
              <DateField
                label="Senest besøgt"
                date={location.last_visited_at}
                note={location.last_visited_note}
                onSave={(date, note) => { updateField('last_visited_at', date); updateField('last_visited_note', note) }}
              />
            </div>
          </Section>

          {/* Interne noter */}
          <Section title="Interne noter">
            <div onClick={() => setEditingNotes(true)} style={{ cursor: 'pointer', minHeight: 32 }}>
              {location.notes ? (
                <p style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}>{location.notes}</p>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontStyle: 'italic' }}>Klik for at redigere...</p>
              )}
            </div>
          </Section>

          {/* Notes modal */}
          {editingNotes && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              onClick={() => { setEditingNotes(false); setNotesVal(location.notes || '') }}>
              <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--surface)', borderRadius: 'var(--r)', padding: 24,
                width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Interne noter — {location.name}</h3>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <FmtBtn label="B" style="bold" onClick={() => wrapSelection('notesTextarea', '**', '**')} />
                  <FmtBtn label="I" style="italic" onClick={() => wrapSelection('notesTextarea', '_', '_')} />
                  <FmtBtn label="—" style="normal" onClick={() => insertAtCursor('notesTextarea', '\n---\n', setNotesVal)} />
                  <FmtBtn label="• Liste" style="normal" onClick={() => insertAtCursor('notesTextarea', '\n• ', setNotesVal)} />
                </div>
                <textarea
                  id="notesTextarea"
                  value={notesVal}
                  onChange={e => setNotesVal(e.target.value)}
                  rows={20}
                  style={{ ...inputStyle, flex: 1, minHeight: 300, fontSize: 13, lineHeight: 1.6 }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <SmBtn label="Annuller" onClick={() => { setEditingNotes(false); setNotesVal(location.notes || '') }} />
                  <SmBtn label="Gem noter" accent onClick={() => { updateField('notes', notesVal || null); setEditingNotes(false) }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === KOLONNE 2: CRM & Opgaver === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Kontakter */}
          <ContactsSection
            locationId={location.id}
            contacts={location.contacts || []}
            onSave={(contacts) => setLocation({ ...location, contacts })}
          />

          {/* Teknisk Service */}
          <TekniskService
            locationId={location.id}
            name={location.teknisk_service_name}
            phone={location.teknisk_service_phone}
            onSave={(name, phone) => setLocation({ ...location, teknisk_service_name: name, teknisk_service_phone: phone })}
          />

          {/* Opgaver */}
          <VenueTodos venueCode={location.venue_code || ''} venueName={location.name} />

          {/* Sessions */}
          <SessionsSection
            locationName={location.name}
            locationId={location.id}
            onLastVisited={(date) => {
              if (!location.last_visited_at || date > location.last_visited_at) {
                updateField('last_visited_at', date)
              }
            }}
          />

          {/* Venue Note */}
          <Section title="Note fra Venue" accent>
            {editingVenueNote ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea value={venueNoteVal} onChange={e => setVenueNoteVal(e.target.value)} rows={3} style={inputStyle} placeholder="Venue kan skrive noter her..." />
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <SmBtn label="Annuller" onClick={() => { setEditingVenueNote(false); setVenueNoteVal(location.venue_note || '') }} />
                  <SmBtn label="Gem" accent onClick={() => { updateField('venue_note', venueNoteVal || null); setEditingVenueNote(false) }} />
                </div>
              </div>
            ) : (
              <div onClick={() => setEditingVenueNote(true)} style={{ cursor: 'pointer', minHeight: 32 }}>
                {location.venue_note ? (
                  <p style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', whiteSpace: 'pre-wrap' }}>{location.venue_note}</p>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontStyle: 'italic' }}>Ingen note fra venue endnu...</p>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* === KOLONNE 3: Kort & Lokaler === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Kort */}
          <VenueLocationMap
            locationId={location.id}
            lat={location.lat}
            lon={location.lon}
            venueName={location.name}
            onSave={(lat, lon) => setLocation({ ...location, lat, lon })}
          />

          {/* Afstande */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <DistCard label="Fredericia" km={location.dist_fredericia_km} min={location.dist_fredericia_min} />
            <DistCard label="Frederikssund" km={location.dist_frederikssund_km} min={location.dist_frederikssund_min} />
          </div>

          {/* Inde & Ude */}
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
    </div>
  )
}

/* === Helper Components === */

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '14px 16px',
      boxShadow: 'var(--shadow)',
      border: '1px solid var(--accent)',
      borderLeft: accent ? '3px solid var(--accent)' : '1px solid var(--accent)',
    }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value, link, field, onSave }: {
  label: string; value?: string | null; link?: string
  field?: string; onSave?: (field: string, value: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')

  function save() {
    if (onSave && field) onSave(field, val.trim() || null)
    setEditing(false)
  }

  if (editing && onSave && field) {
    return (
      <div style={{ padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', display: 'block', marginBottom: 2 }}>{label}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <input value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
            style={{ flex: 1, padding: '3px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: 12, outline: 'none' }}
          />
          <button onClick={save} style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 10 }}>Gem</button>
          <button onClick={() => { setEditing(false); setVal(value || '') }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 10 }}>×</button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onSave && field ? () => setEditing(true) : undefined}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0', borderBottom: '1px solid var(--border)', cursor: onSave && field ? 'pointer' : undefined }}
    >
      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
          style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', textDecoration: 'none', textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || '—'}
        </a>
      ) : (
        <span style={{ fontSize: 12, color: value ? 'var(--text)' : 'var(--muted)', fontFamily: 'Outfit, sans-serif', textAlign: 'right', fontStyle: value ? 'normal' : 'italic' }}>
          {value || '—'}
        </span>
      )}
    </div>
  )
}

function DistCard({ label, km, min }: { label: string; km?: number | null; min?: number | null }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 10px', textAlign: 'center' }}>
      <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Outfit, sans-serif', color: 'var(--text)', marginTop: 2 }}>
        {km != null ? `${km} km` : '-'}
      </p>
      {min != null && <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>{min} min</p>}
    </div>
  )
}

function DateField({ label, date, note, onSave }: { label: string; date?: string | null; note?: string | null; onSave: (date: string | null, note: string | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [d, setD] = useState(date || '')
  const [n, setN] = useState(note || '')

  function formatDate(v?: string | null) {
    if (!v) return '-'
    return new Date(v + 'T00:00:00').toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function daysAgo(v?: string | null) {
    if (!v) return ''
    const diff = Math.floor((Date.now() - new Date(v + 'T00:00:00').getTime()) / 86400000)
    if (diff === 0) return 'i dag'
    if (diff === 1) return 'i går'
    return `${diff}d`
  }

  if (editing) {
    return (
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 10px' }}>
        <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Outfit, sans-serif' }}>{label}</span>
        <input type="date" value={d} onChange={e => setD(e.target.value)} style={{ ...inputStyle, marginTop: 4, padding: '4px 8px', fontSize: 11 }} />
        <input value={n} onChange={e => setN(e.target.value)} placeholder="Note..." style={{ ...inputStyle, marginTop: 4, padding: '4px 8px', fontSize: 11 }} />
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
          <SmBtn label="x" onClick={() => { setEditing(false); setD(date || ''); setN(note || '') }} />
          <SmBtn label="Gem" accent onClick={() => { onSave(d || null, n || null); setEditing(false) }} />
        </div>
      </div>
    )
  }

  return (
    <div onClick={() => setEditing(true)} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '3px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 12, color: date ? 'var(--text)' : 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>
          {formatDate(date)}
        </span>
        {date && (
          <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
            {daysAgo(date)}
          </span>
        )}
      </div>
    </div>
  )
}

function SocialIcon({ href, title, svg }: { href: string; title: string; svg: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" title={title} style={{
      width: 32, height: 32, borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--accent)',
      transition: 'all 0.15s', textDecoration: 'none',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {svg}
      </svg>
    </a>
  )
}

function FlagBadge({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '2px 10px', borderRadius: 12, cursor: 'pointer',
      fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 600,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--muted)',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

function SmBtn({ label, onClick, accent }: { label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: accent ? 'var(--accent)' : 'transparent',
      border: accent ? 'none' : '1px solid var(--border)',
      color: accent ? '#fff' : 'var(--muted)',
      borderRadius: 'var(--r)', padding: '4px 12px', cursor: 'pointer',
      fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 500,
    }}>
      {label}
    </button>
  )
}

function FmtBtn({ label, style: fontStyle, onClick }: { label: string; style: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)',
      padding: '3px 10px', cursor: 'pointer', color: 'var(--text)',
      fontFamily: 'Outfit, sans-serif', fontSize: 12,
      fontWeight: fontStyle === 'bold' ? 700 : 400,
      fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
    }}>
      {label}
    </button>
  )
}

function wrapSelection(id: string, before: string, after: string) {
  const el = document.getElementById(id) as HTMLTextAreaElement
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const text = el.value
  const selected = text.substring(start, end)
  const newVal = text.substring(0, start) + before + selected + after + text.substring(end)
  el.value = newVal
  el.focus()
  el.setSelectionRange(start + before.length, end + before.length)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function insertAtCursor(id: string, text: string, setter: (v: string) => void) {
  const el = document.getElementById(id) as HTMLTextAreaElement
  if (!el) return
  const pos = el.selectionStart
  const val = el.value
  setter(val.substring(0, pos) + text + val.substring(pos))
  setTimeout(() => { el.focus(); el.setSelectionRange(pos + text.length, pos + text.length) }, 0)
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 'var(--r)',
  border: '1px solid var(--border)', background: 'var(--surface2)',
  fontFamily: 'Outfit, sans-serif', fontSize: 13, color: 'var(--text)',
  outline: 'none', width: '100%', resize: 'vertical',
}

const labelSm: React.CSSProperties = {
  fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '0.06em', fontFamily: 'Outfit, sans-serif',
}
