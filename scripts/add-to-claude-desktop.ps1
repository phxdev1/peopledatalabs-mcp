#!/usr/bin/env pwsh
# Script to add the People Data Labs MCP server to Claude Desktop configuration

# Get the absolute path to the build/index.js file
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$indexJsPath = Join-Path $projectRoot "build\index.js"
$indexJsPath = $indexJsPath.Replace("\", "/")  # Convert to forward slashes for JSON

# Claude Desktop config file path
$configPath = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"

# Check if the config file exists
if (-not (Test-Path $configPath)) {
    Write-Host "Claude Desktop configuration file not found at: $configPath"
    Write-Host "Creating a new configuration file..."
    
    # Create directory if it doesn't exist
    $configDir = Split-Path -Parent $configPath
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
    
    # Create a basic config file
    @{
        "mcpServers" = @{}
    } | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
    
    Write-Host "Created new configuration file."
}

# Read the existing config
try {
    $config = Get-Content -Path $configPath -Raw | ConvertFrom-Json
    
    # Ensure mcpServers property exists
    if (-not (Get-Member -InputObject $config -Name "mcpServers" -MemberType Properties)) {
        $config | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value ([PSCustomObject]@{})
    }
    
    # Convert to PSObject if it's not already
    if ($config.mcpServers -isnot [PSCustomObject]) {
        $config.mcpServers = [PSCustomObject]@{}
    }
} catch {
    Write-Host "Error reading configuration file: $_"
    Write-Host "Creating a new configuration..."
    $config = [PSCustomObject]@{
        "mcpServers" = [PSCustomObject]@{}
    }
}

# Prompt for PDL API Key
$apiKey = Read-Host "Enter your People Data Labs API Key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "API Key is required. Exiting."
    exit 1
}

# Create the server configuration
$serverConfig = [PSCustomObject]@{
    "command" = "node"
    "args" = @($indexJsPath)
    "env" = [PSCustomObject]@{
        "PDL_API_KEY" = $apiKey
    }
}

# Add or update the server configuration
$config.mcpServers | Add-Member -MemberType NoteProperty -Name "peopledatalabs" -Value $serverConfig -Force

# Write the updated config back to the file
$config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath

Write-Host "People Data Labs MCP server has been added to Claude Desktop configuration."
Write-Host "Configuration file: $configPath"
Write-Host "Restart Claude Desktop for the changes to take effect."