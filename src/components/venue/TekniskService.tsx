import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  locationId: string
  name?: string | null
  phone?: string | null
  onSave: (name: string, phone: string) => void
}

export default function TekniskService({ locationId, name, phone, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [techName, setTechName] = useState(name || '')
  const [techPhone, setTechPhone] = useState(phone || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!supabase) return
    setSaving(true)
    await supabase.from('locations').update({
      teknisk_service_name: techName || null,
      teknisk_service_phone: techPhone || null,
    }).eq('id', locationId)
    onSave(techName, techPhone)
    setSaving(false)
    setEditing(false)
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 'var(--r)',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: 14,
    outline: 'none', width: '100%',
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '20px 24px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Teknisk Service</h3>
        <button
          onClick={() => editing ? save() : setEditing(true)}
          disabled={saving}
          style={{
            background: editing ? 'var(--accent)' : 'transparent',
            color: editing ? '#fff' : 'var(--accent)',
            border: editing ? 'none' : '1px solid var(--accent)',
            borderRadius: 'var(--r)', padding: '6px 14px', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
          }}
        >
          {saving ? 'Gemmer...' : editing ? 'Gem' : 'Rediger'}
        </button>
      </div>

      {editing ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block', fontFamily: 'Outfit, sans-serif' }}>
              Tekniker
            </label>
            <input
              value={techName} onChange={e => setTechName(e.target.value)}
              placeholder="Navn..." style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block', fontFamily: 'Outfit, sans-serif' }}>
              Telefon
            </label>
            <input
              value={techPhone} onChange={e => setTechPhone(e.target.value)}
              placeholder="Telefonnummer..." style={inputStyle}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24 }}>
          {techName || techPhone ? (
            <>
              {techName && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif' }}>Tekniker</p>
                  <p style={{ fontSize: 14, fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>{techName}</p>
                </div>
              )}
              {techPhone && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif' }}>Telefon</p>
                  <a href={`tel:${techPhone}`} style={{ fontSize: 14, fontFamily: 'Outfit, sans-serif', fontWeight: 500, color: 'var(--accent)', textDecoration: 'none' }}>
                    {techPhone}
                  </a>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
              Ingen teknisk service tilknyttet endnu.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
