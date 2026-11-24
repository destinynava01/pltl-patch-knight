// A tiny C++ highlighter for the code panels (keywords, types, strings, numbers, comments)
const KEYWORDS = new Set(['if', 'else', 'while', 'for', 'return', 'new', 'delete', 'class', 'struct', 'public', 'private', 'protected', 'const', 'static', 'this', 'nullptr', 'NULL', 'true', 'false', 'break', 'continue', 'void', 'using', 'namespace', 'include'])
const TYPES = new Set(['int', 'double', 'float', 'char', 'bool', 'string', 'long', 'auto', 'Item', 'Knight', 'Potion', 'Slime', 'Shield', 'cout', 'endl', 'swap'])
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|(.)/g

export function Highlight({ text }) {
  const parts = []
  let k = 0
  for (const m of text.matchAll(TOKEN)) {
    const [all, com, str, num, word] = m
    let cls = ''
    if (com) cls = 'tok-com'
    else if (str) cls = 'tok-str'
    else if (num) cls = 'tok-num'
    else if (word && KEYWORDS.has(word)) cls = 'tok-kw'
    else if (word && TYPES.has(word)) cls = 'tok-type'
    parts.push(cls ? <span key={k++} className={cls}>{all}</span> : all)
  }
  return <>{parts}</>
}
