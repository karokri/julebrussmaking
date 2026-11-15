import { useEffect, useState } from 'react'
import { slugify } from '../lib/slug'
import type { Store } from '../lib/storage'
import type { ArchiveMeta } from '../lib/types'

/** Tidligere smakinger den innloggede har gitt karakterer i */
export default function PastTastings({ store, me }: { store: Store; me: string }) {
  const [mine, setMine] = useState<ArchiveMeta[]>([])

  useEffect(() => {
    const slug = slugify(me)
    store
      .listArchives()
      .then((all) => setMine(all.filter((a) => a.participants.some((p) => slugify(p) === slug))))
      .catch(() => {})
  }, [store, me])

  if (mine.length === 0) return null

  return (
    <div className="card past-tastings no-print">
      <h2>Dine tidligere smakinger</h2>
      <ul className="voters">
        {mine.map((a) => (
          <li key={a.id}>
            <a href={`#arkiv/${encodeURIComponent(a.id)}`}>{a.title}</a>
            <span className="muted small">{new Date(a.savedAt).toLocaleDateString('nb-NO')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
