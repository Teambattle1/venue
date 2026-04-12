import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface Todo {
  id: string
  title: string
  description?: string | null
  priority?: string | null
  due_date?: string | null
  resolved: boolean
  created_at: string
  is_error?: boolean
}

const PRIORITY_COLORS: Record<string, string> = {
  HASTER: '#ef4444',
  Vigtigt: '#f59e0b',
  'Prioritet 1': '#ef4444',
  'Prioritet 2': '#eab308',
  'Prioritet 3': '#22c55e',
  Normal: '#3b82f6',
  medium: '#94a3b8',
  let: '#34d399',
  'Ved lejlighed': '#6b7280',
}

const PRIORITY_OPTIONS = ['HASTER', 'Vigtigt', 'Normal', 'Ved lejlighed']

interface Props {
  venueCode: string
  venueName: string
}

export default function VenueTodos({ venueCode, venueName }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState('Normal')
  const [newDueDate, setNewDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTodos = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    const { data } = await supabase
      .from('todos')
      .select('id, title, description, priority, due_date, resolved, created_at, is_error')
      .eq('location', venueCode)
      .order('created_at', { ascending: false })
    if (data) setTodos(data)
    setLoading(false)
  }, [venueCode])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  async function addTodo() {
    if (!supabase || !newTitle.trim()) return
    setSaving(true)
    await supabase.from('todos').insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      priority: newPriority,
      due_date: newDueDate || null,
      location: venueCode,
      resolved: false,
    })
    setNewTitle('')
    setNewDesc('')
    setNewPriority('Normal')
    setNewDueDate('')
    setAdding(false)
    setSaving(false)
    fetchTodos()
  }

  async function toggleResolved(id: string, resolved: boolean) {
    if (!supabase) return
    await supabase.from('todos').update({ resolved, updated_at: new Date().toISOString() }).eq('id', id)
    setTodos(prev => prev.map(t => t.id === id ? { ...t, resolved } : t))
  }

  async function deleteTodo(id: string) {
    if (!supabase) return
    await supabase.from('todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const active = todos.filter(t => !t.resolved)
  const done = todos.filter(t => t.resolved)

  function formatDueDate(d?: string | null) {
    if (!d) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const due = new Date(d + 'T00:00:00'); due.setHours(0, 0, 0, 0)
    const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)
    if (diff < 0) return { text: `${Math.abs(diff)}d forsinket`, color: '#ef4444' }
    if (diff === 0) return { text: 'I dag', color: '#f59e0b' }
    if (diff === 1) return { text: 'I morgen', color: '#3b82f6' }
    return { text: due.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }), color: 'var(--muted)' }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
          Opgaver ({active.length})
        </h3>
        <button onClick={() => setAdding(!adding)} style={{
          background: adding ? 'var(--surface2)' : 'var(--accent)', border: 'none',
          color: adding ? 'var(--muted)' : '#fff', borderRadius: 'var(--r)',
          padding: '6px 14px', cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
        }}>
          {adding ? 'Annuller' : '+ Ny opgave'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{
          background: 'var(--surface2)', borderRadius: 'var(--r)', padding: 16,
          marginBottom: 16, border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="Opgavetitel..." style={inputStyle} autoFocus
            />
            <textarea
              value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Beskrivelse (valgfri)..." rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                style={{ ...inputStyle, width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button onClick={addTodo} disabled={saving || !newTitle.trim()} style={{
                background: 'var(--accent)', border: 'none', color: '#fff',
                borderRadius: 'var(--r)', padding: '6px 16px', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
                opacity: saving || !newTitle.trim() ? 0.5 : 1,
              }}>
                {saving ? 'Opretter...' : 'Opret'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>Indl\u00e6ser...</p>
      )}

      {/* Active todos */}
      {!loading && active.length === 0 && !adding && (
        <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>
          Ingen aktive opgaver for dette venue.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {active.map(todo => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggleResolved} onDelete={deleteTodo} formatDueDate={formatDueDate} />
        ))}
      </div>

      {/* Done todos */}
      {done.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowDone(!showDone)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: 12, color: 'var(--muted)',
            padding: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 10, transform: showDone ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>
              \u25B6
            </span>
            F\u00e6rdige ({done.length})
          </button>
          {showDone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, opacity: 0.6 }}>
              {done.map(todo => (
                <TodoItem key={todo.id} todo={todo} onToggle={toggleResolved} onDelete={deleteTodo} formatDueDate={formatDueDate} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TodoItem({ todo, onToggle, onDelete, formatDueDate }: {
  todo: Todo
  onToggle: (id: string, resolved: boolean) => void
  onDelete: (id: string) => void
  formatDueDate: (d?: string | null) => { text: string; color: string } | null
}) {
  const prioColor = PRIORITY_COLORS[todo.priority || ''] || '#6b7280'
  const due = formatDueDate(todo.due_date)

  return (
    <div style={{
      background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '10px 14px',
      borderLeft: `3px solid ${prioColor}`, display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <input
        type="checkbox" checked={todo.resolved}
        onChange={() => onToggle(todo.id, !todo.resolved)}
        style={{ marginTop: 3, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500,
            textDecoration: todo.resolved ? 'line-through' : 'none',
            color: todo.resolved ? 'var(--muted)' : 'var(--text)',
          }}>
            {todo.is_error && <span style={{ color: '#ef4444', marginRight: 4 }}>\u26A0</span>}
            {todo.title}
          </span>
          {todo.priority && (
            <span style={{
              fontSize: 9, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
              padding: '1px 6px', borderRadius: 4,
              background: prioColor + '22', color: prioColor,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {todo.priority}
            </span>
          )}
          {due && (
            <span style={{
              fontSize: 10, fontFamily: 'Outfit, sans-serif',
              color: due.color, fontWeight: 500,
            }}>
              {due.text}
            </span>
          )}
        </div>
        {todo.description && (
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', marginTop: 3 }}>
            {todo.description}
          </p>
        )}
      </div>
      <button onClick={() => onDelete(todo.id)} title="Slet" style={{
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
        fontSize: 14, padding: '0 2px', flexShrink: 0, opacity: 0.5,
      }}>
        \u00D7
      </button>
    </div>
  )
}
