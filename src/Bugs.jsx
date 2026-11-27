import { useCallback, useEffect, useState } from 'react'
import { callFunction } from './api'
import Code from './Code'
import { Highlight } from './cpp'
import { SITE_NAME, TYPE_LABEL, ZONES } from './config'
import { supabase } from './supabase'
import { Button, Panel, Pixel } from './ui'
import { useSession } from './useSession'

// Leader bugs. /submit: a leader writes a bug of their own (fill in a blank, fix a line, put lines in order, or
// predict the output) with a live preview in the real code panel, and sends it for review. /review: reviewers sign
// in with their @utrgv.edu email and approve, edit, reject or retire leader bugs, and can browse every built-in bug.
// Approved bugs join a game when the lobby's "Use leader bugs" is on.

const pkBugs = (payload, fallback = 'Could not reach the server.') => callFunction('pk-bugs', payload, fallback)
const review = (payload, fallback) => callFunction('review', { ...payload, game: 'jeopardy' }, fallback)
const field = 'w-full rounded-sm border-2 border-line bg-panel px-3 py-2 text-ink outline-none focus:border-info'
const mono = `${field} font-mono text-sm leading-6`
const labelText = 'mb-1 block text-sm font-bold'
const UTRGV_EMAIL = /^[^@\s]+@utrgv\.edu$/i

const blank = () => ({ zone: '', type: 'blank', title: '', story: '', prompt: '', code: '', code_after: '', order_lines: '', bug_line: '', answers: [''], hint: '', solution: '', fixed: '', wrong: '' })
const fromForm = (f) => ({ ...blank(), ...f, bug_line: f.bug_line ? String(f.bug_line) : '', answers: f.answers?.length ? f.answers : [''] })
const payloadOf = (d) => ({ ...d, bug_line: Number(d.bug_line) || 0, answers: d.answers.filter((a) => a.trim()) })

const TYPE_HELP = {
  blank: { code: 'The code, with ___ (three underscores) where the student types', answers: 'What goes in the blank', placeholder: 'int total = price ___ count;' },
  fix: { code: 'The code, with the bug in it', answers: 'The corrected line', placeholder: 'int total = price + count;' },
  order: { code: 'Code above the lines to put in order (optional)', answers: '', placeholder: 'int main() {' },
  output: { code: 'The code', answers: 'What it prints (exactly)', placeholder: 'cout << 7 / 2;' },
}

function Page({ title, children, wide = true }) {
  return (
    <main className="world-bg min-h-dvh px-4 py-8 text-ink">
      <div className={`mx-auto ${wide ? 'max-w-6xl' : 'max-w-md'}`}>
        <a href="/" className="text-sm font-bold text-info hover:underline">← Back to {SITE_NAME}</a>
        <header className="mb-6 mt-2 text-center">
          <Pixel className="text-muted">{SITE_NAME}</Pixel>
          <h1 className="mt-2 font-pixel text-2xl text-ok">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  )
}

