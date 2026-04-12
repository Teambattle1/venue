import { ACTIVITIES } from '../../lib/types'

interface Props {
  selected: string[]
  onChange: (ids: string[]) => void
}

export default function ActivitySelector({ selected, onChange }: Props) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    )
  }

  function textColor(bg: string): string {
    const hex = bg.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000' : '#fff'
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
    }}>
      {ACTIVITIES.map(a => {
        const active = selected.includes(a.id)
        const label = a.name.replace(/^Team/, '')
        return (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            style={{
              padding: '10px 6px', borderRadius: 'var(--r)',
              border: `2px solid ${a.color}`,
              background: active ? a.color : 'transparent',
              color: active ? textColor(a.color) : 'var(--text)',
              fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', textAlign: 'center',
              minHeight: 44,
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
