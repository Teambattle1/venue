import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { VenueSpace } from '../../lib/types'
import SpaceCard from './SpaceCard'
import SpaceForm from './SpaceForm'
import OutdoorMap from './OutdoorMap'

interface Props {
  locationId: string
  venueLat?: number | null
  venueLon?: number | null
  venueName?: string
  venueType?: 'inde' | 'ude' | 'begge'
  adgangNote?: string | null
  onAdgangSave?: (note: string | null) => void
}

export default function FloorPlanSection({ locationId, venueLat, venueLon, venueName, venueType = 'begge', adgangNote, onAdgangSave }: Props) {
  const [spaces, setSpaces] = useState<VenueSpace[]>([])
  const [editingAdgang, setEditingAdgang] = useState(false)
  const [adgangVal, setAdgangVal] = useState(adgangNote || '')
  const showInde = venueType === 'inde' || venueType === 'begge'
  const showUde = venueType === 'ude' || venueType === 'begge'
  const defaultTab = showInde ? 'inde' : 'ude'
  const [tab, setTab] = useState<'inde' | 'ude'>(defaultTab)
  const [showForm, setShowForm] = useState(false)
  const [editSpace, setEditSpace] = useState<VenueSpace | null>(null)

  // Adjust tab when venueType changes
  useEffect(() => {
    if (venueType === 'inde' && tab === 'ude') setTab('inde')
    if (venueType === 'ude' && tab === 'inde') setTab('ude')
  }, [venueType])

  async function load() {
    if (!supabase) return
    const { data } = await supabase
      .from('venue_spaces')
      .select('*')
      .eq('location_id', locationId)
      .order('sort_order', { ascending: true })
    if (data) setSpaces(data as VenueSpace[])
  }

  useEffect(() => { load() }, [locationId])

  async function handleDelete(id: string) {
    if (!supabase || !confirm('Slet dette rum/område?')) return
    await supabase.from('venue_spaces').delete().eq('id', id)
    load()
  }

  const inde = spaces.filter(s => s.type === 'inde')
  const ude = spaces.filter(s => s.type === 'ude')
  const current = tab === 'inde' ? inde : ude

  const tabStyle = (active: boolean, type: 'inde' | 'ude'): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 500,
    background: active ? (type === 'ude' ? '#2563eb' : 'var(--accent)') : 'var(--surface2)',
    color: active ? '#fff' : 'var(--muted)',
    transition: 'all 0.2s',
  })

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '20px 24px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Inde & Ude</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {showInde && (
            <button onClick={() => setTab('inde')} style={tabStyle(tab === 'inde', 'inde')}>
              Inde ({inde.length})
            </button>
          )}
          {showUde && (
            <button onClick={() => setTab('ude')} style={tabStyle(tab === 'ude', 'ude')}>
              Ude ({ude.length})
            </button>
          )}
        </div>
      </div>

      {/* Adgang note */}
      <div style={{
        background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '10px 14px',
        marginBottom: 16, border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
            Adgang
          </span>
          {!editingAdgang && (
            <button onClick={() => setEditingAdgang(true)} style={{
              background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 11, padding: 0,
            }}>
              Rediger
            </button>
          )}
        </div>
        {editingAdgang ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              value={adgangVal} onChange={e => setAdgangVal(e.target.value)}
              placeholder="Beskriv adgangsforhold, parkering, indgang mv..."
              rows={3}
              style={{
                padding: '8px 10px', borderRadius: 'var(--r)', border: '1px solid var(--border)',
                background: 'var(--surface)', fontFamily: 'Outfit, sans-serif', fontSize: 12,
                color: 'var(--text)', outline: 'none', width: '100%', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditingAdgang(false); setAdgangVal(adgangNote || '') }}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 'var(--r)', padding: '3px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11 }}>
                Annuller
              </button>
              <button onClick={async () => {
                if (!supabase) return
                await supabase.from('locations').update({ adgang_note: adgangVal.trim() || null }).eq('id', locationId)
                onAdgangSave?.(adgangVal.trim() || null)
                setEditingAdgang(false)
              }}
                style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 'var(--r)', padding: '3px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 500 }}>
                Gem
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: adgangNote ? 'var(--text)' : 'var(--muted)', fontFamily: 'Outfit, sans-serif', whiteSpace: 'pre-wrap', fontStyle: adgangNote ? 'normal' : 'italic' }}>
            {adgangNote || 'Ingen adgangsinfo tilf\u00f8jet...'}
          </p>
        )}
      </div>

      {/* Outdoor map */}
      {tab === 'ude' && (
        <div style={{ marginBottom: 20 }}>
          <OutdoorMap
            centerLat={venueLat} centerLon={venueLon}
            spaces={ude}
            venueName={venueName}
          />
        </div>
      )}

      {/* Cards grid */}
      {current.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          {current.map(s => (
            <SpaceCard
              key={s.id} space={s}
              onEdit={sp => { setEditSpace(sp); setShowForm(true) }}
              onDelete={handleDelete}
              onUpdate={updated => setSpaces(prev => prev.map(p => p.id === updated.id ? updated : p))}
            />
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 13, marginBottom: 16, textAlign: 'center', padding: '24px 0' }}>
          Ingen {tab === 'inde' ? 'indendørs rum' : 'udendørs områder'} tilføjet endnu.
        </p>
      )}

      {/* Add button */}
      <button
        onClick={() => { setEditSpace(null); setShowForm(true) }}
        style={{
          width: '100%', padding: '12px', borderRadius: 'var(--r)',
          border: `2px dashed ${tab === 'ude' ? '#2563eb' : 'var(--accent)'}`,
          background: 'transparent',
          color: tab === 'ude' ? '#2563eb' : 'var(--accent)',
          cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          fontSize: 13, fontWeight: 500,
        }}
      >
        + Tilføj {tab === 'inde' ? 'rum' : 'udendørs område'}
      </button>

      {showForm && (
        <SpaceForm
          locationId={locationId} type={tab} existing={editSpace}
          venueLat={venueLat} venueLon={venueLon}
          onClose={() => setShowForm(false)} onSaved={load}
        />
      )}
    </div>
  )
}
