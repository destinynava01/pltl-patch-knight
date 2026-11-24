import { useEffect, useState } from 'react'
import { Highlight } from './cpp'
import { SITE_NAME, TYPE_LABEL } from './config'
import { Button, Knight, Panel } from './ui'

// After the game: how the class did on every bug (with the fix and the most common wrong answers, to go over at
// the board), every knight's results, and the Excel download.
export default function Report({ call, onNewGame }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('bugs')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => { call({ action: 'report' }).then(setReport).catch((e) => setError(e.message)) }, [call])

  async function download() {
    setDownloading(true)
    try {
      const { downloadResults } = await import('./gameResults')
      await downloadResults(report)
    } catch (e) {
      setError(e.message || 'Could not download the results.')
    } finally {
      setDownloading(false)
    }
  }

  if (!report) return <main className="world-bg flex min-h-dvh items-center justify-center"><p className="text-muted">{error || 'Compiling the report…'}</p></main>

  const ranked = [...report.players].sort((a, b) => b.fixed + b.revealed - (a.fixed + a.revealed) || b.xp - a.xp)

  return (
    <main className="world-bg min-h-dvh p-4 text-ink sm:p-6">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Knight size={44} />
          <div>
            <h1 className="font-pixel text-lg text-ok">{SITE_NAME} · Report</h1>
            <p className="font-pixel text-[9px] text-muted">{report.players.length} KNIGHTS · {report.bugs.length} BUGS</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="gold" disabled={downloading} onClick={download}>{downloading ? 'Saving…' : '⬇ Excel'}</Button>
          <Button variant="outline" onClick={onNewGame}>New game</Button>
        </div>
      </header>
      {error && <p className="mx-auto mt-3 max-w-6xl font-bold text-bad">{error}</p>}
      <p className="mx-auto mt-2 max-w-6xl text-xs text-muted">Download before starting a new game. New game closes this one, and game data is cleared after 8 hours.</p>

      <nav className="mx-auto mt-4 flex max-w-6xl gap-2">
        {[['bugs', 'Bugs'], ['knights', 'Knights']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`rounded-sm border-2 px-4 py-2 font-pixel text-[10px] ${tab === id ? 'border-ok bg-ok-soft text-ok' : 'border-line bg-panel hover:bg-hover'}`}>{label}</button>
        ))}
      </nav>

      {tab === 'bugs' && (
        <ul className="mx-auto mt-4 max-w-6xl space-y-3">
          {report.bugs.map((b) => <BugReport key={b.id} b={b} />)}
        </ul>
      )}

      {tab === 'knights' && (
        <Panel className="mx-auto mt-4 max-w-6xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="font-pixel text-[9px] text-muted">
              <tr><th className="p-2">#</th><th className="p-2">Knight</th><th className="p-2">Bugs fixed</th><th className="p-2">First try</th><th className="p-2">Fix shown</th><th className="p-2">Hints</th><th className="p-2">Wrong tries</th><th className="p-2">Zones</th><th className="p-2">XP</th></tr>
            </thead>
            <tbody>
              {ranked.map((p, i) => (
                <tr key={p.name} className="border-t border-line">
                  <td className="p-2 font-pixel text-[10px] text-muted">{i + 1}</td>
                  <td className="p-2 font-bold">{p.name}</td>
                  <td className="p-2 text-ok">{p.fixed}</td>
                  <td className="p-2">{p.first_try}</td>
                  <td className="p-2 text-gold">{p.revealed}</td>
                  <td className="p-2">{p.hints}</td>
                  <td className="p-2 text-bad">{p.wrong}</td>
                  <td className="p-2">{p.zones_patched}/{p.zones_total}</td>
                  <td className="p-2 font-pixel text-[10px] text-gold">{p.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </main>
  )
}

function BugReport({ b }) {
  const [open, setOpen] = useState(false)
  const rate = b.tried ? Math.round((100 * b.first_try) / b.tried) : null
  return (
    <li className="pixel-box rounded-sm bg-card">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left hover:bg-hover">
        <span>
          <span className="font-pixel text-[9px] text-muted">{b.emoji} {b.zone} · {TYPE_LABEL[b.type]}</span>
          <span className="block font-bold">{b.title}</span>
        </span>
        <span className="flex gap-4 font-pixel text-[9px]">
          <span className="text-muted">TRIED {b.tried}</span>
          <span className="text-ok">FIRST TRY {rate === null ? '—' : `${rate}%`}</span>
          <span className="text-gold">SHOWN {b.revealed}</span>
          <span className="text-bad">MISSES {b.wrong}</span>
        </span>
      </button>
      {open && (
        <div className="grid gap-3 border-t-2 border-line p-3 lg:grid-cols-2">
          <div>
            <p className="text-sm text-bad">🐛 {b.story}</p>
            <pre className="mt-2 overflow-x-auto rounded-sm bg-code p-2 font-mono text-xs leading-6">
              {b.code.map((line, i) => <div key={i}><Highlight text={line} /></div>)}
              {b.lines && <div className="text-muted">{'  // lines to order:'}</div>}
              {b.lines?.map((l) => <div key={l.id}><Highlight text={l.text} /></div>)}
            </pre>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-pixel text-[9px] text-ok">THE FIX</p>
            <pre className="overflow-x-auto rounded-sm bg-code p-2 font-mono text-xs text-ok">{b.solution}</pre>
            <p className="text-muted">💡 {b.hint}</p>
            <p className="font-pixel text-[9px] text-bad">MOST COMMON WRONG ANSWERS</p>
            {b.common_wrong.length ? (
              <ul className="space-y-1">{b.common_wrong.map((w) => <li key={w.answer} className="font-mono text-xs"><span className="text-bad">×{w.count}</span> {w.answer}</li>)}</ul>
            ) : <p className="text-xs text-muted">None.</p>}
          </div>
        </div>
      )}
    </li>
  )
}
