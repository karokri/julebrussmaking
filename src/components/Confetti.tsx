import { useMemo } from 'react'

const COLORS = ['#c8102e', '#1f6b45', '#d9a520', '#ffffff', '#e85d75', '#4caf7a']
const SHAPES = ['', '', '', '', '', '', '', '⭐', '❄']

/** Konfetti-regn som faller én gang. Endre `burst` for å fyre av på nytt. */
export default function Confetti({ burst, pieces = 90 }: { burst: number; pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: `${burst}-${i}`,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 2,
        rotate: Math.random() * 720 - 360,
        drift: (Math.random() - 0.5) * 160,
        w: 6 + Math.random() * 6,
      })),
    [burst, pieces],
  )
  if (!burst) return null
  return (
    <div className="confetti" aria-hidden="true" key={burst}>
      {items.map((c) => (
        <span
          key={c.id}
          style={
            {
              left: `${c.left}%`,
              background: c.shape ? 'none' : c.color,
              width: c.shape ? 'auto' : c.w,
              height: c.shape ? 'auto' : c.w * 0.45,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              '--rot': `${c.rotate}deg`,
              '--drift': `${c.drift}px`,
            } as React.CSSProperties
          }
        >
          {c.shape}
        </span>
      ))}
    </div>
  )
}
