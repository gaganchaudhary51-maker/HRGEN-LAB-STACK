$sh = New-Object -ComObject WScript.Shell
$sc = $sh.CreateShortcut("C:\Users\pc\Desktop\HRGen PhleboTrack.lnk")
$sc.TargetPath = "C:\Users\pc\Desktop\Phlebo PWA\Launch_Phlebo_PWA.bat"
$sc.WorkingDirectory = "C:\Users\pc\Desktop\Phlebo PWA"
$sc.IconLocation = "C:\Users\pc\Desktop\Phlebo PWA\phlebotrack.ico"
$sc.Description = "HRGen PhleboTrack Native Desktop Application"
$sc.Save()
Write-Host "NATIVE_SHORTCUT_UPDATED"
