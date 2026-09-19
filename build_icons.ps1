Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $root 'source'
$iconDir = Join-Path $root 'icons'
New-Item -ItemType Directory -Force -Path $sourceDir, $iconDir | Out-Null

$generated = 'C:\Users\Lenovo\.codex\generated_images\01a0b870-dcd1-7d70-99d1-9eb801f2e313'
$sheets = @(
    @{
        File = 'exec-cdcc4f4e-2646-494b-9eba-eb71de68b09e.png'; Name = '01-phases.png'
        X = @(0, 455, 830, 1287); Y = @(0, 395, 775, 1222)
        Icons = @('01-recruitment', '02-training', '03-event', '04-creation', '05-concert', '06-awards', '07-critics', '08-karma', '09-reset')
    },
    @{
        File = 'exec-e5f7da5c-a725-484f-a59d-8a5b440841e7.png'; Name = '02-resources-mechanics.png'
        X = @(0, 590, 950, 1536); Y = @(0, 338, 675, 1024)
        Icons = @('10-cash', '11-royalties', '12-acclaim', '13-vocal', '14-creativity', '15-stamina', '16-collaboration', '17-legacy', '18-worker-placement')
    },
    @{
        File = 'exec-ebab480f-f6b0-4d4a-9d8c-a56ffbde3a0c.png'; Name = '03-keywords-status.png'
        X = @(0, 590, 950, 1536); Y = @(0, 338, 675, 1024)
        Icons = @('19-artpop', '20-jazz', '21-vocal-flip', '22-empress', '23-exhaustion', '24-disease', '25-stress', '26-banned-substances', '27-death')
    }
)

foreach ($sheet in $sheets) {
    $sourcePath = Join-Path $generated $sheet.File
    $copyPath = Join-Path $sourceDir $sheet.Name
    if (-not (Test-Path -LiteralPath $copyPath)) {
        Copy-Item -LiteralPath $sourcePath -Destination $copyPath
    }
    $bitmap = [System.Drawing.Bitmap]::new($copyPath)
    try {
        for ($row = 0; $row -lt 3; $row++) {
            for ($col = 0; $col -lt 3; $col++) {
                $index = $row * 3 + $col
                $left = [int]$sheet.X[$col]
                $top = [int]$sheet.Y[$row]
                $right = [int]$sheet.X[$col + 1]
                $bottom = [int]$sheet.Y[$row + 1]
                $minX = $right; $minY = $bottom; $maxX = $left; $maxY = $top

                for ($y = $top; $y -lt $bottom; $y++) {
                    for ($x = $left; $x -lt $right; $x++) {
                        if ($bitmap.GetPixel($x, $y).A -gt 12) {
                            if ($x -lt $minX) { $minX = $x }
                            if ($x -gt $maxX) { $maxX = $x }
                            if ($y -lt $minY) { $minY = $y }
                            if ($y -gt $maxY) { $maxY = $y }
                        }
                    }
                }

                if ($maxX -lt $minX) { throw "No icon found: $($sheet.Icons[$index])" }
                $sourceRect = [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
                $canvas = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
                try {
                    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
                    try {
                        $graphics.Clear([System.Drawing.Color]::Transparent)
                        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                        $scale = [Math]::Min(472.0 / $sourceRect.Width, 472.0 / $sourceRect.Height)
                        $w = [int][Math]::Round($sourceRect.Width * $scale)
                        $h = [int][Math]::Round($sourceRect.Height * $scale)
                        $destination = [System.Drawing.Rectangle]::new([int]((512 - $w) / 2), [int]((512 - $h) / 2), $w, $h)
                        $graphics.DrawImage($bitmap, $destination, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
                    } finally { $graphics.Dispose() }
                    $canvas.Save((Join-Path $iconDir ($sheet.Icons[$index] + '.png')), [System.Drawing.Imaging.ImageFormat]::Png)
                } finally { $canvas.Dispose() }
            }
        }
    } finally { $bitmap.Dispose() }
}

$labels = @(
    'Recruitment', 'Training & Care', 'Event', 'Album Creation', 'Live Show', 'Grammy Awards', 'Critics', 'Karma', 'Reset',
    'Cash', 'Royalties', 'Acclaim', 'Vocal', 'Creativity', 'Stamina', 'Collaboration', 'Legacy', 'Worker Placement',
    'Artpop', 'Jazz', 'Vocal Flip', 'Empress', 'Exhaustion', 'Illness', 'Stress', 'Banned Substances', 'Death'
)
$allFiles = Get-ChildItem -LiteralPath $iconDir -Filter '*.png' | Sort-Object Name
$preview = [System.Drawing.Bitmap]::new(1800, 2330, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
try {
    $g = [System.Drawing.Graphics]::FromImage($preview)
    try {
        $g.Clear([System.Drawing.Color]::FromArgb(11, 24, 42))
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $titleFont = [System.Drawing.Font]::new('Microsoft YaHei', 29, [System.Drawing.FontStyle]::Bold)
        $labelFont = [System.Drawing.Font]::new('Microsoft YaHei', 19, [System.Drawing.FontStyle]::Regular)
        $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(240, 203, 133))
        $muted = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(190, 205, 219))
        try {
            $g.DrawString('RECORD LABEL CARD GAME · ICONS', $titleFont, $gold, 80, 42)
            for ($i = 0; $i -lt $allFiles.Count; $i++) {
                $col = $i % 5
                $row = [int][Math]::Floor($i / 5)
                $x = 70 + $col * 345
                $y = 150 + $row * 355
                $icon = [System.Drawing.Image]::FromFile($allFiles[$i].FullName)
                try { $g.DrawImage($icon, $x + 40, $y, 265, 265) } finally { $icon.Dispose() }
                $size = $g.MeasureString($labels[$i], $labelFont)
                $g.DrawString($labels[$i], $labelFont, $muted, [float]($x + 172 - $size.Width / 2), [float]($y + 268))
            }
        } finally {
            $titleFont.Dispose(); $labelFont.Dispose(); $gold.Dispose(); $muted.Dispose()
        }
    } finally { $g.Dispose() }
    $preview.Save((Join-Path $root 'icons-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally { $preview.Dispose() }

Write-Output "Created $($allFiles.Count) icons and icons-preview.png"
