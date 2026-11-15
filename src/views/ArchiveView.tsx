import { useEffect, useState } from 'react'
import type { Store } from '../lib/storage'
import type { Archive } from '../lib/types'
import Results from './Results'

type Props = { store: Store; id: string; me: string }

/** Viser resultatet fra en arkivert smaking */
export default function ArchiveView({ store, id, me }: Props) {
  const [archive, setArchive] = useState<Archive | null | undefined>(undefined)

  useEffect(() => {
    store
      .getArchive(id)
      .then(setArchive)
      .catch(() => setArchive(null))
  }, [store, id])

  if (archive === undefined) return <p className="center muted">Henter smakingen …</p>
  if (archive === null)
    return (
      <div className="card center">
        <h2>Fant ikke smakingen</h2>
        <a href="#" className="center-link">
          ← Tilbake
        </a>
      </div>
    )

  return (
    <>
      <Results
        config={{ count: archive.count, names: archive.names, revealed: true, encNames: '' }}
        votes={archive.votes}
        me={me}
        title={`${archive.title} (${new Date(archive.savedAt).toLocaleDateString('nb-NO')})`}
        intro={false}
      />
      <a href="#" className="center-link no-print">
        ← Tilbake
      </a>
    </>
  )
}
