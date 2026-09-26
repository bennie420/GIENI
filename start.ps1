<#
.SYNOPSIS
    Starts the Gieni OS Monorepo Platform (apps/web and apps/workers).

.DESCRIPTION
    Launches:
    1. @gieni/web: Next.js App Router (Operator Console & Client Portal) on Port 3000.
    2. @gieni/workers: Node.js Background Ingestion & Webhook Service on Port 8080.
    Supports -Seed to initialize database records prior to startup.

.PARAMETER WebPort
    Port for the Next.js Web Console (Default: 3000).

.PARAMETER WorkerPort
    Port for the Background Worker Service (Default: 8080).

.PARAMETER Seed
    Run the database seed script (npm run seed) before starting servers.

.PARAMETER WebOnly
    Starts only the Next.js web application.

.PARAMETER WorkersOnly
    Starts only the background worker service.

.PARAMETER NoBrowser
    Do not automatically open the web browser upon startup.

.EXAMPLE
    .\start.ps1
    Starts both Web Portal (3000) and Worker Service (8080).

.EXAMPLE
    .\start.ps1 -Seed
    Seeds the database and launches both servers.
#>

[CmdletBinding()]
param (
    [int]$WebPort = 3000,
    [int]$WorkerPort = 8080,
    [switch]$Seed,
    [switch]$Clean,
    [switch]$WebOnly,
    [switch]$WorkersOnly,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

# Set Console Title
$host.UI.RawUI.WindowTitle = "Gieni OS Monorepo - Platform Launcher"

Write-Host ""
Write-Host " ====================================================================== " -ForegroundColor DarkCyan
Write-Host "   GIENI OS MONOREPO - PLATFORM LAUNCHER                                " -ForegroundColor Cyan
Write-Host "   Apps: @gieni/web (Next.js) & @gieni/workers (Cloud Run Service)       " -ForegroundColor DarkCyan
Write-Host " ====================================================================== " -ForegroundColor DarkCyan
Write-Host ""

# 0. Clean stale cache if requested
if ($Clean) {
    $NextDir = Join-Path $ProjectRoot "apps\web\.next"
    if (Test-Path $NextDir) {
        Write-Host " [*] Purging stale Next.js build cache (.next)..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $NextDir -ErrorAction SilentlyContinue
        Write-Host " [?] Cleaned apps/web/.next directory." -ForegroundColor Green
    }
}

# 1. Node & NPM Prerequisite Checks
try {
    $nodeVersion = & node -v
    $npmVersion = & npm -v
    Write-Host " [?] Runtime: Node.js $nodeVersion | npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host " [!] Node.js or npm is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Port Conflict Helper
function Test-PortOccupied ([int]$Port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
        return ($null -ne $conn)
    } catch {
        return $false
    }
}

if (-not $WorkersOnly -and (Test-PortOccupied -Port $WebPort)) {
    Write-Host " [!] Notice: Port $WebPort is currently in use." -ForegroundColor Yellow
    Write-Host "     If it is an existing Next.js dev server, it will reload or prompt for port." -ForegroundColor Gray
}

if (-not $WebOnly -and (Test-PortOccupied -Port $WorkerPort)) {
    Write-Host " [!] Notice: Port $WorkerPort is currently occupied." -ForegroundColor Yellow
    Write-Host "     To free port $WorkerPort, run: .\stop.ps1" -ForegroundColor Gray
}

# 3. Optional Database Seeding
if ($Seed) {
    Write-Host " [*] Running database seed script (npm run seed)..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    try {
        npm run seed
        Write-Host " [?] Database seeding completed successfully." -ForegroundColor Green
    } catch {
        Write-Host " [!] Seeding notice/warning: $_" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
}

# 3b. Ensure County Adapters build is available
$AdaptersDist = Join-Path $ProjectRoot "packages\county-adapters\dist\index.js"
if (-not (Test-Path $AdaptersDist)) {
    Write-Host " [*] Compiling @gieni/county-adapters bundle..." -ForegroundColor Yellow
    npm run build --workspace=@gieni/county-adapters
}

# 4. Ensure Workers build is available
$WorkerDist = Join-Path $ProjectRoot "apps\workers\dist\index.js"
if (-not (Test-Path $WorkerDist) -and (-not $WebOnly)) {
    Write-Host " [*] Compiling @gieni/workers TypeScript bundle..." -ForegroundColor Yellow
    Push-Location (Join-Path $ProjectRoot "apps\workers")
    try {
        npm run build
        Write-Host " [?] Workers compiled successfully." -ForegroundColor Green
    } catch {
        Write-Host " [!] Workers build notice: $_" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
}

# 5. Launch Worker Service (Port 8080)
if (-not $WebOnly) {
    Write-Host " [*] Starting @gieni/workers HTTP Service on port $WorkerPort ..." -ForegroundColor Cyan
    $WorkersCmd = @"
`$host.UI.RawUI.WindowTitle = 'Gieni OS - Worker Service (Port $WorkerPort)';
Set-Location '$ProjectRoot';
`$env:PORT = '$WorkerPort';
npm run start --workspace=@gieni/workers
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $WorkersCmd
}

# 6. Launch Next.js Web App (Port 3000)
if (-not $WorkersOnly) {
    Write-Host " [*] Starting @gieni/web Next.js Portal on port $WebPort ..." -ForegroundColor Cyan
    $WebCmd = @"
`$host.UI.RawUI.WindowTitle = 'Gieni OS - Web Portal (Port $WebPort)';
Set-Location '$ProjectRoot';
`$env:PORT = '$WebPort';
npm run dev --workspace=@gieni/web
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $WebCmd
}

# 7. Summary & URLs
Write-Host ""
Write-Host " [?] Gieni OS Services Dispatched!" -ForegroundColor Green
Write-Host ""
Write-Host " ---------------------------------------------------------------------- " -ForegroundColor DarkGray
if (-not $WorkersOnly) {
    Write-Host "   • Web App (Operator Console): http://localhost:$WebPort" -ForegroundColor White
}
if (-not $WebOnly) {
    Write-Host "   • Worker Service Health:      http://localhost:$WorkerPort/healthz" -ForegroundColor White
    Write-Host "   • Worker Webhook Task URL:    http://localhost:$WorkerPort/tasks/deliver" -ForegroundColor White
}
Write-Host " ---------------------------------------------------------------------- " -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Run .\stop.ps1 at any time to terminate both servers." -ForegroundColor DarkYellow
Write-Host ""

# 8. Auto-open browser
if (-not $NoBrowser -and (-not $WorkersOnly)) {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$WebPort"
}

