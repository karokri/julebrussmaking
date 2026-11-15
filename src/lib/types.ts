/** config.json i data-repoet */
export type Config = {
  /** Antall brus. De har nummer 1..count */
  count: number
  /** Navnelisten, kryptert med adminpassordet (skjult under smakingen) */
  encNames: string
  /** Satt av admin når resultatet avsløres */
  revealed: boolean
  /** Navnene i klartekst – fylles kun ut når revealed = true */
  names?: string[]
}

/** votes/<slug>.json – én fil per smaker, så ingen skriver over hverandre */
export type VoteFile = {
  name: string
  /** brusnummer -> karakter 1-5 */
  scores: Record<string, number>
  updated: string
}

export type Session = { name: string; password: string }

/** archive/<id>.json – en avsluttet smaking */
export type Archive = {
  id: string
  title: string
  savedAt: string
  count: number
  names: string[]
  votes: VoteFile[]
}

export type ArchiveMeta = Pick<Archive, 'id' | 'title' | 'savedAt'>
