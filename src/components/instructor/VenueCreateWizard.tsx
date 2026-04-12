import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getCurrentPosition } from '../../lib/geo'
import InstructorShell from './InstructorShell'
import OutdoorMap from '../venue/OutdoorMap'

interface Props {
  initialLat: number
  initialLon: number
  onBack: () => void
  onCreated: (locationId: string) => void
}

export default function VenueCreateWizard({ initialLat, initialLon, onBack, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [lat, setLat] = useState(initialLat)
  const [lon, setLon] = useState(initialLon)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function useMyPosition() {
    try {
      const pos = await getCurrentPosition()
      setLat(pos.lat)
      setLon(pos.lon)
    } catch { /* ignore */ }
  }

  async function save() {
    if (!supabase || !name.trim()) return
    setSaving(true)
    setError('')

    const code = name.trim().toUpperCase().replace(/[^A-ZÆØÅa-zæøå0-9]/g, '').slice(0, 6)

    const { data, error: err } = await supabase.from('locations').insert({
      name: name.trim(),
      address: address.trim() || null,
      postal_code: postalCode.trim() || null,
      phone: phone.trim() || null,
      lat, lon,
      crm_status: 'lead',
      venue_code: code,
      venue_type: 'begge',
      contacts: [],
    }).select('id').single()

    setSaving(false)
    if (err || !data) {
      setError(err?.message || 'Kunne ikke oprette venue')
      return
    }
    onCreated(data.id)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 'var(--r)',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: 15,
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 6, display: 'block',
    fontFamily: 'Outfit, sans-serif', fontWeight: 600,
  }

  if (step === 1) {
    return (
      <InstructorShell
        title="Ny venue — Placering"
        onBack={onBack}
        bottomBar={
          <button onClick={() => setStep(2)} style={btnPrimary}>
            Næste &#8594;
          </button>
        }
      >
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            Klik på kortet for at placere venue, eller brug knappen herunder.
          </p>
          <OutdoorMap
            centerLat={lat} centerLon={lon}
            editable onPinPlace={(la, lo) => { setLat(la); setLon(lo) }}
            editLat={lat} editLon={lon}
            height={350}
          />
          <button onClick={useMyPosition} style={{
            ...btnSecondary, width: '100%', marginTop: 12,
          }}>
            Min position
          </button>
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 8, textAlign: 'center' }}>
            {lat.toFixed(5)}, {lon.toFixed(5)}
          </p>
        </div>
      </InstructorShell>
    )
  }

  if (step === 2) {
    return (
      <InstructorShell
        title="Ny venue — Info"
        onBack={() => setStep(1)}
        bottomBar={
          <button onClick={() => setStep(3)} disabled={!name.trim()} style={{
            ...btnPrimary, opacity: name.trim() ? 1 : 0.5,
          }}>
            Næste &#8594;
          </button>
        }
      >
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Navn *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Venue navn..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Adresse</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Vejnavn 123" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Postnummer</label>
            <input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="1234" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Telefon</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+45..." type="tel" style={inputStyle} />
          </div>
        </div>
      </InstructorShell>
    )
  }

  // Step 3 - confirm
  return (
    <InstructorShell
      title="Ny venue — Bekræft"
      onBack={() => setStep(2)}
      bottomBar={
        <button onClick={save} disabled={saving} style={{
          ...btnPrimary, opacity: saving ? 0.5 : 1,
        }}>
          {saving ? 'Opretter...' : 'Opret venue'}
        </button>
      }
    >
      <div style={{ padding: 16 }}>
        <div style={{
          background: 'var(--surface2)', borderRadius: 'var(--r)', padding: 16,
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, fontFamily: 'Outfit, sans-serif' }}>
            {name}
          </h3>
          {address && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{address}</p>}
          {postalCode && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{postalCode}</p>}
          {phone && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{phone}</p>}
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 8 }}>
            GPS: {lat.toFixed(5)}, {lon.toFixed(5)}
          </p>
        </div>

        <div style={{ marginTop: 16 }}>
          <OutdoorMap
            centerLat={lat} centerLon={lon}
            pinLat={lat} pinLon={lon}
            height={200}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--red, #c03030)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </InstructorShell>
  )
}

const btnPrimary: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 'var(--r)',
  background: 'var(--accent)', border: 'none', color: '#fff',
  fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 600,
  cursor: 'pointer', minHeight: 48,
}

const btnSecondary: React.CSSProperties = {
  padding: '12px', borderRadius: 'var(--r)',
  background: 'transparent', border: '1px solid var(--accent)',
  color: 'var(--accent)', fontFamily: 'Outfit, sans-serif',
  fontSize: 14, fontWeight: 500, cursor: 'pointer', minHeight: 44,
}
