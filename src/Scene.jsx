// What each zone of the game looks like: broken (glitching) until its bugs are fixed, one piece at a time.
// `fixed` of `total` bugs are patched; `flash` replays a right/wrong effect when a fix is tried.

const garble = (text, seed) => {
  const glyphs = '#%&@$?!*<>/\\|=+~'
  return [...text].map((ch, i) => (ch === ' ' ? ' ' : glyphs[(seed * 7 + i * 13) % glyphs.length])).join('')
}

function Glitchy({ broken, children, seed = 1, className = '' }) {
  if (!broken) return <span className={`patch-in ${className}`}>{children}</span>
  return <span className={`glitch text-bad ${className}`}>{garble(String(children), seed)}</span>
}

export default function Scene({ zone, fixed, total, flash }) {
  // Each scene has 4 pieces; piece i repairs once its share of the zone's bugs is fixed (with 4 bugs, one each)
  const broken = (i) => fixed < Math.ceil(((i + 1) * total) / 4)
  const patched = fixed >= total
  const Body = SCENES[zone.id] ?? Fallback
  return (
    <section className={`crt pixel-box relative overflow-hidden rounded-sm bg-code p-4 ${String(flash ?? '').startsWith('wrong') ? 'glitch-once' : ''}`} key={flash ?? 'scene'}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-pixel text-xs uppercase tracking-wider text-info">{zone.emoji} {zone.name}</p>
        <p className={`font-pixel text-xs ${patched ? 'text-ok' : 'text-bad flicker'}`}>{patched ? 'PATCHED' : `${fixed}/${total} FIXED`}</p>
      </div>
      <div className="mt-3 min-h-28">
        <Body broken={broken} patched={patched} />
      </div>
      {!patched && <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_40px,rgb(255_61_129/0.05)_40px_44px)]" />}
    </section>
  )
}

const row = 'flex items-center justify-between rounded-sm bg-panel px-3 py-1.5 font-mono text-sm'

