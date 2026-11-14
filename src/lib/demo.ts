import { encrypt } from './crypto'
import { DEFAULT_BRUS } from './defaultBrus'
import { slugify } from './slug'
import type { Store } from './storage'

const DEMO_USERS = [
  'Bestemor Åse',
  'Morfar Kjell',
  'Emma',
  'Jonas',
  'Tante Liv',
  'Onkel Per',
  'Sofie',
  'Magnus',
  'Nora',
]
export const DEMO_ADMIN_PASSWORD = 'demo'

/** Kun testmodus: legger inn brusliste og smakere med tilfeldige (men realistiske) karakterer */
export async function seedDemo(store: Store) {
  const names = DEFAULT_BRUS
  await store.saveConfig({
    count: names.length,
    encNames: await encrypt(JSON.stringify(names), DEMO_ADMIN_PASSWORD),
    revealed: false,
  })
  // Hver brus får en "egentlig" kvalitet, hver smaker legger på litt egen smak
  const quality = names.map(() => 1.5 + Math.random() * 3)
  for (const [i, name] of DEMO_USERS.entries()) {
    const scores: Record<string, number> = {}
    const howMany = i < 6 ? names.length : Math.floor(names.length * (0.3 + Math.random() * 0.5))
    for (let nr = 1; nr <= howMany; nr++) {
      const s = Math.round(quality[nr - 1] + (Math.random() - 0.5) * 2.5)
      scores[nr] = Math.min(5, Math.max(1, s))
    }
    await store.saveVote(slugify(name), { name, scores, updated: new Date().toISOString() })
  }
}
