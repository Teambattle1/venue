import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ACTIVITIES } from '../lib/types'
import type { PublicLocation } from '../lib/types'
import {
  buildMyMapEmbedUrl,
  MYMAP_EDIT_URL,
  PLACE_TYPES,
  parseLatLon,
  extractPostcode,
  regionFromPostcode,
  geocodeAddress,
  searchAddresses,
  type AddressSuggestion,
} from '../lib/locationHelpers'

const REGIONS = ['Sjælland', 'Fyn', 'Jylland', 'Bornholm']

function emptyDraft(): PublicLocation {
  return {
    id: '',
    name: '',
    address: '',
    postal_code: '',
    city: '',
    region: '',
    lat: null,
    lon: null,
    place_type: 'park',
    capacity_estimate: null,
    has_toilet: false,
    has_parking: false,
    has_power: false,
    has_water: false,
    has_shelter: false,
    access_notes: '',
    permission_required: false,
    permission_contact: '',
    permission_notes: '',
    best_for: [],
    notes: '',
    hidden: false,
  }
}

export default function PublicLocations() {
  const [items, setItems] = useState<PublicLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')
  const [showHidden, setShowHidden] = useState(false)
  const [editing, setEditing] = useState<PublicLocation | null>(null)
  const [saving, setSaving] = useState(false)
  const [defaultZoom, setDefaultZoom] = useState<number>(() => {
    const v = parseInt(localStorage.getItem('publoc_zoom') || '8', 10)
    return isNaN(v) ? 8 : v
  })
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    localStorage.setItem('publoc_zoom', String(defaultZoom))
  }, [defaultZoom])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('public_locations')
      .select('*')
      .order('name', { ascending: true })
    if (error) {
      console.error('public_locations load error', error)
    }
    setItems((data as PublicLocation[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return items.filter(p => {
      if (!showHidden && p.hidden) return false
      if (search) {
        const q = search.toLowerCase()
        const inName = p.name.toLowerCase().includes(q)
        const inAddr = (p.address || '').toLowerCase().includes(q)
        const inNotes = (p.notes || '').toLowerCase().includes(q)
        if (!inName && !inAddr && !inNotes) return false
      }
      if (typeFilter && p.place_type !== typeFilter) return false
      if (regionFilter && p.region !== regionFilter) return false
      if (cityFilter && p.city !== cityFilter) return false
      if (activityFilter && !(p.best_for || []).includes(activityFilter)) return false
      return true
    })
  }, [items, showHidden, search, typeFilter, regionFilter, cityFilter, activityFilter])

  const hiddenCount = items.filter(i => i.hidden).length

  const cityOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of items) {
      if (p.city && p.city.trim()) set.add(p.city.trim())
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'da'))
  }, [items])

  const mapUrl = useMemo(
    () => buildMyMapEmbedUrl({ center: mapCenter, zoom: defaultZoom }),
    [mapCenter, defaultZoom],
  )

  function focusOnMap(loc: PublicLocation) {
    if (loc.lat != null && loc.lon != null) {
      setMapCenter({ lat: Number(loc.lat), lon: Number(loc.lon) })
      setDefaultZoom(15)
    }
  }

  async function save(draft: PublicLocation) {
    if (!draft.name.trim()) {
      alert('Navn er påkrævet')
      return
    }
    setSaving(true)
    const payload = {
      name: draft.name.trim(),
      address: draft.address || null,
      postal_code: draft.postal_code || null,
      city: draft.city || null,
      region: draft.region || null,
      lat: draft.lat,
      lon: draft.lon,
      place_type: draft.place_type || null,
      capacity_estimate: draft.capacity_estimate ?? null,
      has_toilet: !!draft.has_toilet,
      has_parking: !!draft.has_parking,
      has_power: !!draft.has_power,
      has_water: !!draft.has_water,
      has_shelter: !!draft.has_shelter,
      access_notes: draft.access_notes || null,
      permission_required: !!draft.permission_required,
      permission_contact: draft.permission_contact || null,
      permission_notes: draft.permission_notes || null,
      best_for: draft.best_for || [],
      notes: draft.notes || null,
      hidden: !!draft.hidden,
      updated_at: new Date().toISOString(),
    }
    if (draft.id) {
      const { error } = await supabase.from('public_locations').update(payload).eq('id', draft.id)
      if (error) {
        alert('Kunne ikke gemme: ' + error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('public_locations').insert(payload)
      if (error) {
        alert('Kunne ikke oprette: ' + error.message)
        setSaving(false)
        return
      }
    }
    setSaving(false)
    setEditing(null)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Slet dette sted permanent?')) return
    const { error } = await supabase.from('public_locations').delete().eq('id', id)
    if (error) {
      alert('Kunne ikke slette: ' + error.message)
      return
    }
    setEditing(null)
    await load()
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <Link
          to="/"
          style={{
            color: 'var(--muted)',
            textDecoration: 'none',
            fontSize: 13,
            fontFamily: 'Outfit, sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          VENUE
        </Link>
        <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--text)' }}>OFFENTLIGE STEDER</h1>
        <span style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--accent)', fontSize: 13, letterSpacing: '0.1em' }}>
          parker, pladser, strande
        </span>
        <span style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--muted)', fontSize: 13, marginLeft: 'auto' }}>
          {filtered.length} / {items.length} steder
        </span>
        <button
          onClick={() => setEditing(emptyDraft())}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--r)',
            padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.08em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="M12 5v14"/>
          </svg>
          NYT STED
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Søg navn, adresse eller noter..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 240px' }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Alle typer</option>
          {PLACE_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Alle regioner</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
          disabled={cityOptions.length === 0}
          title={cityOptions.length === 0 ? 'Ingen byer registreret endnu' : ''}
        >
          <option value="">Alle byer</option>
          {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={activityFilter} onChange={e => setActivityFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Alle aktiviteter</option>
          {ACTIVITIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {(typeFilter || regionFilter || cityFilter || activityFilter || search) && (
          <button
            onClick={() => {
              setTypeFilter('')
              setRegionFilter('')
              setCityFilter('')
              setActivityFilter('')
              setSearch('')
            }}
            style={{
              background: 'var(--surface)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r)',
              padding: '6px 10px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 11,
              cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
            title="Nulstil alle filtre"
          >
            NULSTIL
          </button>
        )}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>
          <input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
          Vis skjulte ({hiddenCount})
        </label>
        <a
          href={MYMAP_EDIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 11,
            color: 'var(--muted)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r)',
            padding: '6px 10px',
          }}
          title="Åbn Google MyMap i edit mode (eksisterende pins administreres her)"
        >
          REDIGER MYMAP ↗
        </a>
      </div>

      {/* Split layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        {/* Left: list */}
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          {loading ? (
            <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>Indlæser...</p>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: '32px 20px',
              background: 'var(--surface)',
              borderRadius: 'var(--r)',
              border: '1px dashed var(--border)',
              textAlign: 'center',
              color: 'var(--muted)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 13,
            }}>
              {items.length === 0
                ? 'Ingen offentlige steder endnu. Klik NYT STED for at oprette det første.'
                : 'Ingen steder matcher filtrene.'}
            </div>
          ) : (
            filtered.map(p => (
              <PlaceRow
                key={p.id}
                place={p}
                onEdit={() => setEditing(p)}
                onFocus={() => focusOnMap(p)}
              />
            ))
          )}
        </div>

        {/* Right: MyMap embed (sticky) */}
        <div style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'Outfit, sans-serif',
              fontSize: 11,
              color: 'var(--muted)',
              letterSpacing: '0.08em',
            }}>
              <span>GOOGLE MYMAP</span>
              {mapCenter && (
                <button
                  onClick={() => { setMapCenter(null); setDefaultZoom(8) }}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Nulstil zoom
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: mapCenter ? 0 : 'auto' }}>
                <span>zoom</span>
                <button onClick={() => setDefaultZoom(z => Math.max(4, z - 1))} style={zoomBtn}>−</button>
                <span style={{ minWidth: 18, textAlign: 'center' }}>{defaultZoom}</span>
                <button onClick={() => setDefaultZoom(z => Math.min(20, z + 1))} style={zoomBtn}>+</button>
              </div>
            </div>
            <iframe
              key={mapUrl}
              src={mapUrl}
              style={{ width: '100%', height: 'calc(100vh - 220px)', minHeight: 480, border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google MyMap"
            />
          </div>
        </div>
      </div>

      {editing && (
        <PlaceEditModal
          place={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={editing.id ? () => remove(editing.id) : undefined}
          saving={saving}
        />
      )}
    </div>
  )
}

function PlaceRow({ place, onEdit, onFocus }: {
  place: PublicLocation
  onEdit: () => void
  onFocus: () => void
}) {
  const typeLabel = PLACE_TYPES.find(t => t.id === place.place_type)?.label || place.place_type || '—'
  const hasCoords = place.lat != null && place.lon != null
  const amenities = [
    place.has_toilet && 'WC',
    place.has_parking && 'P',
    place.has_power && '⚡',
    place.has_water && '💧',
    place.has_shelter && '⛱',
  ].filter(Boolean) as string[]

  return (
    <div
      onClick={onEdit}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r)',
        padding: '12px 14px',
        cursor: 'pointer',
        border: '1px solid var(--border)',
        opacity: place.hidden ? 0.45 : 1,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 10,
        alignItems: 'start',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'Outfit, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {place.name}
          </h3>
          <span style={{
            fontSize: 10,
            background: 'var(--surface2)',
            padding: '2px 7px',
            borderRadius: 4,
            color: 'var(--accent)',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}>
            {typeLabel.toUpperCase()}
          </span>
          {place.permission_required && (
            <span title="Kræver tilladelse" style={{
              fontSize: 10, background: 'var(--surface2)', padding: '2px 7px', borderRadius: 4,
              color: '#fdc700', fontFamily: 'Outfit, sans-serif', fontWeight: 600,
            }}>
              TILLADELSE
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginBottom: 6 }}>
          {place.address || (hasCoords ? `${place.lat?.toFixed(4)}, ${place.lon?.toFixed(4)}` : '—')}
          {place.region && <span> · {place.region}</span>}
          {place.capacity_estimate ? <span> · ~{place.capacity_estimate} pers.</span> : null}
        </p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {amenities.map(a => (
            <span key={a} style={{
              fontSize: 10,
              background: 'var(--surface2)',
              padding: '2px 6px',
              borderRadius: 4,
              color: 'var(--text)',
              fontFamily: 'Outfit, sans-serif',
            }}>{a}</span>
          ))}
          {(place.best_for || []).map(actId => {
            const act = ACTIVITIES.find(a => a.id === actId)
            if (!act) return null
            return (
              <span key={actId} style={{
                fontSize: 9,
                background: act.color,
                color: act.color === '#ffffff' || act.color === '#fdc700' || act.color === '#f5ec00' || act.color === '#01c7fc' ? '#000' : '#fff',
                padding: '2px 6px',
                borderRadius: 4,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
              }}>{act.name}</span>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
        {hasCoords ? (
          <button
            onClick={e => { e.stopPropagation(); onFocus() }}
            title="Zoom til på kort"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 8px',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            PIN ↗
          </button>
        ) : (
          <span title="Mangler koordinater" style={{
            fontSize: 10, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif',
          }}>ingen pin</span>
        )}
      </div>
    </div>
  )
}

function PlaceEditModal({ place, onClose, onSave, onDelete, saving }: {
  place: PublicLocation
  onClose: () => void
  onSave: (p: PublicLocation) => void
  onDelete?: () => void
  saving: boolean
}) {
  const [draft, setDraft] = useState<PublicLocation>({ ...place })
  const [coordsRaw, setCoordsRaw] = useState<string>(
    place.lat != null && place.lon != null ? `${place.lat}, ${place.lon}` : '',
  )
  const [geocoding, setGeocoding] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suppressNextSearch, setSuppressNextSearch] = useState(false)
  const addressContainerRef = useRef<HTMLDivElement>(null)

  function patch(p: Partial<PublicLocation>) {
    setDraft(d => ({ ...d, ...p }))
  }

  function applyCoords(raw: string) {
    setCoordsRaw(raw)
    const parsed = parseLatLon(raw)
    if (parsed) {
      patch({ lat: parsed.lat, lon: parsed.lon })
    } else if (raw.trim() === '') {
      patch({ lat: null, lon: null })
    }
  }

  // Debounced DAWA-opslag mens brugeren skriver. Vi bruger AbortController så
  // sene svar fra tidligere queries ikke overskriver et nyere resultat.
  useEffect(() => {
    if (suppressNextSearch) {
      setSuppressNextSearch(false)
      return
    }
    const q = (draft.address || '').trim()
    if (q.length < 2) {
      setAddressSuggestions([])
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      const results = await searchAddresses(q, ctrl.signal)
      if (!ctrl.signal.aborted) setAddressSuggestions(results)
    }, 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.address])

  // Luk dropdown ved klik udenfor
  useEffect(() => {
    if (!showSuggestions) return
    const onDocClick = (e: MouseEvent) => {
      if (!addressContainerRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showSuggestions])

  function pickSuggestion(s: AddressSuggestion) {
    const addressLine = `${s.street} ${s.houseNumber}`.trim()
    setSuppressNextSearch(true)
    patch({
      address: addressLine,
      postal_code: s.postalCode || draft.postal_code,
      city: s.city || draft.city,
      region: regionFromPostcode(s.postalCode) || draft.region,
      lat: s.lat,
      lon: s.lon,
    })
    setCoordsRaw(`${s.lat}, ${s.lon}`)
    setAddressSuggestions([])
    setShowSuggestions(false)
  }

  async function tryGeocode() {
    if (!draft.address?.trim()) return
    setGeocoding(true)
    const r = await geocodeAddress(draft.address.trim())
    setGeocoding(false)
    if (!r) {
      alert('Kunne ikke finde adressen automatisk. Indtast koordinater manuelt.')
      return
    }
    const pc = r.postcode || extractPostcode(r.full || draft.address)
    patch({
      lat: r.lat,
      lon: r.lon,
      postal_code: pc || draft.postal_code,
      region: regionFromPostcode(pc) || draft.region,
    })
    setCoordsRaw(`${r.lat}, ${r.lon}`)
  }

  function toggleActivity(actId: string) {
    const cur = draft.best_for || []
    if (cur.includes(actId)) patch({ best_for: cur.filter(a => a !== actId) })
    else patch({ best_for: [...cur, actId] })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '40px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          maxWidth: 720,
          width: '100%',
          padding: 24,
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, color: 'var(--text)' }}>
            {draft.id ? 'REDIGER STED' : 'NYT STED'}
          </h2>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 22,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {/* Navn */}
          <Field label="Navn *">
            <input
              autoFocus
              value={draft.name}
              onChange={e => patch({ name: e.target.value })}
              placeholder="Fx Fælledparken, Tisvilde Strand..."
              style={inputStyle}
            />
          </Field>

          {/* Type */}
          <Field label="Type">
            <select
              value={draft.place_type || ''}
              onChange={e => patch({ place_type: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {PLACE_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </Field>

          {/* Adresse */}
          <Field label="Adresse">
            <div ref={addressContainerRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={draft.address || ''}
                  onChange={e => {
                    const addr = e.target.value
                    const pc = extractPostcode(addr)
                    patch({
                      address: addr,
                      postal_code: pc || draft.postal_code,
                      region: regionFromPostcode(pc) || draft.region,
                    })
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Fx Strandvejen 100, 3220 Tisvildeleje"
                  style={{ ...inputStyle, flex: 1 }}
                  autoComplete="off"
                />
                <button
                  onClick={tryGeocode}
                  disabled={geocoding || !draft.address?.trim()}
                  style={{ ...secondaryBtn, opacity: geocoding ? 0.5 : 1 }}
                >
                  {geocoding ? '...' : 'GEOKOD'}
                </button>
              </div>
              {showSuggestions && addressSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: 1100,
                    maxHeight: 280,
                    overflowY: 'auto',
                  }}
                >
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={`${s.text}-${i}`}
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault()
                        pickSuggestion(s)
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: i < addressSuggestions.length - 1 ? '1px solid var(--border)' : 'none',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: 14,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {s.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* Postnr / by / region */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Postnr.">
              <input
                value={draft.postal_code || ''}
                onChange={e => {
                  const pc = e.target.value
                  patch({
                    postal_code: pc,
                    region: regionFromPostcode(pc) || draft.region,
                  })
                }}
                style={inputStyle}
              />
            </Field>
            <Field label="By">
              <input
                value={draft.city || ''}
                onChange={e => patch({ city: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Region">
              <select
                value={draft.region || ''}
                onChange={e => patch({ region: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">—</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          {/* Lat/lon */}
          <Field label="Koordinater (lat, lon)">
            <input
              value={coordsRaw}
              onChange={e => applyCoords(e.target.value)}
              placeholder="55.578, 9.730"
              style={inputStyle}
            />
            <small style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'Outfit, sans-serif', marginTop: 4, display: 'block' }}>
              Brug GEOKOD-knappen ovenfor eller paste fra Google Maps (højreklik → kopiér koordinater).
            </small>
          </Field>

          {/* Kapacitet */}
          <Field label="Kapacitet (estimeret antal personer)">
            <input
              type="number"
              min={0}
              value={draft.capacity_estimate ?? ''}
              onChange={e => patch({ capacity_estimate: e.target.value ? parseInt(e.target.value, 10) : null })}
              style={inputStyle}
            />
          </Field>

          {/* Faciliteter */}
          <Field label="Faciliteter">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <ToggleChip label="Toilet" active={!!draft.has_toilet} onClick={() => patch({ has_toilet: !draft.has_toilet })} />
              <ToggleChip label="Parkering" active={!!draft.has_parking} onClick={() => patch({ has_parking: !draft.has_parking })} />
              <ToggleChip label="Strøm" active={!!draft.has_power} onClick={() => patch({ has_power: !draft.has_power })} />
              <ToggleChip label="Vand" active={!!draft.has_water} onClick={() => patch({ has_water: !draft.has_water })} />
              <ToggleChip label="Læ / shelter" active={!!draft.has_shelter} onClick={() => patch({ has_shelter: !draft.has_shelter })} />
            </div>
          </Field>

          {/* Adgang */}
          <Field label="Adgang / praktisk note">
            <textarea
              value={draft.access_notes || ''}
              onChange={e => patch({ access_notes: e.target.value })}
              placeholder="Hvor parkerer man? Koder, åbningstider, særlige forhold..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Outfit, sans-serif' }}
            />
          </Field>

          {/* Tilladelse */}
          <div style={{
            padding: 12,
            background: 'var(--surface)',
            borderRadius: 'var(--r)',
            border: '1px solid var(--border)',
            display: 'grid',
            gap: 10,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={!!draft.permission_required}
                onChange={e => patch({ permission_required: e.target.checked })}
                style={{ accentColor: 'var(--accent)' }}
              />
              Kræver tilladelse fra ejer/kommune
            </label>
            {draft.permission_required && (
              <>
                <Field label="Kontakt for tilladelse">
                  <input
                    value={draft.permission_contact || ''}
                    onChange={e => patch({ permission_contact: e.target.value })}
                    placeholder="Navn, telefon eller email"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Note om tilladelse">
                  <textarea
                    value={draft.permission_notes || ''}
                    onChange={e => patch({ permission_notes: e.target.value })}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Outfit, sans-serif' }}
                  />
                </Field>
              </>
            )}
          </div>

          {/* Egnet til */}
          <Field label="Egnet til aktiviteter">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ACTIVITIES.map(a => {
                const active = (draft.best_for || []).includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleActivity(a.id)}
                    style={{
                      background: active ? a.color : 'var(--surface)',
                      color: active ? (a.color === '#ffffff' || a.color === '#fdc700' || a.color === '#f5ec00' || a.color === '#01c7fc' ? '#000' : '#fff') : 'var(--muted)',
                      border: `1px solid ${active ? a.color : 'var(--border)'}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {a.name}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Generelle noter */}
          <Field label="Noter">
            <textarea
              value={draft.notes || ''}
              onChange={e => patch({ notes: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Outfit, sans-serif' }}
            />
          </Field>

          {/* Skjul */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13, color: 'var(--muted)' }}>
            <input
              type="checkbox"
              checked={!!draft.hidden}
              onChange={e => patch({ hidden: e.target.checked })}
              style={{ accentColor: 'var(--accent)' }}
            />
            Skjul stedet (vises ikke i listen)
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {onDelete && (
            <button onClick={onDelete} style={{ ...secondaryBtn, color: 'var(--red)', borderColor: 'var(--red)' }}>
              SLET
            </button>
          )}
          <button onClick={onClose} style={{ ...secondaryBtn, marginLeft: 'auto' }}>
            ANNULLER
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={saving}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r)',
              padding: '8px 18px',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'GEMMER...' : 'GEM'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        color: 'var(--muted)',
        fontFamily: 'Outfit, sans-serif',
        marginBottom: 4,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'var(--accent)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--muted)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 6,
        padding: '6px 12px',
        fontSize: 12,
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--r)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  fontFamily: 'Outfit, sans-serif',
  fontSize: 14,
  outline: 'none',
  color: 'var(--text)',
  width: '100%',
}

const secondaryBtn: React.CSSProperties = {
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)',
  padding: '8px 14px',
  cursor: 'pointer',
  fontFamily: 'Outfit, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.08em',
}

const zoomBtn: React.CSSProperties = {
  background: 'var(--surface2)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  width: 22,
  height: 22,
  cursor: 'pointer',
  fontFamily: 'Outfit, sans-serif',
  fontSize: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}
