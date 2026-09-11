Add-Type -AssemblyName System.Drawing

$srcLogo = Join-Path $PSScriptRoot "..\src\renderer\assets\logo.png"
$bmpSource = [System.Drawing.Bitmap]::FromFile($srcLogo)

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$pngBytesList = @()

foreach ($s in $sizes) {
    $canvas = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # For small sizes (16, 24, 32), fill 100% of the canvas so it's as big as possible on taskbar!
    $g.DrawImage($bmpSource, 0, 0, $s, $s)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $canvas.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList += ,$ms.ToArray()
    $ms.Dispose()
    $canvas.Dispose()
}

$bmpSource.Dispose()

# Build true multi-resolution ICO file
$icoStream = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $icoStream

# ICONDIR header
$bw.Write([UInt16]0) # Reserved
$bw.Write([UInt16]1) # Type: 1 = ICO
$bw.Write([UInt16]$sizes.Count) # Count

# Compute offsets
$headerSize = 6 + ($sizes.Count * 16)
$currentOffset = $headerSize

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    $data = $pngBytesList[$i]
    $bw.Write([Byte]$(if ($s -ge 256) { 0 } else { $s })) # bWidth
    $bw.Write([Byte]$(if ($s -ge 256) { 0 } else { $s })) # bHeight
    $bw.Write([Byte]0) # bColorCount
    $bw.Write([Byte]0) # bReserved
    $bw.Write([UInt16]1) # wPlanes
    $bw.Write([UInt16]32) # wBitCount
    $bw.Write([UInt32]$data.Length) # dwBytesInRes
    $bw.Write([UInt32]$currentOffset) # dwImageOffset
    $currentOffset += $data.Length
}

# Write PNG byte blocks
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $bw.Write($pngBytesList[$i])
}

$icoPath = Join-Path $PSScriptRoot "..\build\icon.ico"
[System.IO.File]::WriteAllBytes($icoPath, $icoStream.ToArray())
$bw.Dispose()
$icoStream.Dispose()

Write-Output "Successfully generated true multi-resolution icon.ico ($($sizes.Count) sizes, total bytes: $( (Get-Item $icoPath).Length ))"
