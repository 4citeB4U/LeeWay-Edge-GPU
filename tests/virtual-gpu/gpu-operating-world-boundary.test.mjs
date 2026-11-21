/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.OPERATING_WORLD.TEST
TAG: LEEWAY.GPU.ONE_WORLD.THIN_CLIENT.CI.V2
5WH:
WHAT = Check the approved proposal's source boundaries without claiming hosted execution.
WHY = Prevent a new GPU-only diagram or full-client download from superseding the one-operating-world design.
WHO = Original GPU source contributors and bounded outside reviewer.
WHERE = tests/virtual-gpu/gpu-operating-world-boundary.test.mjs.
WHEN = 2026-11-21.
HOW = Read contract and source, assert unique worker state and native-permission separation.
LICENSE = MIT.
AUTHORITY = SOURCE_ONLY; no Veritas/GPU/production/host proof.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const contract=new URL('../../contracts/leeway-gpu-operating-world.v2.json',import.meta.url);
const doc=new URL('../../docs/architecture/LEEWAY-GPU-OPERATING-WORLD-V2.md',import.meta.url);
const c=JSON.parse(readFileSync(contract,'utf8')),text=readFileSync(doc,'utf8');
test('original GPU service identity retained; no alternative controller or production enrollment',()=>{
 assert.equal(c.schema,'leeway.gpu.operating-world.v2');
 assert.equal(c.canonicalGpuServiceId,'leeway.gpu.service');
 assert.equal(c.sourceStatus,'SOURCE_REVIEW_ONLY');
 assert.equal(c.noDuplicateControllerOrSigner,true);
 assert.ok(c.notProvenByThisContract.includes('LIVE_HOSTED_WORLD'));
});
test('GPU is one persistent software-defined world, not a physical accelerator definition',()=>{
 assert.equal(c.meaning,'FORMULA_DEVELOPED_LEEWAY_SOFTWARE_GPU_OPERATING_WORLD');
 assert.equal(c.hostedOperatingCoreIndependentOfUserDevices,true);
 assert.equal(c.allTasksRouteThroughSameComposedWorld,true);
 assert.equal(c.physicalGpuSiliconRequiredForEveryTask,false);
 assert.equal(c.hardwareStillRequiredSomewhere,true);
});
test('browser/Tablet requires no full download and must never silently gain host privileges',()=>{
 const x=c.client;
 assert.equal(x.fullEcosystemInstallationRequired,false);
 assert.equal(x.browserOnlyRemoteTabletSupported,true);
 assert.equal(x.browserAutomaticallyControlsOperatingSystem,false);
 assert.equal(x.extensionMandatory,false);
 assert.equal(x.nativeHardwareAccessRequiresMinimalSignedDeviceBridge,true);
 assert.equal(x.platformPermissionsStillRequired,true);
 assert.equal(x.operatingSystemUnchanged,true);
});
test('minimal native binding has the intended four device content/diagnostic interfaces',()=>{
 assert.deepEqual(c.client.thinLocalBindings,[
  'DIGITAL_BRAIN_SCOPED','CONTINUUM_SCOPED','DIAGNOSTICS_SCOPED',
  'CONTENT_VAULT_OPTIONAL_HOT_PROJECTION'
 ]);
 assert.equal(c.dataLanes.hardwareFacts,'DIAGNOSTICS');
 assert.match(c.dataLanes.systemAndDeepFiles,/DIGITAL_BRAIN/);
 assert.equal(c.dataLanes.experiencesAndTransfers,'CONTINUUM');
 assert.match(c.dataLanes.mediaQuickAccess,/CONTENT_VAULT/);
 assert.match(c.dataLanes.nativePhysicalActions,/DEVICE_BRIDGE/);
});
test('agent employees are solitary and can change sites only with exclusive Runtime leases',()=>{
 const w=c.workers;
 assert.equal(w.oneAgentLeePerOwnerScope,true);
 assert.equal(w.oneIdentityPerNamedEmployee,true);
 assert.equal(w.manyReadOnlyViewsAllowed,true);
 assert.equal(w.oneActiveExecutionLocationLeasePerEmployee,true);
 assert.equal(w.sourceLeaseMustBeReleasedOrFencedBeforeDestination,true);
 assert.equal(w.transferKeepsAgentId,true);
 assert.equal(w.transferCheckpointAuthority,'CONTINUUM');
 assert.equal(w.leaseOwner,'RUNTIME_FABRIC');
 assert.equal(w.transferSpeedGuaranteedZeroMs,false);
 assert.equal(w.organizationDataGrantsRequired,true);
});
test('Tablet produces remote sandbox previews and local device export is explicit',()=>{
 assert.equal(c.client.remoteSandboxDefault,true);
 assert.equal(c.client.permanentClientProductFileRequired,false);
 assert.equal(c.client.explicitNativeExportOptInRequired,true);
 assert.match(text,/Virtual Tablet is Agent Lee's remote workstation and sandbox/);
});
test('physical resource truth remains intact inside the operating world',()=>{
 const x=c.computer;
 assert.equal(x.physicalGraphicsGpuAsLeeWayProviderAllowed,false);
 assert.equal(x.hostCpuAndRamRequiredForSoftwareMath,true);
 assert.equal(x.cpuRamNetworkStorageRemainPhysicalExecutionResources,true);
 assert.equal(x.nativeGpuDispatchInCanonicalLeewayProductAllowed,false);
 assert.equal(x.noIndependentPoweredComputeOutcome,'UNAVAILABLE_OR_CHECKPOINTED_RECOVERY');
});
test('all eight physical operating-world acceptance gates remain required but not asserted',()=>{
 assert.deepEqual(c.acceptanceGates,Array.from({length:8},(_,i)=>'W'+(i+1)));
 for(const gate of c.acceptanceGates)assert.match(text,new RegExp('\\b'+gate+'\\.'));
 assert.ok(c.notProvenByThisContract.includes('ONE_WORKER_CROSS_SITE_HANDOFF'));
 assert.ok(c.notProvenByThisContract.includes('DEVICE_LOSS_REMOTE_COMPLETION'));
 assert.ok(c.notProvenByThisContract.includes('PRODUCTION_RECEIPT'));
});

test('user graphics GPU is never LeeWay compute, accelerator fallback or model route',()=>{
 assert.equal(c.externalUserDevicePhysicalGraphicsGpuUsedByLeeway,false);
 assert.equal(c.externalUserDevicePhysicalGraphicsGpuRequiredForLeeway,false);
 assert.equal(c.deviceGraphicsGpuOwnedBy,'DEVICE_OS_AND_USER_NOT_LEEWAY');
 const x=c.computer;
 for(const key of [
   'physicalGraphicsGpuAsLeeWayProviderAllowed',
   'physicalGraphicsGpuAsFallbackAllowed',
   'physicalGraphicsGpuAsOptionalAccelerationAllowed',
   'physicalGraphicsGpuEnumerationForLeewayPlacementAllowed',
   'nativeGpuDispatchInCanonicalLeewayProductAllowed'
 ])assert.equal(x[key],false,key);
 assert.equal(x.softwareGpuExecutionSubstrate,undefined);
 assert.equal(c.softwareGpuExecutionSubstrate,'EXECUTION_HOST_CPU_AND_RAM');
 assert.equal(x.internalImageVoiceVisionInferenceMustUseSoftwarePipeline,true);
 assert.equal(x.missingSoftwareModelOrCodecOutcome,'NOT_AVAILABLE_NO_HOST_GPU_FALLBACK');
 assert.match(text,/not a LeeWay compute resource/);
});
test('21 logical GPU components are a Creator-specified inventory target, not a fabricated verified count',()=>{
 assert.equal(c.creatorSpecifiedLogicalGpuComponents,21);
 assert.equal(c.logicalGpuComponentInventoryStatus,'CREATOR_SPECIFIED_COUNT_SOURCE_INVENTORY_PENDING');
 assert.equal(c.computer.verifiedSourceInventoryRequiredFor21GpuClaim,true);
 assert.ok(c.notProvenByThisContract.includes('21_SOFTWARE_GPU_COMPONENTS_SOURCE_ENUMERATION'));
});
test('CPU/RAM executes software math even when user device has no graphics card',()=>{
 assert.equal(c.computer.leewayCoreComputeMethod,'FORMULA_GOVERNED_SOFTWARE_GPU_CPU_EXECUTED');
 assert.equal(c.computer.hostCpuAndRamRequiredForSoftwareMath,true);
 assert.equal(c.computer.independentHostedCpuMayReplaceEndUserDeviceCpu,true);
 assert.equal(c.computer.graphicalDisplayMayUseOsGraphicsWithoutBecomingLeewayCompute,true);
 assert.equal(c.computer.contentGenerationClaimsNeedExecutionEvidence,true);
});
