// Krypterer GitHub-tokenet én gang per gruppepassord.
//
//   DATA_TOKEN      – fine-grained token med Contents read/write på data-repoet
//   APP_PASSWORD    – passord for hovedgruppen (data i roten av data-repoet)
//   APP_PASSWORDS   – valgfritt, flere grupper, én per linje:  gruppenavn: passord
//                     (data for gruppen ligger i grupper/<gruppenavn>/)
//
// Skriver ut  VITE_ENC_TOKENS=<blob>,<blob>,...
// Hver blob er AES-GCM-kryptert JSON {token, group} – samme format som src/lib/crypto.ts.
const { DATA_TOKEN, APP_PASSWORD = '', APP_PASSWORDS = '' } = process.env
if (!DATA_TOKEN) {
  console.error('Mangler DATA_TOKEN')
  process.exit(1)
}

const slugify = (s) =>
  s.trim().toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const groups = []
if (APP_PASSWORD) groups.push({ group: '', password: APP_PASSWORD })
for (const [n, line] of APP_PASSWORDS.split(/\r?\n/).entries()) {
  if (!line.trim() || line.trim().startsWith('#')) continue
  const i = line.indexOf(':')
  const group = slugify(i < 0 ? '' : line.slice(0, i))
  const password = (i < 0 ? '' : line.slice(i + 1)).trim()
  if (!group || !password) {
    // Ikke skriv ut linjen – den kan inneholde et passord
    console.error(`Ugyldig linje ${n + 1} i APP_PASSWORDS (forventet «gruppe: passord»)`)
    process.exit(1)
  }
  groups.push({ group, password })
}
if (!groups.length) {
  console.error('Mangler APP_PASSWORD eller APP_PASSWORDS')
  process.exit(1)
}
const seen = new Set()
for (const g of groups) {
  if (seen.has(g.password)) {
    console.error(`To grupper har samme passord (${g.group || 'hovedgruppen'}). Passordene må være unike.`)
    process.exit(1)
  }
  seen.add(g.password)
}

const enc = new TextEncoder()
async function encrypt(plain, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)))
  return Buffer.concat([salt, iv, ct]).toString('base64')
}

const blobs = []
for (const { group, password } of groups) blobs.push(await encrypt(JSON.stringify({ token: DATA_TOKEN, group }), password))
console.error(`Krypterte token for ${groups.length} gruppe(r): ${groups.map((g) => g.group || 'hovedgruppen').join(', ')}`)
console.log('VITE_ENC_TOKENS=' + blobs.join(','))
