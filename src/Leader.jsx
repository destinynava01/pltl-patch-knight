import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { pkGame, watchGame } from './api'
import Report from './Report'
import { BUGS_PER_ZONE, HUB_URL, SITE_NAME, SITE_TAGLINE, TYPE_LABEL, ZONES } from './config'
import { readSession, saveSession } from './session'
import { Button, CenterCard, Knight, Panel, Pixel } from './ui'

// The leader: open a lobby (students join with the code while the leader picks the topics), start the game,
// watch the class dashboard on the projector, then end it for the report. The game is remembered in this tab.
export default function Leader() {
  const [session, setSession] = useState(readSession)
  const [status, setStatus] = useState(null) // 'setup' (the lobby) | 'playing' | 'finished'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const call = useCallback((payload) => pkGame({ ...payload, game_id: session.gameId, host_token: session.hostToken }), [session])

  useEffect(() => {
    if (!session) return
    call({ action: 'get_state' })
      .then((d) => setStatus(d.game.status))
      .catch(() => { saveSession(null); setSession(null) })
  }, [session, call])

  async function create() {
    setBusy(true)
    setError('')
    try {
      const d = await pkGame({ action: 'create_game' })
      const s = { gameId: d.game.id, hostToken: d.host_token, joinCode: d.game.join_code }
      saveSession(s)
      setSession(s)
      setStatus('setup')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function newGame() {
    if (session) { try { await call({ action: 'close_game' }) } catch { /* already gone */ } }
    saveSession(null)
    setSession(null)
    setStatus(null)
  }

  if (!session) {
    return (
      <CenterCard title={SITE_NAME}>
        <p className="mt-4"><span className="bob"><Knight size={72} /></span></p>
        <p className="mt-3 font-pixel text-[10px] leading-relaxed text-gold">{SITE_TAGLINE}</p>
        <p className="mt-3 text-muted">
          A CS2 game in C++: every zone of this RPG is bugged (linked lists, pointers, classes, recursion, sorting,
          searching). Students fix the code to repair the world. Solo or in small groups.
        </p>
        <Button className="mt-6" disabled={busy} onClick={create}>{busy ? 'Booting…' : '▶ Open the lobby'}</Button>
        {error && <p className="mt-3 font-bold text-bad">{error}</p>}
        <a href={HUB_URL} className="mt-4 block text-sm text-info hover:underline">← All games</a>
      </CenterCard>
    )
  }
  if (!status) return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">Loading…</p></CenterCard>
  if (status === 'finished') return <Report call={call} onNewGame={newGame} />
  return <Dashboard session={session} call={call} onEnded={() => setStatus('finished')} onNewGame={newGame} />
}

// The topic checklist: the zones, in world order (students unlock the chosen ones in this order)
function TopicPicker({ value, onChange }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Pixel>Topics (zones)</Pixel>
        <span className="flex gap-3 text-xs">
          <button type="button" className="text-info hover:underline" onClick={() => onChange(ZONES.map((z) => z.id))}>All</button>
          <button type="button" className="text-info hover:underline" onClick={() => onChange([])}>None</button>
        </span>
      </div>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {ZONES.map((z) => {
          const on = value.includes(z.id)
          return (
            <li key={z.id}>
              <label className={`flex cursor-pointer items-center gap-3 rounded-sm border-2 px-3 py-2 ${on ? 'border-ok bg-ok-soft' : 'border-line bg-panel hover:bg-hover'}`}>
                <input type="checkbox" checked={on} className="h-4 w-4 accent-green-400"
                  onChange={() => onChange(on ? value.filter((x) => x !== z.id) : ZONES.map((x) => x.id).filter((x) => x === z.id || value.includes(x)))} />
                <span className="text-xl">{z.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{z.topic}</span>
                  <span className="block text-xs text-muted">{z.name} · {BUGS_PER_ZONE} bugs</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">Students unlock the chosen zones one after another, in this order.</p>
    </div>
  )
}

function Dashboard({ session, call, onEnded, onNewGame }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [topics, setTopics] = useState(null) // the checklist while it's being edited (null = not editing)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => call({ action: 'dashboard' }).then((d) => { setData({ ...d, offset: Date.parse(d.server_now) - Date.now() }); setError('') }).catch((e) => setError(e.message)), [call])
  useEffect(() => {
    load()
    return watchGame(session.gameId, ['progress'], load, 8000)
  }, [session, load])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(id) }, [])

  async function end() {
    if (!window.confirm('End the game? Students stop being able to submit fixes, and you get the report.')) return
    try { await call({ action: 'end_game' }); onEnded() } catch (e) { setError(e.message) }
  }

  const inLobby = data?.game.status === 'setup'
  const chosen = topics ?? data?.game.zones ?? ZONES.map((z) => z.id)

  async function saveTopics(start) {
    setBusy(true)
    setError('')
    try {
      await call({ action: start ? 'start_game' : 'set_zones', zones: chosen })
      setTopics(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const joinUrl = `${window.location.origin}/join?code=${session.joinCode}`
  const serverNow = now + (data?.offset ?? 0)

  return (
    <main className="world-bg min-h-dvh p-4 text-ink sm:p-6">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Knight size={44} />
          <div>
            <h1 className="font-pixel text-lg text-ok">{SITE_NAME}</h1>
            <p className="font-pixel text-[9px] text-muted">{inLobby ? 'LEADER LOBBY' : 'CLASS DASHBOARD'} · {data?.players.length ?? 0} KNIGHT{data?.players.length === 1 ? '' : 'S'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!inLobby && <Button variant="danger" onClick={end}>■ End game</Button>}
          <Button variant="outline" onClick={() => window.confirm('Close this game and start a new one? Progress is lost.') && onNewGame()}>New game</Button>
        </div>
      </header>
      {error && <p className="mx-auto mt-3 max-w-7xl font-bold text-bad">{error}</p>}

      <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-5">
          <Panel className="text-center">
            <Pixel>Join code</Pixel>
            <p className="mt-2 font-pixel text-2xl tracking-widest text-gold">{session.joinCode}</p>
            <div className="mx-auto mt-3 w-fit rounded-sm bg-white p-3"><QRCodeSVG value={joinUrl} size={170} title={`Join code ${session.joinCode}`} /></div>
            <p className="mt-2 text-xs text-muted">Scan to join, or go to {window.location.host}/join. Laptops work best for typing code.</p>
          </Panel>

          <Panel>
            <Pixel className="text-bad">Most-missed bugs</Pixel>
            {data?.troubles.length ? (
              <ol className="mt-2 space-y-2">
                {data.troubles.map((t) => (
                  <li key={t.id} className="rounded-sm bg-panel p-2 text-sm">
                    <p className="font-bold">{t.emoji} {t.title}</p>
                    <p className="text-xs text-muted">{TYPE_LABEL[t.type]} · {t.wrong} wrong tr{t.wrong === 1 ? 'y' : 'ies'}{t.stuck ? ` · ${t.stuck} stuck now` : ''}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-sm text-muted">No misses yet.</p>}
            <p className="mt-2 text-xs text-muted">Good ones to go over at the board.</p>
          </Panel>
        </div>

        <div className="space-y-5">
          {inLobby && (
            <Panel>
              <h2 className="font-pixel text-sm text-gold">Pick the topics, then start</h2>
              <p className="mt-1 text-sm text-muted">Students can join now; they wait on a &ldquo;get ready&rdquo; screen until you start.</p>
              <div className="mt-3"><TopicPicker value={chosen} onChange={setTopics} /></div>
              <Button className="mt-4 w-full" disabled={busy || chosen.length === 0} onClick={() => saveTopics(true)}>
                {busy ? 'Starting…' : chosen.length === 0 ? 'Pick at least one topic' : `▶ Start the game (${chosen.length * BUGS_PER_ZONE} bugs)`}
              </Button>
            </Panel>
          )}
          {!inLobby && data && (
            <Panel>
              {topics === null ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm"><span className="font-pixel text-[9px] text-info">TOPICS </span>{ZONES.filter((z) => data.game.zones.includes(z.id)).map((z) => `${z.emoji} ${z.topic}`).join(' · ')}</p>
                  <button type="button" onClick={() => setTopics(data.game.zones)} className="font-pixel text-[9px] text-info hover:underline">Change topics</button>
                </div>
              ) : (
                <>
                  <TopicPicker value={chosen} onChange={setTopics} />
                  <div className="mt-3 flex gap-2">
                    <Button disabled={busy || chosen.length === 0} onClick={() => saveTopics(false)}>{busy ? 'Saving…' : 'Save topics'}</Button>
                    <Button variant="outline" onClick={() => setTopics(null)}>Cancel</Button>
                  </div>
                  <p className="mt-2 text-xs text-muted">Changes apply right away. Students keep the bugs they already fixed.</p>
                </>
              )}
            </Panel>
          )}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(data?.zones.length ?? 6, 6)}, minmax(0, 1fr))` }}>
            {data?.zones.map((z, i) => (
              <div key={z.id} className="pixel-box rounded-sm bg-card p-2 text-center">
                <p className="text-2xl">{z.emoji}</p>
                <p className="font-pixel text-[8px] text-muted">ZONE {i + 1}</p>
                <p className="mt-1 truncate text-xs">{z.topic}</p>
                <p className="mt-1 font-pixel text-sm text-gold">{z.players}</p>
              </div>
            ))}
          </div>

          <Panel>
            <Pixel>Knights</Pixel>
            {data && data.players.length === 0 && <p className="mt-3 text-muted">Waiting for knights to join…</p>}
            {inLobby && data?.players.length > 0 && <p className="mt-2 text-sm text-muted">These knights are in and waiting for you to start.</p>}
            <ul className="mt-3 space-y-2">
              {data?.players.map((p, rank) => {
                const idle = serverNow - Date.parse(p.last_seen) > 3 * 60 * 1000
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-sm bg-panel px-3 py-2">
                    <span className="w-6 text-right font-pixel text-[10px] text-muted">{rank + 1}</span>
                    <Knight color={p.color} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{p.name}{idle && <span className="ml-2 text-xs font-normal text-muted">(idle)</span>}</span>
                      <span className="text-xs text-muted">{p.finished ? '★ Patched the whole world' : p.zone ? `${p.zone.emoji} ${p.zone.name} · ${p.zone.fixed}/${p.zone.total}` : ''}</span>
                    </span>
                    <span className="hidden h-2 w-40 overflow-hidden rounded-sm bg-line sm:block">
                      <span className="block h-full bg-ok" style={{ width: `${(100 * (p.fixed + p.revealed)) / p.total}%` }} />
                    </span>
                    <span className="w-16 text-right font-pixel text-[10px] text-ok">{p.fixed + p.revealed}/{p.total}</span>
                    <span className="w-20 text-right font-pixel text-[10px] text-gold">{p.xp} XP</span>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </main>
  )
}
