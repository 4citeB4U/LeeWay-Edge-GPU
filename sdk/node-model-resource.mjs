// Node host adapter for the portable model-resource contract. File identity and
// range admission remain the responsibility of Runtime Fabric's trusted source.
import {open} from 'node:fs/promises';
import {createDeviceLocalModelResource} from './model-resource.mjs';

export async function openNodeModelResource({file, resourceId, maxReadBytes = 64 * 1024 * 1024} = {}) {
  if (typeof file !== 'string' || !file) throw Error('MODEL_FILE_REQUIRED');
  const handle = await open(file, 'r');
  try {
    const initial = await handle.stat();
    if (!initial.isFile() || !Number.isSafeInteger(initial.size) || initial.size < 1) throw Error('MODEL_FILE_INVALID');
    return createDeviceLocalModelResource({resourceId, byteLength: initial.size, maxReadBytes,
      async read({offset, byteLength, signal}) {
        if (signal?.aborted) throw Error('MODEL_RESOURCE_CANCELLED');
        const before = await handle.stat();
        if (before.size !== initial.size || before.mtimeMs !== initial.mtimeMs || before.ino !== initial.ino)
          throw Error('MODEL_FILE_CHANGED');
        const bytes = new Uint8Array(byteLength); let position = 0;
        while (position < byteLength) {
          if (signal?.aborted) throw Error('MODEL_RESOURCE_CANCELLED');
          const part = await handle.read(bytes, position, byteLength - position, offset + position);
          if (!part.bytesRead) throw Error('MODEL_FILE_TRUNCATED');
          position += part.bytesRead;
        }
        const after = await handle.stat();
        if (after.size !== initial.size || after.mtimeMs !== initial.mtimeMs || after.ino !== initial.ino)
          throw Error('MODEL_FILE_CHANGED');
        return bytes;
      }, close: () => handle.close()});
  } catch (error) { await handle.close(); throw error; }
}
