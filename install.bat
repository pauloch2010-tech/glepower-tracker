@echo off
echo ===================================
echo  GlePower Tracker - npm install
echo ===================================
echo.

SET "NODE_PATH=C:\Program Files\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"

echo Checking Node.js...
"%NODE_PATH%\node.exe" --version
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: node.exe not found at %NODE_PATH%
  pause
  exit /b 1
)

echo.
echo Running npm install in:
echo %~dp0
cd /d "%~dp0"

"%NODE_PATH%\node.exe" "%NODE_PATH%\node_modules\npm\bin\npm-cli.js" install

echo.
echo ===================================
echo  Done! Exit code: %ERRORLEVEL%
echo ===================================
pause
