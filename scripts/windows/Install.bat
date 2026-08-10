@echo off
setlocal EnableExtensions
title GWS Admin Study Desk — Installer
cd /d "%~dp0"

set "APP_NAME=GWS Admin Study Desk"
set "EXE_NAME=GWS Admin Study Desk.exe"
set "DEST=%LOCALAPPDATA%\%APP_NAME%"

echo.
echo  ============================================
echo   %APP_NAME% — Windows install
echo  ============================================
echo.
echo  This will copy the app to:
echo    %DEST%
echo  and create Desktop + Start Menu shortcuts.
echo.
pause

if not exist "%~dp0%EXE_NAME%" (
  echo ERROR: "%EXE_NAME%" not found next to this installer.
  echo Unzip the full folder first, then run Install.bat again.
  pause
  exit /b 1
)

echo.
echo Copying files...
mkdir "%DEST%" 2>nul
robocopy "%~dp0." "%DEST%" /E /NFL /NDL /NJH /NJS /nc /ns /np >nul
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
  echo ERROR: Copy failed ^(robocopy code %RC%^).
  pause
  exit /b 1
)

:: Remove installer helpers from the installed copy (optional cleanup)
del /f /q "%DEST%\Install.bat" 2>nul
del /f /q "%DEST%\Uninstall.bat" 2>nul
del /f /q "%DEST%\README-WINDOWS.txt" 2>nul

echo Creating shortcuts...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$name='%APP_NAME%'; $exe=Join-Path $env:LOCALAPPDATA (Join-Path $name '%EXE_NAME%'); $dir=Split-Path $exe; $w=New-Object -ComObject WScript.Shell; $desk=[Environment]::GetFolderPath('Desktop'); $s=$w.CreateShortcut((Join-Path $desk ($name+'.lnk'))); $s.TargetPath=$exe; $s.WorkingDirectory=$dir; $s.Description=$name; $s.Save(); $sm=Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs'; $s2=$w.CreateShortcut((Join-Path $sm ($name+'.lnk'))); $s2.TargetPath=$exe; $s2.WorkingDirectory=$dir; $s2.Description=$name; $s2.Save()"

echo.
echo Done. Launching %APP_NAME%...
start "" "%DEST%\%EXE_NAME%"
echo.
echo You can delete the unzipped download folder if you like.
echo To remove later, run Uninstall.bat from the zip, or delete:
echo   %DEST%
pause
endlocal
