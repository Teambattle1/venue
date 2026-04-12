import type { ReactNode } from 'react'

interface Props {
  title: string
  onBack?: () => void
  children: ReactNode
  bottomBar?: ReactNode
}

export default function InstructorShell({ title, onBack, children, bottomBar }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
        background: 'var(--surface)',
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
            fontSize: 20, padding: '4px 8px', lineHeight: 1, fontFamily: 'Outfit, sans-serif',
          }}>
            &#8592;
          </button>
        )}
        <h1 style={{
          fontSize: 16, fontWeight: 600, margin: 0,
          fontFamily: 'Outfit, sans-serif', flex: 1, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </h1>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}>
        {children}
      </div>

      {/* Bottom action bar */}
      {bottomBar && (
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          background: 'var(--surface)', flexShrink: 0,
        }}>
          {bottomBar}
        </div>
      )}
    </div>
  )
}
