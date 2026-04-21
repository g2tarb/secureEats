/**
 * SecurColis - Générateur QR Code en pur vanilla JS
 * Implémentation complète : encodage byte, Reed-Solomon, masquage, rendu Canvas/SVG
 */
const QR = (() => {
  // Tables de capacité par version (1-40), mode byte, EC level [L, M, Q, H]
  const CAPACITIES = [
    [17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],
    [134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],
    [321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],
    [586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],
    [929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],
    [1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],
    [1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],
    [2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],
    [2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]
  ];

  // Nombre de mots de code EC par bloc [version][ecLevel]
  const EC_CODEWORDS_PER_BLOCK = [
    [7,10,13,17],[10,16,22,28],[15,26,18,22],[20,18,26,16],[26,24,18,22],
    [18,16,24,28],[20,18,18,26],[24,22,22,26],[30,22,20,24],[18,26,24,28],
    [20,30,28,24],[24,22,26,28],[26,22,24,22],[30,24,20,24],[22,24,30,24],
    [24,28,24,30],[28,28,28,28],[30,26,28,28],[28,26,26,26],[28,26,28,28],
    [28,26,30,28],[28,28,24,30],[30,28,30,30],[30,28,30,30],[26,28,30,30],
    [28,28,28,30],[30,28,30,30],[30,28,30,30],[30,28,30,30],[30,28,30,30],
    [30,28,30,30],[30,28,30,30],[30,28,30,30],[30,28,30,30],[30,28,30,30],
    [30,28,30,30],[30,28,30,30],[30,28,30,30],[30,28,30,30],[30,28,30,30]
  ];

  // Nombre de blocs [version][ecLevel] — [numBlocks1, dataCodewords1, numBlocks2, dataCodewords2]
  const BLOCK_INFO = [
    [[1,19,0,0],[1,16,0,0],[1,13,0,0],[1,9,0,0]],
    [[1,34,0,0],[1,28,0,0],[1,22,0,0],[1,16,0,0]],
    [[1,55,0,0],[1,44,0,0],[2,17,0,0],[2,13,0,0]],
    [[1,80,0,0],[2,32,0,0],[2,24,0,0],[4,9,0,0]],
    [[1,108,0,0],[2,43,0,0],[2,15,2,16],[2,11,2,12]],
    [[2,68,0,0],[4,27,0,0],[4,19,0,0],[4,15,0,0]],
    [[2,78,0,0],[4,31,0,0],[2,14,4,15],[4,13,1,14]],
    [[2,97,0,0],[2,38,2,39],[4,18,2,19],[4,14,2,15]],
    [[2,116,0,0],[3,36,2,37],[4,16,4,17],[4,12,4,13]],
    [[2,68,2,69],[4,43,1,44],[6,19,2,20],[6,15,2,16]],
    [[4,81,0,0],[1,50,4,51],[4,22,4,23],[3,12,8,13]],
    [[2,92,2,93],[6,36,2,37],[4,20,6,21],[7,14,4,15]],
    [[4,107,0,0],[8,37,1,38],[8,20,4,21],[12,11,4,12]],
    [[3,115,1,116],[4,40,5,41],[11,16,5,17],[11,12,5,13]],
    [[5,87,1,88],[5,41,5,42],[5,24,7,25],[11,12,7,13]],
    [[5,98,1,99],[7,45,3,46],[15,19,2,20],[3,15,13,16]],
    [[1,107,5,108],[10,46,1,47],[1,22,15,23],[2,14,17,15]],
    [[5,120,1,121],[9,43,4,44],[17,22,1,23],[2,14,19,15]],
    [[3,113,4,114],[3,44,11,45],[17,21,4,22],[9,13,16,14]],
    [[3,107,5,108],[3,41,13,42],[15,24,5,25],[15,15,10,16]],
    [[4,116,4,117],[17,42,0,0],[17,22,6,23],[19,16,6,17]],
    [[2,111,7,112],[17,46,0,0],[7,24,16,25],[34,13,0,0]],
    [[4,121,5,122],[4,47,14,48],[11,24,14,25],[16,15,14,16]],
    [[6,117,4,118],[6,45,14,46],[11,24,16,25],[30,16,2,17]],
    [[8,106,4,107],[8,47,13,48],[7,24,22,25],[22,15,13,16]],
    [[10,114,2,115],[19,46,4,47],[28,22,6,23],[33,16,4,17]],
    [[8,122,4,123],[22,45,3,46],[8,23,26,24],[12,15,28,16]],
    [[3,117,10,118],[3,45,23,46],[4,24,31,25],[11,15,31,16]],
    [[7,116,7,117],[21,45,7,46],[1,23,37,24],[19,15,26,16]],
    [[5,115,10,116],[19,47,10,48],[15,24,25,25],[23,15,25,16]],
    [[13,115,3,116],[2,46,29,47],[42,24,1,25],[23,15,28,16]],
    [[17,115,0,0],[10,46,23,47],[10,24,35,25],[19,15,35,16]],
    [[17,115,1,116],[14,46,21,47],[29,24,19,25],[11,15,46,16]],
    [[13,115,6,116],[14,46,23,47],[44,24,7,25],[59,16,1,17]],
    [[12,121,7,122],[12,47,26,48],[39,24,14,25],[22,15,41,16]],
    [[6,121,14,122],[6,47,34,48],[46,24,10,25],[2,15,64,16]],
    [[17,122,4,123],[29,46,14,47],[49,24,10,25],[24,15,46,16]],
    [[4,122,18,123],[13,46,32,47],[48,24,14,25],[42,15,32,16]],
    [[20,117,4,118],[40,47,7,48],[43,24,22,25],[10,15,67,16]],
    [[19,118,6,119],[18,47,31,48],[34,24,34,25],[20,15,61,16]]
  ];

  // Positions des motifs d'alignement par version
  const ALIGNMENT_POSITIONS = [
    [],[], [6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],
    [6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],
    [6,26,50,74],[6,30,56,82],[6,30,58,86],[6,30,62,90],[6,34,62,90],
    [6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],
    [6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],
    [6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],
    [6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],
    [6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],
    [6,32,58,84,110,136,162],[6,26,54,82,110,138,166]
  ];

  const EC_LEVEL = { L: 0, M: 1, Q: 2, H: 3 };

  // Galois Field GF(2^8) avec polynôme primitif 0x11d
  const gfExp = new Uint8Array(512);
  const gfLog = new Uint8Array(256);
  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      gfExp[i] = x;
      gfLog[x] = i;
      x <<= 1;
      if (x & 256) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) gfExp[i] = gfExp[i - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return gfExp[gfLog[a] + gfLog[b]];
  }

  function rsGeneratorPoly(degree) {
    let gen = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(gen.length + 1).fill(0);
      for (let j = 0; j < gen.length; j++) {
        next[j] ^= gen[j];
        next[j + 1] ^= gfMul(gen[j], gfExp[i]);
      }
      gen = next;
    }
    return gen;
  }

  function rsEncode(data, ecCount) {
    const gen = rsGeneratorPoly(ecCount);
    const result = new Uint8Array(ecCount);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ result[0];
      for (let j = 0; j < ecCount - 1; j++) result[j] = result[j + 1];
      result[ecCount - 1] = 0;
      for (let j = 0; j < ecCount; j++) result[j] ^= gfMul(gen[j + 1], factor);
    }
    // Shift: gen[0] is always 1, remainder starts from gen[1]
    return result;
  }

  // Classe BitBuffer pour construire le flux de bits
  class BitBuffer {
    constructor() { this.buffer = []; this.length = 0; }
    put(num, len) {
      for (let i = len - 1; i >= 0; i--) {
        this.buffer.push((num >> i) & 1);
        this.length++;
      }
    }
    getByte(index) {
      let val = 0;
      for (let i = 0; i < 8; i++) {
        val = (val << 1) | (this.buffer[index * 8 + i] || 0);
      }
      return val;
    }
  }

  function getMinVersion(dataLen, ecLevel) {
    for (let v = 0; v < 40; v++) {
      if (CAPACITIES[v][ecLevel] >= dataLen) return v + 1;
    }
    return -1;
  }

  function getCharCountBits(version) {
    if (version <= 9) return 8;
    if (version <= 26) return 16;
    return 16;
  }

  function getTotalCodewords(version) {
    const size = version * 4 + 17;
    let total = size * size;
    // Finder patterns + séparateurs
    total -= 3 * 64; // 3 finder patterns 8x8
    total -= 2 * (size - 16); // timing patterns (approx)
    // Version info pour v >= 7
    if (version >= 7) total -= 36;
    // Format info
    total -= 31;
    // Alignement patterns
    const ap = ALIGNMENT_POSITIONS[version];
    if (ap.length > 1) {
      const count = ap.length;
      let alignCount = count * count;
      // Retirer ceux qui chevauchent les finder patterns
      alignCount -= 3;
      total -= alignCount * 25;
    }
    // Dark module
    total -= 1;
    return Math.floor(total / 8);
  }

  function encodeData(text, version, ecLevel) {
    const utf8 = new TextEncoder().encode(text);
    const bb = new BitBuffer();

    // Mode indicator: Byte = 0100
    bb.put(0b0100, 4);
    // Character count
    bb.put(utf8.length, getCharCountBits(version));
    // Data
    for (const byte of utf8) bb.put(byte, 8);
    // Terminator
    const bi = BLOCK_INFO[version - 1][ecLevel];
    const totalDataCodewords = bi[0] * bi[1] + bi[2] * bi[3];
    const totalDataBits = totalDataCodewords * 8;
    const terminatorLen = Math.min(4, totalDataBits - bb.length);
    bb.put(0, terminatorLen);
    // Pad to byte boundary
    while (bb.length % 8 !== 0) bb.put(0, 1);
    // Pad bytes
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (bb.length < totalDataBits) {
      bb.put(padBytes[padIdx % 2], 8);
      padIdx++;
    }

    // Convert to byte array
    const dataBytes = new Uint8Array(totalDataCodewords);
    for (let i = 0; i < totalDataCodewords; i++) dataBytes[i] = bb.getByte(i);

    return dataBytes;
  }

  function addErrorCorrection(dataBytes, version, ecLevel) {
    const bi = BLOCK_INFO[version - 1][ecLevel];
    const ecPerBlock = EC_CODEWORDS_PER_BLOCK[version - 1][ecLevel];
    const blocks = [];
    const ecBlocks = [];
    let offset = 0;

    // Group 1
    for (let i = 0; i < bi[0]; i++) {
      blocks.push(dataBytes.slice(offset, offset + bi[1]));
      offset += bi[1];
    }
    // Group 2
    for (let i = 0; i < bi[2]; i++) {
      blocks.push(dataBytes.slice(offset, offset + bi[3]));
      offset += bi[3];
    }

    // Generate EC for each block
    for (const block of blocks) {
      ecBlocks.push(rsEncode(block, ecPerBlock));
    }

    // Interleave data codewords
    const result = [];
    const maxDataLen = Math.max(bi[1], bi[3] || 0);
    for (let i = 0; i < maxDataLen; i++) {
      for (const block of blocks) {
        if (i < block.length) result.push(block[i]);
      }
    }

    // Interleave EC codewords
    for (let i = 0; i < ecPerBlock; i++) {
      for (const ec of ecBlocks) {
        result.push(ec[i]);
      }
    }

    return new Uint8Array(result);
  }

  function createMatrix(version) {
    const size = version * 4 + 17;
    const matrix = Array.from({ length: size }, () => new Int8Array(size)); // 0=empty, 1=black, -1=white
    const reserved = Array.from({ length: size }, () => new Uint8Array(size)); // 1=reserved
    return { matrix, reserved, size };
  }

  function placeFinderPattern(m, row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c;
        if (rr < 0 || rr >= m.size || cc < 0 || cc >= m.size) continue;
        let black = false;
        if (r >= 0 && r <= 6 && (c === 0 || c === 6)) black = true;
        else if (c >= 0 && c <= 6 && (r === 0 || r === 6)) black = true;
        else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) black = true;
        m.matrix[rr][cc] = black ? 1 : -1;
        m.reserved[rr][cc] = 1;
      }
    }
  }

  function placeAlignmentPattern(m, row, col) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const black = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
        m.matrix[row + r][col + c] = black ? 1 : -1;
        m.reserved[row + r][col + c] = 1;
      }
    }
  }

  function placePatterns(m, version) {
    const s = m.size;

    // Finder patterns
    placeFinderPattern(m, 0, 0);
    placeFinderPattern(m, 0, s - 7);
    placeFinderPattern(m, s - 7, 0);

    // Timing patterns
    for (let i = 8; i < s - 8; i++) {
      const black = i % 2 === 0;
      if (!m.reserved[6][i]) {
        m.matrix[6][i] = black ? 1 : -1;
        m.reserved[6][i] = 1;
      }
      if (!m.reserved[i][6]) {
        m.matrix[i][6] = black ? 1 : -1;
        m.reserved[i][6] = 1;
      }
    }

    // Alignment patterns
    const positions = ALIGNMENT_POSITIONS[version];
    if (positions.length > 1) {
      for (let i = 0; i < positions.length; i++) {
        for (let j = 0; j < positions.length; j++) {
          const r = positions[i], c = positions[j];
          if (m.reserved[r][c]) continue;
          placeAlignmentPattern(m, r, c);
        }
      }
    }

    // Dark module
    m.matrix[s - 8][8] = 1;
    m.reserved[s - 8][8] = 1;

    // Reserve format info areas
    for (let i = 0; i < 8; i++) {
      if (!m.reserved[8][i]) m.reserved[8][i] = 1;
      if (!m.reserved[8][s - 1 - i]) m.reserved[8][s - 1 - i] = 1;
      if (!m.reserved[i][8]) m.reserved[i][8] = 1;
      if (!m.reserved[s - 1 - i][8]) m.reserved[s - 1 - i][8] = 1;
    }
    m.reserved[8][8] = 1;

    // Reserve version info areas
    if (version >= 7) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          m.reserved[i][s - 11 + j] = 1;
          m.reserved[s - 11 + j][i] = 1;
        }
      }
    }
  }

  function placeData(m, codewords) {
    const s = m.size;
    let bitIdx = 0;
    let upward = true;

    for (let col = s - 1; col >= 0; col -= 2) {
      if (col === 6) col = 5; // Skip timing column

      const rows = upward
        ? Array.from({ length: s }, (_, i) => s - 1 - i)
        : Array.from({ length: s }, (_, i) => i);

      for (const row of rows) {
        for (let c = 0; c < 2; c++) {
          const cc = col - c;
          if (cc < 0) continue;
          if (m.reserved[row][cc]) continue;

          let black = false;
          if (bitIdx < codewords.length * 8) {
            const byteIdx = Math.floor(bitIdx / 8);
            const bitOffset = 7 - (bitIdx % 8);
            black = ((codewords[byteIdx] >> bitOffset) & 1) === 1;
          }
          m.matrix[row][cc] = black ? 1 : -1;
          bitIdx++;
        }
      }
      upward = !upward;
    }
  }

  // Mask patterns
  const MASK_FNS = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  ];

  function applyMask(m, maskIdx) {
    const fn = MASK_FNS[maskIdx];
    for (let r = 0; r < m.size; r++) {
      for (let c = 0; c < m.size; c++) {
        if (m.reserved[r][c]) continue;
        if (fn(r, c)) {
          m.matrix[r][c] = m.matrix[r][c] === 1 ? -1 : 1;
        }
      }
    }
  }

  function evaluatePenalty(m) {
    const s = m.size;
    let penalty = 0;

    // Rule 1: consecutive same-color modules in row/col
    for (let r = 0; r < s; r++) {
      let count = 1;
      for (let c = 1; c < s; c++) {
        if ((m.matrix[r][c] > 0) === (m.matrix[r][c - 1] > 0)) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty++;
        } else count = 1;
      }
    }
    for (let c = 0; c < s; c++) {
      let count = 1;
      for (let r = 1; r < s; r++) {
        if ((m.matrix[r][c] > 0) === (m.matrix[r - 1][c] > 0)) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty++;
        } else count = 1;
      }
    }

    // Rule 2: 2x2 blocks of same color
    for (let r = 0; r < s - 1; r++) {
      for (let c = 0; c < s - 1; c++) {
        const val = m.matrix[r][c] > 0;
        if (val === (m.matrix[r][c + 1] > 0) &&
            val === (m.matrix[r + 1][c] > 0) &&
            val === (m.matrix[r + 1][c + 1] > 0)) {
          penalty += 3;
        }
      }
    }

    // Rule 3: finder-like patterns
    const pattern1 = [1, -1, 1, 1, 1, -1, 1, -1, -1, -1, -1];
    const pattern2 = [-1, -1, -1, -1, 1, -1, 1, 1, 1, -1, 1];
    for (let r = 0; r < s; r++) {
      for (let c = 0; c <= s - 11; c++) {
        let match1 = true, match2 = true;
        for (let i = 0; i < 11; i++) {
          const dark = m.matrix[r][c + i] > 0;
          if (dark !== (pattern1[i] > 0)) match1 = false;
          if (dark !== (pattern2[i] > 0)) match2 = false;
        }
        if (match1) penalty += 40;
        if (match2) penalty += 40;
      }
    }
    for (let c = 0; c < s; c++) {
      for (let r = 0; r <= s - 11; r++) {
        let match1 = true, match2 = true;
        for (let i = 0; i < 11; i++) {
          const dark = m.matrix[r + i][c] > 0;
          if (dark !== (pattern1[i] > 0)) match1 = false;
          if (dark !== (pattern2[i] > 0)) match2 = false;
        }
        if (match1) penalty += 40;
        if (match2) penalty += 40;
      }
    }

    // Rule 4: proportion of dark modules
    let darkCount = 0;
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (m.matrix[r][c] > 0) darkCount++;
      }
    }
    const pct = (darkCount / (s * s)) * 100;
    const prev5 = Math.floor(pct / 5) * 5;
    const next5 = prev5 + 5;
    penalty += Math.min(Math.abs(prev5 - 50) / 5, Math.abs(next5 - 50) / 5) * 10;

    return penalty;
  }

  // Format info BCH(15,5)
  const FORMAT_POLY = 0x537;
  const FORMAT_MASK = 0x5412;

  function getFormatBits(ecLevel, maskIdx) {
    const ecBits = [1, 0, 3, 2][ecLevel]; // L=01, M=00, Q=11, H=10
    let data = (ecBits << 3) | maskIdx;
    let bits = data << 10;
    for (let i = 4; i >= 0; i--) {
      if (bits & (1 << (i + 10))) bits ^= FORMAT_POLY << i;
    }
    return ((data << 10) | bits) ^ FORMAT_MASK;
  }

  function placeFormatInfo(m, ecLevel, maskIdx) {
    const s = m.size;
    const bits = getFormatBits(ecLevel, maskIdx);

    // Around top-left finder
    const positions1 = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    for (let i = 0; i < 15; i++) {
      const [r, c] = positions1[i];
      m.matrix[r][c] = (bits >> i) & 1 ? 1 : -1;
    }

    // Around other finders
    const positions2 = [
      [s - 1, 8], [s - 2, 8], [s - 3, 8], [s - 4, 8], [s - 5, 8],
      [s - 6, 8], [s - 7, 8],
      [8, s - 8], [8, s - 7], [8, s - 6], [8, s - 5], [8, s - 4],
      [8, s - 3], [8, s - 2], [8, s - 1]
    ];
    for (let i = 0; i < 15; i++) {
      const [r, c] = positions2[i];
      m.matrix[r][c] = (bits >> i) & 1 ? 1 : -1;
    }
  }

  // Version info BCH(18,6)
  const VERSION_POLY = 0x1F25;

  function getVersionBits(version) {
    let bits = version << 12;
    for (let i = 5; i >= 0; i--) {
      if (bits & (1 << (i + 12))) bits ^= VERSION_POLY << i;
    }
    return (version << 12) | bits;
  }

  function placeVersionInfo(m, version) {
    if (version < 7) return;
    const s = m.size;
    const bits = getVersionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = (bits >> i) & 1;
      const r = Math.floor(i / 3);
      const c = (s - 11) + (i % 3);
      m.matrix[r][c] = bit ? 1 : -1;
      m.matrix[c][r] = bit ? 1 : -1;
    }
  }

  function generate(text, ecLevelStr = 'M') {
    const ecLevel = EC_LEVEL[ecLevelStr] !== undefined ? EC_LEVEL[ecLevelStr] : EC_LEVEL.M;
    const utf8 = new TextEncoder().encode(text);
    const version = getMinVersion(utf8.length, ecLevel);
    if (version < 0) throw new Error('Données trop volumineuses pour un QR code');

    // Encode data
    const dataBytes = encodeData(text, version, ecLevel);
    const codewords = addErrorCorrection(dataBytes, version, ecLevel);

    // Build matrix
    const m = createMatrix(version);
    placePatterns(m, version);

    // Try all masks and pick best
    let bestMask = 0;
    let bestPenalty = Infinity;
    let bestMatrix = null;

    for (let mask = 0; mask < 8; mask++) {
      // Clone matrix
      const clone = {
        matrix: m.matrix.map(r => new Int8Array(r)),
        reserved: m.reserved,
        size: m.size
      };
      placeData(clone, codewords);
      applyMask(clone, mask);
      placeFormatInfo(clone, ecLevel, mask);
      placeVersionInfo(clone, version);

      const penalty = evaluatePenalty(clone);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestMask = mask;
        bestMatrix = clone;
      }
    }

    return bestMatrix;
  }

  function renderCanvas(matrix, canvas, options = {}) {
    const {
      moduleSize = 8,
      margin = 4,
      foreground = '#000000',
      background = '#ffffff'
    } = options;

    const s = matrix.size;
    const totalSize = (s + margin * 2) * moduleSize;
    canvas.width = totalSize;
    canvas.height = totalSize;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, totalSize, totalSize);

    ctx.fillStyle = foreground;
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (matrix.matrix[r][c] > 0) {
          ctx.fillRect(
            (c + margin) * moduleSize,
            (r + margin) * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
  }

  function toSVG(matrix, options = {}) {
    const { moduleSize = 4, margin = 4, foreground = '#000', background = '#fff' } = options;
    const s = matrix.size;
    const totalSize = (s + margin * 2) * moduleSize;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`;
    svg += `<rect width="${totalSize}" height="${totalSize}" fill="${background}"/>`;
    svg += `<path d="`;

    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (matrix.matrix[r][c] > 0) {
          const x = (c + margin) * moduleSize;
          const y = (r + margin) * moduleSize;
          svg += `M${x},${y}h${moduleSize}v${moduleSize}h-${moduleSize}z`;
        }
      }
    }

    svg += `" fill="${foreground}"/>`;
    svg += `</svg>`;
    return svg;
  }

  function toDataURL(matrix, options = {}) {
    const canvas = document.createElement('canvas');
    renderCanvas(matrix, canvas, options);
    return canvas.toDataURL('image/png');
  }

  return {
    generate,
    renderCanvas,
    toSVG,
    toDataURL,
    EC_LEVEL
  };
})();
