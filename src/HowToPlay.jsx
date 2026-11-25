import { useEffect, useState } from 'react'

// A visual "How to play" guide for the projector, with picture mock-ups of what students will see. Leaders can
// skip it, turn it off on this computer, or reopen it with the "? How to play" button. The same file is in every
// PLTL game site; each game passes its own slides and color.
//   site:   a short id for this game ("bakery"), for remembering "don't show again"
//   gameId: the current game, so the guide opens by itself once per game
//   slides: [{ title, text, art }]  (art is JSX)
// Two ways to use it:
//   - On the game screen (default): opens once when the game starts, then stays a "? How to play" button.
//     autoOpen={false} makes it only the button (for games with a running clock), and `note` is shown under the
//     slides (e.g. "The clock keeps running").
//   - Before the game starts: pass `open` and `onClose` (the lobby shows it when Start is pressed and starts the
//     game when it closes, so no clock runs while the class watches).
export default function HowToPlay({ site, gameId, name, accent = '#38bdf8', slides, open: openProp, onClose, autoOpen = true, note = '' }) {
  const skipKey = `pltlHowToSkip:${site}`
  const seenKey = `pltlHowToSeen:${site}:${gameId}`
  const controlled = openProp !== undefined
  const [openState, setOpenState] = useState(() => {
    if (controlled || !autoOpen) return false
    try {
      return !localStorage.getItem(skipKey) && !sessionStorage.getItem(seenKey)
    } catch {
      return true
    }
  })
  const open = controlled ? openProp : openState
  const [step, setStep] = useState(0)
  const [neverAgain, setNeverAgain] = useState(false)

  function close() {
    try {
      sessionStorage.setItem(seenKey, '1')
      if (neverAgain) localStorage.setItem(skipKey, '1')
    } catch {
      // storage blocked: the guide just shows again next time
    }
    setStep(0)
    if (controlled) onClose?.()
    else setOpenState(false)
  }

  const last = step === slides.length - 1
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') setStep((s) => Math.min(slides.length - 1, s + 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) {
    if (controlled) return null
    return (
      <button type="button" onClick={() => setOpenState(true)}
        className="fixed bottom-4 left-4 z-40 rounded-full border border-white/20 bg-slate-900/90 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-slate-800">
        ? How to play
      </button>
    )
  }

  const slide = slides[step]
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={`How to play ${name}`}>
      <section className="my-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl" style={{ boxShadow: `0 0 0 3px ${accent}55, 0 30px 80px rgb(0 0 0 / 0.6)` }}>
        <div className="flex items-center justify-between gap-3 px-6 pt-5">
          <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>How to play · {name}</p>
          <button type="button" onClick={close} className="rounded-full px-3 py-1 text-sm font-bold text-slate-300 hover:bg-white/10">{controlled ? 'Skip and start ✕' : 'Skip ✕'}</button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="flex min-h-[16rem] items-center justify-center rounded-2xl bg-slate-800/80 p-5" key={step}>
            {slide.art}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400">Step {step + 1} of {slides.length}</p>
            <h2 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">{slide.title}</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-200">{slide.text}</p>
          </div>
        </div>
        {note && <p className="px-6 pb-3 text-sm font-bold" style={{ color: accent }}>{note}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={neverAgain} onChange={(e) => setNeverAgain(e.target.checked)} className="h-4 w-4" />
            Don&apos;t show this again on this computer
          </label>
          <div className="flex items-center gap-2">
            <span className="mr-2 flex gap-1.5" aria-hidden="true">
              {slides.map((_, i) => <span key={i} className="h-2 w-2 rounded-full" style={{ background: i === step ? accent : '#475569' }} />)}
            </span>
            <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl px-4 py-2 font-bold text-slate-200 hover:bg-white/10 disabled:opacity-30">◀ Back</button>
            <button type="button" onClick={() => (last ? close() : setStep(step + 1))} className="rounded-xl px-5 py-2 font-black text-slate-950 hover:brightness-110" style={{ background: accent }}>
              {last ? (controlled ? 'Start the game ▶' : "Let's play! ▶") : 'Next ▶'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
