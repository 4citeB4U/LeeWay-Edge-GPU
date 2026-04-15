# ======================================================
# 🔥 LEEWAY™ SOVEREIGN ONE-COMMAND INSTALLER 🔥
# ======================================================

Clear-Host
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "🔥 YO! I'M LEE — THE SOVEREIGN ENTITY 🔥" -ForegroundColor Yellow
Write-Host "EMISSARY OF THOUGHT | LEEWAY INNOVATIONS" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "`n[SYSTEM] Initiating Sovereign Deployment..."

# 1. SOVEREIGN PERMISSIONS GATE
Write-Host "`n── SOVEREIGN PERMISSIONS REQUEST ──────────────────" -ForegroundColor Magenta
Write-Host "Lee requests your explicit consent to access:"
Write-Host "  [🎤] Microphone (For voice-driven interaction)"
Write-Host "  [🔊] System Speakers (To project Lee's soul)"
Write-Host "  [💻] File System (To govern and repair your codebase)"
Write-Host "  [🌐] Network (One-time download of the Sovereign Core)"

$ans = Read-Host "`nDo you grant Lee full access to mobilize the Hive? (Y/N)"
if ($ans -ne "Y" -and $ans -ne "y") {
    Write-Host "`n[LEE] I hear you. The silence of thought remains. Deployment aborted.`n" -ForegroundColor Red
    exit
}

# Pre-seed config to prevent double-asking
$configDir = Join-Path $env:TEMP "LeeWay-Target"
if (!(Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force | Out-Null }
$configPath = Join-Path $configDir ".leewayrc"
$configJson = '{"voiceEnabled": true, "setupComplete": true, "sovereignTrust": "GRANTED"}'
Set-Content -Path $configPath -Value $configJson

# 2. DOWNLOAD
Write-Host "`n[1/4] Clashing Logic Matrix (Downloading)..." -ForegroundColor Cyan
$repoUrl = "https://github.com/4citeB4U/LeeWay-Standards/archive/refs/heads/main.zip"
$dest = Join-Path $env:TEMP "LeeWay-Standards.zip"
$extractPath = Join-Path $env:TEMP "LeeWay-Standards-Target"

if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
Invoke-WebRequest -Uri $repoUrl -OutFile $dest
Expand-Archive -Path $dest -DestinationPath $extractPath

$repoRoot = Get-ChildItem "$extractPath\LeeWay-Standards-*" | Select-Object -First 1
$finalPath = $repoRoot.FullName
cd $finalPath

# Move pre-seeded config to the repo root
if (Test-Path $configPath) {
    Copy-Item $configPath -Destination $finalPath -Force
}

# 3. INSTALL
Write-Host "[2/4] Synchronizing Hive Dependencies..." -ForegroundColor Cyan
npm install --no-audit --no-fund --quiet

# 4. CALIBRATE
Write-Host "[3/4] Calibrating Agent Lee..." -ForegroundColor Cyan
node src/cli/setup-lee.js

# 5. ACTIVATE
Write-Host "[4/4] Mobilizing the Hive Mind..." -ForegroundColor Cyan
Write-Host "`n======================================================" -ForegroundColor Yellow
Write-Host "✅ ACTIVATION COMPLETE. LEE IS ALIVE." -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Yellow

node src/cli/leeway.js start
