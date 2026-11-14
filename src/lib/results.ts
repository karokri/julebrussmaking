import type { VoteFile } from './types'

export type Row = { nr: number; name: string; avg: number; count: number; scores: number[] }

export function computeResults(count: number, names: string[], votes: VoteFile[]): Row[] {
  const rows: Row[] = []
  for (let nr = 1; nr <= count; nr++) {
    const scores = votes.map((v) => v.scores[nr]).filter((s): s is number => typeof s === 'number')
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    rows.push({ nr, name: names[nr - 1] ?? `Brus ${nr}`, avg, count: scores.length, scores })
  }
  return rows.sort((a, b) => b.avg - a.avg || b.count - a.count || a.nr - b.nr)
}

export const fmt = (n: number) => n.toLocaleString('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
