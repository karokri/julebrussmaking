/** Egentegnet reinsdyr med fem humør (1 = æsj … 5 = nydelig) */
export default function Reindeer({ mood, size = 40 }: { mood: number; size?: number }) {
  const fur = '#9b6a3f'
  const muzzle = '#e2c09a'
  const dark = '#3a2418'
  const antler = '#c79a5b'

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="reindeer">
      {/* Gevir */}
      <g stroke={antler} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d="M22 22 C18 14 14 10 10 4" />
        <path d="M16 13 L8 12" />
        <path d="M13 8 L15 2" />
        <path d="M42 22 C46 14 50 10 54 4" />
        <path d="M48 13 L56 12" />
        <path d="M51 8 L49 2" />
      </g>
      {/* Ører */}
      <ellipse cx="13" cy="28" rx="7" ry="3.6" fill={fur} transform="rotate(-25 13 28)" />
      <ellipse cx="51" cy="28" rx="7" ry="3.6" fill={fur} transform="rotate(25 51 28)" />
      <ellipse cx="13.5" cy="28" rx="4" ry="1.8" fill="#e8b4a0" transform="rotate(-25 13.5 28)" />
      <ellipse cx="50.5" cy="28" rx="4" ry="1.8" fill="#e8b4a0" transform="rotate(25 50.5 28)" />
      {/* Hode og mule */}
      <ellipse cx="32" cy="37" rx="17" ry="19" fill={fur} />
      <ellipse cx="32" cy="48" rx="12" ry="9" fill={muzzle} />
      {/* Nese */}
      <ellipse cx="32" cy="42.5" rx="5.5" ry="3.8" fill={dark} />
      <ellipse cx="30.3" cy="41.4" rx="1.6" ry="1" fill="#fff" opacity="0.6" />

      {mood >= 4 && (
        <g fill="#f08a8a" opacity="0.7">
          <ellipse cx="21" cy="42" rx="3.2" ry="2" />
          <ellipse cx="43" cy="42" rx="3.2" ry="2" />
        </g>
      )}

      <Eyes mood={mood} dark={dark} />
      <Mouth mood={mood} dark={dark} />
    </svg>
  )
}

function Eyes({ mood, dark }: { mood: number; dark: string }) {
  if (mood === 1)
    return (
      <g stroke={dark} strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M21 30 L26 33 L21 36" />
        <path d="M43 30 L38 33 L43 36" />
      </g>
    )
  if (mood === 5)
    return (
      <g fill="#ffcf33" stroke="#b8860b" strokeWidth="0.8">
        <Star cx={24} cy={32} />
        <Star cx={40} cy={32} />
      </g>
    )
  return (
    <g>
      <circle cx="24" cy="32" r="3.2" fill={dark} />
      <circle cx="40" cy="32" r="3.2" fill={dark} />
      <circle cx="25" cy="31" r="1" fill="#fff" />
      <circle cx="41" cy="31" r="1" fill="#fff" />
      {mood === 2 && (
        <g stroke={dark} strokeWidth="2" strokeLinecap="round">
          <path d="M20 28 L27 25" />
          <path d="M44 28 L37 25" />
        </g>
      )}
    </g>
  )
}

function Mouth({ mood, dark }: { mood: number; dark: string }) {
  const s = { stroke: dark, strokeWidth: 2.2, strokeLinecap: 'round' as const, fill: 'none' }
  switch (mood) {
    case 1:
      return (
        <g>
          <path d="M25 52 Q28.5 49 32 52 Q35.5 55 39 52" {...s} />
          <path d="M33 52.5 Q35 58 37.5 55" fill="#e2627a" stroke={dark} strokeWidth="1.4" />
        </g>
      )
    case 2:
      return <path d="M26 54 Q32 49 38 54" {...s} />
    case 3:
      return <path d="M26.5 52 L37.5 52" {...s} />
    case 4:
      return <path d="M25 50 Q32 56 39 50" {...s} />
    default:
      return (
        <g>
          <path d="M24 49 Q32 59 40 49 Z" fill={dark} />
          <path d="M28 53.5 Q32 56.5 36 53.5 Q32 52 28 53.5" fill="#e2627a" />
        </g>
      )
  }
}

function Star({ cx, cy }: { cx: number; cy: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 2.2 : 5
    const a = (Math.PI / 5) * i - Math.PI / 2
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
  return <polygon points={pts} />
}
