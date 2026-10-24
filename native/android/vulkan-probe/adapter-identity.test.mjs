import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('main.cpp',import.meta.url),'utf8');
test('probe selects Qualcomm physical adapter only',()=>{assert.match(s,/QUALCOMM_VENDOR_ID=0x5143u/);assert.match(s,/candidate\.vendorID!=QUALCOMM_VENDOR_ID/);assert.match(s,/VK_PHYSICAL_DEVICE_TYPE_CPU/);assert.match(s,/QUALCOMM_COMPUTE_DEVICE_NOT_FOUND/)});
test('compute queue required and foreign GPU cannot qualify',()=>{assert.match(s,/VK_QUEUE_COMPUTE_BIT/);assert.match(s,/if\(gpu\)break/)});
test('SPIR-V magic and minimum header length required',()=>{assert.match(s,/words\.size\(\)<5/);assert.match(s,/words\[0\]!=0x07230203u/)});
test('physical vendor/device identifiers included in readback output',()=>{assert.match(s,/properties\.vendorID/);assert.match(s,/properties\.deviceID/);assert.match(s,/mismatches/)});
