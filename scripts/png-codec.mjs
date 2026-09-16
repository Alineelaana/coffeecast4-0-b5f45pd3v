import fs from 'node:fs'
import zlib from 'node:zlib'

// Simple PNG parser and encoder
function decodePNG(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(4) !== 0x0d0a1a0a) {
    throw new Error('Not a valid PNG')
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idatChunks = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data.readUInt8(8)
      colorType = data.readUInt8(9)
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }
  }

  const compressedData = Buffer.concat(idatChunks)
  const decompressed = zlib.inflateSync(compressedData)

  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 4
  const stride = width * bytesPerPixel
  const rawRgba = Buffer.alloc(width * height * 4)

  let srcOffset = 0
  const prevLine = Buffer.alloc(stride)
  const currLine = Buffer.alloc(stride)

  function paeth(a, b, c) {
    const p = a + b - c
    const pa = Math.abs(p - a)
    const pb = Math.abs(p - b)
    const pc = Math.abs(p - c)
    if (pa <= pb && pa <= pc) return a
    if (pb <= pc) return b
    return c
  }

  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcOffset++]
    for (let i = 0; i < stride; i++) {
      const raw = decompressed[srcOffset++]
      const left = i >= bytesPerPixel ? currLine[i - bytesPerPixel] : 0
      const up = prevLine[i]
      const upLeft = i >= bytesPerPixel ? prevLine[i - bytesPerPixel] : 0

      let val = 0
      if (filter === 0) val = raw
      else if (filter === 1) val = (raw + left) & 0xff
      else if (filter === 2) val = (raw + up) & 0xff
      else if (filter === 3) val = (raw + Math.floor((left + up) / 2)) & 0xff
      else if (filter === 4) val = (raw + paeth(left, up, upLeft)) & 0xff

      currLine[i] = val
    }

    currLine.copy(prevLine)

    // Convert to RGBA
    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4
      const srcIdx = x * bytesPerPixel
      if (colorType === 6) {
        rawRgba[dstIdx] = currLine[srcIdx]
        rawRgba[dstIdx + 1] = currLine[srcIdx + 1]
        rawRgba[dstIdx + 2] = currLine[srcIdx + 2]
        rawRgba[dstIdx + 3] = currLine[srcIdx + 3]
      } else if (colorType === 2) {
        rawRgba[dstIdx] = currLine[srcIdx]
        rawRgba[dstIdx + 1] = currLine[srcIdx + 1]
        rawRgba[dstIdx + 2] = currLine[srcIdx + 2]
        rawRgba[dstIdx + 3] = 255
      }
    }
  }

  return { width, height, data: rawRgba }
}

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1)
    else c >>>= 1
  }
  crcTable[n] = c
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const len = data.length
  const chunk = Buffer.alloc(12 + len)
  chunk.writeUInt32BE(len, 0)
  chunk.write(type, 4, 4, 'ascii')
  data.copy(chunk, 8)
  const toCrc = chunk.subarray(4, 8 + len)
  chunk.writeUInt32BE(crc32(toCrc), 8 + len)
  return chunk
}

function encodePNG(width, height, rgbaData) {
  // We'll use filter type 0 (None)
  const lineSize = 1 + width * 4
  const rawData = Buffer.alloc(lineSize * height)

  for (let y = 0; y < height; y++) {
    rawData[y * lineSize] = 0 // filter type 0
    const srcStart = y * width * 4
    const srcEnd = srcStart + width * 4
    rgbaData.copy(rawData, y * lineSize + 1, srcStart, srcEnd)
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 })

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // RGBA
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace

  const ihdr = makeChunk('IHDR', ihdrData)
  const idat = makeChunk('IDAT', compressed)
  const iend = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([header, ihdr, idat, iend])
}

export { decodePNG, encodePNG }
