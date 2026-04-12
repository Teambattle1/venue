import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadVenueImage } from '../../lib/storage'
import { getCurrentPosition } from '../../lib/geo'
import type { VenueSpace } from '../../lib/types'
import InstructorShell from './InstructorShell'
import OutdoorMap from '../venue/OutdoorMap'
import MultiImageUpload, { type ImageItem } from './MultiImageUpload'
import ActivitySelector from './ActivitySelector'

interface Props {
  locationId: string
  venueLat?: number | null
  venueLon?: number | null
  existing?: VenueSpace | null
  onBack: () => void
  onSaved: () => void
}

export default function SpaceWizard({ locationId, venueLat, venueLon, existing, onBack, onSaved }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(existing ? 2 : 1)
  const [spaceType, setSpaceType] = useState<'inde' | 'ude'>(existing?.type || 'inde')

  // Fields
  const [name, setName] = useState(existing?.name || '')
  const [placement, setPlacement] = useState((existing as any)?.placement || '')
  const [hasScreen, setHasScreen] = useState((existing as any)?.has_screen || false)
  const [description, setDescription] = useState(existing?.description || '')
  const [note, setNote] = useState(existing?.note || '')
  const [adgangsvej, setAdgangsvej] = useState(existing?.adgangsvej || '')
  const [instructorInfo, setInstructorInfo] = useState(existing?.instructor_info || '')
  const [activities, setActivities] = useState<string[]>(existing?.suitable_activities || [])
  const [lat, setLat] = useState<number | null>(existing?.lat || null)
  const [lon, setLon] = useState<number | null>(existing?.lon || null)
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (existing?.image_url) {
      return [{ id: 'existing_cover', url: existing.image_url, preview: existing.image_url }]
    }
    return []
  })
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

    try {
      // Upload new images
      const uploadedUrls: string[] = []
      for (const img of images) {
        if (img.file) {
          const url = await uploadVenueImage(locationId, img.file)
          uploadedUrls.push(url)
        } else if (img.url) {
          uploadedUrls.push(img.url)
        }
      }

      const coverUrl = uploadedUrls[0] || null

      const row: Record<string, any> = {
        location_id: locationId,
        name: name.trim(),
        type: spaceType,
        description: description.trim() || null,
        image_url: coverUrl,
        note: note.trim() || null,
        adgangsvej: adgangsvej.trim() || null,
        instructor_info: instructorInfo.trim() || null,
        suitable_activities: activities,
        lat, lon,
        has_screen: spaceType === 'inde' ? hasScreen : false,
        placement: spaceType === 'inde' ? (placement.trim() || null) : null,
      }

      let spaceId = existing?.id

      if (existing) {
        await supabase.from('venue_spaces').update(row).eq('id', existing.id)
      } else {
        const { data } = await supabase.from('venue_spaces').insert(row).select('id').single()
        spaceId = data?.id
      }

      // Save additional images to space_images table
      if (spaceId && uploadedUrls.length > 0) {
        // Delete old space_images for this space
        await supabase.from('space_images').delete().eq('space_id', spaceId)

        const rows = uploadedUrls.map((url, i) => ({
          space_id: spaceId!,
          image_url: url,
          sort_order: i,
        }))
        await supabase.from('space_images').insert(rows)
      }

      onSaved()
    } catch (err: any) {
      setError(err.message || 'Fejl ved gem')
      setSaving(false)
    }
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

  // Step 1: Choose type
  if (step === 1) {
    return (
      <InstructorShell title="Nyt rum/område" onBack={onBack}>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 40 }}>
          <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', marginBottom: 8 }}>
            Vælg type
          </p>
          <button
            onClick={() => { setSpaceType('inde'); setStep(2) }}
            style={{
              padding: '32px 16px', borderRadius: 'var(--r)',
              border: '2px solid var(--accent)', background: 'var(--surface2)',
              color: 'var(--text)', cursor: 'pointer', fontSize: 20,
              fontFamily: 'Outfit, sans-serif', fontWeight: 600, minHeight: 80,
            }}
          >
            INDE
            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginTop: 4 }}>
              Lokale, sal, møderum
            </span>
          </button>
          <button
            onClick={() => { setSpaceType('ude'); setStep(2) }}
            style={{
              padding: '32px 16px', borderRadius: 'var(--r)',
              border: '2px solid #2563eb', background: 'var(--surface2)',
              color: 'var(--text)', cursor: 'pointer', fontSize: 20,
              fontFamily: 'Outfit, sans-serif', fontWeight: 600, minHeight: 80,
            }}
          >
            UDE
            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginTop: 4 }}>
              Udendørs område, plads, have
            </span>
          </button>
        </div>
      </InstructorShell>
    )
  }

  // Step 2: Details
  if (step === 2) {
    const color = spaceType === 'inde' ? 'var(--accent)' : '#2563eb'
    const typeLabel = spaceType === 'inde' ? 'Indendørs rum' : 'Udendørs område'

    return (
      <InstructorShell
        title={existing ? `Rediger ${typeLabel.toLowerCase()}` : `Nyt ${typeLabel.toLowerCase()}`}
        onBack={() => existing ? onBack() : setStep(1)}
        bottomBar={
          <button onClick={() => setStep(3)} disabled={!name.trim()} style={{
            width: '100%', padding: '14px', borderRadius: 'var(--r)',
            background: color, border: 'none', color: '#fff',
            fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', minHeight: 48, opacity: name.trim() ? 1 : 0.5,
          }}>
            Se opsummering &#8594;
          </button>
        }
      >
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            padding: '4px 12px', borderRadius: 20, background: color, color: '#fff',
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {spaceType === 'inde' ? 'INDE' : 'UDE'}
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>{spaceType === 'inde' ? 'Lokale navn' : 'Område navn'} *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder={spaceType === 'inde' ? 'Fx Store Sal, Mødelokale 2...' : 'Fx Terrasse, Gårdhave...'}
              style={inputStyle} />
          </div>

          {/* INDE-specific fields */}
          {spaceType === 'inde' && (
            <>
              <div>
                <label style={labelStyle}>Placering (sal/sted)</label>
                <input value={placement} onChange={e => setPlacement(e.target.value)}
                  placeholder="Fx 1. sal, Kælderen, Bygning B..."
                  style={inputStyle} />
              </div>

              {/* Screen toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 14, fontFamily: 'Outfit, sans-serif', color: 'var(--text)' }}>
                  Storskærm?
                </label>
                <button
                  onClick={() => setHasScreen(!hasScreen)}
                  style={{
                    width: 56, height: 32, borderRadius: 16,
                    background: hasScreen ? 'var(--accent)' : 'var(--surface2)',
                    border: `1px solid ${hasScreen ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                    padding: 0,
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#fff', position: 'absolute', top: 2,
                    left: hasScreen ? 27 : 2, transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>
            </>
          )}

          {/* UDE-specific: Map */}
          {spaceType === 'ude' && (
            <div>
              <label style={labelStyle}>Placering på kort</label>
              <OutdoorMap
                centerLat={lat || venueLat} centerLon={lon || venueLon}
                editable onPinPlace={(la, lo) => { setLat(la); setLon(lo) }}
                editLat={lat} editLon={lon}
                height={280}
              />
              <button onClick={useMyPosition} style={{
                width: '100%', marginTop: 8, padding: '10px',
                borderRadius: 'var(--r)', background: 'transparent',
                border: '1px solid #2563eb', color: '#2563eb',
                fontFamily: 'Outfit, sans-serif', fontSize: 13,
                cursor: 'pointer', minHeight: 44,
              }}>
                Min position
              </button>
              {lat && lon && (
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 6, textAlign: 'center' }}>
                  {lat.toFixed(5)}, {lon.toFixed(5)}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label style={labelStyle}>{spaceType === 'ude' ? 'Beskriv lokation' : 'Beskrivelse'}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Kort beskrivelse..."
              rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Access */}
          <div>
            <label style={labelStyle}>Adgangsforhold</label>
            <textarea value={adgangsvej} onChange={e => setAdgangsvej(e.target.value)}
              placeholder="Beskriv adgangsforhold, parkering, indgang..."
              rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Note */}
          <div>
            <label style={labelStyle}>Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Yderligere note..."
              rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Instructor info */}
          <div>
            <label style={labelStyle}>Instruktørinfo</label>
            <textarea value={instructorInfo} onChange={e => setInstructorInfo(e.target.value)}
              placeholder="Info til instruktører..."
              rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Activities */}
          <div>
            <label style={labelStyle}>Egnede aktiviteter</label>
            <ActivitySelector selected={activities} onChange={setActivities} />
          </div>

          {/* Photos */}
          <div>
            <label style={labelStyle}>Billeder</label>
            <MultiImageUpload images={images} onChange={setImages} />
          </div>
        </div>
      </InstructorShell>
    )
  }

  // Step 3: Review
  const color = spaceType === 'inde' ? 'var(--accent)' : '#2563eb'

  return (
    <InstructorShell
      title="Opsummering"
      onBack={() => setStep(2)}
      bottomBar={
        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '14px', borderRadius: 'var(--r)',
          background: color, border: 'none', color: '#fff',
          fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', minHeight: 48, opacity: saving ? 0.5 : 1,
        }}>
          {saving ? 'Gemmer...' : existing ? 'Opdater' : 'Gem rum/område'}
        </button>
      }
    >
      <div style={{ padding: 16 }}>
        <div style={{
          background: 'var(--surface2)', borderRadius: 'var(--r)', padding: 16,
          border: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 12,
            background: color, color: '#fff', fontSize: 10, fontWeight: 600,
            textTransform: 'uppercase', marginBottom: 12,
          }}>
            {spaceType === 'inde' ? 'INDE' : 'UDE'}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>
            {name}
          </h3>

          {spaceType === 'inde' && placement && (
            <SummaryRow label="Placering" value={placement} />
          )}
          {spaceType === 'inde' && (
            <SummaryRow label="Storskærm" value={hasScreen ? 'Ja' : 'Nej'} />
          )}
          {description && <SummaryRow label="Beskrivelse" value={description} />}
          {adgangsvej && <SummaryRow label="Adgang" value={adgangsvej} />}
          {note && <SummaryRow label="Note" value={note} />}
          {instructorInfo && <SummaryRow label="Instruktørinfo" value={instructorInfo} />}

          {activities.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Aktiviteter: </span>
              <span style={{ fontSize: 12, color: 'var(--text)' }}>
                {activities.length} valgt
              </span>
            </div>
          )}

          {lat && lon && (
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 8 }}>
              GPS: {lat.toFixed(5)}, {lon.toFixed(5)}
            </p>
          )}
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto' }}>
            {images.map(img => (
              <img key={img.id} src={img.preview || img.url}
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--r)', flexShrink: 0 }}
              />
            ))}
          </div>
        )}

        {/* Map preview for UDE */}
        {spaceType === 'ude' && lat && lon && (
          <div style={{ marginTop: 16 }}>
            <OutdoorMap centerLat={lat} centerLon={lon} pinLat={lat} pinLon={lon} height={180} />
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--red, #c03030)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </InstructorShell>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}: </span>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}
