import { decrypt } from './crypto'
import { GitHubStore, LocalStore, type Store } from './storage'
import type { Session } from './types'

/** Én kryptert blob per gruppe, kommaseparert (se scripts/encrypt-token.mjs) */
const ENC_TOKENS = ((import.meta.env.VITE_ENC_TOKENS as string | undefined) ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const DATA_REPO = import.meta.env.VITE_DATA_REPO as string | undefined
const DATA_BRANCH = (import.meta.env.VITE_DATA_BRANCH as string | undefined) || 'main'

export const isTestMode = ENC_TOKENS.length === 0

/**
 * Passordet bestemmer gruppen: det låser opp tokenet i nøyaktig én blob,
 * og bloben forteller hvilken gruppe (datamappe) brukeren hører til.
 * Feil passord => kaster feil.
 */
export async function openStore(password: string): Promise<Store> {
  if (isTestMode || !DATA_REPO) return new LocalStore()
  const plain = await Promise.any(ENC_TOKENS.map((blob) => decrypt(blob, password)))
  const { token, group } = JSON.parse(plain) as { token: string; group: string }
  return new GitHubStore(token, DATA_REPO, DATA_BRANCH, group)
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
