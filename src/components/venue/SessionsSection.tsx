import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Session {
  id: string
  client_name: string
  client_logo_url: string | null
  guests_count: number | null
  event_date: string | null
  status: string
  lead_instructor: string | null
}

interface Props {
  locationName: string
}

export default function SessionsSection({ locationName }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase || !locationName) return
      const { data } = await supabase.rpc('get_venue_sessions', { venue_name: locationName })
      if (data) setSessions(data)
      setLoading(false)
    }
    load()
  }, [locationName])

  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r)', padding: '20px 24px',
        boxShadow: 'var(--shadow)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Sessions</h3>
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Indlæser...</p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '20px 24px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Sessions ({sessions.length})</h3>
      </div>

      {sessions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 100px 80px 1fr',
            gap: 12, padding: '8px 12px',
            fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase',
            letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif',
            borderBottom: '1px solid var(--border)',
          }}>
            <span></span>
            <span>Client</span>
            <span>Dato</span>
            <span>Deltagere</span>
            <span>Lead instruktør</span>
          </div>

          {sessions.map((s) => (
            <div key={s.id} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 100px 80px 1fr',
              gap: 12, padding: '10px 12px', alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              fontSize: 13, fontFamily: 'Outfit, sans-serif',
            }}>
              {/* Logo */}
              <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.client_logo_url ? (
                  <img src={s.client_logo_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                    {s.client_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>

              {/* Client name */}
              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.client_name}
              </span>

              {/* Date */}
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                {s.event_date ? formatDate(s.event_date) : '-'}
              </span>

              {/* Guests */}
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                {s.guests_count ?? '-'}
              </span>

              {/* Lead instructor */}
              <span style={{ color: 'var(--accent)', fontSize: 12 }}>
                {s.lead_instructor || '-'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
          Ingen sessions fundet for dette venue.
        </p>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}
