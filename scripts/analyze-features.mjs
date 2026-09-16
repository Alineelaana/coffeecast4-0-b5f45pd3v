import fs from 'node:fs'
import { decodePNG, encodePNG } from './png-codec.mjs'

const inputPath = 'src/assets/captura-de-tela-2026-09-16-as-18.32.11-c0470.png'
const buf = fs.readFileSync(inputPath)
const img = decodePNG(buf)
const { width, height, data } = img

// Let's sample a grid across the image:
// We want to see the color distribution, especially at bottom, sides, etc.
// In the attachment, the wordmark "Coffeeecast 4.0" is at the bottom, and below it there's a small audio wave icon.
// Let's check what's at the bottom:
const bottomRow = []
for (let y = height - 30; y < height; y += 5) {
  let sample = []
  for (let x = 0; x < width; x += 40) {
    const idx = (y * width + x) * 4
    sample.push(`(${img.data[idx]},${img.data[idx+1]},${img.data[idx+2]})`)
  }
  bottomRow.push({ y, sample: sample.join(' ') })
}

fs.writeFileSync('scripts/grid-analysis.json', JSON.stringify({ bottomRow }, null, 2))
