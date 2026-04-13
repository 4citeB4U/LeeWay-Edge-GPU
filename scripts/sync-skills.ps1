#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Synchronize and manage the AIskills directory
.DESCRIPTION
    Updates skills from public sources, validates SKILL.md files,
    and maintains the skills registry.
.PARAMETER Action
    Action to perform: Update, Validate, Export, List, Clean
.PARAMETER Source
    Specific source to sync: anthropic, microsoft, community, all
.EXAMPLE
    .\sync-skills.ps1 -Action Update -Source all
    .\sync-skills.ps1 -Action Validate
    .\sync-skills.ps1 -Action List
#>

param(
    [ValidateSet('Update', 'Validate', 'Export', 'List', 'Clean', 'Status')]
    [string]$Action = 'Status',
    
    [ValidateSet('anthropic', 'microsoft', 'community', 'all', 'local')]
    [string]$Source = 'local',
    
    [switch]$Verbose,
    [switch]$DryRun
)

# Configuration
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommandPath
$skillsRoot = Join-Path $scriptRoot "..\skills"
$registryPath = Join-Path $scriptRoot "skills-registry.json"
$configPath = Join-Path $scriptRoot "..\config\skills-config.json"
$logPath = Join-Path $scriptRoot "sync-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"

# Logging function
function Write-Log($message, $level = "INFO") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$level] $message"
    
    if ($Verbose -or $level -eq "ERROR" -or $level -eq "WARNING") {
        Write-Host $logMessage
    }
    
    Add-Content -Path $logPath -Value $logMessage
}

# Validate a SKILL.md file
function Test-SkillFile($skillPath) {
    $skillMdPath = Join-Path $skillPath "SKILL.md"
    
    if (-not (Test-Path $skillMdPath)) {
        return @{ valid = $false; error = "SKILL.md not found" }
    }
    
    $content = Get-Content $skillMdPath -Raw
    
    # Check required sections
    $requiredSections = @("Expert in", "Capabilities", "Use this skill when", "Key techniques", "Tags")
    $missingSection = $null
    
    foreach ($section in $requiredSections) {
        if ($content -notmatch $section) {
            $missingSection += @($section)
        }
    }
    
    if ($missingSection) {
        return @{ 
            valid = $false
            error = "Missing sections: $($missingSection -join ', ')"
        }
    }
    
    return @{ valid = $true; error = $null }
}

# Validate all skills
function Invoke-SkillValidation {
    Write-Log "Starting skill validation..."
    
    $skillDirs = Get-ChildItem -Path $skillsRoot -Directory -Recurse | Where-Object {
        (Get-ChildItem -Path $_.FullName -Filter "SKILL.md").Count -gt 0
    }
    
    $results = @()
    $valid = 0
    $invalid = 0
    
    foreach ($skill in $skillDirs) {
        $test = Test-SkillFile $skill.FullName
        
        if ($test.valid) {
            $valid++
            Write-Log "✓ $($skill.Name)" "SUCCESS"
        } else {
            $invalid++
            Write-Log "✗ $($skill.Name): $($test.error)" "ERROR"
        }
        
        $results += @{
            name = $skill.Name
            path = $skill.FullName
            valid = $test.valid
            error = $test.error
        }
    }
    
    Write-Log "Validation complete: $valid valid, $invalid invalid"
    return $results
}

# List all skills
function Get-SkillsList {
    Write-Host "AIskills Directory Contents" -ForegroundColor Cyan
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
    
    $registry = Get-Content $registryPath | ConvertFrom-Json
    
    # Group by category
    $grouped = $registry.skills | Group-Object -Property category
    
    foreach ($group in $grouped | Sort-Object Name) {
        Write-Host "📁 $($group.Name)" -ForegroundColor Yellow
        
        foreach ($skill in $group.Group | Sort-Object name) {
            $status = if ($skill.enabled) { "✓" } else { "✗" }
            Write-Host "  $status $($skill.name)" -ForegroundColor Green
            Write-Host "     $($skill.description)" -ForegroundColor Gray
        }
        
        Write-Host ""
    }
    
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  Total Skills: $($registry.totalSkills)"
    Write-Host "  Categories: $($registry.categories.Length)"
    Write-Host "  Version: $($registry.version)"
}

