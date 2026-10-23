$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$sdk=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$tools=Join-Path $sdk 'build-tools\34.0.0'
$androidJar=Join-Path $sdk 'platforms\android-35\android.jar'
$build=Join-Path $root 'build'
$classes=Join-Path $build 'classes'
$dex=Join-Path $build 'dex'
New-Item -ItemType Directory -Force -Path $build,$classes,$dex | Out-Null
$javaFiles=Get-ChildItem (Join-Path $root 'src') -Filter '*.java' -Recurse | ForEach-Object FullName
& javac -source 8 -target 8 -cp $androidJar -d $classes $javaFiles
if($LASTEXITCODE -ne 0){throw 'JAVAC_FAILED'}
$classFiles=Get-ChildItem $classes -Filter '*.class' -Recurse | ForEach-Object FullName
& (Join-Path $tools 'd8.bat') --min-api 29 --lib $androidJar --output $dex $classFiles
if($LASTEXITCODE -ne 0){throw 'D8_FAILED'}
$unsigned=Join-Path $build 'unsigned.apk'
& (Join-Path $tools 'aapt2.exe') link --manifest (Join-Path $root 'AndroidManifest.xml') -I $androidJar -o $unsigned --min-sdk-version 29 --target-sdk-version 35
if($LASTEXITCODE -ne 0){throw 'AAPT_LINK_FAILED'}
& jar uf $unsigned -C $dex 'classes.dex'
if($LASTEXITCODE -ne 0){throw 'DEX_PACK_FAILED'}
$aligned=Join-Path $build 'aligned.apk'
& (Join-Path $tools 'zipalign.exe') -f -p 4 $unsigned $aligned
if($LASTEXITCODE -ne 0){throw 'ZIPALIGN_FAILED'}
$out=Join-Path $build 'LeeWayGPU-debug.apk'
& (Join-Path $tools 'apksigner.bat') sign --ks (Join-Path $env:USERPROFILE '.android\debug.keystore') --ks-pass pass:android --key-pass pass:android --out $out $aligned
if($LASTEXITCODE -ne 0){throw 'APK_SIGN_FAILED'}
& (Join-Path $tools 'apksigner.bat') verify --verbose $out
if($LASTEXITCODE -ne 0){throw 'APK_VERIFY_FAILED'}
Write-Output "SIGNED_DIAGNOSTIC_APK=$out"
$sha=[System.Security.Cryptography.SHA256]::Create()
$stream=[System.IO.File]::OpenRead($out)
try {$hash=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant()} finally {$stream.Dispose();$sha.Dispose()}
Write-Output "APK_SHA256=$hash"
