import { useCallback, useEffect, useState } from 'react'
import { pkPlay, watchGame } from './api'
import Code from './Code'
import Scene from './Scene'
import { KNIGHT_COLORS, SITE_NAME, TYPE_LABEL } from './config'
import { Button, CenterCard, Knight, Panel, Pixel } from './ui'

const STORAGE_KEY = 'patchKnightPlayer'
const DEVICE_KEY = 'patchKnightDevice'
const field = 'w-full rounded-sm border-2 border-line bg-code px-3 py-3 text-center font-mono text-lg text-ink outline-none focus:border-ok'

function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id) }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
const readSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null } }
const writeSaved = (v) => { try { v ? localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) : localStorage.removeItem(STORAGE_KEY) } catch { /* blocked */ } }

// The student (or small group): join, then the world map, zones and bugs.
export default function StudentJoin() {
  const [saved, setSaved] = useState(readSaved)
  const [notice, setNotice] = useState('')
  const leave = useCallback((message = '') => { writeSaved(null); setSaved(null); setNotice(message) }, [])
  return saved ? <World saved={saved} onLeave={leave} /> : <JoinForm notice={notice} onJoined={(v) => { writeSaved(v); setSaved(v); setNotice('') }} />
}

function JoinForm({ onJoined, notice }) {
  const [code, setCode] = useState(() => (new URLSearchParams(window.location.search).get('code') ?? '').toUpperCase())
  const [name, setName] = useState('')
  const [color, setColor] = useState(KNIGHT_COLORS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function join(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await pkPlay({ action: 'join', join_code: code, display_name: name, color, device_id: deviceId() })
      onJoined({ playerId: data.player.id, gameId: data.game.id })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <CenterCard title={SITE_NAME}>
      <p className="mt-3"><span className="bob"><Knight color={color} size={64} /></span></p>
      <form onSubmit={join} className="mt-3 space-y-4 text-left">
        {notice && <p className="text-center font-bold text-muted">{notice}</p>}
        <div>
          <Pixel>Game code</Pixel>
          <input className={`${field} mt-2 uppercase tracking-[0.4em]`} maxLength={6} placeholder="ABC123" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())} required autoCapitalize="characters" autoComplete="off" />
        </div>
        <div>
          <Pixel>Knight name</Pixel>
          <input className={`${field} mt-2`} maxLength={60} placeholder="Maria G.  or  Maria & José" value={name} onChange={(e) => setName(e.target.value)} required />
          <p className="mt-1 text-xs text-muted">Playing as a small group on one screen? Put everyone&apos;s names.</p>
        </div>
        <div>
          <Pixel>Armor color</Pixel>
          <div className="mt-2 flex justify-center gap-2">
            {KNIGHT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Color ${c}`} aria-pressed={color === c}
                className={`h-9 w-9 rounded-sm border-4 ${color === c ? 'border-ink' : 'border-transparent'}`} style={{ background: c }} />
            ))}
          </div>
        </div>
        <Button className="w-full" disabled={busy || code.length < 6 || !name.trim()}>{busy ? 'Loading…' : '▶ Press start'}</Button>
        {error && <p className="text-center font-bold text-bad">{error}</p>}
      </form>
    </CenterCard>
  )
}

function World({ saved, onLeave }) {
  const [view, setView] = useState(null)
  const [error, setError] = useState('')
  const [zoneId, setZoneId] = useState(null)
  const [bugId, setBugId] = useState(null)
  const [flash, setFlash] = useState(null) // 'right' | 'wrong', replays the scene effect

  const load = useCallback(
    () => pkPlay({ action: 'status', player_id: saved.playerId, device_id: deviceId() })
      .then((data) => {
        if (data.ended) return onLeave('That game has ended. Join another with a new code.')
        setView(data)
        setError('')
      })
      .catch((e) => {
        if (/not found|another device/i.test(e.message)) return onLeave('You were removed from that game.')
        setError(e.message)
      }),
    [saved, onLeave],
  )
  useEffect(() => { load() }, [load])

  // In the lobby, listen for the leader starting the game (and for topic changes)
  const waiting = view?.game.status === 'setup'
  useEffect(() => {
    if (!waiting) return undefined
    return watchGame(saved.gameId, ['progress'], load, 5000)
  }, [waiting, saved, load])

  if (!view) return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">{error || 'Loading the world…'}</p></CenterCard>

  const { player, zones, summary } = view
  const zone = zones.find((z) => z.id === zoneId)

  return (
    <main className="world-bg min-h-dvh text-ink">
      <header className="sticky top-0 z-10 border-b-4 border-line bg-board/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
          <button type="button" onClick={() => { setZoneId(null); setBugId(null) }} className="flex min-w-0 items-center gap-2 text-left">
            <Knight color={player.color} size={32} />
            <span className="min-w-0">
              <span className="block truncate font-bold">{player.display_name}</span>
              <span className="font-pixel text-[0.7rem] text-info">WORLD MAP</span>
            </span>
          </button>
          <div className="flex items-center gap-4 font-pixel text-xs">
            <span className="text-gold">XP {summary.xp}</span>
            <span className="text-ok">🐛 {summary.fixed + summary.revealed}/{summary.total}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-4 p-4">
        {view.game.status === 'finished' && <Panel className="text-center"><Pixel className="text-gold">The leader ended the game</Pixel><p className="mt-2">You patched {summary.fixed + summary.revealed} bugs and earned {summary.xp} XP. Great debugging!</p></Panel>}
        {error && <p className="font-bold text-bad">{error}</p>}

        {waiting && (
          <Panel className="text-center">
            <p className="text-5xl"><span className="bob"><Knight color={player.color} size={72} /></span></p>
            <Pixel className="mt-3 text-gold">Get ready, knight!</Pixel>
            <p className="mt-2 text-muted">You&apos;re in. The leader is picking the topics and will start the game in a moment.</p>
            <p className="mt-4 text-sm">Coming up: {zones.map((z) => `${z.emoji} ${z.topic}`).join(' · ')}</p>
          </Panel>
        )}
        {!waiting && !zone && <WorldMap zones={zones} summary={summary} onOpen={setZoneId} />}
        {!waiting && zone && !bugId && <ZoneView zone={zone} flash={flash} onBack={() => setZoneId(null)} onOpenBug={setBugId} />}
        {!waiting && zone && bugId && (
          <BugView
            key={bugId}
            saved={saved}
            zone={zone}
            bugId={bugId}
            flash={flash}
            onResult={(right) => { setFlash(right ? 'right' : `wrong-${Date.now()}`); load() }}
            onBack={() => { setBugId(null); setFlash(null) }}
            onNext={(next) => { setBugId(next); setFlash(null) }}
          />
        )}

        <p className="pt-4 text-center"><button onClick={() => onLeave()} className="text-sm text-muted hover:text-ink">Leave game</button></p>
      </div>
    </main>
  )
}

// The world: six zones on a path; locked ones are dark until the one before is patched
function WorldMap({ zones, summary, onOpen }) {
  return (
    <>
      <Panel className="text-center">
        <Pixel className="text-gold">{summary.finished ? '★ The world is patched! ★' : 'The world is glitching'}</Pixel>
        <p className="mt-2 text-sm text-muted">Fix every bug in a zone to unlock the next one. Fix it on the first try for full XP.</p>
      </Panel>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((z, i) => (
          <li key={z.id}>
            <button type="button" disabled={!z.unlocked} onClick={() => onOpen(z.id)}
              className={`pixel-box block h-full w-full rounded-sm p-4 text-left transition ${z.unlocked ? 'bg-card hover:-translate-y-1 hover:bg-hover' : 'bg-code opacity-50'}`}>
              <p className="flex items-center justify-between font-pixel text-xs text-muted">
                <span>ZONE {i + 1}</span>
                <span className={z.patched ? 'text-ok' : z.unlocked ? 'text-bad flicker' : ''}>{z.patched ? 'PATCHED' : z.unlocked ? 'GLITCHING' : '🔒 LOCKED'}</span>
              </p>
              <p className="mt-2 text-3xl">{z.unlocked ? z.emoji : '❔'}</p>
              <p className="mt-1 font-bold">{z.name}</p>
              <p className="text-sm text-muted">{z.topic}</p>
              <div className="mt-3 flex gap-1">
                {z.bugs.map((b) => (
                  <span key={b.id} className={`h-2 flex-1 rounded-sm ${b.status === 'fixed' ? 'bg-ok' : b.status === 'revealed' ? 'bg-gold' : 'bg-line'}`} />
                ))}
              </div>
            </button>
          </li>
        ))}
      </ol>
    </>
  )
}

function ZoneView({ zone, flash, onBack, onOpenBug }) {
  const fixed = zone.bugs.filter((b) => b.status !== 'open').length
  return (
    <>
      <button type="button" onClick={onBack} className="font-pixel text-xs text-info hover:underline">◀ World map</button>
      <Scene zone={zone} fixed={fixed} total={zone.bugs.length} flash={flash} />
      <Panel>
        <Pixel>{zone.topic}</Pixel>
        <p className="mt-1 text-muted">{zone.scene}</p>
        <ul className="mt-3 space-y-2">
          {zone.bugs.map((b, i) => (
            <li key={b.id}>
              <button type="button" onClick={() => onOpenBug(b.id)} className="flex w-full items-center justify-between gap-3 rounded-sm border-2 border-line bg-panel px-3 py-2 text-left hover:bg-hover">
                <span>
                  <span className="font-pixel text-[0.7rem] text-muted">BUG {i + 1} · {TYPE_LABEL[b.type]}</span>
                  <span className="block font-bold">{b.title}</span>
                </span>
                <span className={`shrink-0 font-pixel text-xs ${b.status === 'fixed' ? 'text-ok' : b.status === 'revealed' ? 'text-gold' : 'text-bad'}`}>
                  {b.status === 'fixed' ? '✔ FIXED' : b.status === 'revealed' ? '✔ SHOWN' : b.misses ? `${b.misses} MISS` : '🐛 OPEN'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}

function BugView({ saved, zone, bugId, flash, onResult, onBack, onNext }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { correct, feedback, xp?, can_reveal?, misses? }
  const [error, setError] = useState('')

  const call = useCallback((payload) => pkPlay({ ...payload, player_id: saved.playerId, device_id: deviceId(), bug_id: bugId }), [saved, bugId])
  const reload = useCallback(() => call({ action: 'bug' }).then(setData).catch((e) => setError(e.message)), [call])
  useEffect(() => { reload() }, [reload])

  async function submit(answer, line) {
    setBusy(true)
    setError('')
    try {
      const r = await call({ action: 'submit', answer, line })
      setResult(r)
      onResult(r.correct)
      if (r.correct) await reload()
      else setData((d) => ({ ...d, can_reveal: r.can_reveal, progress: { ...d.progress, misses: r.misses } }))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function hint() {
    try { const r = await call({ action: 'hint' }); setData((d) => ({ ...d, hint: r.hint, progress: { ...d.progress, hinted: true } })) } catch (e) { setError(e.message) }
  }
  async function reveal() {
    if (!window.confirm('Show the fix? This bug counts as patched, but with no XP.')) return
    try { await call({ action: 'reveal' }); setResult(null); onResult(true); await reload() } catch (e) { setError(e.message) }
  }

  if (!data) return <Panel><p className="text-muted">{error || 'Opening the bug…'}</p></Panel>
  const { bug, progress } = data
  const done = progress.status !== 'open'
  const fixedCount = zone.bugs.filter((b) => b.status !== 'open').length
  const index = zone.bugs.findIndex((b) => b.id === bugId)
  const next = zone.bugs.slice(index + 1).find((b) => b.status === 'open') ?? zone.bugs.find((b) => b.status === 'open' && b.id !== bugId)

  return (
    <>
      <button type="button" onClick={onBack} className="font-pixel text-xs text-info hover:underline">◀ {zone.name}</button>
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-3">
          <Panel>
            <p className="font-pixel text-[0.7rem] text-muted">{zone.emoji} BUG {index + 1} · {TYPE_LABEL[bug.type]}</p>
            <h2 className="mt-1 text-xl font-bold">{bug.title}</h2>
            <p className="mt-1 text-bad">🐛 {bug.story}</p>
            <p className="mt-2 font-bold">{bug.prompt}</p>
          </Panel>
          <Code key={`${bug.id}-${done}`} bug={bug} busy={busy} done={done} onSubmit={submit} />
          {error && <p className="font-bold text-bad">{error}</p>}
        </div>

        <div className="space-y-3">
          <Scene zone={zone} fixed={fixedCount} total={zone.bugs.length} flash={flash} />

          {result && !result.correct && (
            <Panel className="glitch-once border-bad">
              <Pixel className="text-bad">✖ Still glitching</Pixel>
              <p className="mt-2">{result.feedback}</p>
            </Panel>
          )}

          {done ? (
            <Panel className="patch-in">
              <Pixel className={progress.status === 'fixed' ? 'text-ok' : 'text-gold'}>{progress.status === 'fixed' ? `✔ Patched! +${progress.xp} XP` : '✔ Fix shown'}</Pixel>
              <p className="mt-2">{data.fixed}</p>
              <p className="mt-3 font-pixel text-[0.7rem] text-muted">THE FIX</p>
              <pre className="mt-1 overflow-x-auto rounded-sm bg-code p-2 font-mono text-sm text-ok">{data.solution}</pre>
              {data.hint && <p className="mt-2 text-sm text-muted">💡 {data.hint}</p>}
              {next ? <Button className="mt-4 w-full" onClick={() => onNext(next.id)}>Next bug ▶</Button> : <Button className="mt-4 w-full" onClick={onBack}>Back to the zone ▶</Button>}
            </Panel>
          ) : (
            <Panel>
              <p className="font-pixel text-[0.7rem] text-muted">TRIES MISSED: {progress.misses}</p>
              {data.hint
                ? <p className="mt-2">💡 {data.hint}</p>
                : <Button variant="outline" className="mt-2 w-full" onClick={hint}>💡 Hint (−30 XP)</Button>}
              {data.can_reveal && <Button variant="gold" className="mt-2 w-full" onClick={reveal}>Show me the fix</Button>}
            </Panel>
          )}
        </div>
      </div>
    </>
  )
}
