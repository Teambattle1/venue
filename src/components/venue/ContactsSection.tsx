import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Contact } from '../../lib/types'

interface Props {
  locationId: string
  contacts: Contact[]
  onSave: (contacts: Contact[]) => void
}

export default function ContactsSection({ locationId, contacts, onSave }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  async function saveContacts(updated: Contact[]) {
    if (!supabase) return
    setSaving(true)
    await supabase.from('locations').update({ contacts: updated }).eq('id', locationId)
    onSave(updated)
    setSaving(false)
  }

  function handleSaveEdit(edited: Contact) {
    const updated = contacts.map(c => c.id === edited.id ? edited : c)
    saveContacts(updated)
    setEditingId(null)
  }

  function handleAdd(contact: Contact) {
    const updated = [...contacts, contact]
    saveContacts(updated)
    setShowAdd(false)
  }

  function handleDelete(id: string) {
    if (!confirm('Slet denne kontaktperson?')) return
    const updated = contacts.filter(c => c.id !== id)
    saveContacts(updated)
    setEditingId(null)
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: '20px 24px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
          Kontaktpersoner ({contacts.length})
        </h3>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null) }}
          style={{
            background: 'transparent', color: 'var(--accent)',
            border: '1px solid var(--accent)', borderRadius: 'var(--r)',
            padding: '6px 14px', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
          }}
        >
          + Tilføj
        </button>
      </div>

      {contacts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contacts.map((c) => (
            editingId === c.id ? (
              <ContactForm
                key={c.id}
                initial={c}
                saving={saving}
                onSave={handleSaveEdit}
                onCancel={() => setEditingId(null)}
                onDelete={() => handleDelete(c.id)}
              />
            ) : (
              <ContactCard
                key={c.id}
                contact={c}
                onEdit={() => { setEditingId(c.id); setShowAdd(false) }}
              />
            )
          ))}
        </div>
      ) : !showAdd && (
        <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
          Ingen kontaktpersoner tilføjet endnu.
        </p>
      )}

      {showAdd && (
        <div style={{ marginTop: contacts.length > 0 ? 16 : 0 }}>
          <ContactForm
            saving={saving}
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}
    </div>
  )
}

function ContactCard({ contact: c, onEdit }: { contact: Contact; onEdit: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 12px',
      cursor: 'pointer',
    }} onClick={() => setOpen(!open)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <p style={{ fontWeight: 500, fontFamily: 'Outfit, sans-serif', fontSize: 13, whiteSpace: 'nowrap' }}>
            {c.name || '(intet navn)'}
          </p>
          {c.title && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>{c.title}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {c.mobile && (
            <a href={`tel:${c.mobile}`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Outfit, sans-serif' }}>
              {c.mobile}
            </a>
          )}
          <span style={{ fontSize: 10, color: 'var(--muted)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>&#9654;</span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          {c.email && (
            <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Outfit, sans-serif', display: 'block', marginBottom: 4 }}>
              {c.email}
            </a>
          )}
          {c.notes && <p style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', whiteSpace: 'pre-wrap', marginBottom: 4 }}>{c.notes}</p>}
          <button onClick={e => { e.stopPropagation(); onEdit() }} style={{
            background: 'none', border: 'none', color: 'var(--accent)',
            fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', padding: 0,
          }}>
            Rediger
          </button>
        </div>
      )}
    </div>
  )
}

function ContactForm({ initial, saving, onSave, onCancel, onDelete }: {
  initial?: Contact
  saving: boolean
  onSave: (contact: Contact) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [title, setTitle] = useState(initial?.title || '')
  const [mobile, setMobile] = useState(initial?.mobile || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [notes, setNotes] = useState(initial?.notes || '')

  function handleSave() {
    if (!name.trim()) return
    onSave({
      id: initial?.id || crypto.randomUUID(),
      name: name.trim(),
      title: title.trim() || undefined,
      mobile: mobile.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 'var(--r)',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: 13,
    outline: 'none', width: '100%',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 3, display: 'block',
    fontFamily: 'Outfit, sans-serif',
  }

  return (
    <div style={{
      background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '14px 16px',
      border: '1px solid var(--accent)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Navn *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Fulde navn..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Titel</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Fx. Chef, Teknik..." style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Mobil</label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Telefonnummer..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@..." style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Note</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Evt. note..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} style={{
                background: 'none', border: 'none', color: 'var(--red)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', padding: 0,
              }}>
                Slet
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', borderRadius: 'var(--r)', padding: '6px 14px',
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 12,
            }}>
              Annuller
            </button>
            <button onClick={handleSave} disabled={!name.trim() || saving} style={{
              background: 'var(--accent)', border: 'none', color: '#fff',
              borderRadius: 'var(--r)', padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
              opacity: !name.trim() || saving ? 0.5 : 1,
            }}>
              {saving ? 'Gemmer...' : initial ? 'Opdater' : 'Tilføj'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
