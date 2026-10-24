$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$sdk='C:\VulkanSDK\1.4.363.0'
$vs='C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat'
if(-not (Test-Path $vs)){throw 'VS_COMPILER_NOT_FOUND'}
if(-not (Test-Path "$sdk\Include\vulkan\vk_layer.h")){throw 'VULKAN_HEADERS_NOT_FOUND'}
$build=Join-Path $root 'build'
New-Item -ItemType Directory -Path $build -Force | Out-Null
$source=Join-Path $root 'leeway_layer.cpp'
$native=Join-Path $build 'leeway_gpu_layer.dll'
$script='call "'+$vs+'" >nul && cl.exe /nologo /std:c++17 /EHsc /O2 /LD /MD /I"'+$sdk+'\Include" "'+$source+'" /link /EXPORT:vkNegotiateLoaderLayerInterfaceVersion /OUT:"'+$native+'"'
cmd.exe /c $script
if($LASTEXITCODE -ne 0){throw ('LEEWAY_VULKAN_LAYER_BUILD_FAILED '+$LASTEXITCODE)}
$manifest=@{
 file_format_version='1.2.0'
 layer=@{
  name='VK_LAYER_LEEWAY_gpu_optin'
  type='GLOBAL'
  library_path='.\leeway_gpu_layer.dll'
  api_version='1.4.0'
  implementation_version='1'
  description='LeeWay GPU opt-in observation only - native dispatch unchanged'
 }
}
[System.IO.File]::WriteAllText((Join-Path $build 'VK_LAYER_LEEWAY_gpu_optin.json'),($manifest | ConvertTo-Json -Depth 4),[System.Text.UTF8Encoding]::new($false))
Write-Output ('LAYER_DLL='+$native)
Write-Output ('LAYER_MANIFEST='+(Join-Path $build 'VK_LAYER_LEEWAY_gpu_optin.json'))
