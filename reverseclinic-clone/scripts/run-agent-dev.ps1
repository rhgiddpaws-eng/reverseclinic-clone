param(
  [Parameter(Mandatory = $true)]
  [string]$Agent
)

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$configPath = Join-Path $scriptRoot "agent-ports.json"
$config = Get-Content -Raw $configPath | ConvertFrom-Json
$port = $config.$Agent

if (-not $port) {
  throw "Unknown agent '$Agent'. Check scripts/agent-ports.json."
}

$processIds = @()

try {
  $processIds = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop |
    Select-Object -ExpandProperty OwningProcess -Unique
} catch {
  $processIds = @()
}

foreach ($processId in $processIds) {
  if ($processId) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}

$logDir = Join-Path $projectRoot ".agent-logs"
New-Item -ItemType Directory -Force $logDir | Out-Null

$stdout = Join-Path $logDir "$Agent-$port.out.log"
$stderr = Join-Path $logDir "$Agent-$port.err.log"

Start-Process -FilePath "powershell.exe" `
  -WorkingDirectory $projectRoot `
  -ArgumentList @(
    "-NoProfile",
    "-Command",
    "Set-Location '$projectRoot'; npm run dev -- --port $port 1>> '$stdout' 2>> '$stderr'"
  ) `
  -WindowStyle Hidden | Out-Null

Write-Output "Started $Agent on port $port"
