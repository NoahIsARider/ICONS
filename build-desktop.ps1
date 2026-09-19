$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $root 'desktop-app'
New-Item -ItemType Directory -Force -Path $target | Out-Null

$files = @('index.html','actor.html','ensemble.html','game.css','game-app.mjs','engine.mjs','data.mjs','server.mjs','electron-main.cjs','electron-preload.cjs')
foreach ($file in $files) { Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $target $file) -Force }
foreach ($folder in @('icons','portraits','assets')) {
    $destination = Join-Path $target $folder
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    Copy-Item -Path (Join-Path (Join-Path $root $folder) '*') -Destination $destination -Recurse -Force
}

foreach ($edition in @('actor-agency','ensemble-debut')) {
    $source = Join-Path $root "dlc\$edition"
    $destination = Join-Path $target "dlc\$edition"
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    Get-ChildItem -LiteralPath $source -File | Where-Object { $_.Extension -in '.mjs','.css','.png' } | Copy-Item -Destination $destination -Force
    foreach ($folder in @('portraits','icons')) {
        $from = Join-Path $source $folder
        if (Test-Path -LiteralPath $from) {
            $to = Join-Path $destination $folder
            New-Item -ItemType Directory -Force -Path $to | Out-Null
            Copy-Item -Path (Join-Path $from '*') -Destination $to -Force
        }
    }
    $animation = Join-Path $source 'animation'
    if (Test-Path -LiteralPath $animation) {
        Get-ChildItem -LiteralPath $animation -Directory | ForEach-Object {
            $to = Join-Path (Join-Path $destination 'animation') $_.Name
            New-Item -ItemType Directory -Force -Path $to | Out-Null
            Copy-Item -Path (Join-Path $_.FullName '*-animated.png') -Destination $to -Force
        }
    }
}

Write-Output "Desktop game source staged in $target"
