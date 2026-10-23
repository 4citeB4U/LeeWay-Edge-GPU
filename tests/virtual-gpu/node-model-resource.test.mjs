// Filesystem adapter tests use temporary byte fixtures, never production models.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm, truncate} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openNodeModelResource} from '../../sdk/node-model-resource.mjs';
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'leeway-model-resource-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  const file = join(root, 'fixture.gguf');
  await writeFile(file, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
  return {file, root};
}
test('file resource reads exact bounded bytes and closes once', async t => {
  const {file} = await fixture(t);
  const resource = await openNodeModelResource({file, resourceId: 'fixture', maxReadBytes: 4});
  try {
    assert.deepEqual([...await resource.read({offset: 2, byteLength: 4})], [3, 4, 5, 6]);
    await assert.rejects(resource.read({offset: 0, byteLength: 5}), /RANGE_INVALID/);
  } finally { await resource.close(); await resource.close(); }
  await assert.rejects(resource.read({offset: 0, byteLength: 1}), /CLOSED/);
});
test('changed file size is rejected before returning model bytes', async t => {
  const {file} = await fixture(t);
  const resource = await openNodeModelResource({file, resourceId: 'fixture'});
  try { await truncate(file, 4); await assert.rejects(resource.read({offset: 0, byteLength: 1}), /FILE_CHANGED/); }
  finally { await resource.close(); }
});
test('failed adapter construction closes the file handle', async t => {
  const {file} = await fixture(t);
  await assert.rejects(openNodeModelResource({file, resourceId: ''}), /ADAPTER_INVALID/);
  await rm(file); // Windows refuses this when an incompatible file handle remains open.
});
test('pre-cancelled file reads return no bytes', async t => {
  const {file} = await fixture(t);
  const resource = await openNodeModelResource({file, resourceId: 'fixture'});
  const controller = new AbortController(); controller.abort();
  try { await assert.rejects(resource.read({offset: 0, byteLength: 1, signal: controller.signal}), /CANCELLED/); }
  finally { await resource.close(); }
});
