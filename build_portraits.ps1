Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $root 'portrait-source'
$portraitDir = Join-Path $root 'portraits'
$assetDir = Join-Path $root 'assets'
New-Item -ItemType Directory -Force -Path $sourceDir, $portraitDir, $assetDir | Out-Null
$generated = 'C:\Users\Lenovo\.codex\generated_images\01a0b870-dcd1-7d70-99d1-9eb801f2e313'
$sheets = @(
    @{ File = 'exec-75cc1ef4-bd10-4351-a65f-0d1e0ba03ede.png'; Name='portrait-sheet-1.png'; IDs=@('adele','benji','cora','dante','nova','echo') },
    @{ File = 'exec-ce662ab4-595a-448d-8f2c-06d749fdae9a.png'; Name='portrait-sheet-2.png'; IDs=@('mara','felix','iris','juno','astra','reed') },
    @{ File = 'exec-57b5b57b-99b8-460e-86e0-1d46bf2c7e4d.png'; Name='portrait-sheet-3.png'; IDs=@('sol','luna','violet','orion','cleo','miles') },
    @{ File = 'exec-d135f65c-302e-4c30-ac6b-580ff23e398a.png'; Name='portrait-sheet-4.png'; IDs=@('ember','ash','zara','kit','sable','poppy') }
)

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg' | Select-Object -First 1
$quality = [System.Drawing.Imaging.EncoderParameters]::new(1)
$quality.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]92)
try {
    foreach ($sheet in $sheets) {
        $copyPath = Join-Path $sourceDir $sheet.Name
        if (-not (Test-Path -LiteralPath $copyPath)) { Copy-Item -LiteralPath (Join-Path $generated $sheet.File) -Destination $copyPath }
        $source = [System.Drawing.Bitmap]::new($copyPath)
        try {
            $cellWidth = [int]($source.Width / 3)
            $cellHeight = [int]($source.Height / 2)
            for ($i = 0; $i -lt 6; $i++) {
                $rectangle = [System.Drawing.Rectangle]::new(($i % 3) * $cellWidth, [int][Math]::Floor($i / 3) * $cellHeight, $cellWidth, $cellHeight)
                $output = [System.Drawing.Bitmap]::new(350, 525)
                try {
                    $g = [System.Drawing.Graphics]::FromImage($output)
                    try {
                        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                        $g.DrawImage($source, [System.Drawing.Rectangle]::new(0,0,350,525), $rectangle, [System.Drawing.GraphicsUnit]::Pixel)
                    } finally { $g.Dispose() }
                    $output.Save((Join-Path $portraitDir ($sheet.IDs[$i] + '.jpg')), $codec, $quality)
                } finally { $output.Dispose() }
            }
        } finally { $source.Dispose() }
    }
} finally { $quality.Dispose() }

$tablePath = Join-Path $assetDir 'record-table.png'
if (-not (Test-Path -LiteralPath $tablePath)) { Copy-Item -LiteralPath (Join-Path $generated 'exec-04d6addb-ee06-4bbf-84b3-0ff22d1c73fa.png') -Destination $tablePath }
Write-Output "Created $((Get-ChildItem -LiteralPath $portraitDir -Filter '*.jpg').Count) portraits and a tabletop background."
