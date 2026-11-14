import { useEffect, useState } from 'react'
import { computeResults, fmt, type Row } from '../lib/results'
import { getBrusInfo } from '../lib/brusInfo'
import Confetti from '../components/Confetti'
import Reindeer from '../components/Reindeer'
import type { Store } from '../lib/storage'
import type { Config, VoteFile } from '../lib/types'

type Props = { store: Store; config: Config; me: string }
const MEDALS = ['🥇', '🥈', '🥉']

export default function Results({ store, config, me }: Props) {
  const [votes, setVotes] = useState<VoteFile[] | null>(null)
  const [error, setError] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [phase, setPhase] = useState<'drum' | 'reveal'>('drum')
  const [burst, setBurst] = useState(0)
  const [zoom, setZoom] = useState<{ src: string; name: string } | null>(null)

  useEffect(() => {
    store
      .getAllVotes()
      .then(setVotes)
      .catch(() => setError(true))
  }, [store])

  // Trommevirvel før vinneren vises
  useEffect(() => {
    if (!votes || phase !== 'drum') return
    const t = setTimeout(() => {
      setPhase('reveal')
      setBurst((b) => b + 1)
    }, 2600)
    return () => clearTimeout(t)
  }, [votes, phase])

  if (error) return <p className="center error-text">Klarte ikke å hente resultatene. Last siden på nytt.</p>
  if (!votes || phase === 'drum')
    return (
      <div
        className="card center drumroll"
        onClick={() => {
          if (!votes) return
          setPhase('reveal')
          setBurst((b) => b + 1)
        }}
      >
        <div className="big-emoji drum">🥁</div>
        <h2>Trommevirvel …</h2>
        <p className="muted">Teller opp stemmene</p>
        <div className="dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    )

  // Bruk navnet fra brusInfo (rettet stavemåte) når brusen er kjent
  const names = (config.names ?? []).map((n) => getBrusInfo(n)?.navn ?? n)
  const rows = computeResults(config.count, names, votes)
  const mine = votes.find((v) => v.name === me)
  const winnerInfo = rows[0] ? getBrusInfo(rows[0].name) : undefined
  const myFav = mine
    ? Object.entries(mine.scores).sort((a, b) => b[1] - a[1])[0]
    : undefined

  return (
    <>
      <Confetti burst={burst} pieces={120} />
      <div className="card center winner">
        {winnerInfo?.bildeUrl ? (
          <img
            className="winner-img"
            src={winnerInfo.bildeUrl}
            alt=""
            onClick={() => setZoom({ src: winnerInfo.bildeUrl!, name: rows[0].name })}
          />
        ) : (
          <div className="big-emoji">🏆</div>
        )}
        <p className="muted">{winnerInfo?.bildeUrl ? "🏆 " : ""}Vinneren er …</p>
        <h1 className="winner-name">{rows[0]?.name}</h1>
        {winnerInfo?.info && <p>{winnerInfo.info}</p>}
        <p>
          Brus nr. {rows[0]?.nr} med snitt <strong>{fmt(rows[0]?.avg ?? 0)}</strong>
        </p>
        <p className="muted small">{votes.length} smakere</p>
      </div>

      {myFav && (
        <p className="center">
          Din favoritt: <strong>{names[Number(myFav[0]) - 1]}</strong> <Reindeer mood={myFav[1]} size={26} />
        </p>
      )}

      <ol className="results">
        {rows.map((r, i) => (
          <ResultRow key={r.nr} row={r} place={i} mine={mine?.scores[r.nr]} onZoom={setZoom} />
        ))}
      </ol>

      <button className="secondary" onClick={() => setShowAll((s) => !s)}>
        {showAll ? 'Skjul alle karakterer' : 'Vis alle karakterer'}
      </button>

      {showAll && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Brus</th>
                {votes.map((v) => (
                  <th key={v.name}>{v.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.nr}>
                  <th>
                    {r.nr}. {r.name}
                  </th>
                  {votes.map((v) => (
                    <td key={v.name}>{v.scores[r.nr] ?? '–'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)} role="dialog" aria-label={zoom.name}>
          <img src={zoom.src} alt={zoom.name} />
          <p>{zoom.name}</p>
          <span className="muted small">Trykk for å lukke</span>
        </div>
      )}
    </>
  )
}

function ResultRow({ row, place, mine, onZoom }: { row: Row; place: number; mine?: number; onZoom: (z: { src: string; name: string }) => void }) {
  const info = getBrusInfo(row.name)
  return (
    <li className={`result ${place < 3 ? 'top' : ''}`} style={{ animationDelay: `${0.4 + place * 0.07}s` }}>
      <div className="place">{MEDALS[place] ?? place + 1}</div>
      {info?.bildeUrl ? (
        <button className="thumb" onClick={() => onZoom({ src: info.bildeUrl!, name: row.name })} aria-label={`Vis bilde av ${row.name}`}>
          <img src={info.bildeUrl} alt="" loading="lazy" />
        </button>
      ) : (
        <div className="thumb">
          <span>🥤</span>
        </div>
      )}
      <div className="result-body">
        <div className="result-head">
          <div className="result-name">
            {row.name} <span className="muted small">nr. {row.nr}</span>
          </div>
          <div className="avg">{row.count ? fmt(row.avg) : '–'}</div>
        </div>
        <div className="bar">
          <div className="bar-fill" style={{ width: `${(row.avg / 5) * 100}%` }} />
        </div>
        <div className="muted small">
          {row.count} stemmer
          {mine ? (
            <>
              {' '}
              · du ga {mine} <Reindeer mood={mine} size={20} />
            </>
          ) : null}
        </div>
        {info && (
          <div className="brus-info">
            <div className="small">
              {[info.produsent, info.sted].filter(Boolean).join(' · ')}
              {info.sukker && <span className="badge">{info.sukker}</span>}
            </div>
            {info.info && <div className="small muted">{info.info}</div>}
          </div>
        )}
      </div>
    </li>
  )
}
