@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Subiendo cambios a GitHub...
echo.
git add -A
git commit -m "Cambios desde Claude (%date% %time%)"
git push origin main
echo.
echo ===== Listo. Si no hay errores arriba, los cambios ya estan en GitHub. =====
pause
