# Build AgentLab.apk from the static site bundled in app/src/main/assets.
# Manual pipeline: aapt2 compile/link -> jar inject assets -> javac -> d8 -> jar dex -> zipalign -> apksigner.
# No Gradle required. Works on Windows with JDK 21 at D:\work\software\jdk21.

$ErrorActionPreference = 'Stop'

$ROOT  = $PSScriptRoot
$JDK   = 'D:\work\software\jdk21'
$SDK   = Join-Path $ROOT 'android-sdk'
$BUILD = Join-Path $ROOT 'build'
$MAN   = Join-Path $ROOT 'app\src\main\AndroidManifest.xml'
$RES   = Join-Path $ROOT 'app\src\main\res'
$ASSETS= Join-Path $ROOT 'app\src\main\assets'
$JAVA  = Join-Path $ROOT 'app\src\main\java\com\agentlab\app'
$OUT   = Join-Path $BUILD 'classes'
$KS    = Join-Path $ROOT 'release-key.jks'
$ALIAS = 'agentlab'
$PASS  = 'agentlab123'
$BT    = '36.0.0'

$env:JAVA_HOME = $JDK
$env:PATH = "$env:PATH;$JDK\bin"

function Run($cmd, $argsArr) {
    & $cmd @argsArr
    if ($LASTEXITCODE -ne 0) { throw "FAILED (exit $LASTEXITCODE): $cmd $($argsArr -join ' ')" }
}

function Download-File($url, $out) {
    Write-Host "  downloading $url"
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 900
}

# Move the directory under $Tmp that contains file $Marker so it becomes $Target.
function Place-InTmp($Tmp, $Target, $Marker) {
    $hit = Get-ChildItem $Tmp -Recurse -Filter $Marker | Select-Object -First 1
    if (-not $hit) { throw "Marker $Marker not found under $Tmp after extraction" }
    $src = $hit.DirectoryName
    if (Test-Path $Target) { Remove-Item $Target -Recurse -Force }
    Move-Item $src $Target -Force
}

function Install-Manual {
    # platform-tools
    if (-not (Test-Path (Join-Path $SDK 'platform-tools\adb.exe'))) {
        Write-Host '== downloading platform-tools ==' -ForegroundColor Yellow
        $z = Join-Path $ROOT 'pt.zip'
        Download-File 'https://dl.google.com/android/repository/platform-tools_r37.0.1-win.zip' $z
        Expand-Archive $z -DestinationPath $SDK -Force
        Remove-Item $z -Force
    }
    # platform android-34
    if (-not (Test-Path (Join-Path $SDK 'platforms\android-34\android.jar'))) {
        Write-Host '== downloading platform android-34 ==' -ForegroundColor Yellow
        $done = $false
        foreach ($c in @('platform-34-ext7_r03.zip','platform-34-ext7_r02.zip','platform-34-ext7_r01.zip')) {
            try {
                $z = Join-Path $ROOT 'pl.zip'
                Download-File "https://dl.google.com/android/repository/$c" $z
                $tmp = Join-Path $ROOT 'pl_tmp'
                if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
                Expand-Archive $z -DestinationPath $tmp -Force
                Place-InTmp $tmp (Join-Path $SDK 'platforms\android-34') 'android.jar'
                Remove-Item $z -Force
                $done = $true
                break
            } catch { Write-Host "   candidate $c failed" -ForegroundColor DarkGray }
        }
        if (-not $done) { throw 'Could not download platform android-34' }
    }
    # build-tools (use 36.0.0: its R8 fixes a d8 NPE on inner classes)
    if (-not (Test-Path (Join-Path $SDK "build-tools\$BT\aapt2.exe"))) {
        Write-Host '== downloading build-tools 36.0.0 ==' -ForegroundColor Yellow
        $z = Join-Path $ROOT 'bt.zip'
        Download-File 'https://dl.google.com/android/repository/build-tools_r36_windows.zip' $z
        $tmp = Join-Path $ROOT 'bt_tmp'
        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
        Expand-Archive $z -DestinationPath $tmp -Force
        Place-InTmp $tmp (Join-Path $SDK "build-tools\$BT") 'aapt2.exe'
        Remove-Item $z -Force
    }
}

