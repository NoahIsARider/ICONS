param([switch]$Rebuild)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
$sets = @(
    @{ Folder = 'actor-agency'; Name = 'clapper'; Source = 'exec-43b28ed0-9913-437b-91a6-54ea1953258e.png'; Duration = 0.12; Loop = $true },
    @{ Folder = 'actor-agency'; Name = 'award-spotlight'; Source = 'exec-4d13c4c4-6a2a-4f5f-ad39-88a89701aad0.png'; Duration = 0.20; Loop = $false },
    @{ Folder = 'ensemble-debut'; Name = 'debut-seats'; Source = 'exec-333411aa-f338-4088-a55e-db707e356761.png'; Duration = 0.32; Loop = $false },
    @{ Folder = 'ensemble-debut'; Name = 'stage-lights'; Source = 'exec-a7c6403f-85e4-46d8-b41f-381670dfc655.png'; Duration = 0.17; Loop = $true }
)
$generated = 'C:\Users\Lenovo\.codex\generated_images\01a0b870-dcd1-7d70-99d1-9eb801f2e313'
foreach ($set in $sets) {
    $directory = Join-Path $root "$($set.Folder)\animation\$($set.Name)"
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    $source = Join-Path $directory 'sprite-sheet.png'
    if (!(Test-Path -LiteralPath $source)) {
        Copy-Item -LiteralPath (Join-Path $generated $set.Source) -Destination $source
    }
    $concat = Join-Path $directory 'frames.txt'
    $entries = @()
    for ($i = 0; $i -lt 6; $i++) {
        $frame = Join-Path $directory ('frame-{0:d2}.png' -f ($i + 1))
        $x = ($i % 3) * 512
        $y = [Math]::Floor($i / 3) * 512
        if ($Rebuild -or !(Test-Path -LiteralPath $frame)) {
            & $ffmpeg -hide_banner -loglevel error -y -i $source -vf "crop=512:512:$($x):$($y)" -frames:v 1 $frame
            if ($LASTEXITCODE -ne 0) { throw "Failed to crop $frame" }
        }
        $entries += "file 'frame-$('{0:d2}' -f ($i + 1)).png'"
        $entries += "duration $($set.Duration.ToString('0.00', [System.Globalization.CultureInfo]::InvariantCulture))"
    }
    $entries += "file 'frame-06.png'"
    Set-Content -LiteralPath $concat -Value $entries -Encoding ascii
    $animation = Join-Path $directory "$($set.Name)-animated.png"
    & $ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $concat -vsync vfr -plays $(if ($set.Loop) { '0' } else { '1' }) -f apng $animation
    if ($LASTEXITCODE -ne 0) { throw "Failed to build $animation" }
    Write-Output $animation
}
