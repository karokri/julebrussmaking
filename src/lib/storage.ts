import type { Config, VoteFile } from './types'
import { b64ToUtf8, utf8ToB64 } from './crypto'

export interface Store {
  readonly mode: 'github' | 'local'
  getConfig(): Promise<Config | null>
  saveConfig(c: Config): Promise<void>
  getVote(slug: string): Promise<VoteFile | null>
  saveVote(slug: string, v: VoteFile): Promise<void>
  getAllVotes(): Promise<VoteFile[]>
}

/**
 * Lagrer JSON-filer i et (privat) GitHub-repo via Contents API.
 *   config.json        – brusliste + avslørt-status (skrives av admin)
 *   votes/<slug>.json  – én fil per smaker
 */
export class GitHubStore implements Store {
  readonly mode = 'github' as const
  private shas = new Map<string, string>()
  private etags = new Map<string, { etag: string; body: unknown }>()
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private token: string,
    private repo: string,
    private branch = 'main',
  ) {}

  private url(path: string) {
    return `https://api.github.com/repos/${this.repo}/contents/${path}`
  }

  private headers(extra: Record<string, string> = {}) {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...extra,
    }
  }

  /** GET med ETag – 304-svar teller ikke mot rate limit */
  private async getJson(path: string): Promise<unknown | null> {
    const cached = this.etags.get(path)
    const res = await fetch(`${this.url(path)}?ref=${this.branch}`, {
      headers: this.headers(cached ? { 'If-None-Match': cached.etag } : {}),
      cache: 'no-store',
    })
    if (res.status === 304 && cached) return cached.body
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`GitHub ${res.status}`)
    const body = await res.json()
    const etag = res.headers.get('ETag')
    if (etag) this.etags.set(path, { etag, body })
    return body
  }

  private async readFile<T>(path: string): Promise<T | null> {
    const body = (await this.getJson(path)) as { sha: string; content: string } | null
    if (!body) {
      this.shas.delete(path)
      return null
    }
    this.shas.set(path, body.sha)
    return JSON.parse(b64ToUtf8(body.content)) as T
  }

  private writeFile(path: string, data: unknown, message: string): Promise<void> {
    // Skrivinger køes, så samme klient aldri sender to samtidige PUT
    const job = this.queue.then(() => this.doWrite(path, data, message, true))
    this.queue = job.catch(() => {})
    return job
  }

  private async doWrite(path: string, data: unknown, message: string, retry: boolean): Promise<void> {
    if (!this.shas.has(path)) await this.readFile(path) // finn sha hvis fila finnes
    const res = await fetch(this.url(path), {
      method: 'PUT',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        message,
        branch: this.branch,
        content: utf8ToB64(JSON.stringify(data, null, 2)),
        sha: this.shas.get(path),
      }),
    })
    if ((res.status === 409 || res.status === 422) && retry) {
      // sha var utdatert – hent ny og prøv igjen
      this.shas.delete(path)
      this.etags.delete(path)
      return this.doWrite(path, data, message, false)
    }
    if (!res.ok) throw new Error(`GitHub ${res.status}`)
    const body = await res.json()
    this.shas.set(path, body.content.sha)
    this.etags.delete(path)
  }

  getConfig() {
    return this.readFile<Config>('config.json')
  }
  saveConfig(c: Config) {
    return this.writeFile('config.json', c, 'Oppdater config')
  }
  getVote(slug: string) {
    return this.readFile<VoteFile>(`votes/${slug}.json`)
  }
  saveVote(slug: string, v: VoteFile) {
    return this.writeFile(`votes/${slug}.json`, v, `Karakterer fra ${v.name}`)
  }
  async getAllVotes() {
    const list = (await this.getJson('votes')) as { name: string; type: string }[] | null
    if (!list) return []
    const files = list.filter((f) => f.type === 'file' && f.name.endsWith('.json'))
    const votes = await Promise.all(files.map((f) => this.readFile<VoteFile>(`votes/${f.name}`)))
    return votes.filter((v): v is VoteFile => v !== null)
  }
}

/** Testmodus uten GitHub – alt lagres i nettleseren (kun for utvikling) */
export class LocalStore implements Store {
  readonly mode = 'local' as const
  private read<T>(key: string): T | null {
    const v = localStorage.getItem('jb:' + key)
    return v ? (JSON.parse(v) as T) : null
  }
  private write(key: string, v: unknown) {
    localStorage.setItem('jb:' + key, JSON.stringify(v))
  }
  async getConfig() {
    return this.read<Config>('config')
  }
  async saveConfig(c: Config) {
    this.write('config', c)
  }
  async getVote(slug: string) {
    return this.read<VoteFile>('vote:' + slug)
  }
  async saveVote(slug: string, v: VoteFile) {
    this.write('vote:' + slug, v)
  }
  async getAllVotes() {
    const out: VoteFile[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!
      if (k.startsWith('jb:vote:')) out.push(JSON.parse(localStorage.getItem(k)!))
    }
    return out
  }
}
