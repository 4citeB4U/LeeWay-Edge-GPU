const bufferPool = [];

export function getBuffer(device, size, usageFlags) {
  // Enforce distinct buffer identities with an acquire/release locking mechanism
  let entry = bufferPool.find(b => !b.inUse && b.size >= size && b.usage === usageFlags);

  if (entry) {
    entry.inUse = true;
    return entry.buffer;
  }

  const buffer = device.createBuffer({
    size,
    usage: usageFlags
  });
  
  bufferPool.push({ buffer, size, usage: usageFlags, inUse: true });
  return buffer;
}

export function releaseBuffer(buffer) {
  const entry = bufferPool.find(b => b.buffer === buffer);
  if (entry) {
    entry.inUse = false;
  }
}
