import { TASKS } from '@/config/catalog'

export function fileExtension(name) {
  const n = String(name || '').toLowerCase()
  const i = n.lastIndexOf('.')
  return i > 0 ? n.slice(i) : ''
}

function accepts(rule, ext, type) {
  if (rule.startsWith('.')) return rule === ext
  if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
  return rule === type
}

export function matchFile(file, index = TASKS) {
  const ext = fileExtension(file?.name)
  const type = String(file?.type || '').toLowerCase()
  return index
    .filter(e => (e.accepts || []).some(rule => accepts(rule, ext, type)))
    .sort((a, b) => Number(!!b.launch) - Number(!!a.launch))
}
