<#
.SYNOPSIS
    Stops the Gieni OS Monorepo servers (ports 3000 and 8080).

.DESCRIPTION
    Identifies and terminates processes specifically listening on port 3000 (@gieni/web)
    and port 8080 (@gieni/workers), releasing the ports cleanly.

.PARAMETER WebPort
    Port for the Next.js web portal (Default: 3000).

.PARAMETER WorkerPort
    Port for the background worker service (Default: 8080).

.EXAMPLE
    .\stop.ps1
#>

[CmdletBinding()]
param (
    [int]$WebPort = 3000,
    [int]$WorkerPort = 8080
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host " ====================================================================== " -ForegroundColor DarkYellow
Write-Host "   GIENI OS MONOREPO - STOPPING SERVERS                                 " -ForegroundColor Yellow
Write-Host " ====================================================================== " -ForegroundColor DarkYellow
Write-Host ""

function Kill-ProcessById ([int]$ProcessId, [int]$Port, [string]$ServiceName) {
    if ($ProcessId -le 0) {
        return
    }
    $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    $procName = "PID $ProcessId"
    if ($proc) {
        $procName = $proc.ProcessName
    }
    Write-Host " [*] Stopping $ServiceName ($procName on Port $Port, PID: $ProcessId)..." -ForegroundColor Cyan
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host " [✓] $ServiceName stopped." -ForegroundColor Green
}

function Stop-ProcessOnPort ([int]$Port, [string]$ServiceName) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
        if (-not $connections) {
            Write-Host " [i] No active process listening on Port $Port ($ServiceName)." -ForegroundColor Gray
            return
        }
        foreach ($conn in $connections) {
            Kill-ProcessById -ProcessId $conn.OwningProcess -Port $Port -ServiceName $ServiceName
        }
    } catch {
        Write-Host " [!] Error stopping process on Port $Port : $_" -ForegroundColor Red
    }
}

Stop-ProcessOnPort -Port $WebPort -ServiceName "@gieni/web Next.js Portal"
Stop-ProcessOnPort -Port $WorkerPort -ServiceName "@gieni/workers Cloud Run Service"

Write-Host ""
Write-Host " [✓] Cleanup completed." -ForegroundColor Green
Write-Host ""
