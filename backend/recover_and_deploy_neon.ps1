<#
.SYNOPSIS
  Secure interactive recovery and deployment script for Brightloop Neon PostgreSQL.
.DESCRIPTION
  Collects the Neon DIRECT connection string securely using Read-Host -AsSecureString,
  validates that it is a Neon direct connection, performs preflight BOM verification,
  executes:
    1. npx prisma migrate resolve --rolled-back 0_init
    2. npx prisma migrate deploy
    3. Runs post-deployment verification of all 19 tables and 8 enums.
  Wipes all credentials from the process environment in the finally block.
#>

[CmdletBinding()]
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Brightloop Neon Production Database - Recovery & Deployment" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "All inputs are collected securely as masked strings." -ForegroundColor Gray
Write-Host "No credentials are saved to disk or printed in output.`n" -ForegroundColor Gray

# -----------------------------------------------------------------------------
# 1. PREFLIGHT LOCAL FILE CHECKS
# -----------------------------------------------------------------------------
Write-Host "[PREFLIGHT 1/3] Checking migration SQL file for UTF-8 BOM..." -ForegroundColor Cyan
$migrationSqlPath = Join-Path $scriptDir "prisma\migrations\0_init\migration.sql"

if (-not (Test-Path $migrationSqlPath)) {
    Write-Host "[FATAL ERROR] Migration SQL file not found at $migrationSqlPath" -ForegroundColor Red
    return
}

$rawBytes = [System.IO.File]::ReadAllBytes($migrationSqlPath)
if ($rawBytes[0] -eq 0xEF -and $rawBytes[1] -eq 0xBB -and $rawBytes[2] -eq 0xBF) {
    Write-Host "[FATAL ERROR] Migration SQL file still contains a UTF-8 BOM. Aborting." -ForegroundColor Red
    return
}

$firstLine = [System.Text.Encoding]::UTF8.GetString($rawBytes[0..12])
if ($firstLine -ne "-- CreateEnum") {
    Write-Host "[FATAL ERROR] Migration SQL does not start with '-- CreateEnum'. Found: '$firstLine'. Aborting." -ForegroundColor Red
    return
}
Write-Host "  -> Migration SQL file is clean UTF-8 without BOM." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 2. SECURE CREDENTIAL COLLECTION & VALIDATION
# -----------------------------------------------------------------------------
function Clean-PostgresUrl([string]$rawInput, [string]$varName) {
    if ([string]::IsNullOrWhiteSpace($rawInput)) {
        return @{ Success = $false; Error = "$varName is empty." }
    }

    $clean = $rawInput

    # Strip ANSI escape sequences
    $clean = $clean -replace '\x1B\[[0-9;]*[a-zA-Z~]', ''

    # Strip BOM, zero-width characters, non-breaking space, control characters, and whitespace from ends
    $clean = $clean -replace '^[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+', ''
    $clean = $clean -replace '[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+$', ''

    # Iteratively unwrap quotes and command wrappers
    $smartLeftDouble = [char]0x201C
    $smartRightDouble = [char]0x201D
    $smartLeftSingle = [char]0x2018
    $smartRightSingle = [char]0x2019

    $iteration = 0
    $changed = $true

    while ($changed -and $iteration -lt 5) {
        $iteration++
        $before = $clean

        if (($clean.StartsWith("'") -and $clean.EndsWith("'")) -or
            ($clean.StartsWith('"') -and $clean.EndsWith('"')) -or
            ($clean.StartsWith('`') -and $clean.EndsWith('`')) -or
            ($clean.StartsWith($smartLeftDouble) -and $clean.EndsWith($smartRightDouble)) -or
            ($clean.StartsWith($smartLeftSingle) -and $clean.EndsWith($smartRightSingle))) {
            if ($clean.Length -ge 2) {
                $clean = $clean.Substring(1, $clean.Length - 2).Trim()
            }
        }

        if ($clean -match '^(export\s+)?(DATABASE_URL|DIRECT_URL)\s*=\s*(.+)$') {
            $clean = $matches[3].Trim()
        } elseif ($clean -match '^psql\s+(-d\s+|--dbname=\s*)?(.+)$') {
            $clean = $matches[2].Trim()
        }

        $clean = $clean -replace '^[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+', ''
        $clean = $clean -replace '[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+$', ''

        if ($clean -eq $before) {
            $changed = $false
        }
    }

    if (-not ($clean -match '^(postgresql|postgres)://')) {
        return @{ Success = $false; Error = "$varName must start with 'postgresql://' or 'postgres://'." }
    }

    $uri = $null
    try {
        $uri = [System.Uri]$clean
    } catch {
        if ($clean -match ':[^@/]*[@#][^@/]*@') {
            return @{
                Success = $false
                Error = "The password in $varName appears to contain unencoded reserved characters. In PostgreSQL connection URIs, reserved characters in passwords must be percent-encoded (e.g. '%40' for '@')."
            }
        }
        return @{
            Success = $false
            Error = "$varName URI format is invalid and could not be parsed: $($_.Exception.Message)"
        }
    }

    if (-not $uri.IsAbsoluteUri) {
        return @{ Success = $false; Error = "$varName is not a valid absolute URI." }
    }

    if ($uri.Scheme -notin @("postgresql", "postgres")) {
        return @{ Success = $false; Error = "$varName scheme is '$($uri.Scheme)'. Expected 'postgresql' or 'postgres'." }
    }

    $hostName = $uri.Host
    if ([string]::IsNullOrWhiteSpace($hostName)) {
        return @{ Success = $false; Error = "Could not parse a valid hostname from the $varName URI authority." }
    }

    $isNeon = $hostName -like "*.neon.tech*"
    $isPooler = $hostName -like "*-pooler*"

    return @{
        Success = $true
        CleanedUrl = $clean
        Host = $hostName
        IsNeon = $isNeon
        IsPooler = $isPooler
    }
}

