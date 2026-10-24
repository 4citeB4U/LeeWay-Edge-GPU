param([string]$BridgeGpuPackage='')
$ErrorActionPreference='Stop'
if(-not $BridgeGpuPackage){
 $workspace=Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
 $BridgeGpuPackage=Join-Path $workspace 'device-bridge-c34-build\packages\leeway-gpu-service'
}
$bundle=Join-Path $PSScriptRoot 'build\leeway-gpu-service'
$service=Join-Path $bundle 'service'
$gpuInference=Join-Path $bundle 'gpu-inference'
New-Item -Force -ItemType Directory -Path $service | Out-Null
New-Item -Force -ItemType Directory -Path $gpuInference | Out-Null
foreach($filename in @('service.mjs','index.mjs', 'client.mjs','preferences.mjs','dashboard.html','discovery.json','package.json')){
 $src=Join-Path $BridgeGpuPackage $filename
 if(-not (Test-Path $src)){throw ('MISSING_CANONICAL_SERVICE_FILE '+$src)}
 Copy-Item $src (Join-Path $service $filename) -Force
}
$gpuInferenceSource=Join-Path (Split-Path $BridgeGpuPackage -Parent) 'gpu-inference'
foreach($filename in @('index.mjs','ollama-gpu-adapter.mjs','remote-service.mjs','pairing.mjs')){
 $src=Join-Path $gpuInferenceSource $filename
 if(-not (Test-Path $src)){throw ('MISSING_GPU_INFERENCE_FILE '+$src)}
 Copy-Item $src (Join-Path $gpuInference $filename) -Force
}
Copy-Item (Join-Path $gpuInferenceSource 'pairing.mjs') (Join-Path $bundle 'pairing.mjs') -Force
foreach($filename in @('start-windows.ps1','install-windows.ps1','install-linux.sh')){
 Copy-Item (Join-Path $PSScriptRoot $filename) (Join-Path $bundle $filename) -Force
}
Copy-Item (Join-Path $PSScriptRoot 'README.md') (Join-Path $bundle 'README.md') -Force
$manifest=@{
 serviceId='leeway.gpu.service'
 packageVersion='0.2.0-remote-inference-preview'
 serviceSource=$BridgeGpuPackage
 backends=@('Windows-D3D12','Android-Vulkan','Linux-Vulkan')
 productionExecutionEnabled=$false
 remoteInferencePreview=$true
 defaultPort=4178
 systemWideGpuDriver=$false
 components=@('Formula','LDWMD','Continuum','CUDA model inference preview','Veritas')
}
$manifest|ConvertTo-Json -Depth 4 | Set-Content (Join-Path $bundle 'package-manifest.json') -Encoding UTF8
Write-Output ('LEEWAY_GPU_STANDALONE_BUNDLE='+$bundle)
