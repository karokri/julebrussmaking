import { useMemo } from 'react'

/** Lett snøfall i bakgrunnen – kun CSS-animasjoner, ingen canvas */
export default function Snow({ count = 28 }: { count?: number }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 0.6 + Math.random() * 1.1,
        duration: 9 + Math.random() * 12,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 80,
        char: Math.random() < 0.35 ? '❄' : '•',
      })),
    [count],
  )
  return (
    <div className="snow" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          style={
            {
              left: `${f.left}%`,
              fontSize: `${f.size}rem`,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              '--drift': `${f.drift}px`,
            } as React.CSSProperties
          }
        >
          {f.char}
        </span>
      ))}
    </div>
  )
}
