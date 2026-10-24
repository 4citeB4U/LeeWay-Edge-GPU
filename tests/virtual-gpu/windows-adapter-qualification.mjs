/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.TESTS.WINDOWS_ADAPTER_DISCOVERY
TAG: LEEWAY_NATIVE_DXGI_PNP_LUID_PROBE_V3
WHO: Creator-authorized LeeWay Windows driver qualification.
WHAT: Correlate real PnP / Win32 video / services / D3DKMT / DXGI.
WHY: Never mistake service names or vendor physical GPUs for LeeWay OS registration.
WHERE: tests/virtual-gpu/windows-adapter-qualification.mjs.
WHEN: 2026-10-24.
HOW: Read-only native build probe with exact PnP and LUID.
AUTHORITY: Diagnostics only; not OS driver enrollment, KMD proof, or Veritas.
LICENSE: Existing LeeWay terms.
*/
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {classifyWindowsAdapter} from '../../native/windows/adapter-contract.mjs';
if(process.platform!=='win32')throw Error('WINDOWS_ONLY_PROBE');
const ps=[
"$ErrorActionPreference='Stop'",
"$pnp=@(Get-PnpDevice -Class Display | Select-Object FriendlyName,Status,InstanceId)",
"$video=@(Get-CimInstance Win32_VideoController | Select-Object Name,PNPDeviceID,DriverVersion,Status)",
"$services=@(Get-CimInstance Win32_SystemDriver | Select-Object Name,State,PathName)",
"[pscustomobject]@{pnp=$pnp;video=$video;services=$services}|ConvertTo-Json -Depth 6 -Compress"
].join('\n');
const data=JSON.parse(execFileSync('powershell.exe',
 ['-NoProfile','-NonInteractive','-Command',ps],
 {encoding:'utf8',timeout:20000,maxBuffer:4*1024*1024}));
const array=v=>v==null?[]:Array.isArray(v)?v:[v];
const video=array(data.video);
const nativePath=process.env.LEEWAY_DXGI_PNP_PROBE;
let native=null,diagnostic=null;
if(nativePath){
 try {
  const stdout=execFileSync(nativePath,[],{encoding:'utf8',timeout:15000,maxBuffer:4*1024*1024});
  const probe=JSON.parse(stdout);
  if(probe.schema!=='leeway.native.dxgi-pnp.v1' || probe.readOnly!==true ||
      !Array.isArray(probe.pnp) || !Array.isArray(probe.dxgi) ||
      probe.mappingMethod!=='SetupDi+D3DKMT+DXGI_LUID' ||
      probe.dxgi.some(x=>x.NativeMapping!==true || !x.PNPDeviceID || !x.AdapterLuid)){
   diagnostic='NATIVE_PROBE_SCHEMA_REJECTED';
  }else native=probe;
 } catch { diagnostic='NATIVE_DXGI_PROBE_FAILED_CLOSED'; }
}else diagnostic='NATIVE_DXGI_PNP_EXECUTABLE_NOT_SUPPLIED';
const pnp=native?native.pnp:array(data.pnp);
const services=native?native.pnp.flatMap(p=>{
 const s=array(data.services).find(z=>String(z.Name).toLowerCase()===String(p.ServiceName||'').toLowerCase());
 return s?[{...s,PNPDeviceID:p.InstanceId}]:[];
}):[];
const dxgi=native?native.dxgi:[];
const checked=classifyWindowsAdapter({pnp,video,services,dxgi});
const gates={
 pnpDisplayRecognized:checked.matchedPnP>0,
 videoControllerCorrelated:checked.correlatedVideo>0,
 runningLeeWayDriverAndDxgiPnPCorrelated:checked.nativeRecognized,
 computeCommandSubmissionVerified:false,
 independentReadbackVerified:false,
 diagnosticsTelemetryVerified:false,
 productionVeritasAuthorized:false
};
const result={
 schema:'leeway.gpu.windows.adapter-qualification.v3',
 observedAt:new Date().toISOString(),platform:'windows',probe:'read-only',
 nativeProbeState:native?'NATIVE_OS_CORRELATION_RECORDED':diagnostic,
 mappingMethod:native?.mappingMethod??'NONE',
 pnp,video,services:services.filter(s=>/leeway/i.test(s.Name)),
 dxgi:dxgi.filter(x=>/leeway/i.test(x.Description)||/leeway/i.test(x.PNPDeviceID)),
 nativeDxgiCount:native?.enumeratedDxgiCount??null,
 exactNativeMappings:native?.matchedDxgiAndPnPCount??null,
 matchedPnP:checked.matchedPnP,correlatedVideo:checked.correlatedVideo,
 nativeRecognition:checked.classification,recognizedAdapterLuid:checked.recognizedAdapterLuid,
 gates,
 outcome:checked.nativeRecognized?'NATIVE_ADAPTER_ENUMERATED_UNQUALIFIED':'NATIVE_ADAPTER_NOT_VERIFIED',
 caveat:'A native PnP/DXGI match still requires independent same-adapter command/readback and protected LeeWay Runtime evidence. Third-party GPUs are not the LeeWay GPU.'
};
const output=process.argv[2];if(!output)throw Error('OUTPUT_PATH_REQUIRED');
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({outcome:result.outcome,nativeProbeState:result.nativeProbeState,
 exactNativeMappings:result.exactNativeMappings,nativeDxgiCount:result.nativeDxgiCount,
 gates:result.gates,sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),output}));
