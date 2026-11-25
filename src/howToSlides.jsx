// The "How to play" slides for Patch Knight (shown on the projector when the game starts)

export const SLIDES = [
  {
    title: 'The game is broken',
    text: 'Every zone of this RPG is glitching, and each zone is a C++ topic. Fix all the bugs in a zone to patch it and unlock the next one. Play solo or as a small group on one laptop.',
    art: (
      <div className="grid grid-cols-3 gap-2 font-mono text-xs">
        {[['🎒', 'Linked lists', 'PATCHED'], ['🗡️', 'Pointers', 'GLITCHING'], ['🧙', 'Classes', '🔒']].map(([e, t, s]) => (
          <div key={t} className={`rounded border-4 p-2 text-center ${s === 'PATCHED' ? 'border-green-400' : s === 'GLITCHING' ? 'border-pink-500' : 'border-slate-600 opacity-50'}`}>
            <p className="text-2xl">{e}</p><p className="font-bold">{t}</p><p className={s === 'PATCHED' ? 'text-green-400' : 'text-pink-400'}>{s}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Fix the C++',
    text: 'Bugs come in four kinds: fill in the blank, click the broken line and rewrite it, put lines in order, or predict what the code prints.',
    art: (
      <pre className="rounded border-2 border-slate-600 bg-[#0b0a14] p-3 font-mono text-sm leading-7 text-slate-200">
{'while (curr != nullptr) {\n    cout << curr->name;\n    curr = '}<span className="rounded border-2 border-yellow-300 bg-yellow-300/20 px-2 text-yellow-300">curr-&gt;next</span>{';\n}'}
      </pre>
    ),
  },
  {
    title: 'Wrong answers glitch',
    text: 'A wrong fix makes the game glitch and explains what that exact mistake would break, so you can see why it\'s wrong. Right fixes repair that part of the game.',
    art: (
      <div className="w-72 space-y-2 font-mono text-sm">
        <p className="rounded border-2 border-pink-500 bg-pink-500/10 p-3 text-pink-300">✖ curr++ moves to the next memory address, not the next node. The bag fills with garbage.</p>
        <p className="rounded border-2 border-green-400 bg-green-400/10 p-3 text-green-300">✔ Patched! +100 XP</p>
      </div>
    ),
  },
  {
    title: 'Hints and XP',
    text: 'First-try fixes earn 100 XP, a little less for each miss. A hint costs 30 XP. After three misses you can ask to see the fix: the bug counts as patched, but with no XP.',
    art: (
      <div className="space-y-2 font-mono text-lg font-bold">
        <p className="text-yellow-300">XP 100 · first try</p>
        <p className="text-slate-300">💡 Hint · −30 XP</p>
        <p className="text-yellow-500">Show me the fix · after 3 misses</p>
      </div>
    ),
  },
  {
    title: 'Watch the class dashboard',
    text: 'This screen shows every knight\'s zone and progress live, plus the bugs the class misses most: good ones to go over at the board. End the game for a full report and Excel download.',
    art: (
      <div className="w-72 space-y-2 font-mono text-sm">
        {[['Ada', 80], ['Bit & Byte', 55], ['Rook', 30]].map(([n, w]) => (
          <div key={n} className="flex items-center gap-2"><span className="w-24 truncate">{n}</span><span className="h-2 flex-1 rounded bg-slate-700"><span className="block h-full rounded bg-green-400" style={{ width: `${w}%` }} /></span></div>
        ))}
        <p className="pt-2 text-pink-400">Most missed: The Stuck Bag (5)</p>
      </div>
    ),
  },
]

// The guide's own look (the 16-bit RPG: a chunky pixel menu box with pixel lettering). HowToPlay.jsx reads this; anything left out uses its plain dark look.
export const SKIN = {
  backdrop: 'bg-black/85',
  panel: 'pixel-box rounded-none bg-card text-ink',
  glow: false,
  label: 'font-pixel text-[10px] uppercase leading-relaxed text-info',
  skip: 'border-2 border-line px-3 py-1 font-pixel text-[10px] text-muted hover:bg-hover hover:text-ink',
  art: 'crt world-bg border-4 border-line',
  step: 'font-pixel text-[10px] text-gold',
  title: 'font-pixel text-lg leading-relaxed text-ok sm:text-2xl',
  text: 'text-lg leading-relaxed text-ink',
  footer: 'border-t-4 border-line',
  check: 'text-sm text-muted',
  back: 'border-2 border-line px-4 py-2 font-pixel text-[10px] text-ink hover:bg-hover',
  next: 'border-2 border-ink bg-ok px-5 py-2 font-pixel text-[10px] text-board shadow-[4px_4px_0_rgb(0_0_0/0.5)] hover:brightness-110',
  dotOff: '#3b3970',
  launcher: 'pixel-box bg-card px-4 py-2 font-pixel text-[10px] text-info hover:bg-hover',
}
