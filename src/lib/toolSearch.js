import { SEARCH_INDEX, TASKS } from '@/config/catalog'
import { SYNONYMS } from '@/config/synonyms'

const STOP = new Set(['a', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'en', 'para', 'con', 'mi', 'mis', 'y', 'o', 'que', 'quiero', 'como', 'al', 'to', 'the', 'hacer', 'necesito'])

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9#+.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const words = (text) => normalize(text).split(' ').filter(Boolean)

const prepared = new WeakMap()
function prepare(entry) {
  let p = prepared.get(entry)
  if (!p) {
    p = {
      name: words(entry.name),
      keywords: entry.keywords.flatMap(words),
      task: words(entry.task)
    }
    prepared.set(entry, p)
  }
  return p
}

function scoreTerm(alts, p) {
  let best = 0
  for (const t of alts) {
    for (const w of p.name) {
      if (w === t) best = Math.max(best, 10)
      else if (w.startsWith(t)) best = Math.max(best, 7)
    }
    for (const w of p.keywords) {
      if (w === t) best = Math.max(best, 8)
      else if (w.startsWith(t)) best = Math.max(best, 5)
    }
    if (t.length >= 3) {
      for (const w of p.task) if (w.startsWith(t)) best = Math.max(best, 2)
    }
  }
  return best
}

export function searchTools(query, index = SEARCH_INDEX, { limit = 50 } = {}) {
  const terms = words(query).filter(t => !STOP.has(t))
  if (!terms.length) {
    return TASKS.filter(t => t.featured).map(entry => ({ entry, score: 0 })).slice(0, limit)
  }
  const expanded = terms.map(t => [t, ...(SYNONYMS[t] || [])])
  const results = []
  for (const entry of index) {
    const p = prepare(entry)
    let total = 0
    let ok = true
    for (const alts of expanded) {
      const s = scoreTerm(alts, p)
      if (!s) { ok = false; break }
      total += s
    }
    if (ok) results.push({ entry, score: total + (entry.featured ? 3 : 0) + (entry.bench === false ? -2 : 0) })
  }
  return results
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name, 'es'))
    .slice(0, limit)
}
