import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  locationId: string
  lastContactedAt?: string | null
  lastContactedNote?: string | null
  lastVisitedAt?: string | null
  lastVisitedNote?: string | null
  onSave: (updates: {
    last_contacted_at?: string | null
    last_contacted_note?: string | null
    last_visited_at?: string | null
    last_visited_note?: string | null
  }) => void
}

export default function VenueActivityLog({
  locationId, lastContactedAt, lastContactedNote, lastVisitedAt, lastVisitedNote, onSave,
}: Props) {
  const [editingContact, setEditingContact] = useState(false)
  const [editingVisit, setEditingVisit] = useState(false)
  const [contactDate, setContactDate] = useState(lastContactedAt || '')
  const [contactNote, setContactNote] = useState(lastContactedNote || '')
  const [visitDate, setVisitDate] = useState(lastVisitedAt || '')
  const [visitNote, setVisitNote] = useState(lastVisitedNote || '')
  const [saving, setSaving] = useState(false)

  async function saveContact() {
    if (!supabase) return
    setSaving(true)
    await supabase.from('locations').update({
      last_contacted_at: contactDate || null,
      last_contacted_note: contactNote || null,
    }).eq('id', locationId)
    onSave({ last_contacted_at: contactDate || null, last_contacted_note: contactNote || null })
    setSaving(false)
    setEditingContact(false)
  }

  async function saveVisit() {
    if (!supabase) return
    setSaving(true)
    await supabase.from('locations').update({
      last_visited_at: visitDate || null,
      last_visited_note: visitNote || null,
    }).eq('id', locationId)
    onSave({ last_visited_at: visitDate || null, last_visited_note: visitNote || null })
    setSaving(false)
    setEditingVisit(false)
  }

  function formatDate(d?: string | null) {
    if (!d) return 'Ikke registreret'
    return new Date(d + 'T00:00:00').toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function daysAgo(d?: string | null) {
    if (!d) return null
    const diff = Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000)
    if (diff === 0) return 'I dag'
    if (diff === 1) return 'I g\u00e5r'
    return `${diff} dage siden`
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 'var(--r)',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    fontFamily: 'Outfit, sans-serif', fontSize: 13, color: 'var(--text)',
    outline: 'none', width: '100%',
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '20px 24px',
      boxShadow: 'var(--shadow)',
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Aktivitetslog</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Senest kontaktet */}
        <div style={{
          background: 'var(--surface2)', borderRadius: 'var(--r)', padding: 16,
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
              Senest kontaktet
            </span>
            {!editingContact && (
              <button onClick={() => setEditingContact(true)} style={{
                background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)',
                borderRadius: 'var(--r)', padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: 11,
              }}>
                Opdater
              </button>
            )}
          </div>

          {editingContact ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="date" value={contactDate} onChange={e => setContactDate(e.target.value)} style={inputStyle} />
              <textarea
                value={contactNote} onChange={e => setContactNote(e.target.value)}
                placeholder="Note..." rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditingContact(false); setContactDate(lastContactedAt || ''); setContactNote(lastContactedNote || '') }}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 'var(--r)', padding: '4px 12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11 }}>
                  Annuller
                </button>
                <button onClick={saveContact} disabled={saving}
                  style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 'var(--r)', padding: '4px 12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 500, opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Gemmer...' : 'Gem'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 15, fontWeight: 500, fontFamily: 'Outfit, sans-serif', color: 'var(--text)' }}>
                {formatDate(lastContactedAt)}
              </p>
              {lastContactedAt && (
                <p style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', marginTop: 2 }}>
                  {daysAgo(lastContactedAt)}
                </p>
              )}
              {lastContactedNote && (
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginTop: 6 }}>
                  {lastContactedNote}
                </p>
              )}
            </>
          )}
        </div>

        {/* Senest besøgt */}
        <div style={{
          background: 'var(--surface2)', borderRadius: 'var(--r)', padding: 16,
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
              Senest besøgt
            </span>
            {!editingVisit && (
              <button onClick={() => setEditingVisit(true)} style={{
                background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)',
                borderRadius: 'var(--r)', padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: 11,
              }}>
                Opdater
              </button>
            )}
          </div>

          {editingVisit ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} style={inputStyle} />
              <textarea
                value={visitNote} onChange={e => setVisitNote(e.target.value)}
                placeholder="Note..." rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditingVisit(false); setVisitDate(lastVisitedAt || ''); setVisitNote(lastVisitedNote || '') }}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 'var(--r)', padding: '4px 12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11 }}>
                  Annuller
                </button>
                <button onClick={saveVisit} disabled={saving}
                  style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 'var(--r)', padding: '4px 12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 500, opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Gemmer...' : 'Gem'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 15, fontWeight: 500, fontFamily: 'Outfit, sans-serif', color: 'var(--text)' }}>
                {formatDate(lastVisitedAt)}
              </p>
              {lastVisitedAt && (
                <p style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', marginTop: 2 }}>
                  {daysAgo(lastVisitedAt)}
                </p>
              )}
              {lastVisitedNote && (
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginTop: 6 }}>
                  {lastVisitedNote}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
