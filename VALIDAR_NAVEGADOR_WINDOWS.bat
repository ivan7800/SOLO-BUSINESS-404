@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul || (echo ERROR: instala Python 3 con py.exe & exit /b 1)
py -m pip show playwright >nul 2>nul || (echo ERROR: py -m pip install playwright & exit /b 1)
py tests\browser-smoke.py
if errorlevel 1 (echo FALLO o bloqueo del navegador: revisa el error anterior & exit /b 1)
echo OK: ver QA-NAVEGADOR.json
endlocal
