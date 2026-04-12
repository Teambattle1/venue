import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { VenueSpace } from '../../lib/types'
import SpaceCard from './SpaceCard'
import SpaceForm from './SpaceForm'
import OutdoorMap from './OutdoorMap'
import SpaceWizard from '../instructor/SpaceWizard'

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
  const [showForm, setShowForm] = useState(false)
  const [editSpace, setEditSpace] = useState<VenueSpace | null>(null)
  const [formType, setFormType] = useState<'inde' | 'ude'>('inde')
  const [wizardSpace, setWizardSpace] = useState<VenueSpace | null | undefined>(undefined) // undefined = closed

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

  const addBtnStyle = (color: string): React.CSSProperties => ({
    width: '100%', padding: '10px', borderRadius: 'var(--r)',
    border: `2px dashed ${color}`, background: 'transparent',
    color, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
    fontSize: 12, fontWeight: 500,
  })

  const columnHeaderStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
    marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '20px 24px',
      boxShadow: 'var(--shadow)',
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Inde & Ude</h3>

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
            {adgangNote || 'Ingen adgangsinfo tilføjet...'}
          </p>
        )}
      </div>

      {/* Two columns: INDE and UDE */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showInde && showUde ? '1fr 1fr' : '1fr',
        gap: 20,
      }}>
        {/* INDE column */}
        {showInde && (
          <div style={{
            border: '1px solid var(--accent)', borderRadius: 'var(--r)', padding: 16,
          }}>
            <div style={columnHeaderStyle}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ color: 'var(--accent)' }}>Inde ({inde.length})</span>
            </div>

            {inde.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                {inde.map(s => (
                  <SpaceCard
                    key={s.id} space={s}
                    onEdit={sp => { setEditSpace(sp); setFormType('inde'); setShowForm(true) }}
                    onDelete={handleDelete}
                    onUpdate={updated => setSpaces(prev => prev.map(p => p.id === updated.id ? updated : p))}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 12, marginBottom: 12, textAlign: 'center', padding: '16px 0' }}>
                Ingen lokaler endnu.
              </p>
            )}

            <button onClick={() => { setEditSpace(null); setFormType('inde'); setShowForm(true) }} style={addBtnStyle('var(--accent)')}>
              + Tilføj lokale
            </button>
          </div>
        )}

        {/* UDE column */}
        {showUde && (
          <div style={{
            border: '1px solid #2563eb', borderRadius: 'var(--r)', padding: 16,
          }}>
            <div style={columnHeaderStyle}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb' }} />
              <span style={{ color: '#2563eb' }}>Ude ({ude.length})</span>
            </div>

            {/* Outdoor map */}
            {ude.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <OutdoorMap
                  centerLat={venueLat} centerLon={venueLon}
                  spaces={ude} venueName={venueName} height={200}
                />
              </div>
            )}

            {ude.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                {ude.map(s => (
                  <SpaceCard
                    key={s.id} space={s}
                    onEdit={sp => { setEditSpace(sp); setFormType('ude'); setShowForm(true) }}
                    onDelete={handleDelete}
                    onUpdate={updated => setSpaces(prev => prev.map(p => p.id === updated.id ? updated : p))}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 12, marginBottom: 12, textAlign: 'center', padding: '16px 0' }}>
                Ingen udendørs arealer endnu.
              </p>
            )}

            <button onClick={() => { setEditSpace(null); setFormType('ude'); setShowForm(true) }} style={addBtnStyle('#2563eb')}>
              + Tilføj areal
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <SpaceForm
          locationId={locationId} type={formType} existing={editSpace}
          venueLat={venueLat} venueLon={venueLon}
          onClose={() => setShowForm(false)} onSaved={load}
        />
      )}

      {/* SpaceWizard modal overlay (if triggered from elsewhere) */}
      {wizardSpace !== undefined && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
        }}>
          <SpaceWizard
            locationId={locationId}
            venueLat={venueLat}
            venueLon={venueLon}
            existing={wizardSpace}
            onBack={() => setWizardSpace(undefined)}
            onSaved={() => { setWizardSpace(undefined); load() }}
          />
        </div>
      )}
    </div>
  )
}
