# LEEWAY HEADER — CORE.DELIVERY.INFERENCE.SETUP
# Downloads the prebuilt llama-server binary for local GGUF execution

Write-Host "[LEEWAY] Setting up Sovereign Inference Engine..." -ForegroundColor Cyan

$binDir = Join-Path (Get-Location) "bin"
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Force -Path $binDir | Out-Null }

$serverPath = Join-Path $binDir "llama-server.exe"

if (Test-Path $serverPath) {
    Write-Host "[LEEWAY] llama-server.exe already present at: $serverPath" -ForegroundColor Green
} else {
    Write-Host "[LEEWAY] llama-server.exe not found. Downloading latest release..." -ForegroundColor Yellow

    # Fetch the latest release info
    $releaseUrl = "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest"
    try {
        $release = Invoke-RestMethod -Uri $releaseUrl -Headers @{ "User-Agent" = "LeeWay-Agent" }
        
        # Find the Windows CPU binary asset - match various naming conventions
        $asset = $release.assets | Where-Object {
            $_.name -match "win" -and $_.name -match "x64" -and $_.name -match "\.zip$" -and $_.name -notmatch "cuda" -and $_.name -notmatch "vulkan"
        } | Select-Object -First 1

        if (-not $asset) {
            # Broader fallback - any windows zip
            $asset = $release.assets | Where-Object {
                $_.name -match "win" -and $_.name -match "\.zip$" -and $_.name -notmatch "cuda"
            } | Select-Object -First 1
        }

        if ($asset) {
            $downloadUrl = $asset.browser_download_url
            $zipPath = Join-Path $binDir "llama-cpp-release.zip"
            
            Write-Host "[LEEWAY] Downloading: $($asset.name)..." -ForegroundColor Cyan
            Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing

            Write-Host "[LEEWAY] Extracting..." -ForegroundColor Cyan
            Expand-Archive -Path $zipPath -DestinationPath $binDir -Force

            # Find and move llama-server.exe to the bin root
            $found = Get-ChildItem -Path $binDir -Recurse -Filter "llama-server.exe" | Select-Object -First 1
            if ($found -and $found.FullName -ne $serverPath) {
                Move-Item -Path $found.FullName -Destination $serverPath -Force
            }

            Remove-Item $zipPath -Force
            Write-Host "[LEEWAY] llama-server.exe installed at: $serverPath" -ForegroundColor Green
        } else {
            Write-Host "[LEEWAY] Could not find a matching Windows release." -ForegroundColor Red
            Write-Host "  Manual download: https://github.com/ggml-org/llama.cpp/releases" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[LEEWAY] Download failed: $_" -ForegroundColor Red
        Write-Host "  Manual download: https://github.com/ggml-org/llama.cpp/releases" -ForegroundColor Yellow
        Write-Host "  Place llama-server.exe in: $binDir" -ForegroundColor Yellow
    }
}

# Verify the model is present
$modelPath = Join-Path (Join-Path (Get-Location) "agents") "andrewzh_Absolute_Zero_Reasoner-Coder-3b-Q4_K_M.gguf"
if (Test-Path $modelPath) {
    $sizeMB = [math]::Round((Get-Item $modelPath).Length / 1MB, 1)
    Write-Host "[LEEWAY] GGUF Model found: $sizeMB MB" -ForegroundColor Green
} else {
    Write-Host "[LEEWAY] WARNING: GGUF model not found at: $modelPath" -ForegroundColor Red
}

# Test launch
if (Test-Path $serverPath) {
    Write-Host ""
    Write-Host "[LEEWAY] Sovereign Inference Engine is ready." -ForegroundColor Cyan
    Write-Host "  Binary:  $serverPath" -ForegroundColor White
    Write-Host "  Model:   $modelPath" -ForegroundColor White
    Write-Host "  Command: Tell Agent Lee to 'awaken' in the terminal." -ForegroundColor White
}
