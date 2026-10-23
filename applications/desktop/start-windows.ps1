param([switch]$NoDashboard)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$service=Join-Path $root 'service\service.mjs'
$configPath=Join-Path $root 'runtime.json'
if(-not (Test-Path $service)){throw 'LEEWAY_GPU_SERVICE_PACKAGE_MISSING'}
$node=(Get-Command 'node.exe' -ErrorAction Stop).Source
$url='http://127.0.0.1:4178/v1/status'
$config=$null
if(Test-Path $configPath){$config=Get-Content -LiteralPath $configPath -Raw|ConvertFrom-Json}
$mode=if($config -and $config.mode -in @('client','workstation')){$config.mode}else{'disabled'}
$expected=if($mode -eq 'client'){'REMOTE_GPU_PREVIEW'}elseif($mode -eq 'workstation'){'LOCAL_GPU_PREVIEW'}else{'UNAVAILABLE'}

function Get-LeeWayStatus {
 try { return (Invoke-RestMethod -Uri $url -TimeoutSec 2 -Method Get) } catch { return $null }
}
function Read-PairingKey {
 $keyFile=Join-Path $root 'pairing-key.dpapi'
 if(-not (Test-Path $keyFile)){throw 'GPU_PAIRING_KEY_REQUIRED'}
 Add-Type -AssemblyName System.Security
 $encrypted=Get-Content -LiteralPath $keyFile -Raw
 $sealed=[Convert]::FromBase64String($encrypted)
 $raw=[Security.Cryptography.ProtectedData]::Unprotect($sealed,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
 return [Text.Encoding]::UTF8.GetString($raw)
}

$current=Get-LeeWayStatus
if($current){
 if($current.serviceId -ne 'leeway.gpu.service'){throw 'LEEWAY_GPU_PORT_4178_OWNED_BY_OTHER_SERVICE'}
 if($current.previewInference -ne $expected){throw 'LEEWAY_GPU_RUNNING_SERVICE_CONFIG_MISMATCH_RESTART_REQUIRED'}
 if(-not $NoDashboard){Start-Process 'http://127.0.0.1:4178/';Write-Output 'LEEWAY_GPU_APP_OPEN'}
 else {Write-Output ('LEEWAY_GPU_'+$mode.ToUpper()+'_SERVICE_RUNNING')}
 exit 0
}

$env:LEEWAY_GPU_PORT='4178'
$env:LEEWAY_GPU_PREVIEW_MODE=$mode
if($mode -in @('client','workstation')){$env:LEEWAY_GPU_PAIRING_KEY=Read-PairingKey}
if($mode -eq 'client'){
 if(-not $config.remoteHost){throw 'GPU_REMOTE_HOST_REQUIRED'}
 $env:LEEWAY_GPU_REMOTE_HOST=[string]$config.remoteHost
 $env:LEEWAY_GPU_REMOTE_PORT=[string]$config.remotePort
 $env:LEEWAY_GPU_MODELS=(@($config.models)-join ',')
}
if($mode -eq 'workstation'){
 $bind=[string]$config.bindAddress
 if(-not $bind -or -not (Get-NetIPAddress -AddressFamily IPv4 -IPAddress $bind -ErrorAction SilentlyContinue)){
  throw 'GPU_WORKSTATION_BIND_ADDRESS_NOT_LOCAL'
 }
 $env:LEEWAY_GPU_WORKSTATION_BIND=$bind
 $env:LEEWAY_GPU_REMOTE_PORT=[string]$config.port
 $env:LEEWAY_GPU_OLLAMA_URL=[string]$config.ollamaUrl
 $env:LEEWAY_GPU_MODELS=(@($config.models)-join ',')
 $env:LEEWAY_GPU_DEVICE_NAME='NVIDIA GPU'
 $nvidia=Get-Command 'nvidia-smi.exe' -ErrorAction SilentlyContinue
 if($nvidia){$gpuName=& $nvidia.Source '--query-gpu=name' '--format=csv,noheader' 2>$null|Select-Object -First 1;if($gpuName){$env:LEEWAY_GPU_DEVICE_NAME=[string]$gpuName.Trim()}}
 try { $null=Invoke-RestMethod -Uri ($env:LEEWAY_GPU_OLLAMA_URL+'/api/tags') -TimeoutSec 2 }
 catch {
  $ollama=(Get-Command 'ollama.exe' -ErrorAction SilentlyContinue).Source
  if(-not $ollama){foreach($candidate in @((Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'),'C:\Program Files\Ollama\ollama.exe')){if(Test-Path $candidate){$ollama=$candidate;break}}}
  if(-not $ollama){throw 'OLLAMA_RUNTIME_NOT_INSTALLED'}
  $env:OLLAMA_HOST='127.0.0.1:21435'
  $env:OLLAMA_LLM_LIBRARY=[string]$config.ollamaLibrary
  if(-not $env:OLLAMA_LLM_LIBRARY){$env:OLLAMA_LLM_LIBRARY='cuda_v13'}
  Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
  $ready=$false
  for($i=0;$i -lt 60 -and -not $ready;$i++){
   Start-Sleep -Milliseconds 500
   try{$null=Invoke-RestMethod -Uri ($env:LEEWAY_GPU_OLLAMA_URL+'/api/tags') -TimeoutSec 2;$ready=$true}catch{}
  }
  if(-not $ready){throw 'OLLAMA_CUDA_RUNTIME_DID_NOT_START'}
 }
}

Start-Process -FilePath $node -ArgumentList ('"'+$service+'"') -WorkingDirectory (Split-Path $service) -WindowStyle Hidden
$ok=$false
for($i=0;$i -lt 30 -and -not $ok;$i++){
 Start-Sleep -Milliseconds 250
 $result=Get-LeeWayStatus
 if($result){$ok=($result.serviceId -eq 'leeway.gpu.service' -and $result.previewInference -eq $expected)}
}
if(-not $ok){throw 'LEEWAY_GPU_LOCAL_SERVICE_DID_NOT_START_IN_EXPECTED_MODE'}
if($mode -eq 'workstation'){
 $connected=$false
 for($i=0;$i -lt 12 -and -not $connected;$i++){
  Start-Sleep -Milliseconds 250
  $connection=Get-NetTCPConnection -LocalAddress ([string]$config.bindAddress) -LocalPort ([int]$config.port) -State Listen -ErrorAction SilentlyContinue
  $connected=[bool]$connection
 }
 if(-not $connected){throw 'LEEWAY_GPU_WORKSTATION_LISTENER_MISSING'}
}
if(-not $NoDashboard){Start-Process 'http://127.0.0.1:4178/';Write-Output 'LEEWAY_GPU_APP_OPEN'}
else{Write-Output ('LEEWAY_GPU_'+$mode.ToUpper()+'_SERVICE_RUNNING')}
