import type { Archive, ArchiveMeta, Config, VoteFile } from './types'
import { b64ToUtf8, utf8ToB64 } from './crypto'

export interface Store {
  readonly mode: 'github' | 'local'
  getConfig(): Promise<Config | null>
  saveConfig(c: Config): Promise<void>
  getVote(slug: string): Promise<VoteFile | null>
  saveVote(slug: string, v: VoteFile): Promise<void>
  getAllVotes(): Promise<VoteFile[]>
  /** Sletter alle stemmer (brukes når en ny smaking startes) */
  clearVotes(): Promise<void>
  deleteConfig(): Promise<void>
  saveArchive(a: Archive): Promise<void>
  listArchives(): Promise<ArchiveMeta[]>
  getArchive(id: string): Promise<Archive | null>
}

const byNewest = (a: ArchiveMeta, b: ArchiveMeta) => b.savedAt.localeCompare(a.savedAt)
const toMeta = ({ id, title, savedAt, votes }: Archive): ArchiveMeta => ({
  id,
  title,
  savedAt,
  participants: votes.map((v) => v.name),
})

/**
 * Lagrer JSON-filer i et (privat) GitHub-repo via Contents API.
 *   config.json        – brusliste + avslørt-status (skrives av admin)
 *   votes/<slug>.json  – én fil per smaker
 *   archive/<id>.json  – avsluttede smakinger
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
    if (!res.ok) throw new Error(await explain(res, this.repo))
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
    if (!res.ok) throw new Error(await explain(res, this.repo))
    const body = await res.json()
    this.shas.set(path, body.content.sha)
    this.etags.delete(path)
    if (path.includes('/')) this.etags.delete(path.split('/')[0])
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
    const files = await this.listDir('votes')
    const votes = await Promise.all(files.map((f) => this.readFile<VoteFile>(`votes/${f.name}`)))
    return votes.filter((v): v is VoteFile => v !== null)
  }

  async clearVotes() {
    // Sekvensielt: parallelle commits mot samme branch gir 409-konflikter
    for (const f of await this.listDir('votes')) await this.deleteFile(`votes/${f.name}`, f.sha)
  }

  async deleteConfig() {
    if (!this.shas.has('config.json')) await this.readFile('config.json')
    const sha = this.shas.get('config.json')
    if (sha) await this.deleteFile('config.json', sha)
  }

  saveArchive(a: Archive) {
    return this.writeFile(`archive/${a.id}.json`, a, `Arkiver ${a.title}`)
  }

  async listArchives() {
    const files = await this.listDir('archive')
    const all = await Promise.all(files.map((f) => this.readFile<Archive>(`archive/${f.name}`)))
    return all.filter((a): a is Archive => a !== null).map(toMeta).sort(byNewest)
  }

  getArchive(id: string) {
    return this.readFile<Archive>(`archive/${id}.json`)
  }

  private async listDir(dir: string) {
    const list = (await this.getJson(dir)) as { name: string; type: string; sha: string }[] | null
    return (list ?? []).filter((f) => f.type === 'file' && f.name.endsWith('.json'))
  }

  private deleteFile(path: string, sha: string): Promise<void> {
    const job = this.queue.then(async () => {
      const res = await fetch(this.url(path), {
        method: 'DELETE',
        headers: this.headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ message: `Slett ${path}`, sha, branch: this.branch }),
      })
      if (!res.ok && res.status !== 404) throw new Error(await explain(res, this.repo))
      this.shas.delete(path)
      this.etags.delete(path)
      this.etags.delete(path.split('/')[0])
    })
    this.queue = job.catch(() => {})
    return job
  }
}

async function explain(res: Response, repo: string): Promise<string> {
  let msg = ''
  try {
    msg = ((await res.json()) as { message?: string }).message ?? ''
  } catch {
    /* ignorer */
  }
  const hint: Record<number, string> = {
    401: 'Tokenet er ugyldig eller utløpt (DATA_TOKEN).',
    403: 'Tokenet mangler skrivetilgang – sett Contents til «Read and write».',
    404: `Finner ikke repoet ${repo}, eller tokenet har ikke tilgang til det.`,
    409: 'Repoet er tomt – legg til en README så main-branchen finnes.',
    422: 'Repoet er tomt eller branchen finnes ikke – legg til en README.',
  }
  return `GitHub ${res.status}: ${hint[res.status] ?? msg}`
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
  private keys(prefix: string) {
    const out: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!
      if (k.startsWith(prefix)) out.push(k)
    }
    return out
  }
  async getAllVotes() {
    return this.keys('jb:vote:').map((k) => JSON.parse(localStorage.getItem(k)!) as VoteFile)
  }
  async clearVotes() {
    this.keys('jb:vote:').forEach((k) => localStorage.removeItem(k))
  }
  async deleteConfig() {
    localStorage.removeItem('jb:config')
  }
  async saveArchive(a: Archive) {
    this.write('archive:' + a.id, a)
  }
  async listArchives() {
    return this.keys('jb:archive:')
      .map((k) => toMeta(JSON.parse(localStorage.getItem(k)!) as Archive))
      .sort(byNewest)
  }
  async getArchive(id: string) {
    return this.read<Archive>('archive:' + id)
  }
}
