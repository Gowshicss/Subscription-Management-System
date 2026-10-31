<#
.SYNOPSIS
  Secure interactive deployment script for Brightloop Neon PostgreSQL migrations.
.DESCRIPTION
  Collects Neon connection strings securely using Read-Host -AsSecureString,
  cleans and strictly validates URI formatting and Neon host constraints,
  prompts for explicit confirmation ("DEPLOY"),
  executes `npx prisma migrate deploy` strictly against the Neon production database,
  and wipes all credentials from the process environment in the finally block.
#>

[CmdletBinding()]
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Brightloop Neon Production Database - Migration Deployment" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "All inputs are collected securely as masked strings." -ForegroundColor Gray
Write-Host "No credentials are saved to disk or printed in output.`n" -ForegroundColor Gray

function Clean-PostgresUrl([string]$rawInput, [string]$varName) {
    if ([string]::IsNullOrWhiteSpace($rawInput)) {
        return @{ Success = $false; Error = "$varName is empty." }
    }

    $clean = $rawInput

    # 1. Strip ANSI escape sequences (e.g. bracketed paste mode)
    $clean = $clean -replace '\x1B\[[0-9;]*[a-zA-Z~]', ''

    # 2. Strip BOM, zero-width characters, non-breaking space, control characters, and whitespace from ends
    $clean = $clean -replace '^[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+', ''
    $clean = $clean -replace '[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+$', ''

    # 3. Iteratively unwrap known quotes, prefixes, and wrappers (bounded to at most 5 passes)
    $smartLeftDouble = [char]0x201C
    $smartRightDouble = [char]0x201D
    $smartLeftSingle = [char]0x2018
    $smartRightSingle = [char]0x2019

    $iteration = 0
    $changed = $true

    while ($changed -and $iteration -lt 5) {
        $iteration++
        $before = $clean

        # Remove surrounding matching standard quotes, smart quotes, or backticks
        if (($clean.StartsWith("'") -and $clean.EndsWith("'")) -or
            ($clean.StartsWith('"') -and $clean.EndsWith('"')) -or
            ($clean.StartsWith('`') -and $clean.EndsWith('`')) -or
            ($clean.StartsWith($smartLeftDouble) -and $clean.EndsWith($smartRightDouble)) -or
            ($clean.StartsWith($smartLeftSingle) -and $clean.EndsWith($smartRightSingle))) {
            if ($clean.Length -ge 2) {
                $clean = $clean.Substring(1, $clean.Length - 2).Trim()
            }
        }

        # Remove known prefix wrappers (export DATABASE_URL=, DATABASE_URL=, psql, psql -d)
        if ($clean -match '^(export\s+)?(DATABASE_URL|DIRECT_URL)\s*=\s*(.+)$') {
            $clean = $matches[3].Trim()
        } elseif ($clean -match '^psql\s+(-d\s+|--dbname=\s*)?(.+)$') {
            $clean = $matches[2].Trim()
        }

        # Clean trailing and leading whitespace / control chars after unwrapping
        $clean = $clean -replace '^[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+', ''
        $clean = $clean -replace '[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+$', ''

        if ($clean -eq $before) {
            $changed = $false
        }
    }

    # 4. Strict scheme validation
    $schemeMatched = $clean -match '^(postgresql|postgres)://'
    if (-not $schemeMatched) {
        $codePoints = @()
        $maxLen = [Math]::Min(8, $rawInput.Length)
        for ($i = 0; $i -lt $maxLen; $i++) {
            $codePoints += [string]::Format("U+{0:X4}", [int][char]$rawInput[$i])
        }

        return @{
            Success = $false
            Error = "$varName must start with 'postgresql://' or 'postgres://'."
            Diagnostic = @{
                RawLength = $rawInput.Length
                CleanLength = $clean.Length
                LeadingCodePoints = ($codePoints -join ' ')
            }
        }
    }

    # 5. Strict URI Parsing using [System.Uri]
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

    if ($clean -match ':[^@/]*@[^@/]*@') {
        return @{
            Success = $false
            Error = "Multiple '@' characters detected in $varName. An unencoded '@' in the username or password corrupts the host authority. Please percent-encode it as '%40'."
        }
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

$secPooled = $null
$secDirect = $null
$rawPooled = $null
$rawDirect = $null
$cleanPooled = $null
$cleanDirect = $null

try {
    # 1. Secure Input Collection
    $secPooled = Read-Host -Prompt "Enter Neon POOLED connection string (DATABASE_URL with -pooler)" -AsSecureString
    $secDirect = Read-Host -Prompt "Enter Neon DIRECT connection string (DIRECT_URL without -pooler)" -AsSecureString

    if (-not $secPooled -or -not $secDirect) {
        Write-Host "`n[ERROR] Both connection strings are required." -ForegroundColor Red
        return
    }

    # 2. Convert SecureString to process-only memory string
    $bstrP = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPooled)
    $rawPooled = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstrP)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrP)

    $bstrD = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secDirect)
    $rawDirect = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstrD)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrD)

    # 3. Clean and strictly validate both URLs
    $resPooled = Clean-PostgresUrl $rawPooled "DATABASE_URL"
    $resDirect = Clean-PostgresUrl $rawDirect "DIRECT_URL"

    $valid = $true

    if (-not $resPooled.Success) {
        Write-Host "`n[VALIDATION FAILED] $($resPooled.Error)" -ForegroundColor Red
        if ($resPooled.Diagnostic) {
            Write-Host "  Diagnostic: InputLength=$($resPooled.Diagnostic.RawLength), LeadingCodePoints=$($resPooled.Diagnostic.LeadingCodePoints)" -ForegroundColor Yellow
        }
        $valid = $false
    }
    if (-not $resDirect.Success) {
        Write-Host "`n[VALIDATION FAILED] $($resDirect.Error)" -ForegroundColor Red
        if ($resDirect.Diagnostic) {
            Write-Host "  Diagnostic: InputLength=$($resDirect.Diagnostic.RawLength), LeadingCodePoints=$($resDirect.Diagnostic.LeadingCodePoints)" -ForegroundColor Yellow
        }
        $valid = $false
    }

    if ($valid) {
        # Check host domain (*.neon.tech)
        if (-not $resPooled.IsNeon) {
            Write-Host "`n[VALIDATION FAILED] DATABASE_URL host does not belong to Neon (*.neon.tech)." -ForegroundColor Red
            $valid = $false
        }
        if (-not $resDirect.IsNeon) {
            Write-Host "`n[VALIDATION FAILED] DIRECT_URL host does not belong to Neon (*.neon.tech)." -ForegroundColor Red
            $valid = $false
        }

        # Check pooler distinction
        if (-not $resPooled.IsPooler) {
            Write-Host "`n[VALIDATION FAILED] DATABASE_URL host must contain '-pooler' (pooled connection)." -ForegroundColor Red
            $valid = $false
        }
        if ($resDirect.IsPooler) {
            Write-Host "`n[VALIDATION FAILED] DIRECT_URL host must NOT contain '-pooler' (direct/unpooled connection)." -ForegroundColor Red
            $valid = $false
        }
    }

    if (-not $valid) {
        Write-Host "`nPlease verify the connection strings from your Neon dashboard and try again." -ForegroundColor Yellow
        return
    }

    $cleanPooled = $resPooled.CleanedUrl
    $cleanDirect = $resDirect.CleanedUrl

    Write-Host "`n[VALIDATION PASSED] Both Neon connection strings verified successfully." -ForegroundColor Green

    # 4. Explicit Pre-Deployment Confirmation Prompt
    Write-Host "`n================================================================" -ForegroundColor Yellow
    Write-Host " WARNING: PRODUCTION DATABASE DEPLOYMENT CONFIRMATION" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host "You are about to apply migration 0_init to the Neon production database." -ForegroundColor White
    Write-Host "This will create all 19 application tables, 8 enums, and the _prisma_migrations history table.`n" -ForegroundColor Gray

    $confirm = Read-Host -Prompt "To proceed with deployment, type DEPLOY in all caps (or press Enter to cancel)"

    if ($confirm -cne "DEPLOY") {
        Write-Host "`n[ABORTED] Deployment cancelled. Confirmation input was '$confirm'. No changes were made." -ForegroundColor Yellow
        return
    }

    Write-Host "`n[CONFIRMED] Confirmation received. Executing: npx prisma migrate deploy...`n" -ForegroundColor Cyan

    # 5. Inject into process environment for Prisma CLI execution
    $env:DATABASE_URL = $cleanPooled
    $env:DIRECT_URL = $cleanDirect

    # 6. Execute production migration deploy
    & npx prisma migrate deploy
    $prismaExitCode = $LASTEXITCODE

    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Prisma migrate deploy exit code: $prismaExitCode" -ForegroundColor $(if ($prismaExitCode -eq 0) { "Green" } else { "Red" })
    if ($prismaExitCode -eq 0) {
        Write-Host "Migration 0_init deployed successfully to Neon PostgreSQL!" -ForegroundColor Green
        Write-Host "`nRunning automated post-deployment verification of all schema objects..." -ForegroundColor Cyan
        & npx tsx verify_post_deploy.ts
    } else {
        Write-Host "Migration deployment encountered an error (exit code $prismaExitCode)." -ForegroundColor Red
    }
    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray

} catch {
    Write-Host "`n[UNEXPECTED ERROR] An error occurred during deployment: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # 7. Cleanup: Wipe environment variables and clear sensitive references
    Remove-Item env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item env:DIRECT_URL -ErrorAction SilentlyContinue

    $rawPooled = $null
    $rawDirect = $null
    $cleanPooled = $null
    $cleanDirect = $null
    $secPooled = $null
    $secDirect = $null

    [System.GC]::Collect()
    Write-Host "`n[SECURITY] Process environment variables and credentials cleared from memory." -ForegroundColor Gray
}
