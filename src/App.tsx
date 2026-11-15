import { useCallback, useEffect, useState } from 'react'
import { isTestMode, loadSession, openStore, saveSession } from './lib/auth'
import type { Store } from './lib/storage'
import type { Config, Session } from './lib/types'
import Login from './views/Login'
import Tasting from './views/Tasting'
import Results from './views/Results'
import Admin from './views/Admin'
import ArchiveView from './views/ArchiveView'
import PastTastings from './components/PastTastings'
import Snow from './components/Snow'
import Lights from './components/Lights'

const useHash = () => {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const [session, setSession] = useState<Session | null>(loadSession)
  const [store, setStore] = useState<Store | null>(null)
  const [config, setConfig] = useState<Config | null | undefined>(undefined)
  const [error, setError] = useState('')

  // Gjenopprett innlogging ved reload
  useEffect(() => {
    if (!session || store) return
    openStore(session.password)
      .then(setStore)
      .catch(() => {
        saveSession(null)
        setSession(null)
      })
  }, [session, store])

  const refreshConfig = useCallback(async () => {
    if (!store) return
    try {
      setConfig(await store.getConfig())
      setError('')
    } catch (e) {
      setError(`Får ikke kontakt med serveren. Prøver igjen … ${e instanceof Error ? e.message : ''}`)
    }
  }, [store])

  // Sjekk jevnlig om admin har avslørt resultatet
  useEffect(() => {
    if (!store) return
    refreshConfig()
    const id = setInterval(refreshConfig, 20_000)
    const onVisible = () => document.visibilityState === 'visible' && refreshConfig()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [store, refreshConfig])

  const logout = () => {
    saveSession(null)
    setSession(null)
    setStore(null)
    setConfig(undefined)
  }

  let content
  if (!session || !store) {
    content = (
      <Login
        onLogin={(s, st) => {
          saveSession(s)
          setSession(s)
          setStore(st)
        }}
        restoring={!!session}
      />
    )
  } else if (hash.startsWith('#arkiv/')) {
    content = <ArchiveView store={store} id={decodeURIComponent(hash.slice('#arkiv/'.length))} me={session.name} />
  } else if (hash === '#admin') {
    content = <Admin store={store} config={config ?? null} onChanged={refreshConfig} />
  } else if (config === undefined) {
    content = <p className="center muted">Laster …</p>
  } else if (config === null || !config.count) {
    content = (
      <div className="card center">
        <div className="big-emoji wobble">⏳</div>
        <h2>Smakingen er ikke klar ennå</h2>
        <p className="muted">Vent til arrangøren har satt opp brusene.</p>
      </div>
    )
  } else if (config.revealed) {
    content = <Results store={store} config={config} me={session.name} />
  } else {
    content = <Tasting store={store} config={config} name={session.name} />
  }

  return (
    <div className="app">
      <Snow />
      <header className="top">
        <a href="#" className="logo">
          🎄 Julebrustesten 2026
        </a>
        {session && store && (
          <div className="who">
            <button className="link" onClick={logout}>
              Logg ut
            </button>
          </div>
        )}
      </header>
      <Lights />
      {isTestMode && <div className="banner">Testmodus – lagres bare i denne nettleseren</div>}
      {error && <div className="banner error">{error}</div>}
      <main>
        {content}
        {session && store && hash !== '#admin' && !hash.startsWith('#arkiv/') && (
          <PastTastings store={store} me={session.name} />
        )}
      </main>
      {store && hash !== '#admin' && !hash.startsWith('#arkiv/') && (
        <footer>
          <a href="#admin">Arrangør</a>
        </footer>
      )}
    </div>
  )
}
