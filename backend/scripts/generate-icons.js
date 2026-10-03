const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table & implementation for valid PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function generatePng(size) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData.writeUInt8(8, 8);      // bit depth 8
  ihdrData.writeUInt8(6, 9);      // color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10);     // compression
  ihdrData.writeUInt8(0, 11);     // filter
  ihdrData.writeUInt8(0, 12);     // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with scanline filters (filter byte 0)
  const scanlines = [];
  const radius = size * 0.45;
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    scanlines.push(0); // Filter byte 0 (None)
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dark theme background with rounded icon badge
      if (dist < radius) {
        // Gradient from LeetCode orange (#FFA116) to GitHub emerald (#2EA043)
        const t = (x + y) / (size * 2);
        const r = Math.round(255 * (1 - t) + 46 * t);
        const g = Math.round(161 * (1 - t) + 160 * t);
        const b = Math.round(22 * (1 - t) + 67 * t);

        // Center code bracket symbol (white)
        const inCodeArea = Math.abs(dx) < size * 0.28 && Math.abs(dy) < size * 0.28;
        if (inCodeArea && (
            (dx < -size * 0.08 && Math.abs(Math.abs(dy) - Math.abs(dx) * 0.8) < size * 0.06) ||
            (dx > size * 0.08 && Math.abs(Math.abs(dy) - Math.abs(dx) * 0.8) < size * 0.06) ||
            (Math.abs(dx + dy * 0.5) < size * 0.04 && Math.abs(dy) < size * 0.2)
        )) {
          // Inner icon graphic
          scanlines.push(255, 255, 255, 255);
        } else {
          scanlines.push(r, g, b, 255);
        }
      } else if (dist < radius + 1) {
        // Anti-aliased border
        const alpha = Math.round(255 * (1 - (dist - radius)));
        scanlines.push(35, 134, 54, alpha);
      } else {
        // Transparent outer
        scanlines.push(0, 0, 0, 0);
      }
    }
  }

  const rawBuffer = Buffer.from(scanlines);
  const compressedData = zlib.deflateSync(rawBuffer);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const assetsDir = path.resolve(__dirname, '../../extension/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuf = generatePng(size);
  const filePath = path.join(assetsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Generated ${filePath} (${size}x${size}, ${pngBuf.length} bytes)`);
});
