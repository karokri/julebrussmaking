/** Lysslynge under toppen */
export default function Lights({ count = 18 }: { count?: number }) {
  return (
    <div className="lights" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`bulb c${i % 4}`} style={{ animationDelay: `${(i % 3) * 0.4}s` }} />
      ))}
    </div>
  )
}
