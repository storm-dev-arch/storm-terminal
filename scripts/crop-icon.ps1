Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\ico.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $bmp.Width
$h = $bmp.Height

$minX = $w
$maxX = 0
$minY = $h
$maxY = 0

for ($y = 100; $y -le 500; $y += 100) {
    for ($x = 100; $x -le 500; $x += 100) {
        $p = $bmp.GetPixel($x, $y)
        Write-Output "Pixel at ($x, $y): R=$($p.R), G=$($p.G), B=$($p.B), A=$($p.A)"
    }
}
