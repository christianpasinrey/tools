// Operaciones de edición Markdown puras: (texto, selección) → { text, sel }.
// Las comparten el editor de escritorio y el móvil.

const lineStartOf = (text, offset) => text.lastIndexOf('\n', offset - 1) + 1
const lineEndOf = (text, offset) => {
  const i = text.indexOf('\n', offset)
  return i === -1 ? text.length : i
}

export function wrapSelection(text, sel, before, after = '', placeholder = '') {
  const selected = text.slice(sel.start, sel.end)
  const inner = selected || placeholder
  const out = text.slice(0, sel.start) + before + inner + after + text.slice(sel.end)
  if (!selected) {
    const start = sel.start + before.length
    return { text: out, sel: { start, end: start + inner.length } }
  }
  const pos = sel.start + before.length + inner.length + after.length
  return { text: out, sel: { start: pos, end: pos } }
}

// Aplica fn a las líneas tocadas por la selección (sin contar un salto final seleccionado)
function mapLines(text, sel, fn) {
  const lastChar = sel.end > sel.start && text[sel.end - 1] === '\n' ? sel.end - 1 : sel.end
  const from = lineStartOf(text, sel.start)
  const to = lineEndOf(text, Math.max(sel.start, lastChar))
  const block = fn(text.slice(from, to).split('\n')).join('\n')
  return { text: text.slice(0, from) + block + text.slice(to), from, to: from + block.length, delta: block.length - (to - from) }
}

export function toggleLinePrefix(text, sel, prefix) {
  let shift = 0
  const r = mapLines(text, sel, (lines) => {
    const all = lines.every(l => l.startsWith(prefix))
    shift = all ? -prefix.length : prefix.length
    return lines.map(l => (all ? l.slice(prefix.length) : prefix + l))
  })
  const start = Math.max(r.from, sel.start + shift)
  const end = sel.end === sel.start ? start : Math.max(start, sel.end + r.delta)
  return { text: r.text, sel: { start, end } }
}

export function setHeading(text, sel, level) {
  const from = lineStartOf(text, sel.start)
  const to = lineEndOf(text, sel.start)
  const line = text.slice(from, to)
  const m = line.match(/^(#{1,6})\s+/)
  const current = m ? m[1].length : 0
  const body = m ? line.slice(m[0].length) : line
  const next = current === level ? body : `${'#'.repeat(level)} ${body}`
  const pos = from + next.length
  return { text: text.slice(0, from) + next + text.slice(to), sel: { start: pos, end: pos } }
}

export function insertBlock(text, sel, block) {
  const before = text.slice(0, sel.start)
  const after = text.slice(sel.end)
  const lead = before === '' ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  const trail = after === '' ? '\n' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
  const pos = before.length + lead.length + block.length
  return { text: before + lead + block + trail + after, sel: { start: pos, end: pos } }
}

export function indentLines(text, sel, outdent = false) {
  const multi = text.slice(sel.start, sel.end).includes('\n')
  if (!multi && !outdent) {
    const pos = sel.start + 2
    return { text: text.slice(0, sel.start) + '  ' + text.slice(sel.end), sel: { start: pos, end: pos } }
  }
  const r = mapLines(text, sel, (lines) => lines.map(l => (outdent ? l.replace(/^ {1,2}/, '') : '  ' + l)))
  return { text: r.text, sel: { start: r.from, end: r.to } }
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function findMatches(text, query) {
  if (!query) return []
  const re = new RegExp(escapeRegex(query), 'gi')
  const out = []
  let m
  while ((m = re.exec(text)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length })
    if (m[0].length === 0) re.lastIndex++
  }
  return out
}

export const replaceAt = (text, match, replacement) => text.slice(0, match.start) + replacement + text.slice(match.end)

export function replaceAll(text, query, replacement) {
  if (!query) return { text, count: 0 }
  let count = 0
  const out = text.replace(new RegExp(escapeRegex(query), 'gi'), () => { count++; return replacement })
  return { text: out, count }
}

export function extractOutline(text) {
  const out = []
  let inFence = false
  text.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return }
    if (inFence) return
    const m = line.match(/^(#{1,6})\s+(.+)$/)
    if (m) out.push({ level: m[1].length, text: m[2].replace(/[*_`]/g, '').trim(), line: i })
  })
  return out
}

export function computeStats(text) {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  return { words, chars: text.length, lines: text.split('\n').length, readTime: words ? Math.max(1, Math.ceil(words / 200)) : 0 }
}

export function offsetOfLine(text, line) {
  const lines = text.split('\n')
  let pos = 0
  for (let i = 0; i < line && i < lines.length; i++) pos += lines[i].length + 1
  return pos
}

export function cursorPosition(text, offset) {
  const before = text.slice(0, offset).split('\n')
  return { line: before.length, col: before[before.length - 1].length + 1 }
}
