import { decrypt } from './crypto'
import { GitHubStore, LocalStore, type Store } from './storage'
import type { Session } from './types'

const ENC_TOKEN = import.meta.env.VITE_ENC_TOKEN as string | undefined
const DATA_REPO = import.meta.env.VITE_DATA_REPO as string | undefined
const DATA_BRANCH = (import.meta.env.VITE_DATA_BRANCH as string | undefined) || 'main'

export const isTestMode = !ENC_TOKEN

/** Felles passord låser opp GitHub-tokenet. Feil passord => kaster feil. */
export async function openStore(password: string): Promise<Store> {
  if (!ENC_TOKEN || !DATA_REPO) return new LocalStore()
  const token = await decrypt(ENC_TOKEN, password)
  return new GitHubStore(token, DATA_REPO, DATA_BRANCH)
}

const KEY = 'julebrus-session'
export function loadSession(): Session | null {
  try {
    const s = localStorage.getItem(KEY)
    return s ? (JSON.parse(s) as Session) : null
  } catch {
    return null
  }
}
export function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    /* privat modus o.l. – da må man logge inn på nytt ved reload */
  }
}
