import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/cheatsheets')
const meta = readdirSync(dir)
  .filter(f => f.endsWith('.json') && f !== 'meta.json')
  .map(f => {
    const data = JSON.parse(readFileSync(resolve(dir, f), 'utf8'))
    return { id: basename(f, '.json'), title: data.title || basename(f, '.json'), description: data.description || '' }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

writeFileSync(resolve(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')
console.log(`cheatsheet meta: ${meta.length} entradas`)
