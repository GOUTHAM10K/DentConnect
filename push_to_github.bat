@echo off
echo ====================================================
echo Pushing DentConnect Project to GitHub Repository
echo Target: https://github.com/GOUTHAM10K/DentConnect
echo ====================================================
echo.

C:\Users\Goutham\mingit\cmd\git.exe push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Project pushed successfully to https://github.com/GOUTHAM10K/DentConnect
) else (
    echo.
    echo ERROR: Push failed. Check your network or GitHub authentication.
)
pause
