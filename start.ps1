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

function Assert-PortAvailability ($Options) {
    if (-not $Options.WorkersOnly -and (Test-PortOccupied -Port $Options.WebPort)) {
        Write-Host " [!] Notice: Port $($Options.WebPort) is currently in use." -ForegroundColor Yellow
        Write-Host "     If it is an existing Next.js dev server, it will reload or prompt for port." -ForegroundColor Gray
    }

    if (-not $Options.WebOnly -and (Test-PortOccupied -Port $Options.WorkerPort)) {
        Write-Host " [!] Notice: Port $($Options.WorkerPort) is currently occupied." -ForegroundColor Yellow
        Write-Host "     To free port $($Options.WorkerPort), run: .\stop.ps1" -ForegroundColor Gray
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

function Invoke-PackageCompilation ([string]$Root, [bool]$WebOnly) {
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

function Start-NpmWorkspaceProcess ([string]$Workspace, [string]$Script, [int]$Port) {
    $Title = "Gieni OS - $Workspace (Port $Port)"
    Write-Host " [*] Starting $Workspace on port $Port ..." -ForegroundColor Cyan
    $Cmd = "`$host.UI.RawUI.WindowTitle = '$Title'; Set-Location '$ProjectRoot'; `$env:PORT = '$Port'; npm run $Script --workspace=$Workspace"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $Cmd
}

function Show-StartupSummary ($Options) {
    Write-Host ""
    Write-Host " [?] Gieni OS Services Dispatched!" -ForegroundColor Green
    Write-Host ""
    Write-Host " ---------------------------------------------------------------------- " -ForegroundColor DarkGray
    if (-not $Options.WorkersOnly) {
        Write-Host "   • Web App (Operator Console): http://localhost:$($Options.WebPort)" -ForegroundColor White
    }
    if (-not $Options.WebOnly) {
        Write-Host "   • Worker Service Health:      http://localhost:$($Options.WorkerPort)/healthz" -ForegroundColor White
        Write-Host "   • Worker Webhook Task URL:    http://localhost:$($Options.WorkerPort)/tasks/deliver" -ForegroundColor White
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

function Start-GieniMonorepo ($Options) {
    if ($Options.Clean) {
        Clear-WebCache -Root $Options.Root
    }

    Test-NodeRuntime
    Assert-PortAvailability $Options

    if ($Options.Seed) {
        Invoke-DatabaseSeed -Root $Options.Root
    }

    Invoke-PackageCompilation -Root $Options.Root -WebOnly $Options.WebOnly

    if (-not $Options.WebOnly) {
        Start-NpmWorkspaceProcess `
            -Workspace "@gieni/workers" `
            -Script "start" `
            -Port $Options.WorkerPort
    }

    if (-not $Options.WorkersOnly) {
        Start-NpmWorkspaceProcess `
            -Workspace "@gieni/web" `
            -Script "dev" `
            -Port $Options.WebPort
    }

    Show-StartupSummary $Options

    if (-not $Options.NoBrowser -and (-not $Options.WorkersOnly)) {
        Open-WebBrowser -WebPort $Options.WebPort
    }
}

$LaunchConfig = [PSCustomObject]@{
    Root        = $ProjectRoot
    WebPort     = $WebPort
    WorkerPort  = $WorkerPort
    Seed        = $Seed.IsPresent
    Clean       = $Clean.IsPresent
    WebOnly     = $WebOnly.IsPresent
    WorkersOnly = $WorkersOnly.IsPresent
    NoBrowser   = $NoBrowser.IsPresent
}

Start-GieniMonorepo $LaunchConfig

