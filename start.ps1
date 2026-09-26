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

function Clear-WebCache ([string]$Root) {
    $NextDir = Join-Path $Root "apps\web\.next"
    if (Test-Path $NextDir) {
        Write-Host " [*] Purging stale Next.js build cache (.next)..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $NextDir -ErrorAction SilentlyContinue
        Write-Host " [?] Cleaned apps/web/.next directory." -ForegroundColor Green
    }
}

function Test-NodeRuntime {
    try {
        $nodeVersion = & node -v
        $npmVersion = & npm -v
        Write-Host " [?] Runtime: Node.js $nodeVersion | npm $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host " [!] Node.js or npm is not installed or not in PATH." -ForegroundColor Red
        exit 1
    }
}

function Test-PortOccupied ([int]$Port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
        return ($null -ne $conn)
    } catch {
        return $false
    }
}

function Assert-PortAvailability ([int]$WebPort, [int]$WorkerPort, [bool]$WebOnly, [bool]$WorkersOnly) {
    if (-not $WorkersOnly -and (Test-PortOccupied -Port $WebPort)) {
        Write-Host " [!] Notice: Port $WebPort is currently in use." -ForegroundColor Yellow
        Write-Host "     If it is an existing Next.js dev server, it will reload or prompt for port." -ForegroundColor Gray
    }

    if (-not $WebOnly -and (Test-PortOccupied -Port $WorkerPort)) {
        Write-Host " [!] Notice: Port $WorkerPort is currently occupied." -ForegroundColor Yellow
        Write-Host "     To free port $WorkerPort, run: .\stop.ps1" -ForegroundColor Gray
    }
}

function Invoke-DatabaseSeed ([string]$Root) {
    Write-Host " [*] Running database seed script (npm run seed)..." -ForegroundColor Yellow
    Push-Location $Root
    try {
        npm run seed
        Write-Host " [?] Database seeding completed successfully." -ForegroundColor Green
    } catch {
        Write-Host " [!] Seeding notice/warning: $_" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
}

function Build-DistributablePackages ([string]$Root, [bool]$WebOnly) {
    $AdaptersDist = Join-Path $Root "packages\county-adapters\dist\index.js"
    if (-not (Test-Path $AdaptersDist)) {
        Write-Host " [*] Compiling @gieni/county-adapters bundle..." -ForegroundColor Yellow
        npm run build --workspace=@gieni/county-adapters
    }

    $WorkerDist = Join-Path $Root "apps\workers\dist\index.js"
    if (-not (Test-Path $WorkerDist) -and (-not $WebOnly)) {
        Write-Host " [*] Compiling @gieni/workers TypeScript bundle..." -ForegroundColor Yellow
        Push-Location (Join-Path $Root "apps\workers")
        try {
            npm run build
            Write-Host " [?] Workers compiled successfully." -ForegroundColor Green
        } catch {
            Write-Host " [!] Workers build notice: $_" -ForegroundColor Yellow
        } finally {
            Pop-Location
        }
    }
}

function Start-WorkerService ([string]$Root, [int]$WorkerPort) {
    Write-Host " [*] Starting @gieni/workers HTTP Service on port $WorkerPort ..." -ForegroundColor Cyan
    $WorkersCmd = @"
`$host.UI.RawUI.WindowTitle = 'Gieni OS - Worker Service (Port $WorkerPort)';
Set-Location '$Root';
`$env:PORT = '$WorkerPort';
npm run start --workspace=@gieni/workers
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $WorkersCmd
}

function Start-WebPortal ([string]$Root, [int]$WebPort) {
    Write-Host " [*] Starting @gieni/web Next.js Portal on port $WebPort ..." -ForegroundColor Cyan
    $WebCmd = @"
`$host.UI.RawUI.WindowTitle = 'Gieni OS - Web Portal (Port $WebPort)';
Set-Location '$Root';
`$env:PORT = '$WebPort';
npm run dev --workspace=@gieni/web
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $WebCmd
}

function Show-StartupSummary ([int]$WebPort, [int]$WorkerPort, [bool]$WebOnly, [bool]$WorkersOnly) {
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
}

function Open-WebBrowser ([int]$WebPort) {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$WebPort"
}

function Start-GieniMonorepo {
    param (
        [string]$Root,
        [int]$WebPort,
        [int]$WorkerPort,
        [bool]$Seed,
        [bool]$Clean,
        [bool]$WebOnly,
        [bool]$WorkersOnly,
        [bool]$NoBrowser
    )

    if ($Clean) {
        Clear-WebCache -Root $Root
    }

    Test-NodeRuntime
    Assert-PortAvailability -WebPort $WebPort -WorkerPort $WorkerPort -WebOnly $WebOnly -WorkersOnly $WorkersOnly

    if ($Seed) {
        Invoke-DatabaseSeed -Root $Root
    }

    Build-DistributablePackages -Root $Root -WebOnly $WebOnly

    if (-not $WebOnly) {
        Start-WorkerService -Root $Root -WorkerPort $WorkerPort
    }

    if (-not $WorkersOnly) {
        Start-WebPortal -Root $Root -WebPort $WebPort
    }

    Show-StartupSummary -WebPort $WebPort -WorkerPort $WorkerPort -WebOnly $WebOnly -WorkersOnly $WorkersOnly

    if (-not $NoBrowser -and (-not $WorkersOnly)) {
        Open-WebBrowser -WebPort $WebPort
    }
}

Start-GieniMonorepo `
    -Root $ProjectRoot `
    -WebPort $WebPort `
    -WorkerPort $WorkerPort `
    -Seed $Seed.IsPresent `
    -Clean $Clean.IsPresent `
    -WebOnly $WebOnly.IsPresent `
    -WorkersOnly $WorkersOnly.IsPresent `
    -NoBrowser $NoBrowser.IsPresent

