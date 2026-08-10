@echo off
setlocal EnableExtensions
title GWS Admin Study Desk — Uninstall
set "APP_NAME=GWS Admin Study Desk"
set "DEST=%LOCALAPPDATA%\%APP_NAME%"

echo.
echo This removes shortcuts and:
echo   %DEST%
echo.
pause

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$name='%APP_NAME%'; $desk=Join-Path ([Environment]::GetFolderPath('Desktop')) ($name+'.lnk'); $sm=Join-Path ([Environment]::GetFolderPath('StartMenu')) (Join-Path 'Programs' ($name+'.lnk')); if (Test-Path $desk) { Remove-Item $desk -Force }; if (Test-Path $sm) { Remove-Item $sm -Force }"

if exist "%DEST%" (
  rmdir /s /q "%DEST%"
  echo Removed app folder.
) else (
  echo App folder was already gone.
)

echo Uninstall complete.
pause
endlocal
