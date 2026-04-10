import { supabase } from '../../lib/supabase'
import { ACTIVITIES } from '../../lib/types'
import type { VenueSpace } from '../../lib/types'

interface Props {
  space: VenueSpace
  onEdit: (space: VenueSpace) => void
  onDelete: (id: string) => void
  onUpdate?: (space: VenueSpace) => void
}

export default function SpaceCard({ space, onEdit, onDelete, onUpdate }: Props) {
  const suitable = space.suitable_activities || []

  async function toggleActivity(actId: string) {
    if (!supabase) return
    const next = suitable.includes(actId)
      ? suitable.filter(a => a !== actId)
      : [...suitable, actId]
    await supabase.from('venue_spaces').update({ suitable_activities: next }).eq('id', space.id)
    onUpdate?.({ ...space, suitable_activities: next })
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)',
      overflow: 'hidden', boxShadow: 'var(--shadow)',
      border: `2px solid ${space.type === 'ude' ? '#2563eb' : 'var(--accent)'}`,
    }}>
      {space.image_url && (
        <img
          src={space.image_url} alt={space.name}
          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
        />
      )}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h4 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{space.name}</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onEdit(space)} style={btnStyle}>Rediger</button>
            <button onClick={() => onDelete(space.id)} style={{ ...btnStyle, color: 'var(--red)' }}>Slet</button>
          </div>
        </div>
        {space.description && (
          <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginBottom: 4 }}>
            {space.description}
          </p>
        )}
        {space.adgangsvej && (
          <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adgangsvej: </span>
            {space.adgangsvej}
          </p>
        )}
        {space.note && (
          <p style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {space.note}
          </p>
        )}
        {space.lat && space.lon && (
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 4 }}>
            {space.lat.toFixed(5)}, {space.lon.toFixed(5)}
          </p>
        )}

        {/* Egnet til aktiviteter */}
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>
            Egnet til
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ACTIVITIES.map(act => {
              const active = suitable.includes(act.id)
              return (
                <button
                  key={act.id}
                  onClick={() => toggleActivity(act.id)}
                  title={act.name}
                  style={{
                    padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 600,
                    border: `1px solid ${act.color}`,
                    background: active ? act.color : 'transparent',
                    color: active
                      ? (act.color === '#000000' || act.color === '#f5ec00' || act.color === '#fdc700' || act.color === '#ffffff' ? '#000' : '#fff')
                      : act.color,
                    opacity: active ? 1 : 0.4,
                    transition: 'all 0.15s',
                  }}
                >
                  {act.name.replace('Team', '')}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--accent)',
  fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', padding: 0,
}