// The form, with the live preview beside it
function BugForm({ draft, setDraft, children }) {
  const set = (patch) => setDraft({ ...draft, ...patch })
  const help = TYPE_HELP[draft.type]
  const codeLines = draft.code.split('\n')
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,30rem)]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className={labelText}>Zone (topic)</span>
            <select className={field} value={draft.zone} onChange={(e) => set({ zone: e.target.value })}>
              <option value="">Pick one…</option>
              {['CS1', 'CS2'].map((c) => (
                <optgroup key={c} label={c === 'CS1' ? 'CS1 review' : 'CS2'}>
                  {ZONES.filter((z) => z.course === c).map((z) => <option key={z.id} value={z.id}>{z.emoji} {z.topic} ({z.name})</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block"><span className={labelText}>Title</span>
            <input className={field} value={draft.title} maxLength={60} onChange={(e) => set({ title: e.target.value })} placeholder="The Greedy Shopkeeper" />
          </label>
        </div>
        <fieldset>
          <legend className={labelText}>Kind of bug</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(TYPE_LABEL).map(([id, name]) => (
              <button key={id} type="button" onClick={() => set({ type: id })}
                className={`rounded-sm border-2 px-2 py-2 text-sm font-bold ${draft.type === id ? 'border-ok bg-ok-soft text-ok' : 'border-line bg-panel hover:bg-hover'}`}>{name}</button>
            ))}
          </div>
        </fieldset>
        <label className="block"><span className={labelText}>What&apos;s broken in the game (the story)</span>
          <textarea className={field} rows={2} maxLength={300} value={draft.story} onChange={(e) => set({ story: e.target.value })} placeholder="Every item in the shop costs twice as much as it should." />
        </label>
        <label className="block"><span className={labelText}>Instructions <span className="font-normal text-muted">(optional: a default fits each kind)</span></span>
          <input className={field} maxLength={200} value={draft.prompt} onChange={(e) => set({ prompt: e.target.value })} />
        </label>
        <label className="block"><span className={labelText}>{help.code}</span>
          <textarea className={mono} rows={Math.min(14, Math.max(4, codeLines.length + 1))} value={draft.code} spellCheck={false} onChange={(e) => set({ code: e.target.value })} placeholder={help.placeholder} />
        </label>
        {draft.type === 'fix' && (
          <label className="block"><span className={labelText}>The broken line</span>
            <select className={field} value={draft.bug_line} onChange={(e) => set({ bug_line: e.target.value })}>
              <option value="">Pick the line…</option>
              {codeLines.map((l, i) => l.trim() && <option key={i} value={i + 1}>{i + 1}: {l.trim().slice(0, 60)}</option>)}
            </select>
          </label>
        )}
        {draft.type === 'order' && (
          <>
            <label className="block"><span className={labelText}>The lines to put in order, one per line, <b>in the right order</b> (the game shuffles them)</span>
              <textarea className={mono} rows={5} value={draft.order_lines} spellCheck={false} onChange={(e) => set({ order_lines: e.target.value })} placeholder={'Node* n = new Node;\nn->next = head;\nhead = n;'} />
            </label>
            <label className="block"><span className={labelText}>Code below them (optional)</span>
              <textarea className={mono} rows={3} value={draft.code_after} spellCheck={false} onChange={(e) => set({ code_after: e.target.value })} placeholder="}" />
            </label>
          </>
        )}
        {draft.type !== 'order' && (
          <div>
            <span className={labelText}>{help.answers} <span className="font-normal text-muted">(add other right versions too; spacing doesn&apos;t matter)</span></span>
            <div className="space-y-2">
              {draft.answers.map((a, i) => (
                <div key={i} className="flex gap-2">
                  {draft.type === 'output'
                    ? <textarea className={mono} rows={2} value={a} spellCheck={false} onChange={(e) => set({ answers: draft.answers.map((x, j) => (j === i ? e.target.value : x)) })} />
                    : <input className={`${mono} py-2`} value={a} spellCheck={false} onChange={(e) => set({ answers: draft.answers.map((x, j) => (j === i ? e.target.value : x)) })} />}
                  {draft.answers.length > 1 && <button type="button" onClick={() => set({ answers: draft.answers.filter((_, j) => j !== i) })} className="px-2 text-bad" aria-label="Remove">✕</button>}
                </div>
              ))}
            </div>
            {draft.answers.length < 5 && <button type="button" onClick={() => set({ answers: [...draft.answers, ''] })} className="mt-1 text-sm font-bold text-info hover:underline">+ Another right answer</button>}
          </div>
        )}
        <label className="block"><span className={labelText}>Hint <span className="font-normal text-muted">(optional)</span></span>
          <input className={field} maxLength={300} value={draft.hint} onChange={(e) => set({ hint: e.target.value })} placeholder="What does + do to a price? What should it do?" />
        </label>
        <label className="block"><span className={labelText}>The fix, explained (shown once it&apos;s fixed)</span>
          <textarea className={field} rows={2} maxLength={500} value={draft.solution} onChange={(e) => set({ solution: e.target.value })} placeholder="The total is price times count, so it needs * instead of +." />
        </label>
        <details className="text-sm">
          <summary className="cursor-pointer font-bold text-muted">More (optional): what the game says when it&apos;s fixed, or wrong</summary>
          <div className="mt-2 space-y-2">
            <input className={field} maxLength={200} value={draft.fixed} onChange={(e) => set({ fixed: e.target.value })} placeholder="Fixed! (default: the zone works again)" />
            <input className={field} maxLength={200} value={draft.wrong} onChange={(e) => set({ wrong: e.target.value })} placeholder="Wrong answer message (default: read the code again)" />
          </div>
        </details>
        {children}
      </div>
      <LivePreview draft={draft} />
    </div>
  )
}

// The bug as a student sees it, in the game's own code panel, with its answer and whether that answer checks
function LivePreview({ draft }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const payload = JSON.stringify(payloadOf(draft))
  useEffect(() => {
    const id = setTimeout(() => {
      pkBugs({ action: 'preview', bug: JSON.parse(payload) })
        .then((d) => { setData(d.preview ?? null); setError(d.error ?? '') })
        .catch((e) => { setData(null); setError(e.message) })
    }, 450)
    return () => clearTimeout(id)
  }, [payload])
  const zone = ZONES.find((z) => z.id === draft.zone)
  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <Pixel>👁 Preview</Pixel>
      <Panel className="mt-2 space-y-3">
        {!data && <p className="p-4 text-center text-sm text-muted">{error || 'Fill in the form: the bug shows here as students will see it.'}</p>}
        {data && (
          <>
            <p className="font-pixel text-[0.7rem] text-muted">{zone ? `${zone.emoji} ${zone.name}` : ''} · {TYPE_LABEL[data.bug.type]}</p>
            <h3 className="font-pixel text-sm text-gold">{data.bug.title}</h3>
            <p className="text-sm text-bad">{data.bug.story}</p>
            <p className="text-sm">{data.bug.prompt}</p>
            <Code key={payload} bug={data.bug} busy={false} done={false} onSubmit={() => {}} />
            <div className={`rounded-sm px-3 py-2 text-sm ${data.works ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}>
              <b>{data.works ? '✓ The answer checks.' : '✕ The answer doesn’t pass the check.'}</b>
              {data.bug_line !== null && <span> Broken line: {data.bug_line + 1}.</span>}
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{data.answer}</pre>
            </div>
            <p className="text-xs text-gold"><b>Hint:</b> {data.hint}</p>
            <p className="text-xs text-muted"><b>Once fixed:</b> {data.fixed} {data.solution}</p>
          </>
        )}
        {data && error && <p className="text-sm text-bad">{error}</p>}
      </Panel>
    </aside>
  )
}

// /submit: write a bug and send it for review
export default function BugSubmit() {
  const [draft, setDraft] = useState(blank)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [problem, setProblem] = useState('')
  async function send() {
    setBusy(true); setProblem(''); setMessage('')
    try {
      const d = await pkBugs({ action: 'submit', bug: payloadOf(draft), submitter_name: name })
      setMessage(d.message)
      setDraft(blank())
    } catch (e) { setProblem(e.message) } finally { setBusy(false) }
  }
  return (
    <Page title="Write a bug">
      <p className="mx-auto -mt-2 mb-6 max-w-2xl text-center text-muted">
        Break some C++ for students to fix. A reviewer approves it, and leaders can turn on &quot;Use leader bugs&quot; in the lobby to mix the approved
        ones in with the built-in bugs. <a href="/review" className="font-bold text-info hover:underline">Reviewers: approve bugs here.</a>
      </p>
      <Panel>
        <BugForm draft={draft} setDraft={setDraft}>
          <label className="block"><span className={labelText}>Your name</span>
            <input className={field} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
          <Button className="w-full" disabled={busy || !name.trim()} onClick={send}>{busy ? 'Sending…' : 'Send for review'}</Button>
          {message && <p className="rounded-sm bg-ok-soft px-3 py-2 font-bold text-ok">{message}</p>}
          {problem && <p className="rounded-sm bg-bad-soft px-3 py-2 font-bold text-bad">{problem}</p>}
        </BugForm>
      </Panel>
    </Page>
  )
}

// /review: reviewers sign in, then approve, edit, reject or retire leader bugs, or browse the built-in ones
export function BugReviewPage() {
  const session = useSession()
  if (session === undefined) return <Page title="Bug review" wide={false}><p className="text-center text-muted">Checking…</p></Page>
  return session ? <ReviewList email={session.user.email} /> : <SignIn />
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function sendLink(event) {
    event.preventDefault()
    setError('')
    const clean = email.trim().toLowerCase()
    if (!UTRGV_EMAIL.test(clean)) return setError('Use your @utrgv.edu email address.')
    setBusy(true)
    try {
      const access = await callFunction('review-access', { email: clean }, 'Could not check your reviewer access.')
      if (!access.authorized) { setBusy(false); return setError('This email is not authorized to review. Ask the supervisor to add it.') }
    } catch (e) { setBusy(false); return setError(e.message) }
    const { error: sendError } = await supabase.auth.signInWithOtp({ email: clean, options: { emailRedirectTo: `${window.location.origin}/review` } })
    setBusy(false)
    if (sendError) return setError(sendError.message)
    setEmail(clean)
    setSent(true)
  }
  async function verifyCode(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setBusy(false)
    if (verifyError) setError(verifyError.message)
  }
  return (
    <Page title="Bug review" wide={false}>
      <Panel>
        {!sent ? (
          <form onSubmit={sendLink} className="space-y-4">
            <p className="text-center text-muted">Reviewers sign in with their UTRGV email (the same reviewers as the question review). We&apos;ll email a sign-in link, so there&apos;s no password.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@utrgv.edu" aria-label="Your UTRGV email" required className={field} />
            <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Checking…' : 'Email me a sign-in link'}</Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-center">Check <b className="text-info">{email}</b> and click the sign-in link.</p>
            <p className="text-center text-sm text-muted">Opened it on another device? Enter the code from the email instead:</p>
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="123456" aria-label="The code from the email" className={`${field} text-center tracking-[0.4em]`} />
            <Button type="submit" className="w-full" disabled={busy || code.trim().length < 6}>{busy ? 'Checking…' : 'Sign in with the code'}</Button>
          </form>
        )}
        {error && <p className="mt-3 rounded-sm bg-bad-soft px-3 py-2 text-sm font-bold text-bad">{error}</p>}
      </Panel>
    </Page>
  )
}

const tab = (on) => `rounded-sm px-3 py-1 text-sm font-bold ${on ? 'bg-ok text-black' : 'bg-panel hover:bg-hover'}`

function ReviewList({ email }) {
  const [status, setStatus] = useState('pending')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const done = useCallback(() => setReload((n) => n + 1), [])
  useEffect(() => {
    if (status === 'builtin') return
    review({ action: 'list_pk_bugs', status }, 'Could not load bugs.').then((d) => { setRows(d.bugs); setError('') }).catch((e) => setError(e.message))
  }, [status, reload])
  return (
    <Page title="Bug review">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {['pending', 'approved', 'rejected', 'retired'].map((st) => <button key={st} type="button" onClick={() => setStatus(st)} className={`${tab(status === st)} capitalize`}>{st}</button>)}
          <button type="button" onClick={() => setStatus('builtin')} className={tab(status === 'builtin')}>⚙️ Built in</button>
        </div>
        <p className="text-sm text-muted">{email} · <button type="button" onClick={() => supabase.auth.signOut()} className="font-bold text-info">Sign out</button> · <a href="/submit" className="font-bold text-info">Write one</a></p>
      </div>
      {status === 'builtin' ? <BuiltIn /> : (
        <>
          {error && <p className="rounded-sm bg-bad-soft px-3 py-2 text-bad">{error}</p>}
          {!rows && !error && <p className="text-muted">Loading…</p>}
          {rows?.length === 0 && <Panel><p className="text-muted">Nothing {status} right now.</p></Panel>}
          <div className="space-y-4">{rows?.map((row) => <BugCard key={row.id} row={row} onDone={done} />)}</div>
        </>
      )}
    </Page>
  )
}

function BugCard({ row, onDone }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => fromForm(row.form))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const zone = ZONES.find((z) => z.id === row.zone)
  const p = row.preview
  async function act(payload, fallback) {
    setBusy(true)
    setError('')
    try { await review({ ...payload, bug_id: row.id }, fallback); setEditing(false); onDone() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Panel className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold">{zone?.emoji} {row.form.title} <span className="ml-1 rounded-sm bg-info-soft px-2 py-0.5 text-xs font-bold text-info">{TYPE_LABEL[row.type]} · {zone?.topic}</span></p>
        <span className="text-xs text-muted">By {row.submitter_name} · {new Date(row.created_at).toLocaleDateString()}</span>
      </div>
      {editing ? (
        <BugForm draft={draft} setDraft={setDraft}>
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => act({ action: 'edit_pk_bug', bug: payloadOf(draft) }, 'Could not save.')}>Save</Button>
            <Button variant="outline" onClick={() => { setEditing(false); setDraft(fromForm(row.form)) }}>Cancel</Button>
          </div>
        </BugForm>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,30rem)]">
          <div className="space-y-2 text-sm">
            <p className="text-bad">{p.bug.story}</p>
            <p>{p.bug.prompt}</p>
            <div className={`rounded-sm px-3 py-2 ${p.works ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}>
              <b>Answer{p.works ? '' : ' (doesn’t pass the check!)'}:</b>{p.bug_line !== null && ` line ${p.bug_line + 1} becomes`}
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{p.answer}</pre>
            </div>
            <p className="text-gold"><b>Hint:</b> {p.hint}</p>
            <p className="text-muted"><b>Once fixed:</b> {p.solution}</p>
            {row.review_note && <p className="text-xs text-muted">Review note: {row.review_note}</p>}
          </div>
          <Code bug={p.bug} busy={false} done={false} onSubmit={() => {}} />
        </div>
      )}
      {!editing && (
        <div className="flex flex-wrap items-center gap-2">
          {row.status !== 'approved' && <Button className="!px-4 !py-2" disabled={busy} onClick={() => act({ action: 'approve_pk_bug' }, 'Could not approve.')}>✓ Approve</Button>}
          <Button variant="outline" className="!px-4 !py-2" disabled={busy} onClick={() => setEditing(true)}>Edit</Button>
          {row.status === 'pending' && <Button variant="danger" className="!px-4 !py-2" disabled={busy} onClick={() => act({ action: 'reject_pk_bug', note }, 'Could not reject.')}>Reject</Button>}
          {row.status === 'approved' && <Button variant="outline" className="!px-4 !py-2" disabled={busy} onClick={() => act({ action: 'retire_pk_bug', note }, 'Could not retire.')}>Retire</Button>}
          <input className={`${field} min-w-0 flex-1 text-sm`} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Note to the leader (optional)" />
        </div>
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
    </Panel>
  )
}

// Every built-in bug, zone by zone, with its answer: what the game already has (nothing here needs approving)
function BuiltIn() {
  const [zones, setZones] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState('')
  useEffect(() => { review({ action: 'pk_builtin' }, 'Could not load the built-in bugs.').then((d) => setZones(d.zones)).catch((e) => setError(e.message)) }, [])
  if (error) return <p className="rounded-sm bg-bad-soft px-3 py-2 text-bad">{error}</p>
  if (!zones) return <p className="text-muted">Loading…</p>
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">The {zones.reduce((n, z) => n + z.bugs.length, 0)} bugs {SITE_NAME} already has, {zones[0]?.bugs.length ?? 20} per zone. Each student gets a random few from every zone the leader picks. Spot something wrong? Use &quot;Report a problem&quot; in a game.</p>
      {zones.map((z) => (
        <Panel key={z.id} className="!p-0">
          <button type="button" onClick={() => setOpen(open === z.id ? '' : z.id)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
            <span className="font-bold">{z.emoji} {z.name} <span className="font-normal text-muted">· {z.topic} · {z.course}</span></span>
            <span className="text-sm text-muted">{z.bugs.length} bugs {open === z.id ? '▲' : '▼'}</span>
          </button>
          {open === z.id && (
            <div className="grid gap-3 border-t-2 border-line p-4 md:grid-cols-2">
              {z.bugs.map((b) => (
                <article key={b.id} className="space-y-2 rounded-sm bg-panel p-3 text-sm">
                  <p className="font-bold">{b.title} <span className="ml-1 text-xs font-normal text-info">{TYPE_LABEL[b.type]}</span></p>
                  <p className="text-bad">{b.story}</p>
                  <pre className="overflow-x-auto rounded-sm bg-code p-2 font-mono text-xs leading-5">
                    {b.code.map((line, i) => (
                      <div key={i} className={b.bug_line === i ? 'bg-bad-soft' : ''}>
                        {b.type === 'order' && i === b.slotAt && <div className="text-ok">{b.lines.map((l, j) => <div key={j}>{l} <span className="text-muted">← {j + 1}</span></div>)}</div>}
                        <Highlight text={line} />
                      </div>
                    ))}
                    {b.type === 'order' && b.slotAt >= b.code.length && <div className="text-ok">{b.lines.map((l, j) => <div key={j}>{l} <span className="text-muted">← {j + 1}</span></div>)}</div>}
                  </pre>
                  {b.answers && <p className="text-ok"><b>{b.type === 'fix' ? `Line ${b.bug_line + 1} becomes:` : b.type === 'output' ? 'Prints:' : 'Blank:'}</b> <span className="whitespace-pre-wrap font-mono text-xs">{b.answers.join('  ·  ')}</span></p>}
                  <p className="text-xs text-gold"><b>Hint:</b> {b.hint}</p>
                  <p className="text-xs text-muted">{b.solution}</p>
                </article>
              ))}
            </div>
          )}
        </Panel>
      ))}
    </div>
  )
}
