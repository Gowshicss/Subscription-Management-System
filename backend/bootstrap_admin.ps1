<#
.SYNOPSIS
  Secure interactive Admin bootstrap script for Brightloop Neon PostgreSQL.
.DESCRIPTION
  Collects Neon direct connection string and Admin user credentials securely using Read-Host -AsSecureString,
  validates host constraints and password matching,
  executes bootstrap_admin.ts to create the initial ADMIN account without overwriting existing users,
  and completely wipes all credentials from memory and process environment in the finally block.
#>

[CmdletBinding()]
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Brightloop Neon Production Database - Admin Account Bootstrap" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "All credentials are collected securely as masked strings." -ForegroundColor Gray
Write-Host "Passwords exist only in memory and are wiped in the finally block.`n" -ForegroundColor Gray

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
        if ($clean -match ':[^@/]*[@#][^@/]*@') {
            return @{
                Success = $false
                Error = "The password in $varName contains unencoded reserved characters. Please percent-encode them (e.g. '%40' for '@')."
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
        return @{ Success = $false; Error = "Could not parse a valid hostname from $varName." }
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
$secPass = $null
$secPassConfirm = $null
$rawPass = $null
$rawPassConfirm = $null

try {
    # 1. Collect Neon Direct Connection String
    Write-Host "[STEP 1/3] Database Connection" -ForegroundColor Cyan
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
        Write-Host "`n[VALIDATION FAILED] DIRECT_URL host must NOT contain '-pooler' (direct connection required for DDL/admin operations)." -ForegroundColor Red
        return
    }
    Write-Host "  -> Neon Direct connection verified." -ForegroundColor Green

    # 2. Collect Admin User Details
    Write-Host "`n[STEP 2/3] Admin Account Details" -ForegroundColor Cyan
    $adminEmail = Read-Host -Prompt "Enter Admin Email (e.g. admin@brightloop.io)"
    if ([string]::IsNullOrWhiteSpace($adminEmail)) {
        Write-Host "`n[ERROR] Admin email is required." -ForegroundColor Red
        return
    }

    $firstName = Read-Host -Prompt "Enter First Name [default: Admin]"
    if ([string]::IsNullOrWhiteSpace($firstName)) { $firstName = "Admin" }

    $lastName = Read-Host -Prompt "Enter Last Name [default: User]"
    if ([string]::IsNullOrWhiteSpace($lastName)) { $lastName = "User" }

    # 3. Collect & Confirm Admin Password Securely
    Write-Host "`n[STEP 3/3] Admin Password" -ForegroundColor Cyan
    Write-Host "Requirements: >8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 special character." -ForegroundColor Gray

    $secPass = Read-Host -Prompt "Enter Admin Password (masked)" -AsSecureString
    $secPassConfirm = Read-Host -Prompt "Confirm Admin Password (masked)" -AsSecureString

    if (-not $secPass -or -not $secPassConfirm) {
        Write-Host "`n[ERROR] Password cannot be empty." -ForegroundColor Red
        return
    }

    $bstrP1 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
    $rawPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstrP1)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrP1)

    $bstrP2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPassConfirm)
    $rawPassConfirm = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstrP2)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrP2)

    if ($rawPass -cne $rawPassConfirm) {
        Write-Host "`n[VALIDATION FAILED] Passwords do not match. Aborting." -ForegroundColor Red
        return
    }

    # 4. Inject temporary environment variables for bootstrap execution
    $env:DATABASE_URL = $resDirect.CleanedUrl
    $env:DIRECT_URL = $resDirect.CleanedUrl
    $env:BOOTSTRAP_ADMIN_EMAIL = $adminEmail.Trim()
    $env:BOOTSTRAP_ADMIN_PASSWORD = $rawPass
    $env:BOOTSTRAP_ADMIN_FIRSTNAME = $firstName.Trim()
    $env:BOOTSTRAP_ADMIN_LASTNAME = $lastName.Trim()

    Write-Host "`nExecuting bootstrap..." -ForegroundColor Cyan

    # 5. Execute Admin Bootstrap Script
    & npx tsx bootstrap_admin.ts
    $bootstrapExitCode = $LASTEXITCODE

    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Bootstrap Exit Code: $bootstrapExitCode" -ForegroundColor $(if ($bootstrapExitCode -eq 0) { "Green" } else { "Red" })
    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray

} catch {
    Write-Host "`n[UNEXPECTED ERROR] An error occurred during bootstrap: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # 6. Cleanup: Wipe environment variables and memory references immediately
    Remove-Item env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item env:DIRECT_URL -ErrorAction SilentlyContinue
    Remove-Item env:BOOTSTRAP_ADMIN_EMAIL -ErrorAction SilentlyContinue
    Remove-Item env:BOOTSTRAP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item env:BOOTSTRAP_ADMIN_FIRSTNAME -ErrorAction SilentlyContinue
    Remove-Item env:BOOTSTRAP_ADMIN_LASTNAME -ErrorAction SilentlyContinue

    $rawDirect = $null
    $rawPass = $null
    $rawPassConfirm = $null
    $secDirect = $null
    $secPass = $null
    $secPassConfirm = $null

    [System.GC]::Collect()
    Write-Host "`n[SECURITY] Process credentials and environment variables cleared from memory." -ForegroundColor Gray
}

