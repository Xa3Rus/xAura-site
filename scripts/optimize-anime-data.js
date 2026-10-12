import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.resolve(__dirname, '../public/data/anime.json')

console.log('Reading anime.json...')
const raw = fs.readFileSync(filePath, 'utf8')
const initialSize = Buffer.byteLength(raw, 'utf8')
const data = JSON.parse(raw)

let strippedCount = 0
for (const item of data) {
  if (item.image && typeof item.image === 'object') {
    const original = item.image.original || ''
    item.image = { original }
    strippedCount++
  }
}

console.log(`Stripped redundant image fields from ${strippedCount} items.`)
const minified = JSON.stringify(data)
fs.writeFileSync(filePath, minified, 'utf8')
const finalSize = Buffer.byteLength(minified, 'utf8')

console.log(`Initial size: ${(initialSize / 1024 / 1024).toFixed(2)} MB`)
console.log(`Final size: ${(finalSize / 1024 / 1024).toFixed(2)} MB`)
console.log(`Saved: ${((initialSize - finalSize) / 1024 / 1024).toFixed(2)} MB (${Math.round((1 - finalSize / initialSize) * 100)}% reduction)`)
