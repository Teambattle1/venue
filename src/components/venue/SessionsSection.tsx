import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ACTIVITIES } from '../../lib/types'

interface Session {
  id: string
  client_name: string
  client_logo_url: string | null
  guests_count: number | null
  event_date: string | null
  status: string
  lead_instructor: string | null
  activities: string[] | null
}

interface Props {
  locationName: string
  locationId?: string
  onLastVisited?: (date: string) => void
}

export default function SessionsSection({ locationName, locationId, onLastVisited }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase || !locationName) return
      const { data } = await supabase.rpc('get_venue_sessions', { venue_name: locationName })
      if (data) {
        setSessions(data)
        // Auto-update last_visited_at with most recent past session
        if (locationId && onLastVisited) {
          const now = new Date()
          const pastSessions = data.filter((s: Session) => s.event_date && new Date(s.event_date) <= now)
          if (pastSessions.length > 0) {
            const latest = pastSessions[0].event_date!
            const dateStr = new Date(latest).toISOString().split('T')[0]
            onLastVisited(dateStr)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [locationName])

  if (loading) {
    return (
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>Sessions</h3>
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 12, marginTop: 8 }}>Indl\u00e6ser...</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Sessions ({sessions.length})</h3>

      {sessions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sessions.map((s) => {
            const actNames = (s.activities || [])
              .map(id => ACTIVITIES.find(a => a.id === id))
              .filter(Boolean)
            return (
              <div key={s.id} style={{
                background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 10px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 4, overflow: 'hidden',
                    background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {s.client_logo_url ? (
                      <img src={s.client_logo_url} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{s.client_name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Outfit, sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.client_name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>
                    {s.event_date ? formatDate(s.event_date) : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginLeft: 30 }}>
                  {s.guests_count && (
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>
                      {s.guests_count} pers.
                    </span>
                  )}
                  {s.lead_instructor && (
                    <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
                      {s.lead_instructor}
                    </span>
                  )}
                  {actNames.map(a => (
                    <span key={a!.id} style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 3,
                      background: a!.color + '22', color: a!.color,
                      fontFamily: 'Outfit, sans-serif', fontWeight: 600,
                      border: `1px solid ${a!.color}44`,
                    }}>
                      {a!.name.replace('Team', '')}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
          Ingen sessions fundet.
        </p>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}
