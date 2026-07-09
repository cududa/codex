@echo off
setlocal
set "CODEX_BUILD_PRIORITY_SHIM_ARGS=%*"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\invoke-priority-command.ps1" -CommandName rustc
exit /b %ERRORLEVEL%