function Ensure-Sdk {
    $needed = @(
        (Join-Path $SDK "build-tools\$BT\aapt2.exe"),
        (Join-Path $SDK "build-tools\$BT\zipalign.exe"),
        (Join-Path $SDK "build-tools\$BT\apksigner.bat"),
        (Join-Path $SDK 'platform-tools\adb.exe'),
        (Join-Path $SDK 'platforms\android-34\android.jar')
    )
    $missing = $needed | Where-Object { -not (Test-Path $_) }
    if ($missing.Count -eq 0) { Write-Host 'SDK already present, skipping install' -ForegroundColor Green; return }
    Write-Host "Missing $($missing.Count) SDK component(s), installing..." -ForegroundColor Yellow
    try {
        $sdkmgr = Join-Path $SDK 'cmdline-tools\latest\bin\sdkmanager.bat'
        & $sdkmgr --install 'platform-tools','platforms;android-34',"build-tools;$BT"
        if ($LASTEXITCODE -ne 0) { throw 'sdkmanager exit非0' }
    } catch {
        Write-Host "sdkmanager failed ($_), using direct download fallback" -ForegroundColor Yellow
        Install-Manual
    }
}

function Main {
    $aapt2    = Join-Path $SDK "build-tools\$BT\aapt2.exe"
    $d8       = Join-Path $SDK "build-tools\$BT\d8.bat"
    $zipalign = Join-Path $SDK "build-tools\$BT\zipalign.exe"
    $apksigner= Join-Path $SDK "build-tools\$BT\apksigner.bat"
    $androidJar = Join-Path $SDK 'platforms\android-34\android.jar'

    if (Test-Path $BUILD) { Remove-Item $BUILD -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $BUILD | Out-Null

    Write-Host '== 1/6 aapt2 compile resources ==' -ForegroundColor Cyan
    Run $aapt2 @('compile','--dir',$RES,'-o',(Join-Path $BUILD 'res.flata'))

    Write-Host '== 2/6 aapt2 link (no -A; assets injected via jar) ==' -ForegroundColor Cyan
    Run $aapt2 @('link','-o',(Join-Path $BUILD 'app-unsigned.apk'),'-I',$androidJar,
        '--manifest',$MAN,'-R',(Join-Path $BUILD 'res.flata'),
        '--auto-add-overlay','--no-version-vectors')

    Write-Host '== 3/6 inject assets via jar (guarantees / separators) ==' -ForegroundColor Cyan
    Push-Location $ROOT
    Run (Join-Path $JDK 'bin\jar.exe') @('uf',(Join-Path $BUILD 'app-unsigned.apk'),'-C','app\src\main','assets')
    Pop-Location

    Write-Host '== 4/6 javac + d8 (MainActivity -> classes.dex) ==' -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $OUT | Out-Null
    Run (Join-Path $JDK 'bin\javac.exe') @('--release','17','-encoding','UTF-8','-cp',$androidJar,
        '-d',$OUT,(Join-Path $JAVA 'MainActivity.java'))
    $classesJar = Join-Path $BUILD 'classes.jar'
    Run (Join-Path $JDK 'bin\jar.exe') @('cf',$classesJar,'-C',$OUT,'.')
    $DEXDIR = Join-Path $BUILD 'dex'
    New-Item -ItemType Directory -Force -Path $DEXDIR | Out-Null
    Run $d8 @('--min-api','21','--output',$DEXDIR,$classesJar)
    Run (Join-Path $JDK 'bin\jar.exe') @('uf',(Join-Path $BUILD 'app-unsigned.apk'),'-C',$DEXDIR,'classes.dex')

    Write-Host '== 5/6 zipalign ==' -ForegroundColor Cyan
    $aligned = Join-Path $BUILD 'app-aligned.apk'
    Run $zipalign @('-p','4',(Join-Path $BUILD 'app-unsigned.apk'),$aligned)

    Write-Host '== 6/6 sign ==' -ForegroundColor Cyan
    if (-not (Test-Path $KS)) {
        Run (Join-Path $JDK 'bin\keytool.exe') @('-genkeypair','-v','-keystore',$KS,
            '-alias',$ALIAS,'-storepass',$PASS,'-keypass',$PASS,'-keyalg','RSA',
            '-keysize','2048','-validity','10000','-dname','CN=AgentLab, OU=Dev, O=AgentLab, L=Unknown, S=Unknown, C=CN')
    }
    $final = Join-Path $ROOT 'AgentLab.apk'
    Run $apksigner @('sign','--ks',$KS,'--ks-key-alias',$ALIAS,
        '--ks-pass',"pass:$PASS",'--key-pass',"pass:$PASS",'--out',$final,$aligned)

    Write-Host '== verify ==' -ForegroundColor Cyan
    & $apksigner verify $final

    Write-Host "BUILD OK -> $final" -ForegroundColor Green
    Get-Item $final | Select-Object Name,Length
}

Ensure-Sdk
Main