# Export skills as JSON
function Export-SkillsData {
    param([string]$OutputPath)
    
    Write-Log "Exporting skills data..."
    
    $registry = Get-Content $registryPath | ConvertFrom-Json
    
    if ([string]::IsNullOrEmpty($OutputPath)) {
        $OutputPath = Join-Path $scriptRoot "skills-export-$(Get-Date -Format 'yyyy-MM-dd').json"
    }
    
    $registry | ConvertTo-Json -Depth 10 | Out-File $OutputPath
    Write-Log "Skills exported to: $OutputPath"
    
    return $OutputPath
}

# Generate CSV report
function Export-SkillsReport {
    param([string]$OutputPath)
    
    Write-Log "Generating skills report..."
    
    $registry = Get-Content $registryPath | ConvertFrom-Json
    
    if ([string]::IsNullOrEmpty($OutputPath)) {
        $OutputPath = Join-Path $scriptRoot "skills-report-$(Get-Date -Format 'yyyy-MM-dd').csv"
    }
    
    $reportData = $registry.skills | Select-Object @(
        @{ Name = 'Name'; Expression = { $_.name } }
        @{ Name = 'Category'; Expression = { $_.category } }
        @{ Name = 'Version'; Expression = { $_.version } }
        @{ Name = 'Tags'; Expression = { $_.tags -join '; ' } }
        @{ Name = 'Enabled'; Expression = { $_.enabled } }
    )
    
    $reportData | Export-Csv -Path $OutputPath -NoTypeInformation
    Write-Log "Report generated: $OutputPath"
    
    return $OutputPath
}

# Check status
function Get-SyncStatus {
    Write-Host "AIskills Synchronization Status" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path $registryPath) {
        $registry = Get-Content $registryPath | ConvertFrom-Json
        $lastUpdated = [DateTime]::Parse($registry.lastUpdated)
        
        Write-Host "Registry Info:" -ForegroundColor Yellow
        Write-Host "  Version: $($registry.version)"
        Write-Host "  Last Updated: $lastUpdated"
        Write-Host "  Total Skills: $($registry.totalSkills)"
        Write-Host "  Categories: $($registry.categories.Length)"
        Write-Host ""
    }
    
    # Count physical skills
    $skillCount = (Get-ChildItem -Path $skillsRoot -Directory -Recurse | 
                   Where-Object { Test-Path (Join-Path $_.FullName "SKILL.md") }).Count
    
    Write-Host "Physical Skills: $skillCount"
    Write-Host "Registry Path: $registryPath"
    Write-Host "Config Path: $configPath"
    Write-Host "Log Path: $logPath"
    Write-Host ""
}

# Clean up old logs and cache
function Invoke-SkillsClean {
    Write-Log "Cleaning up..."
    
    # Remove logs older than 30 days
    $oldLogs = Get-ChildItem -Path $scriptRoot -Filter "sync-*.log" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
    
    foreach ($log in $oldLogs) {
        if (-not $DryRun) {
            Remove-Item $log
            Write-Log "Removed old log: $($log.Name)"
        } else {
            Write-Log "[DRY RUN] Would remove: $($log.Name)"
        }
    }
    
    Write-Log "Cleanup complete"
}

# Main execution
switch ($Action) {
    'Validate' {
        Write-Host "Validating skills..." -ForegroundColor Cyan
        $results = Invoke-SkillValidation
        Write-Host ""
        Write-Host "Validation Summary:" -ForegroundColor Yellow
        Write-Host "  Valid: $(($results | Where-Object valid).Count)"
        Write-Host "  Invalid: $(($results | Where-Object { -not $_.valid }).Count)"
    }
    
    'List' {
        Get-SkillsList
    }
    
    'Export' {
        $jsonPath = Export-SkillsData
        $csvPath = Export-SkillsReport
        Write-Host "Exports completed:" -ForegroundColor Green
        Write-Host "  JSON: $jsonPath"
        Write-Host "  CSV: $csvPath"
    }
    
    'Clean' {
        Invoke-SkillsClean
        Write-Log "Cleanup completed"
    }
    
    'Status' {
        Get-SyncStatus
    }
    
    'Update' {
        Write-Log "Update function placeholder - extend with upstream sources"
        Write-Host "Update from public sources would be implemented here:" -ForegroundColor Yellow
        Write-Host "  - Anthropic Skills: https://github.com/anthropics/anthropic-sdk-python/tree/main/examples/skills"
        Write-Host "  - Microsoft Skills: https://github.com/microsoft/agent-framework-skills"
        Write-Host "  - Community Skills: curated from awesome-copilot repos"
    }
}

Write-Log "Script execution completed"
