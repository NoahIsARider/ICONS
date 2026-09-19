$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceRoot = 'C:\Users\Lenovo\.codex\generated_images\01a0b870-dcd1-7d70-99d1-9eb801f2e313'
$output = Join-Path $root 'actor-agency\icons'
$sheets = Join-Path $root 'actor-agency\icon-sheets'
New-Item -ItemType Directory -Force -Path $output,$sheets | Out-Null
$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
$groups = @(
  @{ File='exec-d9a76c7c-ed89-4380-add0-ee3a1955dd69.png'; Names=@('01-recruitment','02-training','03-event','04-creation','05-concert','06-awards','07-critics','08-karma','09-reset') },
  @{ File='exec-e13622a8-ae71-4d7d-b1ef-fe4cf1fd883e.png'; Names=@('10-cash','11-royalties','12-acclaim','13-vocal','14-creativity','15-stamina','16-collaboration','17-legacy','18-worker-placement') },
  @{ File='exec-1c17610d-1fb5-4f6d-8e86-a1ad00f7dac8.png'; Names=@('19-artpop','20-jazz','21-vocal-flip','22-empress','23-exhaustion','24-disease','25-stress','26-banned-substances','27-death') }
)
for ($groupIndex=0; $groupIndex -lt $groups.Count; $groupIndex++) {
  $group=$groups[$groupIndex]
  $sheet=Join-Path $sheets ('actor-icons-{0}.png' -f ($groupIndex+1))
  if (!(Test-Path -LiteralPath $sheet)) { Copy-Item -LiteralPath (Join-Path $sourceRoot $group.File) -Destination $sheet }
  for ($index=0; $index -lt 9; $index++) {
    $x=($index%3)*418
    $y=[Math]::Floor($index/3)*418
    $target=Join-Path $output "$($group.Names[$index]).png"
    & $ffmpeg -hide_banner -loglevel error -y -i $sheet -vf "crop=418:418:$($x):$($y),scale=512:512:flags=lanczos" -frames:v 1 $target
    if ($LASTEXITCODE -ne 0) { throw "Failed to crop $target" }
  }
}
Write-Output ((Get-ChildItem -LiteralPath $output -Filter '*.png').Count)
