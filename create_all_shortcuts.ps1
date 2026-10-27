$sh = New-Object -ComObject WScript.Shell

# 1. DSD Care - Patient Portal
$sc1 = $sh.CreateShortcut("C:\Users\pc\Desktop\DSD Care - Patient Portal.lnk")
$sc1.TargetPath = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\Launch_DSD_Care.bat"
$sc1.WorkingDirectory = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking"
$sc1.IconLocation = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\dsd_care.ico"
$sc1.Description = "Dr. Shastri Diagnostics (DSD Care) Patient Booking Portal"
$sc1.Save()

# 2. HRGen PhleboTrack
$sc2 = $sh.CreateShortcut("C:\Users\pc\Desktop\HRGen PhleboTrack.lnk")
$sc2.TargetPath = "C:\Users\pc\Desktop\Phlebo PWA\Launch_Phlebo_PWA.bat"
$sc2.WorkingDirectory = "C:\Users\pc\Desktop\Phlebo PWA"
$sc2.IconLocation = "C:\Users\pc\Desktop\Phlebo PWA\phlebotrack.ico"
$sc2.Description = "HRGen PhleboTrack Universal Workforce & Diagnostic Sales Platform"
$sc2.Save()

# 3. HRGen GIA LIMS
$sc3 = $sh.CreateShortcut("C:\Users\pc\Desktop\HRGen GIA LIMS.lnk")
$sc3.TargetPath = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\03_GIA_LIMS_Core\Launch_GIA_LIMS.bat"
$sc3.WorkingDirectory = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\03_GIA_LIMS_Core"
$sc3.IconLocation = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\03_GIA_LIMS_Core\gia_lims.ico"
$sc3.Description = "HRGen GIA LIMS v6.0.0 Central Laboratory Information Management System"
$sc3.Save()

# 4. HRGERN Security Inspector
$sc4 = $sh.CreateShortcut("C:\Users\pc\Desktop\HRGERN Security Inspector.lnk")
$sc4.TargetPath = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\04_HRGERN_Security_Inspector\Launch_HRGERN_Inspector.bat"
$sc4.WorkingDirectory = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\04_HRGERN_Security_Inspector"
$sc4.IconLocation = "C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\04_HRGERN_Security_Inspector\hrgern_inspector.ico"
$sc4.Description = "HRGERN Inspector Web & Wireless Security Lab"
$sc4.Save()

Write-Host "ALL_4_NATIVE_SHORTCUTS_CONFIGURED"
