import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { VenueSpace } from '../../lib/types'
import { ACTIVITIES } from '../../lib/types'
import InstructorShell from './InstructorShell'

interface Props {
  locationId: string
  venueName: string
  venueLat?: number | null
  venueLon?: number | null
  onBack: () => void
  onAddSpace: (type?: 'inde' | 'ude') => void
  onEditSpace: (space: VenueSpace) => void
}

export default function VenueSpacesScreen({ locationId, venueName, venueLat, venueLon, onBack, onAddSpace, onEditSpace }: Props) {
  const [spaces, setSpaces] = useState<VenueSpace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [locationId])

  async function load() {
    if (!supabase) return
    const { data } = await supabase
      .from('venue_spaces')
      .select('*')
      .eq('location_id', locationId)
      .order('type')
      .order('sort_order')
    if (data) setSpaces(data as VenueSpace[])
    setLoading(false)
  }

  const indeSpaces = spaces.filter(s => s.type === 'inde')
  const udeSpaces = spaces.filter(s => s.type === 'ude')

  return (
    <InstructorShell
      title={venueName}
      onBack={onBack}
      bottomBar={
        <button onClick={() => onAddSpace()} style={{
          width: '100%', padding: '14px', borderRadius: 'var(--r)',
          background: 'var(--accent)', border: 'none', color: '#fff',
          fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', minHeight: 48,
        }}>
          + Tilføj rum/område
        </button>
      }
    >
      <div style={{ padding: 16 }}>
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
            Henter...
          </p>
        )}

        {/* INDE section */}
        {indeSpaces.length > 0 && (
          <>
            <SectionHeader label="Inde" count={indeSpaces.length} color="var(--accent)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {indeSpaces.map(s => (
                <MobileSpaceCard key={s.id} space={s} onClick={() => onEditSpace(s)} />
              ))}
            </div>
          </>
        )}

        {/* UDE section */}
        {udeSpaces.length > 0 && (
          <>
            <SectionHeader label="Ude" count={udeSpaces.length} color="#2563eb" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {udeSpaces.map(s => (
                <MobileSpaceCard key={s.id} space={s} onClick={() => onEditSpace(s)} />
              ))}
            </div>
          </>
        )}

        {!loading && spaces.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 14 }}>
            Ingen rum/områder endnu
          </p>
        )}
      </div>
    </InstructorShell>
  )
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: color,
      }} />
      <span style={{
        fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase',
        letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif', fontWeight: 600,
      }}>
        {label} ({count})
      </span>
    </div>
  )
}

function MobileSpaceCard({ space: s, onClick }: { space: VenueSpace; onClick: () => void }) {
  const color = s.type === 'inde' ? 'var(--accent)' : '#2563eb'
  const activityNames = (s.suitable_activities || [])
    .map(id => ACTIVITIES.find(a => a.id === id)?.name.replace(/^Team/, ''))
    .filter(Boolean)

  return (
    <button onClick={onClick} style={{
      display: 'flex', gap: 12, padding: 12, borderRadius: 'var(--r)',
      border: '1px solid var(--border)', background: 'var(--surface2)',
      cursor: 'pointer', textAlign: 'left', width: '100%',
      borderLeft: `3px solid ${color}`,
    }}>
      {s.image_url && (
        <img src={s.image_url} alt="" style={{
          width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--r)',
          flexShrink: 0,
        }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {s.map_letter && (
            <span style={{
              width: 20, height: 20, borderRadius: '50%', background: color,
              color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {s.map_letter}
            </span>
          )}
          <span style={{
            fontSize: 14, fontWeight: 500, fontFamily: 'Outfit, sans-serif',
            color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {s.name}
          </span>
        </div>
        {s.description && (
          <p style={{
            fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {s.description}
          </p>
        )}
        {activityNames.length > 0 && (
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            {activityNames.join(', ')}
          </p>
        )}
      </div>
      <span style={{ color: 'var(--muted)', fontSize: 16, alignSelf: 'center', flexShrink: 0 }}>&#9654;</span>
    </button>
  )
}