const SCENES = {
  // ---- CS1 review ----
  // The village shop: prices and change are garbled until the math is fixed
  vars: ({ broken }) => (
    <div className="space-y-1.5">
      {[['🍞', 'Bread', '3 gold'], ['🧪', 'Potion', '7.5 gold'], ['🪙', 'Change', '2h 15m'], ['📊', 'Average', '6.67']].map(([e, n, v], i) => (
        <p key={n} className={row}><span>{e} {n}</span><Glitchy broken={broken(i)} seed={i}>{v}</Glitchy></p>
      ))}
    </div>
  ),
  // The crossroads: each gate lets the right travelers through once its condition is fixed
  logic: ({ broken }) => (
    <div className="grid grid-cols-2 gap-2">
      {[['🚪', 'Gold gate'], ['🔦', 'Cave gate'], ['🎟️', 'VIP gate'], ['🌙', 'Night gate']].map(([e, n], i) => (
        <p key={n} className={`${row} justify-start gap-2`}>{e} {n}: <Glitchy broken={broken(i)} seed={i + 3}>{i % 2 ? 'closed' : 'open'}</Glitchy></p>
      ))}
    </div>
  ),
  // The windmills: each one spins the right number of times once its loop is fixed
  loops: ({ broken, patched }) => (
    <div className="flex items-end justify-around">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <p className={`text-3xl ${broken(i) ? 'glitch' : patched ? 'bob' : ''}`}>{broken(i) ? '💥' : '🌾'}</p>
          <p className="font-mono text-xs"><Glitchy broken={broken(i)} seed={i}>{`x${i + 2}`}</Glitchy></p>
        </div>
      ))}
    </div>
  ),
  // The spellbook: each spell returns its result once its function is fixed
  funcs: ({ broken }) => (
    <div className="space-y-1.5 font-mono text-sm">
      {[['doubleIt(7)', '14'], ['heal(hp)', 'hp = 40'], ['greet("Aria")', 'Hail, Aria'], ['biggest(4, 9)', '9']].map(([call, out], i) => (
        <p key={call} className={row}><span>📜 {call}</span><Glitchy broken={broken(i)} seed={i + 1}>{out}</Glitchy></p>
      ))}
    </div>
  ),
  // The market: shelves and signs unscramble as the arrays and strings are fixed
  arrays: ({ broken }) => (
    <div className="space-y-2">
      <div className="flex gap-1">
        {['🍎', '🍞', '🧀', '🥕', '🍯'].map((e, i) => (
          <span key={i} className={`flex h-9 flex-1 items-center justify-center rounded-sm bg-panel text-xl ${broken(Math.min(3, i)) && i % 2 ? 'glitch' : ''}`}>{e}</span>
        ))}
      </div>
      <p className={row}><span>🪧 Sign</span><Glitchy broken={broken(2)} seed={5}>KING&apos;S MARKET</Glitchy></p>
      <p className={row}><span>🛒 Cart</span><Glitchy broken={broken(3)} seed={6}>4 items</Glitchy></p>
    </div>
  ),

  // ---- CS2 ----
  // The bag (linked list): items appear as the traversal, count, insert and peek bugs are fixed
  inventory: ({ broken }) => (
    <div className="space-y-1.5">
      {[['🗡️', 'Sword'], ['🛡️', 'Shield'], ['🧪', 'Potion'], ['🔮', 'Orb (new loot)']].map(([e, n], i) => (
        <p key={n} className={row}><span>{e} <Glitchy broken={broken(i)} seed={i}>{n}</Glitchy></span><span className="text-muted">→</span></p>
      ))}
      <p className="text-right font-mono text-xs text-muted">items: <Glitchy broken={broken(1)}>4</Glitchy></p>
    </div>
  ),
  // Weapons (pointers): attack, the swap, gold and the shield
  armory: ({ broken }) => (
    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
      <p className={row}>⚔️ ATK <Glitchy broken={broken(0)}>15</Glitchy></p>
      <p className={row}>🤚 L/R <Glitchy broken={broken(1)} seed={2}>Bow/Sword</Glitchy></p>
      <p className={row}>💰 Gold <Glitchy broken={broken(2)} seed={3}>30</Glitchy></p>
      <p className={row}>🛡️ Armor <Glitchy broken={broken(3)} seed={4}>25</Glitchy></p>
    </div>
  ),
  // Heroes (classes): HP, potions, the slime census, the shield blueprint
  guild: ({ broken }) => (
    <div className="space-y-1.5 font-mono text-sm">
      <p className={row}>🧙 Sir Ada <span>HP <Glitchy broken={broken(0)}>120</Glitchy></span></p>
      <p className={row}>🧪 Potion <span>heals <Glitchy broken={broken(1)} seed={2}>40</Glitchy></span></p>
      <p className={row}>🟢 Slimes <span><Glitchy broken={broken(2)} seed={3}>3</Glitchy></span></p>
      <p className={row}>🛡️ Shield <span>DEF <Glitchy broken={broken(3)} seed={4}>12</Glitchy></span></p>
    </div>
  ),
  // Rooms within rooms (recursion): nested squares stop flickering as bugs are fixed
  dungeon: ({ broken, patched }) => (
    <div className="flex items-center gap-4">
      <div className={`aspect-square w-28 shrink-0 border-2 p-1.5 ${patched ? 'border-ok' : 'flicker border-bad'}`}>
        <div className="flex h-full gap-1.5">
          {[0, 1].map((k) => (
            <div key={k} className={`flex-1 border-2 p-1 ${patched ? 'border-ok/70' : 'border-bad/70'}`}>
              <div className="flex h-full flex-col gap-1">{[0, 1].map((j) => <div key={j} className={`flex-1 border ${patched ? 'border-ok/50' : 'border-bad/40'}`} />)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1 font-mono text-sm">
        <p>rooms(3) = <Glitchy broken={broken(0)}>15</Glitchy></p>
        <p>2^5 = <Glitchy broken={broken(1)} seed={2}>32</Glitchy></p>
        <p>rabbits = <Glitchy broken={broken(2)} seed={3}>8</Glitchy></p>
        <p>loot = <Glitchy broken={broken(3)} seed={4}>120</Glitchy></p>
      </div>
    </div>
  ),
  // The leaderboard (sorting): stays scrambled until the sorts are fixed
  arena: ({ broken, patched }) => {
    const board = [['Rook', 980], ['Ada', 875], ['Bit', 640], ['Null', 120]]
    const shown = patched ? board : [board[3], board[1], ['????', 0xdead], board[0]]
    return (
      <ol className="space-y-1.5 font-mono text-sm">
        {shown.map(([n, s], i) => (
          <li key={`${n}${i}`} className={row}>
            <span>{i === 0 ? '🏆' : `#${i + 1}`} <Glitchy broken={!patched && broken(i)} seed={i}>{n}</Glitchy></span>
            <span className={patched ? 'patch-in' : ''}>{s}</span>
          </li>
        ))}
      </ol>
    )
  },
  // The map (searching): the pin lands once the searches work
  tower: ({ broken, patched }) => (
    <div className="flex items-center gap-4">
      <div className="grid shrink-0 grid-cols-6 gap-0.5">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className={`flex h-6 w-6 items-center justify-center text-xs ${i === 17 && patched ? 'patch-in bg-ok/30' : 'bg-panel'} ${!patched && i % 5 === 2 ? 'flicker bg-bad/30' : ''}`}>
            {i === 17 && patched ? '📍' : ''}
          </div>
        ))}
      </div>
      <div className="space-y-1 font-mono text-sm">
        <p>town @ <Glitchy broken={broken(0)}>2</Glitchy></p>
        <p>level 23 @ <Glitchy broken={broken(1)} seed={2}>5</Glitchy></p>
        <p>last room <Glitchy broken={broken(2)} seed={3}>found</Glitchy></p>
        <p>trace <Glitchy broken={broken(3)} seed={4}>3 5</Glitchy></p>
      </div>
    </div>
  ),
}

function Fallback({ patched }) {
  return <p className="font-mono text-sm">{patched ? 'All systems normal.' : 'ERROR ERROR ERROR'}</p>
}
