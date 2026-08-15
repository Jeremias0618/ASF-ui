function readU16(view, offset) {
  return view.getUint16(offset, true);
}

function readU32(view, offset) {
  return view.getUint32(offset, true);
}

async function inflateRaw(compressed) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('no-inflate');
  }

  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function fileNameOf(path) {
  const parts = String(path || '').replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Extract the first matching file from a standard ZIP (store or deflate).
 * @param {ArrayBuffer} buffer
 * @param {(name: string) => boolean} predicate
 * @returns {Promise<Uint8Array>}
 */
export async function extractZipFile(buffer, predicate) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  while (offset + 30 <= bytes.length) {
    const signature = readU32(view, offset);
    if (signature !== 0x04034b50) break;

    const method = readU16(view, offset + 8);
    const flags = readU16(view, offset + 6);
    const compressedSize = readU32(view, offset + 18);
    const nameLen = readU16(view, offset + 26);
    const extraLen = readU16(view, offset + 28);
    const nameStart = offset + 30;
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;

    if (Math.floor(flags / 8) % 2 === 1) {
      throw new Error('zip-data-descriptor');
    }

    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) throw new Error('truncated-zip');

    if (predicate(name) || predicate(fileNameOf(name))) {
      const compressed = bytes.subarray(dataStart, dataEnd);
      if (method === 0) return compressed.slice();
      if (method === 8) return inflateRaw(compressed);
      throw new Error('unsupported-compression');
    }

    offset = dataEnd;
  }

  throw new Error('dll-not-in-zip');
}

export function isPluginDllName(name) {
  return fileNameOf(name).toLowerCase() === 'asfbotsocial.dll';
}
