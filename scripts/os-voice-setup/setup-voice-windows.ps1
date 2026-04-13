# LEEWAY HEADER — CORE.DELIVERY.VOICE.WINDOWS
# Autoconfigures high-fidelity Neural voices for Windows 11

Write-Host "[LEEWAY] Unlocking High-Fidelity Windows Natural Voices..." -ForegroundColor Cyan

# Windows 11 Natural Voice Registry Unlock
# Bridges OneCore voices to the legacy Speech API
$Modern = "HKLM:\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens"
$Legacy = "HKLM:\SOFTWARE\Microsoft\Speech\Voices\Tokens"

if (Test-Path $Modern) {
    Get-ChildItem -Path $Modern | ForEach-Object {
        $name = $_.PSChildName
        $legacyPath = "$Legacy\$name"
        if (!(Test-Path $legacyPath)) {
            try {
                Copy-Item -Path $_.PSPath -Destination $Legacy -Recurse -ErrorAction SilentlyContinue
                Write-Host " [SUCCESS] Unlocked Natural Voice: $name" -ForegroundColor Green
            } catch {
                Write-Host " [NOTICE] Run as Admin to unlock more voices." -ForegroundColor Yellow
            }
        }
    }
}

# Now select the highest quality unlocked voice
Add-Type -AssemblyName System.speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$installedVoices = $synth.GetInstalledVoices() | Where-Object { $_.Enabled }

# Priority list for natural robotic authority
$priorityList = @("Microsoft David", "Microsoft Natural", "Microsoft Mark", "Microsoft Zira")
$selectedVoice = $null

foreach ($pref in $priorityList) {
    $match = $installedVoices | Where-Object { $_.VoiceInfo.Name -match $pref }
    if ($match) {
        $selectedVoice = $match.VoiceInfo.Name
        break
    }
}

if (-not $selectedVoice -and $installedVoices.Count -gt 0) {
    $selectedVoice = $installedVoices[0].VoiceInfo.Name
}

$configDir = Join-Path $HOME ".leeway"
if (-not (Test-Path $configDir)) { New-Item -ItemType Directory -Force -Path $configDir | Out-Null }

$configObj = @{
    os = "win32"
    voice_id = $selectedVoice
    method = "powershell"
}

$configObj | ConvertTo-Json | Out-File -FilePath (Join-Path $configDir "voice-config.json") -Encoding utf8

Write-Host "[LEEWAY] Windows Neural Bridge active. Locked: $selectedVoice" -ForegroundColor Cyan
