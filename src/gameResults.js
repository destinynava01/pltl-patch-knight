// The report as a spreadsheet: Bugs (how the class did on each, with the fix), Knights (each player's results),
// and Progress (each knight × bug). The Excel library loads only when someone downloads.
export async function downloadResults(report) {
  const XLSX = await import('xlsx')
  const book = XLSX.utils.book_new()
  const add = (name, rows, widths) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'Nothing to show.' }])
    sheet['!cols'] = widths.map((wch) => ({ wch }))
    XLSX.utils.book_append_sheet(book, sheet, name)
  }
  add('Bugs', report.bugs.map((b) => ({
    Zone: b.zone, Bug: b.title, Type: b.type, Tried: b.tried, Fixed: b.fixed, 'First try': b.first_try,
    'Fix shown': b.revealed, 'Wrong tries': b.wrong, 'Stuck at the end': b.stuck,
    'Most common wrong answers': b.common_wrong.map((w) => `${w.answer} (×${w.count})`).join(' | '),
    Fix: b.solution,
  })), [22, 28, 8, 7, 7, 9, 9, 11, 14, 60, 60])
  add('Knights', report.players.map((p) => ({
    Knight: p.name, 'Bugs fixed': p.fixed, 'First try': p.first_try, 'Fix shown': p.revealed, Hints: p.hints,
    'Wrong tries': p.wrong, 'Zones patched': p.zones_patched, XP: p.xp,
  })), [24, 11, 9, 9, 7, 11, 13, 7])
  add('Progress', report.players.map((p) => ({
    Knight: p.name,
    ...Object.fromEntries(report.bugs.map((b) => [b.title, p.by_bug[b.id] ?? ''])),
  })), [24, ...report.bugs.map(() => 16)])
  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(book, `Patch-Knight-results-${today}.xlsx`)
}
