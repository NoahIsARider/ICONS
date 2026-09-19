$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$generated = 'C:\Users\Lenovo\.codex\generated_images\01a0b870-dcd1-7d70-99d1-9eb801f2e313'
$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source

$backgrounds = @(
  @{ File = 'exec-bbf5e2cb-5fb2-4477-93ad-92d49989bb17.png'; Target = 'actor-agency\film-set-table.png' },
  @{ File = 'exec-d2fc5a51-6a89-4ae8-adaf-31e466d15a32.png'; Target = 'ensemble-debut\debut-stage-table.png' }
)
foreach ($item in $backgrounds) {
  $target = Join-Path $root $item.Target
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  if (!(Test-Path -LiteralPath $target)) { Copy-Item -LiteralPath (Join-Path $generated $item.File) -Destination $target }
  Write-Output $target
}

$sheets = @(
  @{ File = 'exec-88b7685c-d6fa-4c3a-ae5d-fcc9c4f91a86.png'; Names = @('mei','malcolm','valeria','arjun') },
  @{ File = 'exec-d5842ff5-a0b4-4e2a-8a00-40ee8dfbd31c.png'; Names = @('rowan','kenji','imani','farid') },
  @{ File = 'exec-960ddbfe-7105-4f78-9d70-9793dd6e83ab.png'; Names = @('sasha','august','lucien','hana') },
  @{ File = 'exec-200fa59f-743f-4659-826e-54f4bcae5686.png'; Names = @('nadine','eiji','celeste','mateo') },
  @{ File = 'exec-c28559f2-c13e-476e-935c-d297e60aca91.png'; Names = @('yuna','leila','theo','graham') },
  @{ File = 'exec-7341ad2a-1c91-4db6-8417-fa9e5247c6f1.png'; Names = @('mira','jay','priya','finn') }
)
$portraitDir = Join-Path $root 'actor-agency\portraits'
$sheetDir = Join-Path $root 'actor-agency\source-sheets'
New-Item -ItemType Directory -Force -Path $portraitDir,$sheetDir | Out-Null
for ($sheetIndex = 0; $sheetIndex -lt $sheets.Count; $sheetIndex++) {
  $sheet = $sheets[$sheetIndex]
  $sheetPath = Join-Path $sheetDir ('actors-{0}.png' -f ($sheetIndex + 1))
  if (!(Test-Path -LiteralPath $sheetPath)) { Copy-Item -LiteralPath (Join-Path $generated $sheet.File) -Destination $sheetPath }
  for ($index = 0; $index -lt 4; $index++) {
    $x = ($index % 2) * 512
    $y = [Math]::Floor($index / 2) * 768
    $out = Join-Path $portraitDir "$($sheet.Names[$index]).jpg"
    & $ffmpeg -hide_banner -loglevel error -y -i $sheetPath -vf "crop=506:760:$($x + 3):$($y + 4)" -frames:v 1 -q:v 2 $out
    if ($LASTEXITCODE -ne 0) { throw "Failed to crop $out" }
    Write-Output $out
  }
}
