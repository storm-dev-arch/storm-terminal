Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\ico.png"
$buildDir = Join-Path $PSScriptRoot "..\build"
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
}

$source = [System.Drawing.Bitmap]::FromFile($srcPath)
$sizes = @(16, 32, 48, 64, 128, 256)

# Create 256x256 icon
$thumb = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($thumb)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($source, 0, 0, 256, 256)
$g.Dispose()

$hIcon = $thumb.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$icoPath = Join-Path $buildDir "icon.ico"
$fs = [System.IO.File]::OpenWrite($icoPath)
$icon.Save($fs)
$fs.Close()

$icon.Dispose()
$thumb.Dispose()
$source.Dispose()

Write-Output "Successfully generated $icoPath"
