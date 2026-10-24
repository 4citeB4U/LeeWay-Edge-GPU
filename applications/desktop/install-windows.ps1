$ErrorActionPreference='Stop'
$source=Split-Path -Parent $MyInvocation.MyCommand.Path
$destination=Join-Path $env:LOCALAPPDATA 'LeeWayGPU'
New-Item -Force -ItemType Directory -Path $destination | Out-Null
Copy-Item (Join-Path $source 'service') $destination -Recurse -Force
Copy-Item (Join-Path $source 'gpu-inference') $destination -Recurse -Force
Copy-Item (Join-Path $source 'pairing.mjs') $destination -Force
Copy-Item (Join-Path $source 'start-windows.ps1') $destination -Force
$startMenu=Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$shell=New-Object -ComObject WScript.Shell
$link=$shell.CreateShortcut((Join-Path $startMenu 'LeeWay GPU.lnk'))
$link.TargetPath='powershell.exe'
$link.Arguments='-NoProfile -ExecutionPolicy Bypass -File "'+(Join-Path $destination 'start-windows.ps1')+'"'
$link.WorkingDirectory=$destination
$link.Description='LeeWay GPU workstation and remote inference preview; canonical execution remains governed'
$link.Save()
$startup=Join-Path $startMenu 'Startup'
$boot=$shell.CreateShortcut((Join-Path $startup 'LeeWay GPU Local Service.lnk'))
$boot.TargetPath='powershell.exe'
$boot.Arguments='-NoProfile -ExecutionPolicy Bypass -File "'+(Join-Path $destination 'start-windows.ps1')+'" -NoDashboard'
$boot.WorkingDirectory=$destination
$boot.Description='Start LeeWay GPU paired workstation or client service on sign-in'
$boot.Save()
Write-Output ('LEEWAY_GPU_WINDOWS_INSTALLED '+$destination)
Write-Output 'START_MENU_SHORTCUT LeeWay GPU'
