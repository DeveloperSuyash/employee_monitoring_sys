param(
  [Parameter(Mandatory = $true)]
  [string]$ExtensionId
)

$ErrorActionPreference = "Stop"

$hostName = "com.employee_monitoring.idle_overlay"
$sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = Join-Path $env:LOCALAPPDATA "EmployeeMonitoring\NativeHost"
$manifestPath = Join-Path $installDir "$hostName.json"
$cmdPath = Join-Path $installDir "idle-overlay-host.cmd"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Copy-Item -Force (Join-Path $sourceDir "idle-overlay-host.js") $installDir
Copy-Item -Force (Join-Path $sourceDir "idle-overlay.ps1") $installDir

@"
@echo off
node "%~dp0idle-overlay-host.js"
"@ | Set-Content -Encoding ASCII -Path $cmdPath

$manifest = @{
  name = $hostName
  description = "Employee Monitoring idle overlay native host"
  path = $cmdPath
  type = "stdio"
  allowed_origins = @("chrome-extension://$ExtensionId/")
} | ConvertTo-Json -Depth 5

$manifest | Set-Content -Encoding ASCII -Path $manifestPath

$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName"
New-Item -Force -Path $registryPath | Out-Null
Set-ItemProperty -Path $registryPath -Name "(default)" -Value $manifestPath

Write-Host "Native host installed: $hostName"
Write-Host "Manifest: $manifestPath"
Write-Host "Allowed extension: $ExtensionId"
