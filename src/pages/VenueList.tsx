import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STATUS_COLORS } from '../lib/types'
import type { Contact, Location } from '../lib/types'

type ViewMode = 'list' | 'grid'

export default function VenueList() {
  const navigate = useNavigate()
  const [locations, setLocations] = useState<Location[]>([])
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    (localStorage.getItem('venue_view') as ViewMode) || 'list'
  )
  const [loading, setLoading] = useState(true)
  const [showHidden, setShowHidden] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({})
  const [spaceStats, setSpaceStats] = useState<Record<string, { spaces: number; images: boolean; coords: boolean }>>({})

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const [locRes, sessRes, statsRes] = await Promise.all([
        supabase.from('locations')
          .select('id, name, address, postal_code, region, phone, website, contacts, crm_status, venue_code, lat, lon, hidden, venue_type')
          .order('name', { ascending: true }),
        supabase.rpc('get_venue_session_counts'),
        supabase.rpc('get_venue_space_stats'),
      ])
      if (locRes.data) setLocations(locRes.data as Location[])
      if (sessRes.data) {
        const counts: Record<string, number> = {}
        for (const r of sessRes.data) counts[r.location_name] = Number(r.session_count)
        setSessionCounts(counts)
      }
      if (statsRes.data) {
        const stats: Record<string, { spaces: number; images: boolean; coords: boolean }> = {}
        for (const r of statsRes.data) stats[r.location_id] = { spaces: Number(r.space_count), images: r.has_images, coords: r.has_coords }
        setSpaceStats(stats)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function toggleHide(id: string, hidden: boolean) {
    if (!supabase) return
    await supabase.from('locations').update({ hidden }).eq('id', id)
    setLocations(prev => prev.map(l => l.id === id ? { ...l, hidden } : l))
  }

  function setView(mode: ViewMode) {
    setViewMode(mode)
    localStorage.setItem('venue_view', mode)
  }

  const regions = [...new Set(locations.map(l => l.region).filter(Boolean))].sort()
  const statuses = [...new Set(locations.map(l => l.crm_status).filter(Boolean))].sort()
  const hiddenCount = locations.filter(l => l.hidden).length

  const filtered = locations.filter(l => {
    if (!showHidden && l.hidden) return false
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) &&
        !l.address?.toLowerCase().includes(search.toLowerCase())) return false
    if (regionFilter && l.region !== regionFilter) return false
    if (statusFilter && l.crm_status !== statusFilter) return false
    return true
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>Indlæser venues...</p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 16px', borderRadius: 'var(--r)',
    border: '1px solid var(--border)', background: 'var(--surface)',
    fontFamily: 'Outfit, sans-serif', fontSize: 14, outline: 'none',
    color: 'var(--text)',
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--text)' }}>VENUE</h1>
        <span style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--accent)', fontSize: 14, letterSpacing: '0.1em' }}>
          by TEAMBATTLE
        </span>
        <span style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--muted)', fontSize: 14, marginLeft: 'auto' }}>
          {filtered.length} / {locations.length} venues
        </span>

        {/* Admin gear */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAdminOpen(!adminOpen)}
            style={{
              background: adminOpen ? 'var(--accent)' : 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--r)',
              padding: '6px 8px', cursor: 'pointer', color: adminOpen ? '#fff' : 'var(--muted)',
              display: 'flex', alignItems: 'center',
              transition: 'all 0.2s',
            }}
            title="Admin"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          {adminOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: 12, minWidth: 220,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100,
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: 13, color: 'var(--text)',
              }}>
                <input
                  type="checkbox" checked={showHidden}
                  onChange={e => setShowHidden(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Vis skjulte venues ({hiddenCount})
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Søg venue eller adresse..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 250px' }}
        />
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Alle regioner</option>
          {regions.map(r => <option key={r} value={r!}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Alle status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--r)', padding: 3 }}>
          <button onClick={() => setView('list')} style={viewBtnStyle(viewMode === 'list')} title="Listevisning">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2.5" rx="1"/><rect x="1" y="6.75" width="14" height="2.5" rx="1"/><rect x="1" y="11.5" width="14" height="2.5" rx="1"/></svg>
          </button>
          <button onClick={() => setView('grid')} style={viewBtnStyle(viewMode === 'grid')} title="Gridvisning">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
          </button>
        </div>
      </div>

      {/* Venue Cards */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(loc => (
            <GridCard key={loc.id} loc={loc} onClick={() => navigate(`/v/${loc.venue_code}`)}
              showHidden={showHidden} onToggleHide={toggleHide}
              sessionCount={sessionCounts[loc.name] || 0}
              stats={spaceStats[loc.id]} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map(loc => (
            <ListCard key={loc.id} loc={loc} onClick={() => navigate(`/v/${loc.venue_code}`)}
              showHidden={showHidden} onToggleHide={toggleHide}
              sessionCount={sessionCounts[loc.name] || 0}
              stats={spaceStats[loc.id]} />
          ))}
        </div>
      )}
    </div>
  )
}

type SpaceStats = { spaces: number; images: boolean; coords: boolean }

function GridCard({ loc, onClick, showHidden, onToggleHide, sessionCount, stats }: {
  loc: Location; onClick: () => void; showHidden: boolean; onToggleHide: (id: string, hidden: boolean) => void; sessionCount: number; stats?: SpaceStats
}) {
  const hasContacts = (loc.contacts?.length || 0) > 0
  const hasCoords = !!(loc.lat && loc.lon)
  const isReady = hasContacts && hasCoords

  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '18px 20px',
      boxShadow: 'var(--shadow)', cursor: 'pointer',
      border: `1px solid ${isReady ? 'var(--green)' : 'var(--border)'}`,
      transition: 'border-color 0.2s',
      opacity: loc.hidden ? 0.4 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: STATUS_COLORS[loc.crm_status] || '#8a8578',
          flexShrink: 0,
        }} />
        <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {loc.name}
        </h3>
        {showHidden && (
          <button
            onClick={e => { e.stopPropagation(); onToggleHide(loc.id, !loc.hidden) }}
            title={loc.hidden ? 'Vis venue' : 'Skjul venue'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
              color: loc.hidden ? 'var(--accent)' : 'var(--muted)', fontSize: 14,
            }}
          >
            {loc.hidden ? '👁' : '👁‍🗨'}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {loc.venue_code && (
          <span style={{
            fontFamily: 'monospace', fontSize: 11, background: 'var(--surface2)',
            padding: '2px 8px', borderRadius: 4, color: 'var(--accent)', fontWeight: 600,
          }}>
            {loc.venue_code}
          </span>
        )}
        {sessionCount > 0 && (
          <span style={{
            fontSize: 10, background: 'var(--accent)', color: '#fff',
            padding: '2px 8px', borderRadius: 4, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
          }}>
            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {loc.contacts?.length > 0 && (
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>
            {loc.contacts.length} kontakt{loc.contacts.length !== 1 ? 'er' : ''}
          </span>
        )}
        {stats && stats.images && (
          <span title="Har billeder" style={{ fontSize: 10, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, color: 'var(--green)', fontFamily: 'Outfit, sans-serif' }}>
            IMG
          </span>
        )}
        {stats && stats.coords && (
          <span title="Har kort-pins" style={{ fontSize: 10, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, color: '#2563eb', fontFamily: 'Outfit, sans-serif' }}>
            MAP
          </span>
        )}
        {loc.lat && loc.lon && (
          <span title="Har placering" style={{ fontSize: 10, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
            PIN
          </span>
        )}
      </div>
    </div>
  )
}

function ListCard({ loc, onClick, showHidden, onToggleHide, sessionCount, stats }: {
  loc: Location; onClick: () => void; showHidden: boolean; onToggleHide: (id: string, hidden: boolean) => void; sessionCount: number; stats?: SpaceStats
}) {
  const hasContacts = (loc.contacts?.length || 0) > 0
  const hasCoords = !!(loc.lat && loc.lon)
  const isReady = hasContacts && hasCoords

  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', borderRadius: 'var(--r)',
      padding: '20px 24px', boxShadow: 'var(--shadow)', cursor: 'pointer',
      border: `1px solid ${isReady ? 'var(--green)' : 'var(--border)'}`,
      borderLeftWidth: 4, borderLeftColor: STATUS_COLORS[loc.crm_status] || '#8a8578',
      opacity: loc.hidden ? 0.4 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{loc.name}</h3>
            {loc.venue_code && (
              <span style={{
                fontFamily: 'monospace', fontSize: 12, background: 'var(--surface2)',
                padding: '2px 8px', borderRadius: 4, color: 'var(--accent)', fontWeight: 600,
              }}>
                {loc.venue_code}
              </span>
            )}
            <span style={{
              fontSize: 11, fontFamily: 'Outfit, sans-serif',
              color: STATUS_COLORS[loc.crm_status] || '#8a8578',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
            }}>
              {loc.crm_status}
            </span>
            {sessionCount > 0 && (
              <span style={{
                fontSize: 10, background: 'var(--accent)', color: '#fff',
                padding: '2px 8px', borderRadius: 4, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
              }}>
                {sessionCount} session{sessionCount !== 1 ? 's' : ''}
              </span>
            )}
            {showHidden && (
              <button
                onClick={e => { e.stopPropagation(); onToggleHide(loc.id, !loc.hidden) }}
                title={loc.hidden ? 'Vis venue' : 'Skjul venue'}
                style={{
                  background: loc.hidden ? 'var(--accent)' : 'var(--surface2)',
                  border: '1px solid var(--border)', borderRadius: 'var(--r)',
                  padding: '2px 10px', cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', fontSize: 11, color: loc.hidden ? '#fff' : 'var(--muted)',
                  marginLeft: 'auto',
                }}
              >
                {loc.hidden ? 'Vis' : 'Skjul'}
              </button>
            )}
          </div>
          {loc.address && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{loc.address}</p>}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {stats && stats.images && (
              <span title="Har billeder" style={{ fontSize: 10, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, color: 'var(--green)', fontFamily: 'Outfit, sans-serif' }}>
                IMG
              </span>
            )}
            {stats && stats.coords && (
              <span title="Har kort-pins" style={{ fontSize: 10, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, color: '#2563eb', fontFamily: 'Outfit, sans-serif' }}>
                MAP
              </span>
            )}
            {loc.lat && loc.lon && (
              <span title="Har placering" style={{ fontSize: 10, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
                PIN
              </span>
            )}
            {stats && stats.spaces > 0 && (
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>
                {stats.spaces} rum/område{stats.spaces !== 1 ? 'r' : ''}
              </span>
            )}
          </div>
        </div>

        {loc.contacts?.length > 0 && (
          <div style={{ flex: '0 1 400px', borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>
              Kontaktpersoner ({loc.contacts.length})
            </p>
            {loc.contacts.map((c: Contact) => (
              <div key={c.id} style={{ marginBottom: 8, fontSize: 13, fontFamily: 'Outfit, sans-serif' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 500 }}>{c.name || '(intet navn)'}</span>
                  {c.title && <span style={{ color: 'var(--muted)', fontSize: 12 }}>{c.title}</span>}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
                  {c.mobile && <span>{c.mobile}</span>}
                  {c.email && <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{c.email}</a>}
                </div>
                {c.notes && <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{c.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function viewBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    display: 'flex', alignItems: 'center',
    transition: 'all 0.2s',
  }
}
