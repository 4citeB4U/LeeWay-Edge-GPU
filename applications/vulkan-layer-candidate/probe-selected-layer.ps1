$ErrorActionPreference='Stop'
$pref=Join-Path $env:LOCALAPPDATA 'LeeWayGPU\preferences.json'
$requested=$false
if(Test-Path $pref){
 $state=Get-Content $pref -Raw | ConvertFrom-Json
 if($state.schema -ne 'leeway.gpu.preference.v1' -or $state.requestedEnabled -isnot [bool]){throw 'GPU_PREFERENCE_INVALID'}
 $requested=$state.requestedEnabled
}
$build=Join-Path $PSScriptRoot 'build'
$layer='VK_LAYER_LEEWAY_gpu_optin'
$layerLog=''
Remove-Item Env:VK_LAYER_PATH,Env:VK_INSTANCE_LAYERS,Env:VK_LOADER_DEBUG -ErrorAction SilentlyContinue
if($requested){
 if(-not(Test-Path (Join-Path $build 'leeway_gpu_layer.dll'))){throw 'GPU_VULKAN_LAYER_NOT_BUILT'}
 if(-not(Test-Path (Join-Path $build ($layer+'.json')))){throw 'GPU_VULKAN_LAYER_MANIFEST_MISSING'}
 $env:VK_LAYER_PATH=$build
 $env:VK_INSTANCE_LAYERS=$layer
 $env:VK_LOADER_DEBUG='layer'
}
$ErrorActionPreference='Continue'
$output=& vulkaninfo.exe --summary 2>&1 | Out-String
$exitCode=$LASTEXITCODE
$ErrorActionPreference='Stop'
if($exitCode -ne 0){throw ('GPU_LAYER_PROBE_FAILED '+$exitCode)}
$loaded=$output -match 'Insert instance layer "VK_LAYER_LEEWAY_gpu_optin"'
if($requested -and -not $loaded){throw 'GPU_LAYER_REQUESTED_BUT_NOT_LOADED'}
if(-not $requested -and $loaded){throw 'GPU_LAYER_LOADED_WITH_PREFERENCE_OFF'}
if($output -notmatch 'Intel\(R\) Graphics' -or $output -notmatch 'NVIDIA GeForce RTX 5060 Laptop GPU'){throw 'GPU_PHYSICAL_ADAPTER_NOT_ENUMERATED'}
$mode=if($requested){'OPT_IN_CANDIDATE_LAYER_PASS_THROUGH'}else{'SYSTEM_NATIVE_VULKAN'}
Write-Output ('PREFERENCE_REQUESTED='+$requested)
Write-Output ('EFFECTIVE_DIAGNOSTIC_LAYER_MODE='+$mode)
Write-Output ('VULKAN_LAYER_LOADED='+$loaded)
Write-Output 'GPU_DISPATCH_GOVERNED=false'
Write-Output 'VULKAN_LAYER_PROBE=PASS'
