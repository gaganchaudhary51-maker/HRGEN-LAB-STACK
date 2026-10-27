@echo off
title HRGen PhleboTrack Native Desktop Launcher
cd /d "%~dp0"

set "PYTHON_EXE=C:\Users\pc\antigravity\Remix-PhleboTrack\backend\.venv\Scripts\pythonw.exe"
if not exist "%PYTHON_EXE%" (
    set "PYTHON_EXE=pythonw.exe"
)

start "" "%PYTHON_EXE%" "C:\Users\pc\Desktop\Phlebo PWA\app_desktop.py"
exit
