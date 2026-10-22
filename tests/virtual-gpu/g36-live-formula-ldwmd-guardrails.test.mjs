/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.G36.LIVE_CHAIN_TEST
TAG: LEEWAY.G36.CANONICAL_FORMULA_LDWMD_SOURCE_GUARDRAILS
5WH:
WHAT = Reject altered G30 source, invalid request or wrong-sized software workloads.
WHY = Diagnostic live Formula evaluation must never proceed on an unqualified source.
WHO = Creator-authorized LeeWay engineering; no protected issuer identity.
WHERE = LeeWay-Edge-GPU/tests/virtual-gpu/g36-live-formula-ldwmd-guardrails.test.mjs
WHEN = 2026-10-22
HOW = Fail-closed source preflight without invoking any real protected ledger.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runG36LiveOriginalSoftwarePartialChain as run} from '../../scripts/run-g36-live-formula-ldwmd-compute.mjs';
test('G36 refuses non-256 qualification workloads before live API calls',async()=>{
  await assert.rejects(run({requestId:'g36-reject-wrong-size',size:16,
    formulaRoot:path.resolve('.'),ldwmdRoot:path.resolve('.')}),/G36_ACCEPTANCE_MATRIX_MUST_BE_256/);
});
test('G36 refuses invalid request IDs before Formula receipt writes',async()=>{
  await assert.rejects(run({requestId:'../../my-ledger',size:256,
    formulaRoot:path.resolve('.'),ldwmdRoot:path.resolve('.')}),/G36_BAD_REQUEST_ID/);
});
test('G36 requires an absolute original source owner path',async()=>{
  await assert.rejects(run({requestId:'g36-absolute-required',size:256,
    formulaRoot:'./formula',ldwmdRoot:'./ldwmd'}),/G36_PINNED_SOURCE_PATHS_REQUIRED/);
});
test('G36 refuses substituted LDWMD bridge bytes before computation',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'lee-g36-source-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const file=path.join(root,'automation-runtime','src','vtensor','ldwmd-leeway-cpu-binding.mjs');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,'export const notTrusted=true;\n');
  await assert.rejects(run({requestId:'g36-source-tamper',size:256,
    formulaRoot:root,ldwmdRoot:root}),/G36_ORIGINAL_G30_LDWMD_BRIDGE_CHANGED/);
});
