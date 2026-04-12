import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import OutdoorMap from './OutdoorMap'

const MY_MAPS_MID = '1kk3NNhrq_jToiol2_X6-_ExAh88Z55I'

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

  const myMapsEmbedUrl = lat && lon
    ? `https://www.google.com/maps/d/embed?mid=${MY_MAPS_MID}&ll=${lat},${lon}&z=16`
    : `https://www.google.com/maps/d/embed?mid=${MY_MAPS_MID}&z=7`

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '16px 20px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>Venue-kort</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'transparent', color: 'var(--accent)',
                border: '1px solid var(--accent)', borderRadius: 'var(--r)',
                padding: '4px 12px', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 500,
              }}
            >
              {lat && lon ? 'Flyt pin' : 'S\u00e6t pin'}
            </button>
          ) : (
            <>
              <button onClick={cancel} style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', borderRadius: 'var(--r)', padding: '4px 12px',
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11,
              }}>
                Annuller
              </button>
              <button onClick={save} disabled={saving || (!pinLat && !pinLon)} style={{
                background: 'var(--accent)', border: 'none', color: '#fff',
                borderRadius: 'var(--r)', padding: '4px 12px', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 500,
                opacity: saving || (!pinLat && !pinLon) ? 0.5 : 1,
              }}>
                {saving ? 'Gemmer...' : 'Gem'}
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <>
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginBottom: 8 }}>
            Klik p\u00e5 kortet for at s\u00e6tte pin. Tr\u00e6k pin for at justere.
          </p>
          <OutdoorMap
            centerLat={pinLat || lat}
            centerLon={pinLon || lon}
            editable
            onPinPlace={(la, lo) => { setPinLat(la); setPinLon(lo) }}
            editLat={pinLat}
            editLon={pinLon}
            height={300}
            venueName={venueName}
          />
        </>
      ) : (
        <iframe
          src={myMapsEmbedUrl}
          style={{
            width: '100%', height: 350, border: 'none',
            borderRadius: 'var(--r)',
          }}
          allowFullScreen
          loading="lazy"
        />
      )}

      {(pinLat && pinLon) && (
        <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 6 }}>
          {pinLat.toFixed(5)}, {pinLon.toFixed(5)}
        </p>
      )}

      {!editing && lat && lon && (
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <a
            href={`https://www.google.com/maps?q=${lat},${lon}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', textDecoration: 'none' }}
          >
            Google Maps &rarr;
          </a>
          <a
            href={`https://www.google.com/maps/d/edit?mid=${MY_MAPS_MID}&ll=${lat},${lon}&z=16`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', textDecoration: 'none' }}
          >
            Rediger My Maps &rarr;
          </a>
        </div>
      )}
    </div>
  )
}
