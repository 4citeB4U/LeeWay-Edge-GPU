// Deterministic bytes for the new GPU qualification envelope. This follows the
// existing LeeWay sorted-key receipt pattern; request/result hash contracts keep
// their original serialization. Signed envelopes use JSON and safe integers.
export function canonicalGpuSigningBytes(value) {
  const ancestors = new Set();
  function encode(item) {
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return JSON.stringify(item);
    if (typeof item === 'number' && Number.isSafeInteger(item)) return JSON.stringify(item);
    if (!item || typeof item !== 'object' || ancestors.has(item) ||
        (!Array.isArray(item) && ![Object.prototype, null].includes(Object.getPrototypeOf(item))))
      throw Error('GPU_SIGNING_JSON_INVALID');
    ancestors.add(item);
    let result;
    if (Array.isArray(item)) {
      for (let index = 0; index < item.length; index++) if (!(index in item)) throw Error('GPU_SIGNING_JSON_INVALID');
      result = '[' + item.map(encode).join(',') + ']';
    } else result = '{' + Object.keys(item).sort().map(key => JSON.stringify(key) + ':' + encode(item[key])).join(',') + '}';
    ancestors.delete(item);
    return result;
  }
  return new TextEncoder().encode(encode(value));
}
