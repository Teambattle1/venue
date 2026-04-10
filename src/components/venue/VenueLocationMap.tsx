import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import OutdoorMap from './OutdoorMap'

interface Props {
  locationId: string
  lat?: number | null
  lon?: number | null
  venueName?: string
  onSave: (lat: number | null, lon: number | null) => void
}

export default function VenueLocationMap({ locationId, lat, lon, venueName, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [pinLat, setPinLat] = useState<number | null>(lat || null)
  const [pinLon, setPinLon] = useState<number | null>(lon || null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!supabase) return
    setSaving(true)
    await supabase.from('locations').update({
      lat: pinLat,
      lon: pinLon,
    }).eq('id', locationId)
    onSave(pinLat, pinLon)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setPinLat(lat || null)
    setPinLon(lon || null)
    setEditing(false)
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '20px 24px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Placering på kort</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'transparent', color: 'var(--accent)',
              border: '1px solid var(--accent)', borderRadius: 'var(--r)',
              padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
            }}
          >
            {lat && lon ? 'Flyt pin' : 'Sæt pin'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={cancel} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', borderRadius: 'var(--r)', padding: '6px 14px',
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 12,
            }}>
              Annuller
            </button>
            <button onClick={save} disabled={saving || (!pinLat && !pinLon)} style={{
              background: 'var(--accent)', border: 'none', color: '#fff',
              borderRadius: 'var(--r)', padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
              opacity: saving || (!pinLat && !pinLon) ? 0.5 : 1,
            }}>
              {saving ? 'Gemmer...' : 'Gem placering'}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginBottom: 12 }}>
          Klik på kortet for at sætte pin. Træk pin for at justere.
        </p>
      )}

      <OutdoorMap
        centerLat={pinLat || lat}
        centerLon={pinLon || lon}
        editable={editing}
        onPinPlace={(la, lo) => { setPinLat(la); setPinLon(lo) }}
        editLat={pinLat}
        editLon={pinLon}
        pinLat={pinLat}
        pinLon={pinLon}
        height={300}
        venueName={venueName}
      />

      {(pinLat && pinLon) && (
        <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 8 }}>
          Koordinater: {pinLat.toFixed(5)}, {pinLon.toFixed(5)}
        </p>
      )}

      {!editing && lat && lon && (
        <a
          href={`https://www.google.com/maps?q=${lat},${lon}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}
        >
          Åbn i Google Maps &rarr;
        </a>
      )}
    </div>
  )
}
