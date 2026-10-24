/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.TESTS.WINDOWS_ADAPTER_DISCOVERY
TAG: LEEWAY_NATIVE_GPU_FAIL_CLOSED_READ_ONLY_PROBE_V2
WHO: Creator-authorized LeeWay Windows qualification.
WHAT: Report actual Windows PnP, graphics service and VideoController inventory.
WHERE: tests/virtual-gpu. WHEN: 2026-10-24.
WHY: A friendly device label and matching VideoController alone are not a GPU.
HOW: Read-only CIM/PnP observations passed into the strict adapter contract.
AUTHORITY: No WDDM installation, no native command proof, no Veritas receipt.
LICENSE: Existing LeeWay repository terms.
*/
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {classifyWindowsAdapter} from '../../native/windows/adapter-contract.mjs';
const ps=String.raw`
$ErrorActionPreference='Stop'
$pnp=@(Get-PnpDevice -Class Display | Select-Object FriendlyName,Status,InstanceId)
$video=@(Get-CimInstance Win32_VideoController | Select-Object Name,PNPDeviceID,DriverVersion,Status)
$services=@(Get-CimInstance Win32_SystemDriver | Where-Object {$_.Name -match 'LeeWay.*(GPU|Display|Graphics)'} | Select-Object Name,State,PathName)
[pscustomobject]@{pnp=$pnp;video=$video;services=$services}|ConvertTo-Json -Depth 6 -Compress
`;
const raw=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',ps],
 {encoding:'utf8',timeout:20000});
const data=JSON.parse(raw),array=v=>v==null?[]:Array.isArray(v)?v:[v];
const pnp=array(data.pnp),video=array(data.video),services=array(data.services);
// This read-only probe does NOT implement DXGI LUID-to-PnP correlation.
// Never fill dxgi from VideoController names or invent adapter identifiers.
const strict=classifyWindowsAdapter({pnp,video,services,dxgi:[]});
const result={
 schema:'leeway.gpu.windows.adapter-qualification.v2',
 observedAt:new Date().toISOString(),platform:'windows',probe:'read-only',
 pnp,video,services,dxgiCorrelation:'NOT_IMPLEMENTED',
 matchedPnP:strict.matchedPnP,
 correlatedVideo:strict.correlatedVideo,
 nativeRecognition:strict.classification,
 gates:{
  pnpDisplayRecognized:strict.matchedPnP>0,
  videoControllerCorrelated:strict.correlatedVideo>0,
  driverServiceObserved:services.some(x=>String(x.State).toLowerCase()==='running'),
  dxgiPnpAndDriverCorrelated:false,
  computeCommandSubmissionVerified:false,
  independentReadbackVerified:false,
  diagnosticsTelemetryVerified:false
 },
 outcome:'NATIVE_ADAPTER_NOT_VERIFIED',
 caveat:'CPU renderer and PnP/video service names are not a Windows WDDM graphics adapter; DXGI PnP/LUID and real WDDM command proof are absent.'
};
const output=process.argv[2];if(!output)throw Error('OUTPUT_PATH_REQUIRED');
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({outcome:result.outcome,gates:result.gates,
 sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),output}));
