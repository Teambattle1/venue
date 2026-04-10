import { useEffect, useState } from 'react'

export default function IntroAnimation({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'done'>('in')
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'), 4200)
    const t3 = setTimeout(() => { setPhase('done'); onDone?.() }, 5000)

    let start: number | null = null
    function tick(ts: number) {
      if (!start) start = ts
      const elapsed = ts - start
      const pct = Math.min(100, Math.round((elapsed / 4200) * 100))
      setCounter(pct)
      if (pct < 100) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'done') return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#0e0c09',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.8s ease' : 'none',
    }}>
      <Particles />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          border: '2px solid rgba(212,100,10,0.3)',
          margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'introRingSpin 8s linear infinite',
        }}>
          <span style={{
            fontFamily: 'Playfair Display, serif', fontSize: 36, color: '#d4640a',
            animation: 'introFadeUp 0.8s 0.3s both ease',
          }}>V</span>
        </div>

        <h1 style={{
          fontFamily: 'Playfair Display, serif', fontSize: 'clamp(42px, 7vw, 72px)',
          color: '#f0ece6', letterSpacing: '0.06em', fontWeight: 400,
          animation: 'introFadeUp 0.9s 0.5s both ease',
        }}>
          VENUE
          <span style={{ display: 'block', fontSize: 'clamp(11px, 1.6vw, 16px)', color: '#d4640a', letterSpacing: '0.15em', fontWeight: 400, fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            by TEAMBATTLE
          </span>
        </h1>

        <p style={{
          fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(13px, 1.8vw, 17px)',
          color: 'rgba(240,236,230,0.45)', letterSpacing: '0.08em', marginTop: 18,
          animation: 'introFadeUp 0.9s 0.9s both ease',
        }}>
          Venue Portal
        </p>

        <div style={{
          width: 200, height: 1, background: 'rgba(255,255,255,0.06)',
          margin: '22px auto 0', overflow: 'hidden',
          animation: 'introFadeUp 0.9s 1.1s both ease',
        }}>
          <div style={{
            height: '100%', width: `${counter}%`,
            background: 'linear-gradient(90deg, #d4640a, #e87520)',
            transition: 'width 0.1s linear',
          }} />
        </div>

        <p style={{
          fontSize: 11, color: 'rgba(212,100,10,0.5)', marginTop: 10,
          fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em',
          animation: 'introFadeUp 0.9s 1.1s both ease',
        }}>
          {counter}%
        </p>
      </div>

      <style>{`
        @keyframes introFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes introRingSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes introParticle {
          0%   { opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-80vh) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 5.5) % 92}%`,
    size: 2 + (i % 4),
    delay: (i * 0.28) % 4,
    duration: 4 + (i % 5),
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', bottom: -10, left: p.left,
          width: p.size, height: p.size, borderRadius: '50%',
          background: '#d4640a',
          animation: `introParticle ${p.duration}s ${p.delay}s ease-in infinite`,
        }} />
      ))}
    </div>
  )
}
