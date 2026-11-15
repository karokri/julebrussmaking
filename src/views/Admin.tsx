import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { decrypt, encrypt } from '../lib/crypto'
import { DEFAULT_BRUS } from '../lib/defaultBrus'
import { computeResults } from '../lib/results'
import type { Store } from '../lib/storage'
import { slugify } from '../lib/slug'
import type { ArchiveMeta, Config, VoteFile } from '../lib/types'

type Props = { store: Store; config: Config | null; onChanged: () => Promise<void> }

const parseLines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.replace(/^\s*\d+[.):-]?\s*/, '').trim())
    .filter(Boolean)

export default function Admin({ store, config, onChanged }: Props) {
  const [pw, setPw] = useState('')
  const [names, setNames] = useState<string[] | null>(null)
  const [text, setText] = useState('')
  const [votes, setVotes] = useState<VoteFile[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [armed, setArmed] = useState<'reveal' | 'count' | 'archive' | null>(null)
  const [archives, setArchives] = useState<ArchiveMeta[]>([])
  const [archiveTitle, setArchiveTitle] = useState(`Julebrustesten ${new Date().getFullYear()}`)

  const loadVotes = useCallback(() => {
    store.getAllVotes().then(setVotes).catch(() => {})
  }, [store])

  const loadArchives = useCallback(() => {
    store.listArchives().then(setArchives).catch(() => {})
  }, [store])

  useEffect(() => {
    if (names) loadArchives()
  }, [names, loadArchives])

  useEffect(() => {
    if (!names) return
    loadVotes()
    const id = setInterval(loadVotes, 30_000)
    return () => clearInterval(id)
  }, [names, loadVotes])

  const unlock = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    if (!config?.encNames) {
      if (pw.length < 4) return setMsg('Velg et adminpassord på minst 4 tegn')
      setNames([])
      setText(DEFAULT_BRUS.join('\n'))
      return
    }
    try {
      const n = JSON.parse(await decrypt(config.encNames, pw)) as string[]
      setNames(n)
      setText(n.join('\n'))
    } catch {
      setMsg('Feil adminpassord')
    }
  }

  const write = async (next: Config, ok: string) => {
    setBusy(true)
    setMsg('')
    try {
      await store.saveConfig(next)
      await onChanged()
      setMsg(ok)
    } catch (e) {
      setMsg(`Noe gikk galt ved lagring. ${e instanceof Error ? e.message : ''}`)
    } finally {
      setBusy(false)
    }
  }

  const saveList = async () => {
    const list = parseLines(text)
    if (!list.length) return setMsg('Listen er tom')
    if (votes.length && config && list.length !== config.count && armed !== 'count') {
      setArmed('count')
      return setMsg(`Antallet endres fra ${config.count} til ${list.length}, og noen har allerede stemt. Trykk Lagre igjen for å bekrefte.`)
    }
    setArmed(null)
    const revealed = config?.revealed ?? false
    await write(
      { count: list.length, encNames: await encrypt(JSON.stringify(list), pw), revealed, names: revealed ? list : undefined },
      `Lagret ${list.length} brus ✓`,
    )
    setNames(list)
  }

  const setRevealed = async (revealed: boolean) => {
    if (!config || !names?.length) return setMsg('Lagre bruslisten først')
    if (revealed && armed !== 'reveal') return setArmed('reveal')
    setArmed(null)
    await write({ ...config, revealed, names: revealed ? names : undefined }, revealed ? 'Resultatet er avslørt 🎉' : 'Resultatet er skjult igjen')
  }

  const download = () => {
    if (!config || !names) return
    const data = {
      eksportert: new Date().toISOString(),
      brus: names.map((navn, i) => ({ nr: i + 1, navn })),
      resultat: computeResults(config.count, names, votes),
      stemmer: votes,
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `julebrus-resultat-${new Date().getFullYear()}.json` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const archiveAndReset = async () => {
    if (!config || !names?.length) return setMsg('Det finnes ingen smaking å arkivere')
    if (!archiveTitle.trim()) return setMsg('Gi smakingen et navn')
    if (armed !== 'archive') return setArmed('archive')
    setArmed(null)
    setBusy(true)
    setMsg('')
    try {
      const allVotes = await store.getAllVotes()
      const savedAt = new Date().toISOString()
      const id = `${savedAt.slice(0, 10)}-${slugify(archiveTitle) || 'smaking'}`
      await store.saveArchive({ id, title: archiveTitle.trim(), savedAt, count: config.count, names, votes: allVotes })
      await store.clearVotes()
      await store.deleteConfig()
      setVotes([])
      setText(DEFAULT_BRUS.join('\n'))
      await onChanged()
      loadArchives()
      setMsg(`«${archiveTitle.trim()}» er lagret i arkivet. Sett opp bruslisten for en ny smaking.`)
    } catch (e) {
      setMsg(`Noe gikk galt ved arkivering. ${e instanceof Error ? e.message : ''}`)
    } finally {
      setBusy(false)
    }
  }

  if (!names) {
    return (
      <form className="card" onSubmit={unlock}>
        <h1>Arrangør{store.group && <span className="group-tag">gruppe {store.group}</span>}</h1>
        <p className="muted">
          {config?.encNames
            ? 'Skriv adminpassordet for å se bruslisten og styre smakingen.'
            : 'Ingen smaking er satt opp ennå. Velg et adminpassord – det brukes for å skjule brusnavnene til resultatet avsløres.'}
        </p>
        <label>
          Adminpassord
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" />
        </label>
        {msg && <p className="error-text">{msg}</p>}
        <button className="primary">Åpne</button>
        <a href="#" className="center-link">
          ← Tilbake
        </a>
      </form>
    )
  }

  const count = config?.count ?? 0
  const preview = parseLines(text)

  return (
    <>
      <div className="card">
        <h1>Arrangør{store.group && <span className="group-tag">gruppe {store.group}</span>}</h1>
        <p>
          Status:{' '}
          <strong>{!config ? 'Ikke satt opp' : config.revealed ? 'Resultatet er avslørt' : 'Smaking pågår'}</strong>
        </p>
        <div className="stack">
          {armed === 'reveal' && <p className="muted small">Etter avsløring kan ingen endre karakterene sine.</p>}
          {config && !config.revealed && (
            <button className="primary" disabled={busy} onClick={() => setRevealed(true)}>
              {armed === 'reveal' ? 'Sikker? Trykk igjen for å avsløre' : '🎉 Avslør resultatet'}
            </button>
          )}
          {config?.revealed && (
            <button className="secondary" disabled={busy} onClick={() => setRevealed(false)}>
              Skjul resultatet igjen
            </button>
          )}
          {config && (
            <button className="secondary" onClick={download}>
              Last ned resultat (JSON)
            </button>
          )}
        </div>
        {msg && <p className={msg.startsWith('Noe gikk galt') || msg.startsWith('Det finnes') || msg.startsWith('Gi ') ? 'error-text' : 'msg'}>{msg}</p>}
      </div>

      <div className="card">
        <h2>Smakere ({votes.length})</h2>
        {votes.length === 0 ? (
          <p className="muted">Ingen har stemt ennå.</p>
        ) : (
          <ul className="voters">
            {votes
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
              .map((v) => {
                const n = Object.keys(v.scores).filter((k) => Number(k) <= count).length
                return (
                  <li key={v.name}>
                    <span>{v.name}</span>
                    <span className={n === count ? 'ok' : 'muted'}>
                      {n}/{count} {n === count && '✓'}
                    </span>
                  </li>
                )
              })}
          </ul>
        )}
        <button className="link" onClick={loadVotes}>
          Oppdater
        </button>
      </div>

      <div className="card">
        <h2>Bruslisten</h2>
        <p className="muted small">
          Én brus per linje. Linje 1 = brus nr. 1 osv. Navnene er kryptert med adminpassordet og vises først når du avslører.
        </p>
        <textarea rows={Math.max(8, preview.length + 1)} value={text} onChange={(e) => setText(e.target.value)} />
        <ol className="preview">
          {preview.map((n, i) => (
            <li key={i}>
              <strong>{i + 1}.</strong> {n}
            </li>
          ))}
        </ol>
        <button className="primary" disabled={busy} onClick={saveList}>
          Lagre bruslisten ({preview.length} brus)
        </button>
      </div>

      {config && (
        <div className="card">
          <h2>Avslutt og start ny smaking</h2>
          <p className="muted small">
            Lagrer bruslisten og alle karakterene i arkivet, og tømmer smakingen så du kan sette opp en ny.
          </p>
          <label>
            Navn på smakingen
            <input value={archiveTitle} onChange={(e) => setArchiveTitle(e.target.value)} maxLength={60} />
          </label>
          <button className="primary" disabled={busy} onClick={archiveAndReset}>
            {armed === 'archive' ? 'Sikker? Trykk igjen for å arkivere' : '📦 Lagre i arkivet og start ny'}
          </button>
        </div>
      )}

      <div className="card">
        <h2>Tidligere smakinger</h2>
        {archives.length === 0 ? (
          <p className="muted">Ingen smakinger er arkivert ennå.</p>
        ) : (
          <ul className="voters">
            {archives.map((a) => (
              <li key={a.id}>
                <a href={`#arkiv/${encodeURIComponent(a.id)}`}>{a.title}</a>
                <span className="muted small">{new Date(a.savedAt).toLocaleDateString('nb-NO')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <a href="#" className="center-link">
        ← Tilbake til smakingen
      </a>
    </>
  )
}
