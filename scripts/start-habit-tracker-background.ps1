$ErrorActionPreference = "Stop"

$projectPath = Split-Path -Parent $PSScriptRoot
$portInUse = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if ($portInUse) {
  exit 0
}

$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
Start-Process `
  -FilePath $nodePath `
  -ArgumentList "server/dev.js" `
  -WorkingDirectory $projectPath `
  -WindowStyle Hidden
