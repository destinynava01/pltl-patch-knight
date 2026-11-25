import { useState } from 'react'
import { Highlight } from './cpp'
import { Button } from './ui'

const gutter = 'w-8 shrink-0 select-none pr-3 text-right text-muted/60'
const codeInput = 'min-w-0 rounded-sm border-2 border-gold bg-gold-soft px-2 py-0.5 font-mono text-gold outline-none focus:border-ok'

// The code panel for one bug. Each puzzle type has its own way of answering; onSubmit(answer, line) sends it.
// `done` shows the code read-only (the solution is shown by the parent).
export default function Code({ bug, busy, done, onSubmit }) {
  if (bug.type === 'blank') return <Blank bug={bug} busy={busy} done={done} onSubmit={onSubmit} />
  if (bug.type === 'fix') return <Fix bug={bug} busy={busy} done={done} onSubmit={onSubmit} />
  if (bug.type === 'order') return <Order bug={bug} busy={busy} done={done} onSubmit={onSubmit} />
  return <Output bug={bug} busy={busy} done={done} onSubmit={onSubmit} />
}

function Frame({ children }) {
  return <pre className="crt overflow-x-auto rounded-sm border-2 border-line bg-code py-3 font-mono text-sm leading-7">{children}</pre>
}

function Line({ n, children, className = '', onClick, selected }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick}
      className={`flex w-full min-w-max items-center pr-4 text-left ${onClick ? 'hover:bg-hover' : ''} ${selected ? 'bg-bad-soft' : ''} ${className}`}>
      <span className={gutter}>{n}</span>
      <span className="whitespace-pre">{children}</span>
    </Tag>
  )
}

// ---- Fill in the blank: the ___ becomes an input inside the line ----
function Blank({ bug, busy, done, onSubmit }) {
  const [value, setValue] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSubmit(value) }}>
      <Frame>
        {bug.code.map((text, i) => {
          if (!text.includes('___')) return <Line key={i} n={i + 1}><Highlight text={text} /></Line>
          const [before, after] = text.split('___')
          return (
            <Line key={i} n={i + 1}>
              <Highlight text={before} />
              <input className={`${codeInput} w-44`} value={value} onChange={(e) => setValue(e.target.value)} disabled={done || busy}
                placeholder="your code" aria-label="Fill in the blank" autoComplete="off" autoCapitalize="none" spellCheck={false} />
              <Highlight text={after} />
            </Line>
          )
        })}
      </Frame>
      {!done && <Button className="mt-3 w-full" disabled={busy || !value.trim()}>{busy ? 'Compiling…' : '▶ Run the patch'}</Button>}
    </form>
  )
}

// ---- Find & fix: click the broken line, then rewrite it ----
function Fix({ bug, busy, done, onSubmit }) {
  const [line, setLine] = useState(null)
  const [value, setValue] = useState('')
  const pick = (i) => {
    if (done) return
    setLine(i)
    setValue(bug.code[i].trim())
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (line !== null) onSubmit(value, line) }}>
      <Frame>
        {bug.code.map((text, i) => (
          line === i ? (
            <Line key={i} n={i + 1} selected>
              <span className="whitespace-pre">{text.match(/^\s*/)[0]}</span>
              <input className={`${codeInput} w-[min(32rem,70vw)]`} value={value} onChange={(e) => setValue(e.target.value)} disabled={busy}
                aria-label={`Fixed line ${i + 1}`} autoFocus autoComplete="off" autoCapitalize="none" spellCheck={false} />
            </Line>
          ) : (
            <Line key={i} n={i + 1} onClick={done ? undefined : () => pick(i)}><Highlight text={text} /></Line>
          )
        ))}
      </Frame>
      {!done && (
        <>
          <p className="mt-2 text-sm text-muted">{line === null ? '👆 Click the line that causes the glitch.' : `Editing line ${line + 1}. Click another line to switch.`}</p>
          <Button className="mt-2 w-full" disabled={busy || line === null || !value.trim()}>{busy ? 'Compiling…' : '▶ Run the patch'}</Button>
        </>
      )}
    </form>
  )
}

// ---- Put in order: move lines up and down inside the slot ----
function Order({ bug, busy, done, onSubmit }) {
  const [lines, setLines] = useState(bug.lines)
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= lines.length) return
    const next = [...lines];
    [next[i], next[j]] = [next[j], next[i]]
    setLines(next)
  }
  const before = bug.code.slice(0, bug.slotAt)
  const after = bug.code.slice(bug.slotAt)
  let n = 0
  return (
    <div>
      <Frame>
        {before.map((text, i) => <Line key={`b${i}`} n={++n}><Highlight text={text} /></Line>)}
        <div className="my-1 border-y-2 border-dashed border-gold/50 bg-gold-soft/30 py-1">
          {lines.map((l, i) => (
            <div key={l.id} className="flex min-w-max items-center pr-2">
              <span className={gutter}>{++n}</span>
              <span className="flex-1 whitespace-pre"><Highlight text={l.text} /></span>
              {!done && (
                <span className="ml-3 flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || busy} aria-label={`Move line ${n} up`} className="rounded-sm border border-line px-2 font-pixel text-xs hover:bg-hover disabled:opacity-30">▲</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === lines.length - 1 || busy} aria-label={`Move line ${n} down`} className="rounded-sm border border-line px-2 font-pixel text-xs hover:bg-hover disabled:opacity-30">▼</button>
                </span>
              )}
            </div>
          ))}
        </div>
        {after.map((text, i) => <Line key={`a${i}`} n={++n}><Highlight text={text} /></Line>)}
      </Frame>
      {!done && <Button className="mt-3 w-full" disabled={busy} onClick={() => onSubmit(lines.map((l) => l.id))}>{busy ? 'Compiling…' : '▶ Run the patch'}</Button>}
    </div>
  )
}

// ---- Predict the output ----
function Output({ bug, busy, done, onSubmit }) {
  const [value, setValue] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSubmit(value) }}>
      <Frame>{bug.code.map((text, i) => <Line key={i} n={i + 1}><Highlight text={text} /></Line>)}</Frame>
      {!done && (
        <>
          <label className="mt-3 block font-pixel text-xs uppercase tracking-wider text-info" htmlFor="output">Console output</label>
          <input id="output" className="mt-1 w-full rounded-sm border-2 border-line bg-code px-3 py-2 font-mono text-ok outline-none focus:border-ok"
            value={value} onChange={(e) => setValue(e.target.value)} placeholder="> what prints?" autoComplete="off" autoCapitalize="none" spellCheck={false} />
          <Button className="mt-3 w-full" disabled={busy || !value.trim()}>{busy ? 'Running…' : '▶ Check output'}</Button>
        </>
      )}
    </form>
  )
}
