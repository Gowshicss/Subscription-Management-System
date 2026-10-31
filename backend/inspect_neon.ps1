<#
.SYNOPSIS
  Secure interactive read-only database metadata inspection for Neon PostgreSQL.
.DESCRIPTION
  Collects the Neon DIRECT connection string securely using Read-Host -AsSecureString,
  cleans and validates formatting strictly (Neon direct host, no pooler),
  executes inspect_db_metadata.ts to query PostgreSQL system catalogs only,
  and wipes all credentials from memory in the finally block.
#>

[CmdletBinding()]
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Brightloop Neon Production Database - Read-Only Inspection" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "All inputs are collected securely as masked strings." -ForegroundColor Gray
Write-Host "No credentials are saved or printed. Metadata queries only.`n" -ForegroundColor Gray

function Clean-PostgresUrl([string]$rawInput, [string]$varName) {
    if ([string]::IsNullOrWhiteSpace($rawInput)) {
        return @{ Success = $false; Error = "$varName is empty." }
    }

    $clean = $rawInput

    # 1. Strip ANSI escape sequences (e.g. bracketed paste)
    $clean = $clean -replace '\x1B\[[0-9;]*[a-zA-Z~]', ''

    # 2. Strip BOM, zero-width characters, non-breaking space, control characters, and whitespace from ends
    $clean = $clean -replace '^[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+', ''
    $clean = $clean -replace '[\x00-\x1F\x7F\uFEFF\u200B-\u200F\u00A0\s]+$', ''

    # 3. Iteratively unwrap known quotes, prefixes, and wrappers
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

    # 4. Strict scheme validation
    if (-not ($clean -match '^(postgresql|postgres)://')) {
        return @{ Success = $false; Error = "$varName must start with 'postgresql://' or 'postgres://'." }
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
    # 1. Secure Input Collection
    $secDirect = Read-Host -Prompt "Enter Neon DIRECT connection string (DIRECT_URL without -pooler)" -AsSecureString

    if (-not $secDirect) {
        Write-Host "`n[ERROR] Direct connection string is required." -ForegroundColor Red
        return
    }

    # 2. Convert SecureString to process-only memory string
    $bstrD = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secDirect)
    $rawDirect = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstrD)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrD)

    # 3. Clean and strictly validate URL
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
        Write-Host "`n[VALIDATION FAILED] DIRECT_URL host must NOT contain '-pooler' (direct connection required for DDL/metadata inspection)." -ForegroundColor Red
        return
    }

    $cleanDirect = $resDirect.CleanedUrl
    Write-Host "`n[VALIDATION PASSED] Neon Direct connection string verified." -ForegroundColor Green
    Write-Host "Querying database metadata (read-only)...`n" -ForegroundColor Cyan

    # 4. Inject into process environment
    $env:DATABASE_URL = $cleanDirect

    # 5. Execute read-only metadata inspection
    & npx tsx inspect_db_metadata.ts
    $inspectExitCode = $LASTEXITCODE

    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Inspection exit code: $inspectExitCode" -ForegroundColor $(if ($inspectExitCode -eq 0) { "Green" } else { "Yellow" })
    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray

} catch {
    Write-Host "`n[UNEXPECTED ERROR] An error occurred during inspection: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # 6. Cleanup: Wipe environment variable and memory references
    Remove-Item env:DATABASE_URL -ErrorAction SilentlyContinue

    $rawDirect = $null
    $cleanDirect = $null
    $secDirect = $null

    [System.GC]::Collect()
    Write-Host "`n[SECURITY] Process environment variables and credentials cleared from memory." -ForegroundColor Gray
}

