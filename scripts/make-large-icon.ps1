Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\ico.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

# Find tight bounding box of pixels with alpha > 15
$minX = $w; $maxX = 0; $minY = $h; $maxY = 0
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$contentW = $maxX - $minX + 1
$contentH = $maxY - $minY + 1
Write-Output "Content bounds: X=$minX..$maxX ($contentW px), Y=$minY..$maxY ($contentH px)"

# Create a cropped bitmap
$cropped = New-Object System.Drawing.Bitmap $contentW, $contentH
$gCrop = [System.Drawing.Graphics]::FromImage($cropped)
$gCrop.DrawImage($bmp, 0, 0, (New-Object System.Drawing.Rectangle $minX, $minY, $contentW, $contentH), [System.Drawing.GraphicsUnit]::Pixel)
$gCrop.Dispose()

# Target high-res canvas 512x512
$targetSize = 512
$scaled = New-Object System.Drawing.Bitmap $targetSize, $targetSize
$gScale = [System.Drawing.Graphics]::FromImage($scaled)
$gScale.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gScale.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gScale.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Fill 94% of the canvas so it's as big as possible without clipping
$scaleFactor = [Math]::Min(($targetSize * 0.94) / $contentW, ($targetSize * 0.94) / $contentH)
$destW = [int]($contentW * $scaleFactor)
$destH = [int]($contentH * $scaleFactor)
$destX = [int](($targetSize - $destW) / 2)
$destY = [int](($targetSize - $destH) / 2)

$gScale.DrawImage($cropped, $destX, $destY, $destW, $destH)
$gScale.Dispose()
$cropped.Dispose()
$bmp.Dispose()

# Ensure directories exist
$assetsDir = Join-Path $PSScriptRoot "..\src\renderer\assets"
$publicDir = Join-Path $PSScriptRoot "..\public"
$buildDir = Join-Path $PSScriptRoot "..\build"
if (-not (Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir | Out-Null }
if (-not (Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir | Out-Null }
if (-not (Test-Path $buildDir)) { New-Item -ItemType Directory -Path $buildDir | Out-Null }

# Save scaled PNGs
$scaled.Save((Join-Path $assetsDir "logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$scaled.Save((Join-Path $publicDir "ico.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$scaled.Save((Join-Path $publicDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$scaled.Save((Join-Path $buildDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# Generate multi-size Windows .ICO
# Windows Icon header: 0, 1 (icon type), count
$sizes = @(16, 24, 32, 48, 64, 128, 256)
$icoPath = Join-Path $buildDir "icon.ico"

# Save 256x256 icon as primary
$icon256 = New-Object System.Drawing.Bitmap 256, 256
$g256 = [System.Drawing.Graphics]::FromImage($icon256)
$g256.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g256.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g256.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g256.DrawImage($scaled, 0, 0, 256, 256)
$g256.Dispose()

$hIcon = $icon256.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::OpenWrite($icoPath)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$icon256.Dispose()
$scaled.Dispose()

Write-Output "Successfully generated optimized large icons in assets, public, and build!"