$secDirect = $null
$rawDirect = $null
$cleanDirect = $null

try {
    Write-Host "`n[PREFLIGHT 2/3] Collecting Neon Direct credentials..." -ForegroundColor Cyan
    $secDirect = Read-Host -Prompt "Enter Neon DIRECT connection string (DIRECT_URL without -pooler)" -AsSecureString

    if (-not $secDirect) {
        Write-Host "`n[ERROR] Direct connection string is required." -ForegroundColor Red
        return
    }

    $bstrD = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secDirect)
    $rawDirect = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstrD)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrD)

    $resDirect = Clean-PostgresUrl $rawDirect "DIRECT_URL"

    if (-not $resDirect.Success) {
        Write-Host "`n[VALIDATION FAILED] $($resDirect.Error)" -ForegroundColor Red
        return
    }

    if (-not $resDirect.IsNeon) {
        Write-Host "`n[VALIDATION FAILED] DIRECT_URL host does not belong to Neon (*.neon.tech)." -ForegroundColor Red
        return
    }

    if ($resDirect.IsPooler) {
        Write-Host "`n[VALIDATION FAILED] DIRECT_URL host must NOT contain '-pooler' (direct connection required for DDL/migration operations)." -ForegroundColor Red
        return
    }

    $cleanDirect = $resDirect.CleanedUrl
    Write-Host "  -> Neon Direct connection string verified successfully." -ForegroundColor Green

    # Inject for both DATABASE_URL and DIRECT_URL to prevent any localhost/.env fallback
    $env:DATABASE_URL = $cleanDirect
    $env:DIRECT_URL = $cleanDirect

    # -------------------------------------------------------------------------
    # 3. PREFLIGHT DATABASE STATE INSPECTION
    # -------------------------------------------------------------------------
    Write-Host "`n[PREFLIGHT 3/3] Inspecting current Neon database state..." -ForegroundColor Cyan
    & npx tsx inspect_db_metadata.ts
    $preflightExit = $LASTEXITCODE

    if ($preflightExit -ne 0) {
        Write-Host "`n[PREFLIGHT FAILED] Preflight database inspection failed (code $preflightExit). Aborting." -ForegroundColor Red
        return
    }

    # -------------------------------------------------------------------------
    # 4. USER CONFIRMATION GUARD
    # -------------------------------------------------------------------------
    Write-Host "`n================================================================" -ForegroundColor Yellow
    Write-Host " AUTHORIZATION REQUIRED: PRODUCTION MIGRATION RECOVERY" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host "Approved Operations to execute:" -ForegroundColor White
    Write-Host "  1. npx prisma migrate resolve --rolled-back 0_init" -ForegroundColor Cyan
    Write-Host "  2. npx prisma migrate deploy" -ForegroundColor Cyan
    Write-Host "  3. Automated post-deployment schema verification" -ForegroundColor Cyan
    Write-Host "`nTarget Database: Neon PostgreSQL (Production)`n" -ForegroundColor White

    $confirm = Read-Host -Prompt "To proceed with recovery and deployment, type RECOVER (or Enter to cancel)"

    if ($confirm -cne "RECOVER") {
        Write-Host "`n[ABORTED] Recovery cancelled by user. No database modifications were made." -ForegroundColor Yellow
        return
    }

    # -------------------------------------------------------------------------
    # 5. OPERATION A — MARK FAILED MIGRATION AS ROLLED BACK
    # -------------------------------------------------------------------------
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host " [OPERATION A] Marking failed migration as rolled-back..." -ForegroundColor Cyan
    Write-Host " Executing: npx prisma migrate resolve --rolled-back 0_init" -ForegroundColor Gray
    Write-Host "----------------------------------------------------------------`n" -ForegroundColor Cyan

    & npx prisma migrate resolve --rolled-back 0_init
    $resolveExit = $LASTEXITCODE

    if ($resolveExit -ne 0) {
        Write-Host "`n[FATAL] 'prisma migrate resolve' failed with exit code $resolveExit." -ForegroundColor Red
        Write-Host "Stopping immediately. Operation B will NOT be executed." -ForegroundColor Red
        return
    }
    Write-Host "`n[SUCCESS] Migration 0_init marked as rolled back." -ForegroundColor Green

    # -------------------------------------------------------------------------
    # 6. OPERATION B — APPLY CORRECTED MIGRATION
    # -------------------------------------------------------------------------
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host " [OPERATION B] Applying corrected migration 0_init..." -ForegroundColor Cyan
    Write-Host " Executing: npx prisma migrate deploy" -ForegroundColor Gray
    Write-Host "----------------------------------------------------------------`n" -ForegroundColor Cyan

    & npx prisma migrate deploy
    $deployExit = $LASTEXITCODE

    if ($deployExit -ne 0) {
        Write-Host "`n[FATAL] 'prisma migrate deploy' failed with exit code $deployExit." -ForegroundColor Red
        Write-Host "Stopping immediately. Inspect the Prisma error above." -ForegroundColor Red
        return
    }
    Write-Host "`n[SUCCESS] Migration 0_init applied successfully!" -ForegroundColor Green

    # -------------------------------------------------------------------------
    # 7. POST-DEPLOYMENT VERIFICATION
    # -------------------------------------------------------------------------
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host " [FINAL VERIFICATION] Verifying all schema objects in Neon..." -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------------`n" -ForegroundColor Cyan

    & npx tsx verify_post_deploy.ts
    $verifyExit = $LASTEXITCODE

    if ($verifyExit -eq 0) {
        Write-Host "`n================================================================" -ForegroundColor Green
        Write-Host " RECOVERY & DEPLOYMENT COMPLETE: ALL 19 TABLES & 8 ENUMS LIVE" -ForegroundColor Green
        Write-Host "================================================================" -ForegroundColor Green
    } else {
        Write-Host "`n[WARNING] Verification reported discrepancies (exit code $verifyExit)." -ForegroundColor Yellow
    }

} catch {
    Write-Host "`n[UNEXPECTED ERROR] An error occurred: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # 8. Cleanup: Wipe environment variables and memory references
    Remove-Item env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item env:DIRECT_URL -ErrorAction SilentlyContinue

    $rawDirect = $null
    $cleanDirect = $null
    $secDirect = $null

    [System.GC]::Collect()
    Write-Host "`n[SECURITY] Process environment variables and credentials cleared from memory." -ForegroundColor Gray
}

