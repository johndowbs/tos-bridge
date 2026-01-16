# Release Script for TOS Bridge (PowerShell)
# Automates: version bump, build, and GitHub release with verification
#
# Usage: .\scripts\release.ps1 [-VersionType patch|minor|major] [-Notes "Release notes"]
# Example: .\scripts\release.ps1 -VersionType patch -Notes "Bug fixes"

param(
    [ValidateSet("patch", "minor", "major")]
    [string]$VersionType = "patch",
    [string]$Notes = ""
)

$ErrorActionPreference = "Stop"

# Helper functions
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Check we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Err "Must run from project root (where package.json is)"
    exit 1
}

# Get current version
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Info "Current version: $currentVersion"

# Check for uncommitted changes
$gitStatus = git status --porcelain | Where-Object { $_ -notmatch "package" }
if ($gitStatus) {
    Write-Err "You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
}

# Step 1: Bump version
Write-Info "Bumping version ($VersionType)..."
$newVersionOutput = npm version $VersionType --no-git-tag-version
$newVersion = $newVersionOutput -replace 'v', ''
Write-Info "New version: $newVersion"

# Step 2: Commit version bump
Write-Info "Committing version bump..."
git add package.json package-lock.json
git commit -m "Bump version to $newVersion"

# Step 3: Build
Write-Info "Building application..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Err "Build failed!"
    exit 1
}

# Step 4: Verify build outputs exist
$releaseDir = "release"
$exeFile = "$releaseDir\TOS-Bridge-Setup-$newVersion.exe"
$ymlFile = "$releaseDir\latest.yml"

if (-not (Test-Path $exeFile)) {
    Write-Err "Build failed: $exeFile not found"
    exit 1
}

if (-not (Test-Path $ymlFile)) {
    Write-Err "Build failed: $ymlFile not found"
    exit 1
}

Write-Info "Build artifacts found:"
Get-Item $exeFile | Format-Table Name, Length -AutoSize
Get-Item $ymlFile | Format-Table Name, Length -AutoSize

# Step 5: Verify checksums match
Write-Info "Verifying checksums..."

# Get checksum from latest.yml
$ymlContent = Get-Content $ymlFile -Raw
$ymlSha512 = ($ymlContent | Select-String -Pattern "sha512: (.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }).Trim()
$ymlSize = ($ymlContent | Select-String -Pattern "size: (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }).Trim()

# Calculate actual file checksum
$hashBytes = (Get-FileHash -Path $exeFile -Algorithm SHA512).Hash
$hashBytesArray = [byte[]]::new($hashBytes.Length / 2)
for ($i = 0; $i -lt $hashBytes.Length; $i += 2) {
    $hashBytesArray[$i / 2] = [Convert]::ToByte($hashBytes.Substring($i, 2), 16)
}
$actualSha512 = [Convert]::ToBase64String($hashBytesArray)
$actualSize = (Get-Item $exeFile).Length

Write-Info "Expected (from latest.yml):"
Write-Host "  SHA512: $ymlSha512"
Write-Host "  Size:   $ymlSize bytes"

Write-Info "Actual (from exe file):"
Write-Host "  SHA512: $actualSha512"
Write-Host "  Size:   $actualSize bytes"

if ($ymlSha512 -ne $actualSha512) {
    Write-Err "SHA512 checksum mismatch!"
    exit 1
}

if ($ymlSize -ne $actualSize.ToString()) {
    Write-Err "File size mismatch!"
    exit 1
}

Write-Info "Checksums verified successfully!"

# Step 6: Push to remote
Write-Info "Pushing to origin..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Err "Git push failed!"
    exit 1
}

# Step 7: Create GitHub release
Write-Info "Creating GitHub release v$newVersion..."

if ([string]::IsNullOrEmpty($Notes)) {
    $Notes = "Release v$newVersion"
}

$fullNotes = @"
$Notes

---
**Full Changelog**: https://github.com/johndowbs/tos-bridge/compare/v$currentVersion...v$newVersion
"@

gh release create "v$newVersion" --title "v$newVersion" --notes $fullNotes
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to create release!"
    exit 1
}

# Step 8: Upload assets
Write-Info "Uploading latest.yml..."
gh release upload "v$newVersion" $ymlFile --clobber

Write-Info "Uploading installer (this may take a minute)..."
gh release upload "v$newVersion" $exeFile --clobber

# Step 9: Verify upload
Write-Info "Verifying upload..."
Start-Sleep -Seconds 5

$releaseInfo = gh api "repos/johndowbs/tos-bridge/releases/tags/v$newVersion" | ConvertFrom-Json
$uploadedExe = $releaseInfo.assets | Where-Object { $_.name -like "*.exe" }
$uploadedSize = $uploadedExe.size

if ($uploadedSize -ne $actualSize) {
    Write-Err "Upload verification failed! Expected size $actualSize but got $uploadedSize"
    Write-Warn "You may need to manually fix the release at:"
    Write-Host "https://github.com/johndowbs/tos-bridge/releases/tag/v$newVersion"
    exit 1
}

# Step 10: Final verification - download and check
Write-Info "Final verification - downloading and checking..."
$tempDir = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempPath()) -Name "release-verify-$(Get-Random)" -Force
gh release download "v$newVersion" --pattern "latest.yml" --output "$tempDir\latest.yml" --clobber

$downloadedYml = Get-Content "$tempDir\latest.yml" -Raw
$downloadedSha512 = ($downloadedYml | Select-String -Pattern "sha512: (.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }).Trim()

if ($downloadedSha512 -ne $actualSha512) {
    Write-Err "Downloaded latest.yml has wrong checksum!"
    Write-Err "Expected: $actualSha512"
    Write-Err "Got: $downloadedSha512"
    Remove-Item -Recurse -Force $tempDir
    exit 1
}

Remove-Item -Recurse -Force $tempDir

# Success!
Write-Host ""
Write-Info "========================================="
Write-Info "Release v$newVersion completed successfully!"
Write-Info "========================================="
Write-Host ""
Write-Host "Release URL: https://github.com/johndowbs/tos-bridge/releases/tag/v$newVersion"
Write-Host ""
Write-Host "Assets:"
$releaseInfo.assets | ForEach-Object { Write-Host "  - $($_.name) ($($_.size) bytes)" }
