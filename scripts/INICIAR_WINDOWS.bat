@echo off
setlocal
cd /d "%~dp0.."
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4173"
  py -3 -m http.server 4173 --bind 127.0.0.1
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4173"
  python -m http.server 4173 --bind 127.0.0.1
  goto :end
)
echo Necesitas instalar Python 3 o ejecutar un servidor local desde VS Code.
echo Alternativa: en VS Code usa la extension Live Server.
pause
:end
endlocal
