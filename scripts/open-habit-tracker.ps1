$ErrorActionPreference = "Stop"

$backgroundLauncher = Join-Path $PSScriptRoot "start-habit-tracker-background.ps1"
& $backgroundLauncher

$deadline = (Get-Date).AddSeconds(20)
do {
  $ready = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
  if (-not $ready) {
    Start-Sleep -Milliseconds 300
  }
} while (-not $ready -and (Get-Date) -lt $deadline)

if (-not $ready) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show(
    "Habit Tracker n'a pas pu démarrer. Lance npm run dev une fois pour voir l'erreur.",
    "Habit Tracker"
  ) | Out-Null
  exit 1
}

Start-Process "https://localhost:5173"
