import { useCallback, useEffect, useRef, useState } from 'react'
import { RATINGS } from '../lib/rating'
import Confetti from '../components/Confetti'
import Reindeer from '../components/Reindeer'
import { slugify } from '../lib/slug'
import type { Store } from '../lib/storage'
import type { Config } from '../lib/types'

type Props = { store: Store; config: Config; name: string }
type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function Tasting({ store, config, name }: Props) {
  const slug = slugify(name)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const dirty = useRef(false)
  const latest = useRef(scores)
  latest.current = scores

  useEffect(() => {
    store
      .getVote(slug)
      .then((v) => v && setScores(v.scores))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [store, slug])

  // Versjonsteller: «Lagret ✓» vises bare når den nyeste endringen er lagret
  const version = useRef(0)

  const saveNow = useCallback(async () => {
    const v = version.current
    setStatus('saving')
    await store.saveVote(slug, { name, scores: latest.current, updated: new Date().toISOString() })
    if (version.current === v) {
      dirty.current = false
      setStatus('saved')
    }
  }, [store, slug, name])

  // Lagre automatisk litt etter siste trykk; prøv igjen ved feil
  useEffect(() => {
    if (!dirty.current) return
    let retry: ReturnType<typeof setTimeout>
    const save = async () => {
      try {
        await saveNow()
      } catch {
        setStatus('error')
        retry = setTimeout(save, 5000)
      }
    }
    const t = setTimeout(save, 700)
    return () => {
      clearTimeout(t)
      clearTimeout(retry)
    }
  }, [scores, saveNow])

  // Lagre med en gang hvis appen lukkes eller legges i bakgrunnen
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && dirty.current) saveNow().catch(() => {})
    }
    document.addEventListener('visibilitychange', flush)
    return () => document.removeEventListener('visibilitychange', flush)
  }, [saveNow])

  const rate = (nr: number, value: number) => {
    dirty.current = true
    version.current++
    setStatus('saving')
    setScores((s) => ({ ...s, [nr]: value }))
  }

  const [burst, setBurst] = useState(0)
  const prevDone = useRef<number | null>(null)
  const doneCount = Object.keys(scores).filter((k) => Number(k) <= config.count).length
  useEffect(() => {
    // Konfetti når siste brus får karakter (ikke når siden lastes)
    if (loaded && prevDone.current !== null && prevDone.current < config.count && doneCount === config.count) setBurst((b) => b + 1)
    if (loaded) prevDone.current = doneCount
  }, [doneCount, loaded, config.count])

  const numbers = Array.from({ length: config.count }, (_, i) => i + 1)
  const done = numbers.filter((n) => scores[n]).length

  if (!loaded) return <p className="center muted">Henter karakterene dine …</p>

  return (
    <>
      <Confetti burst={burst} />
      <div className="progress-bar">
        <div className="progress-text">
          <strong>
            {done} av {config.count}
          </strong>{' '}
          smakt
          <span className={`save-status ${status}`}>
            {status === 'saving' && 'Lagrer …'}
            {status === 'saved' && 'Lagret ✓'}
            {status === 'error' && 'Ikke lagret – prøver igjen'}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(done / config.count) * 100}%` }} />
        </div>
      </div>

      <p className="muted intro">
        <strong className="hello">Hei, {name}!</strong> Trykk på reinsdyret som passer for hver brus. Du kan ombestemme deg helt til resultatet avsløres.
      </p>

      <ol className="brus-list">
        {numbers.map((nr) => (
          <li key={nr} className={`brus ${scores[nr] ? 'rated' : ''}`} style={{ animationDelay: `${Math.min(nr, 12) * 40}ms` }}>
            <div className="brus-nr" aria-label={`Brus nummer ${nr}`}>
              {nr}
            </div>
            <div className="rating" role="radiogroup" aria-label={`Karakter for brus ${nr}`}>
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  role="radio"
                  aria-checked={scores[nr] === r.value}
                  aria-label={`${r.value} – ${r.label}`}
                  className={scores[nr] === r.value ? 'selected' : ''}
                  onClick={() => rate(nr, r.value)}
                >
                  <span className="emoji">
                    <Reindeer mood={r.value} size={38} />
                  </span>
                  <span className="num">{r.value}</span>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {done === config.count && (
        <div className="card center">
          <div className="big-emoji bounce">🎉</div>
          <h2>Ferdig! Godt jobba, smaksdommer!</h2>
          <p className="muted">Resultatet dukker opp her av seg selv når arrangøren avslører det.</p>
        </div>
      )}
    </>
  )
}
