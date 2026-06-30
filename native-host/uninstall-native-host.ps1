$hostName = "com.employee_monitoring.idle_overlay"
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName"

if (Test-Path $registryPath) {
  Remove-Item -Force -Path $registryPath
}

Write-Host "Native host registry entry removed: $hostName"
