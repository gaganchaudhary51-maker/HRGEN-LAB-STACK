Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = currentDir

pythonExe = "C:\Users\pc\antigravity\Remix-PhleboTrack\backend\.venv\Scripts\pythonw.exe"
If Not fso.FileExists(pythonExe) Then
    pythonExe = "pythonw.exe"
End If

targetScript = fso.BuildPath(currentDir, "app_desktop.py")
cmd = """" & pythonExe & """ """ & targetScript & """"

' Run completely hidden (WindowStyle 0) - Zero black console window
WshShell.Run cmd, 0, False
