import test from 'node:test';
import assert from 'node:assert/strict';
import {readAndroidVulkanFeatures as parse} from './g19-android-vulkan-capability.mjs';
test('Fold6 declares Vulkan compute feature without claiming execution',()=>{const x=parse('feature:android.hardware.vulkan.compute\nfeature:android.hardware.vulkan.level=1\nfeature:android.hardware.vulkan.version=4206592\n');assert.equal(x.computeFeatureAdvertised,true);assert.equal(x.level,'1');assert.equal(x.version,'4206592');assert.equal(x.vulkanDispatchVerified,false);assert.equal(x.readbackVerified,false);assert.equal(x.localModelInferenceVerified,false)});
test('missing compute feature stays unsupported by inventory',()=>assert.equal(parse('feature:android.hardware.vulkan.level=1\n').computeFeatureAdvertised,false));
test('arbitrary text cannot masquerade as feature',()=>assert.equal(parse('notfeature:android.hardware.vulkan.compute').computeFeatureAdvertised,false));
test('malformed input is rejected',()=>assert.throws(()=>parse(null),/SOURCE_REQUIRED/));
