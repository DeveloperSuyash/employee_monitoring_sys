param(
  [string]$Reason = "browser-idle"
)

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$script:allowClose = $false

$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Idle Check"
        WindowStyle="None"
        ResizeMode="NoResize"
        WindowState="Maximized"
        Topmost="True"
        ShowInTaskbar="False"
        AllowsTransparency="True"
        Background="Transparent">
  <Grid Background="#88F8FAFC">
    <Border Width="520"
            Padding="34"
            CornerRadius="22"
            Background="#F8FFFFFF"
            BorderBrush="#D5CBD5E1"
            BorderThickness="1"
            HorizontalAlignment="Center"
            VerticalAlignment="Center">
      <Border.Effect>
        <DropShadowEffect Color="#0F172A" BlurRadius="55" ShadowDepth="16" Opacity="0.20" />
      </Border.Effect>
      <StackPanel>
        <Border Width="64"
                Height="64"
                CornerRadius="18"
                Background="#111827"
                HorizontalAlignment="Center"
                Margin="0,0,0,18">
          <TextBlock Text="!"
                     Foreground="White"
                     FontSize="30"
                     FontWeight="Black"
                     HorizontalAlignment="Center"
                     VerticalAlignment="Center" />
        </Border>

        <TextBlock Text="Are you working or sleeping?"
                   FontSize="26"
                   FontWeight="Bold"
                   Foreground="#111827"
                   TextAlignment="Center"
                   Margin="0,0,0,10" />

        <TextBlock Text="No activity has been detected for the last 2 minutes."
                   FontSize="15"
                   Foreground="#475569"
                   TextAlignment="Center"
                   Margin="0,0,0,24" />

        <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
          <Button x:Name="WorkingButton"
                  Content="I am Working"
                  Width="190"
                  Height="46"
                  Background="#111827"
                  Foreground="White"
                  FontWeight="Bold"
                  BorderThickness="0"
                  Cursor="Hand" />
        </StackPanel>
      </StackPanel>
    </Border>
  </Grid>
</Window>
"@

$reader = New-Object System.Xml.XmlNodeReader ([xml]$xaml)
$window = [Windows.Markup.XamlReader]::Load($reader)
$workingButton = $window.FindName("WorkingButton")

function Send-OverlayAction {
  param(
    [string]$Action,
    [string]$ActionReason
  )

  $payload = @{ action = $Action; reason = $ActionReason } | ConvertTo-Json -Compress
  [Console]::Out.WriteLine($payload)
  [Console]::Out.Flush()
}

$workingButton.Add_Click({
  Send-OverlayAction -Action "idleWorking" -ActionReason "native-overlay-working"
  $script:allowClose = $true
  $window.Close()
})

$window.Add_Closing({
  if (-not $script:allowClose) {
    $_.Cancel = $true
  }
})

$timer = New-Object Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromMilliseconds(800)
$timer.Add_Tick({
  $window.Topmost = $false
  $window.Topmost = $true
  $window.Activate() | Out-Null
})
$timer.Start()

$window.Activate() | Out-Null
$null = $window.ShowDialog()
