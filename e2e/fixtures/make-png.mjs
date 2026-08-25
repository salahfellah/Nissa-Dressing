// Génère un petit PNG valide, sans dépendance externe.
//
// Sert de photo d'annonce dans les tests : on veut vérifier que l'API réencode
// réellement l'image (WebP, EXIF supprimés), ce qu'un fichier factice ne
// permettrait pas — sharp refuserait de le décoder.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const [, , output] = process.argv;
if (!output) {
  console.error('Usage : node make-png.mjs <fichier.png>');
  process.exit(1);
}

const WIDTH = 16;
const HEIGHT = 16;
const COLOR = [200, 169, 106]; // l'or de la charte

// Données brutes : un octet de filtre par ligne, puis RGB par pixel.
const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
for (let y = 0; y < HEIGHT; y += 1) {
  raw[y * (WIDTH * 3 + 1)] = 0;
  for (let x = 0; x < WIDTH; x += 1) {
    const offset = y * (WIDTH * 3 + 1) + 1 + x * 3;
    raw[offset] = COLOR[0];
    raw[offset + 1] = COLOR[1];
    raw[offset + 2] = COLOR[2];
  }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8; // profondeur
ihdr[9] = 2; // couleur RGB

writeFileSync(
  output,
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
