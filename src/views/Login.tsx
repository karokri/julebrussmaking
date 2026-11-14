import { useState, type FormEvent } from 'react'
import { isTestMode, openStore } from '../lib/auth'
import { DEMO_ADMIN_PASSWORD, resetDemo, seedDemo } from '../lib/demo'
import { slugify } from '../lib/slug'
import type { Store } from '../lib/storage'
import type { Session } from '../lib/types'

type Props = { onLogin: (s: Session, store: Store) => void; restoring: boolean }

export default function Login({ onLogin, restoring }: Props) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [demoMsg, setDemoMsg] = useState('')
  const [confirm, setConfirm] = useState<{ session: Session; store: Store } | null>(null)

  if (restoring) return <p className="center muted">Logger inn …</p>

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const clean = name.trim().replace(/\s+/g, ' ')
    if (!slugify(clean)) return setError('Skriv inn navnet ditt')
    if (!password) return setError('Skriv inn passordet')
    setBusy(true)
    setError('')
    let store: Store
    try {
      store = await openStore(password)
    } catch {
      setBusy(false)
      return setError('Feil passord – prøv igjen')
    }
    const session = { name: clean, password }
    try {
      const existing = await store.getVote(slugify(clean))
      if (existing) {
        setConfirm({ session: { ...session, name: existing.name }, store })
        setBusy(false)
        return
      }
    } catch {
      /* ingen fare – sjekken er bare et hint */
    }
    onLogin(session, store)
  }

  if (confirm) {
    return (
      <div className="card">
        <h2>Er det deg, {confirm.session.name}?</h2>
        <p>Noen med dette navnet har allerede gitt karakterer. Er det deg, fortsetter du der du slapp.</p>
        <div className="stack">
          <button className="primary" onClick={() => onLogin(confirm.session, confirm.store)}>
            Ja, det er meg
          </button>
          <button
            className="secondary"
            onClick={() => {
              setConfirm(null)
              setName('')
            }}
          >
            Nei, jeg velger et annet navn
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="big-emoji wobble">🎅</div>
      <h1>Velkommen til Julebrustesten 2026!</h1>
      <label>
        Hva heter du?
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
          autoCapitalize="words"
          maxLength={30}
          placeholder="F.eks. Bestemor Åse"
        />
      </label>
      <label>
        Passord
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder={isTestMode ? 'Hva som helst i testmodus' : ''}
        />
      </label>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <button className="primary" disabled={busy}>
        {busy ? 'Sjekker …' : 'Start smakingen'}
      </button>
      {isTestMode && (
        <>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await seedDemo(await openStore(''))
              setBusy(false)
              setDemoMsg(`Demodata lagt inn: 21 brus og 9 smakere. Adminpassord: «${DEMO_ADMIN_PASSWORD}»`)
            }}
          >
            Legg inn demodata
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await resetDemo(await openStore(''))
              setBusy(false)
              setDemoMsg(`Nullstilt: 21 brus, ingen stemmer. Adminpassord: «${DEMO_ADMIN_PASSWORD}»`)
            }}
          >
            Nullstill – ingen har svart
          </button>
          {demoMsg && <p className="msg">{demoMsg}</p>}
        </>
      )}
    </form>
  )
}
