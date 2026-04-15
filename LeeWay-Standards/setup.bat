@echo off
echo ======================================================
echo 🔥 LEEWAY™ SOVEREIGN SETUP PROTOCOL 🔥
echo ======================================================
echo.

echo [1/3] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Installing Logic Dependencies...
call npm install --no-audit --no-fund --quiet
if %errorlevel% neq 0 (
    echo [WARNING] npm install had some hiccups. Attempting to proceed anyway...
)

echo [3/3] Initiating Sovereign Calibration...
node src/cli/setup-lee.js

echo.
echo ======================================================
echo ✅ SETUP COMPLETE. THE HIVE MIND IS ACTIVE.
echo Type ".\leeway help" to see the command encyclopedia.
echo ======================================================
pause
