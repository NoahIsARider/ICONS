Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root 'icons\11-royalties.png'
$output = Join-Path $root 'assets\app.ico'
$sizes = @(16, 32, 48, 256)
$images = @()
$bitmap = [System.Drawing.Bitmap]::new($source)
try {
    foreach ($size in $sizes) {
        $icon = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($icon)
            try {
                $graphics.Clear([System.Drawing.Color]::Transparent)
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.DrawImage($bitmap, 0, 0, $size, $size)
            } finally { $graphics.Dispose() }
            $memory = [System.IO.MemoryStream]::new()
            try { $icon.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png); $images += ,$memory.ToArray() }
            finally { $memory.Dispose() }
        } finally { $icon.Dispose() }
    }
} finally { $bitmap.Dispose() }

$stream = [System.IO.File]::Create($output)
$writer = [System.IO.BinaryWriter]::new($stream)
try {
    $writer.Write([uint16]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]$sizes.Count)
    $offset = 6 + 16 * $sizes.Count
    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $writer.Write([byte]($sizes[$i] % 256))
        $writer.Write([byte]($sizes[$i] % 256))
        $writer.Write([byte]0)
        $writer.Write([byte]0)
        $writer.Write([uint16]1)
        $writer.Write([uint16]32)
        $writer.Write([uint32]$images[$i].Length)
        $writer.Write([uint32]$offset)
        $offset += $images[$i].Length
    }
    foreach ($bytes in $images) { $writer.Write([byte[]]$bytes) }
} finally { $writer.Dispose() }
Write-Output "Created $output"
