
@echo off
title Eduverse - Student App

cd /d "%~dp0"

echo ==========================================
echo       Eduverse Student App Launcher
echo ==========================================
echo.

REM Check for package.json
if not exist package.json (
    echo ERROR: package.json not found.
    pause
    exit /b 1
)

REM Check for Node.js
where node >nul 2>&1 || (
    echo ERROR: Node.js is not installed or not on PATH.
    pause
    exit /b 1
)

REM Install dependencies on first run
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
    echo.
)

REM Find this PC's Wi-Fi/LAN address (the adapter with a default gateway). Expo's own detection
REM relies on wmic, which newer Windows 11 builds removed, so it falls back to 127.0.0.1 and the
REM phone fails with "Failed to download remote update". Virtual adapters (VirtualBox, WSL) are skipped.
set "LAN_IP="
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1).IPv4Address.IPAddress"`) do set "LAN_IP=%%i"

if defined LAN_IP (
    set "REACT_NATIVE_PACKAGER_HOSTNAME=%LAN_IP%"
    echo Phone loads the app from: http://%LAN_IP%:8081
    echo App calls the API at:     http://%LAN_IP%:5000  ^(the backend must be running on this PC^)
) else (
    echo WARNING: Could not detect this PC's Wi-Fi/LAN address. Is Wi-Fi connected?
    echo The phone may not be able to load the app.
)
echo The phone must be on the same Wi-Fi network as this PC.
echo.

REM Stop an existing Metro bundler on port 8081
echo Checking port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":8081 .*LISTENING"') do (
    echo Stopping existing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)
echo.

echo How do you want to run the app?
echo   1. Start the Expo dev server (Expo Go, or a dev build already installed on the phone)
echo   2. Build and install on an Android phone/emulator (needs Android Studio)
choice /C 12 /N /M "Choose 1 or 2: "
set "MODE=%errorlevel%"
echo.

if "%MODE%"=="2" goto android

echo Starting Expo dev server...
echo Scan the QR code with Expo Go, or press "a" to open on a connected Android device.
echo.
call npx expo start
goto done

:android
REM expo run:android needs the Android SDK (installed with Android Studio)
if not defined ANDROID_HOME if not exist "%LOCALAPPDATA%\Android\Sdk" (
    echo ERROR: Android SDK not found.
    echo Install Android Studio, then either start an emulator or connect a phone
    echo with USB debugging enabled, and run this script again.
    echo Option 1 works without Android Studio if you use Expo Go.
    pause
    exit /b 1
)

echo Building and installing the app on Android...
echo.
call npx expo run:android

:done
echo.
echo App stopped or exited with an error.
pause
