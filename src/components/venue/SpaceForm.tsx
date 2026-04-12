import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadVenueImage } from '../../lib/storage'
import type { VenueSpace } from '../../lib/types'
import ImageUpload from './ImageUpload'
import OutdoorMap from './OutdoorMap'

interface Props {
  locationId: string
  type: 'inde' | 'ude'
  existing?: VenueSpace | null
  venueLat?: number | null
  venueLon?: number | null
  onClose: () => void
  onSaved: () => void
}

export default function SpaceForm({ locationId, type, existing, venueLat, venueLon, onClose, onSaved }: Props) {
  const [name, setName] = useState(existing?.name || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [note, setNote] = useState(existing?.note || '')
  const [adgangsvej, setAdgangsvej] = useState(existing?.adgangsvej || '')
  const [imageUrl, setImageUrl] = useState(existing?.image_url || '')
  const [lat, setLat] = useState<number | null>(existing?.lat || null)
  const [lon, setLon] = useState<number | null>(existing?.lon || null)
  const [mapLetter, setMapLetter] = useState(existing?.map_letter || '')
  const [instructorInfo, setInstructorInfo] = useState(existing?.instructor_info || '')
  const [saving, setSaving] = useState(false)

  async function handleUpload(file: File) {
    const url = await uploadVenueImage(locationId, file)
    setImageUrl(url)
  }

  async function save() {
    if (!supabase || !name.trim()) return
    setSaving(true)

    const row = {
      location_id: locationId,
      name: name.trim(),
      type,
      description: description.trim() || null,
      image_url: imageUrl || null,
      note: note.trim() || null,
      adgangsvej: adgangsvej.trim() || null,
      lat: lat,
      lon: lon,
      map_letter: mapLetter.trim() || null,
      instructor_info: instructorInfo.trim() || null,
    }

    if (existing) {
      await supabase.from('venue_spaces').update(row).eq('id', existing.id)
    } else {
      await supabase.from('venue_spaces').insert(row)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 'var(--r)',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: 14,
    outline: 'none', width: '100%',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 'var(--r)', padding: 24,
          width: '100%', maxWidth: 820, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>
          {existing ? 'Rediger' : 'Tilføj'} {type === 'inde' ? 'rum' : 'udendørs område'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, gridColumn: '1 / -1' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Navn</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Fx. Store sal, Terrasse..." style={inputStyle} />
            </div>
            <div style={{ width: 80 }}>
              <label style={labelStyle}>Kort-bogstav</label>
              <select value={mapLetter} onChange={e => setMapLetter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">-</option>
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Beskrivelse</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Kort beskrivelse..." rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Billede</label>
            <ImageUpload onUpload={handleUpload} currentUrl={imageUrl} />
          </div>

          <div>
              <label style={labelStyle}>Placering på kort (klik for at sætte pin)</label>
              <OutdoorMap
                centerLat={lat || venueLat} centerLon={lon || venueLon}
                editable onPinPlace={(la, lo) => { setLat(la); setLon(lo) }}
                editLat={lat} editLon={lon} height={250}
              />
              {lat && lon && (
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 6 }}>
                  Pin: {lat.toFixed(5)}, {lon.toFixed(5)}
                </p>
              )}
          </div>

          <div>
            <label style={labelStyle}>Instrukt\u00f8rinfo</label>
            <textarea
              value={instructorInfo} onChange={e => setInstructorInfo(e.target.value)}
              placeholder="Info til instrukt\u00f8rer om dette rum/omr\u00e5de..." rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Adgangsvej</label>
            <textarea
              value={adgangsvej} onChange={e => setAdgangsvej(e.target.value)}
              placeholder="Beskriv adgangsvej til rummet/området..." rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Note</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Tilføj en note..." rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, gridColumn: '1 / -1' }}>
            <button onClick={onClose} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', borderRadius: 'var(--r)', padding: '8px 20px',
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13,
            }}>
              Annuller
            </button>
            <button onClick={save} disabled={!name.trim() || saving} style={{
              background: 'var(--accent)', border: 'none', color: '#fff',
              borderRadius: 'var(--r)', padding: '8px 20px', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 500,
              opacity: !name.trim() || saving ? 0.5 : 1,
            }}>
              {saving ? 'Gemmer...' : existing ? 'Opdater' : 'Tilføj'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 4, display: 'block',
  fontFamily: 'Outfit, sans-serif',
}
