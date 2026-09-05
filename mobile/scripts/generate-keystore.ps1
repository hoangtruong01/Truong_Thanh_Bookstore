# ==============================================================================
# TRƯỜNG THÀNH BOOKSTORE — ANDROID RELEASE KEYSTORE GENERATOR (PowerShell)
# ==============================================================================
# Usage:
#   .\mobile\scripts\generate-keystore.ps1 [-KeyAlias <alias>] [-KeystorePath <path>]
# ==============================================================================

param(
    [string]$KeyAlias = "truongthanh_release_key",
    [string]$KeystorePath = "$PSScriptRoot\..\android\app\upload-keystore.jks"
)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "🔐 TRƯỜNG THÀNH BOOKSTORE — RELEASE KEYSTORE GENERATOR" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Resolve keytool executable
$KeytoolCmd = "keytool"
$KeytoolPath = (Get-Command $KeytoolCmd -ErrorAction SilentlyContinue)

if (-not $KeytoolPath) {
    # Check JAVA_HOME
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\keytool.exe")) {
        $KeytoolCmd = "$env:JAVA_HOME\bin\keytool.exe"
    } else {
        Write-Error "keytool not found! Please ensure Java JDK is installed and JAVA_HOME is configured."
        exit 1
    }
}

if (Test-Path $KeystorePath) {
    Write-Error "Keystore already exists at: $KeystorePath. Preserve the signing key; use a different path to generate a new key."
    exit 1
}

Write-Host "`nGenerating 2048-bit RSA Keystore..." -ForegroundColor Green
Write-Host "Target file: $KeystorePath"
Write-Host "Key alias:   $KeyAlias"
Write-Host "Validity:    10,000 days (27+ years)`n"

& $KeytoolCmd -genkey -v `
    -keystore $KeystorePath `
    -alias $KeyAlias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storetype JKS `
    -dname "CN=Truong Thanh Bookstore, OU=Mobile Engineering, O=Truong Thanh Co Ltd, L=Ninh Binh, ST=Ninh Binh, C=VN"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Keystore generated successfully at: $KeystorePath" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Copy 'mobile/android/key.properties.example' to 'mobile/android/key.properties'"
    Write-Host "2. Fill in your chosen passwords and set 'storeFile=../app/upload-keystore.jks'"
    Write-Host "3. Build release bundle: flutter build appbundle --release"
    Write-Host "======================================================================`n" -ForegroundColor Cyan
} else {
    Write-Error "Keystore generation failed with exit code $LASTEXITCODE."
    exit $LASTEXITCODE
}
