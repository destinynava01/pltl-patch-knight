import { useEffect, useState } from 'react'
import { TYPE_LABEL } from './config'
import { Highlight } from './cpp'
import { Button, Pixel } from './ui'
import ReportProblem from './ReportProblem'

// The leader's peek at one knight: the bug they have open, exactly as their screen shows it, how they're doing on
// it, and every answer they've tried. The hint and the fix stay behind buttons, since the dashboard is often on
// the projector. Refreshes whenever the dashboard does (`stamp` changes).
export default function Peek({ call, player, stamp, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [show, setShow] = useState({ hint: false, fix: false })

  useEffect(() => {
    call({ action: 'peek', player_id: player.id }).then((d) => { setData(d); setError('') }).catch((e) => setError(e.message))
  }, [call, player.id, stamp])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const b = data?.bug
  const status = data?.progress?.status
  const minutes = data?.opened_at ? Math.max(0, Math.round((Date.parse(data.server_now) - Date.parse(data.opened_at)) / 60000)) : null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={`Peek at ${player.name}`}>
      <section className="pixel-box my-auto w-full max-w-3xl bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Pixel className="text-info">👀 Peeking at {player.name}</Pixel>
            {b && <p className="mt-2 text-sm text-muted">{data.zone.emoji} {data.zone.name} ({data.zone.topic}) · {TYPE_LABEL[b.type]}{minutes !== null ? ` · opened ${minutes === 0 ? 'just now' : `${minutes} min ago`}` : ''}</p>}
          </div>
          <button type="button" onClick={onClose} className="border-2 border-line px-3 py-1 font-pixel text-xs hover:bg-hover" aria-label="Close">✕</button>
        </div>

        {error && <p className="mt-3 font-bold text-bad">{error}</p>}
        {!data && !error && <p className="mt-4 text-muted">Loading…</p>}
        {data && !b && <p className="mt-4 text-muted">{player.name} hasn&apos;t opened a bug yet (they&apos;re on the world map).</p>}

        {b && (
          <>
            <h2 className="mt-3 text-xl font-bold">{b.title}</h2>
            <p className="text-sm text-muted">{b.story}</p>
            <p className="mt-2 text-sm"><span className="font-pixel text-[0.7rem] text-gold">TASK </span>{b.prompt}</p>

            <pre className="crt mt-3 overflow-x-auto rounded-sm border-2 border-line bg-code py-2 font-mono text-sm leading-7">
              {b.code.slice(0, b.type === 'order' ? b.slotAt : undefined).map((line, i) => (
                <div key={i} className={`flex px-3 ${show.fix && data.bug_line === i ? 'bg-bad-soft' : ''}`}>
                  <span className="w-8 shrink-0 select-none pr-3 text-right text-muted/60">{i + 1}</span>
                  <span><Highlight text={line} /></span>
                </div>
              ))}
              {b.type === 'order' && (
                <>
                  <div className="px-3 text-muted">{'      // the lines they have to put in order (shuffled, as they see them):'}</div>
                  {b.lines.map((l) => <div key={l.id} className="px-3 pl-11 text-gold"><Highlight text={l.text} /></div>)}
                  {b.code.slice(b.slotAt).map((line, i) => <div key={`after-${i}`} className="px-3 pl-11"><Highlight text={line} /></div>)}
                </>
              )}
            </pre>

            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className={`font-bold ${status === 'fixed' ? 'text-ok' : status === 'revealed' ? 'text-gold' : data.progress.misses ? 'text-bad' : 'text-info'}`}>
                {status === 'fixed' ? `✓ Fixed (+${data.progress.xp} XP)` : status === 'revealed' ? 'Asked to see the fix' : data.progress.misses ? `Stuck: ${data.progress.misses} wrong tr${data.progress.misses === 1 ? 'y' : 'ies'}` : 'Working on it, no tries yet'}
              </span>
              {data.progress.hinted && <span className="text-muted">💡 used the hint</span>}
            </div>

            <div className="mt-3">
              <Pixel>Their tries</Pixel>
              {data.attempts.length === 0 ? <p className="mt-1 text-sm text-muted">Nothing submitted yet.</p> : (
                <ol className="mt-1 space-y-1">
                  {data.attempts.map((a, i) => (
                    <li key={i} className={`flex items-start gap-2 rounded-sm px-2 py-1 font-mono text-sm ${a.correct ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}>
                      <span>{a.correct ? '✓' : '✗'}</span><span className="break-all">{b.type === 'order' ? a.answer.split(',').map((id) => b.lines.findIndex((l) => l.id === id) + 1).join(' → ') + '  (by the shuffled line numbers above)' : a.answer}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setShow({ ...show, hint: !show.hint })}>{show.hint ? 'Hide' : 'Show'} the hint</Button>
              <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setShow({ ...show, fix: !show.fix })}>{show.fix ? 'Hide' : 'Show'} the fix</Button>
              <span className="self-center text-xs text-muted">(hidden by default in case this is on the projector)</span>
            </div>
            {show.hint && <p className="mt-2 rounded-sm bg-info-soft px-3 py-2 text-sm">💡 {data.hint}</p>}
            {show.fix && <pre className="mt-2 overflow-x-auto rounded-sm bg-code p-2 font-mono text-sm text-ok">{data.solution}</pre>}
            <ReportProblem call={call} location={`${player.name} · ${data.zone.name}: ${b.title}`} question={`${b.story}\n${b.prompt}`} answer={data.solution ?? ''} className="mt-3 block" />
          </>
        )}
      </section>
    </div>
  )
}
