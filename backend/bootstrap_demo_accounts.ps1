<#
.SYNOPSIS
  Secure interactive evaluator demo account provisioning script for Brightloop Neon PostgreSQL.
.DESCRIPTION
  Collects Neon direct connection string securely via Read-Host -AsSecureString,
  validates host constraints,
  executes bootstrap_demo_accounts.ts to provision dedicated evaluator demo accounts
  (Admin, Staff, Customer with linked sample subscription & invoice)
  without altering, resetting, or modifying any real production operational accounts,
  and cleans all credentials from memory and process environment in the finally block.
#>

[CmdletBinding()]
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Brightloop Neon Production - Evaluator Demo Accounts Setup" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "All credentials are collected securely as masked strings." -ForegroundColor Gray
Write-Host "Real operational accounts and business data are left 100% untouched.`n" -ForegroundColor Gray

function Clean-PostgresUrl([string]$rawInput, [string]$varName) {
    if ([string]::IsNullOrWhiteSpace($rawInput)) {
        return @{ Success = $false; Error = "$varName is empty." }
    }

    $clean = $rawInput
    $clean = $clean -replace '\x1B\[[0-9;]*[a-zA-Z~]', ''
    $clean = $clean -replace '^[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+', ''
    $clean = $clean -replace '[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+$', ''

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
        return @{ Success = $false; Error = "Invalid URI format: $($_.Exception.Message)" }
    }

    if (-not $uri.IsAbsoluteUri) {
        return @{ Success = $false; Error = "$varName is not a valid absolute URI." }
    }

    $hostName = $uri.Host
    if ([string]::IsNullOrWhiteSpace($hostName)) {
        return @{ Success = $false; Error = "Could not parse hostname." }
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

try {
    # 1. Collect Neon Direct Connection String
    Write-Host "[STEP 1/2] Database Connection" -ForegroundColor Cyan
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
        Write-Host "`n[VALIDATION FAILED] DIRECT_URL host must NOT contain '-pooler' (direct connection required for admin operations)." -ForegroundColor Red
        return
    }
    Write-Host "  -> Neon Direct connection verified." -ForegroundColor Green

    Write-Host "`n[STEP 2/2] Provisioning Evaluator Demo Accounts" -ForegroundColor Cyan
    Write-Host "This will safely set up:" -ForegroundColor Gray
    Write-Host "  * demo.admin@brightloop.io    (Admin Role)" -ForegroundColor Gray
    Write-Host "  * demo.staff@brightloop.io    (Staff Role)" -ForegroundColor Gray
    Write-Host "  * demo.customer@brightloop.io (Customer Role with sample portal data)" -ForegroundColor Gray

    # Inject temporary environment variables in process memory
    $env:DATABASE_URL = $resDirect.CleanedUrl
    $env:DIRECT_URL = $resDirect.CleanedUrl

    Write-Host "`nExecuting demo provisioning..." -ForegroundColor Cyan
    & npx tsx bootstrap_demo_accounts.ts
    $exitCode = $LASTEXITCODE

    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Demo Provisioning Exit Code: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })
    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray

} catch {
    Write-Host "`n[ERROR] An error occurred: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Remove-Item env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item env:DIRECT_URL -ErrorAction SilentlyContinue
    $rawDirect = $null
    $secDirect = $null
    [System.GC]::Collect()
    Write-Host "`n[SECURITY] Process credentials and environment variables cleared from memory." -ForegroundColor Gray
}

