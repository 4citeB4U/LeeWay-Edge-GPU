// Read-only Windows qualification. Does not install, register, or impersonate a GPU.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
const ps = String.raw`$ErrorActionPreference='Stop'; $d=@(Get-PnpDevice -Class Display | Select-Object FriendlyName,Status,InstanceId); $v=@(Get-CimInstance Win32_VideoController | Select-Object Name,PNPDeviceID,DriverVersion,Status); $s=@(Get-CimInstance Win32_SystemDriver | Where-Object {$_.Name -match 'LeeWay.*(GPU|Display|Graphics)'} | Select-Object Name,State,PathName); [pscustomobject]@{pnp=$d;video=$v;services=$s}|ConvertTo-Json -Depth 6 -Compress`;
const raw=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',ps],{encoding:'utf8',timeout:20000});
const data=JSON.parse(raw);
const array=v=>v==null?[]:Array.isArray(v)?v:[v];
const pnp=array(data.pnp),video=array(data.video),services=array(data.services);
const matches=pnp.filter(d=>/leeway/i.test(d.FriendlyName??''));
const qualified=matches.filter(d=>d.Status==='OK'&&video.some(v=>v.PNPDeviceID===d.InstanceId&&/leeway/i.test(v.Name??'')&&v.DriverVersion));
const result={schema:'leeway.gpu.windows.adapter-qualification.v1',observedAt:new Date().toISOString(),platform:'windows',probe:'read-only',pnp,video,services,leeWayDisplayMatches:matches,qualifiedVideoMatches:qualified,
 gates:{pnpDisplayRecognized:matches.some(d=>d.Status==='OK'),videoControllerCorrelated:qualified.length>0,driverServiceObserved:services.length>0,computeCommandSubmissionVerified:false,webGpuAdapterVerified:false,diagnosticsTelemetryVerified:false},
 outcome:qualified.length?'ENUMERATED_NOT_YET_COMPUTE_QUALIFIED':'NATIVE_ADAPTER_NOT_ENUMERATED',
 caveat:'PnP display and Win32_VideoController correlation is a necessary diagnostic, not proof of WDDM conformance, independent hardware, WebGPU integration, or compute correctness.'};
const output=process.argv[2];if(!output)throw Error('OUTPUT_PATH_REQUIRED');
fs.writeFileSync(output,JSON.stringify(result,null,2));
const bytes=fs.readFileSync(output);console.log(JSON.stringify({outcome:result.outcome,gates:result.gates,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),output}));
