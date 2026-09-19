$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $root 'desktop-app'
New-Item -ItemType Directory -Force -Path $target | Out-Null

$files = @('index.html','game.css','game-app.mjs','engine.mjs','data.mjs','server.mjs','electron-main.cjs','electron-preload.cjs')
foreach ($file in $files) { Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $target $file) -Force }
foreach ($folder in @('icons','portraits','assets')) {
    $destination = Join-Path $target $folder
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    Copy-Item -Path (Join-Path (Join-Path $root $folder) '*') -Destination $destination -Recurse -Force
}

Write-Output "Desktop game source staged in $target"
