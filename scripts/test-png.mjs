import fs from 'node:fs'
import { decodePNG, encodePNG } from './png-codec.mjs'

// Analyze input image
const inputPath = 'src/assets/captura-de-tela-2026-09-16-as-18.32.11-c0470.png'
const buf = fs.readFileSync(inputPath)
const img = decodePNG(buf)
console.log(`Loaded image: ${img.width}x${img.height}`)

// Sample colors in corners (background)
const corners = [
  [0, 0],
  [img.width - 1, 0],
  [0, img.height - 1],
  [img.width - 1, img.height - 1],
  [Math.floor(img.width / 2), 2],
  [2, Math.floor(img.height / 2)],
  [img.width - 3, Math.floor(img.height / 2)],
]

const cornerColors = corners.map(([x, y]) => {
  const idx = (y * img.width + x) * 4
  return { x, y, r: img.data[idx], g: img.data[idx + 1], b: img.data[idx + 2] }
})

fs.writeFileSync(
  'scripts/analysis.json',
  JSON.stringify(
    {
      width: img.width,
      height: img.height,
      corners: cornerColors,
    },
    null,
    2,
  ),
)
console.log('Sampled corners:', cornerColors)
