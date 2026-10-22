/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.G26.FORMULA_TEST
TAG: LEEWAY.G26.CANONICAL_FORMULA_OBSERVATION.TEST
5WH:
WHAT = Qualify measured software-compute 16x6 observations and fail-closed source checks.
WHY = The source-pinned Formula replay must not be faked by a golden-only test.
WHO = Creator-authorized LeeWay engineering; no signing/production authority.
WHERE = tests/virtual-gpu/canonical-formula-software-observation.test.mjs
WHEN = 2026-10-22
HOW = Real original worker samples and negative source/interface tests.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {measureLeeWaySoftwareWindow,replayCanonicalFormula,executeObservedFormula,
 G26_FORMULA_RANGES} from '../../core/canonical-formula-software-observation.mjs';

test('G26 observes 16 real LeeWay CPU worker samples without external GPU provider',async()=>{
  const result=await measureLeeWaySoftwareWindow({size:2});
  assert.equal(result.samples,16);
  assert.equal(result.stateRows.length,16);
  assert.equal(result.noPhysicalGpuProvider,true);
  for(const row of result.stateRows){
    assert.equal(row.length,6);
    assert.equal(row[0],1);
    assert.ok(row.every(Number.isFinite));
    assert.ok(row[1]>0);
    assert.ok(row[5]>0);
    for(let i=0;i<6;i++) assert.ok(row[i]>=G26_FORMULA_RANGES[i][0]);
  }
  assert.match(result.interpretation,/NOT_EXECUTION_AUTHORIZATION/);
});
test('wrong window dimensions refuse measurements',async()=>{
  await assert.rejects(measureLeeWaySoftwareWindow({size:0}),/G26_OBSERVATION_DIMENSION_INVALID/);
  await assert.rejects(measureLeeWaySoftwareWindow({size:2,samples:15}),/G26_OBSERVATION_DIMENSION_INVALID/);
});
test('unrecognized Formula source root is rejected',async()=>{
  await assert.rejects(replayCanonicalFormula({formulaRoot:'relative-location',stateRows:[],
    inputRanges:G26_FORMULA_RANGES}),/G26_FORMULA_REFERENCE_ROOT_REQUIRED/);
});
test('unapproved local Formula bytes are rejected before a call to the service',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'g26-false-formula-'));
  t.after(()=>fs.rmSync(dir,{force:true,recursive:true}));
  const engineDir=path.join(dir,'runtime','canonical','leeway-formula','v1');
  fs.mkdirSync(path.join(engineDir,'adapters'),{recursive:true});
  fs.writeFileSync(path.join(engineDir,'leeway-formula-v1.mjs'),'export function evaluate(){}\n');
  fs.writeFileSync(path.join(engineDir,'adapters','runtime-state-v1.mjs'),'export const version=1;\n');
  await assert.rejects(replayCanonicalFormula({formulaRoot:dir,stateRows:[],
    inputRanges:G26_FORMULA_RANGES}),/G26_FORMULA_SOURCE_PIN_MISMATCH/);
});
test('request ID cannot contain caller code injection',async()=>{
  await assert.rejects(executeObservedFormula({requestId:'../authority',formulaRoot:'/nonexistent'}),
    /G26_REQUEST_ID_INVALID/);
});
