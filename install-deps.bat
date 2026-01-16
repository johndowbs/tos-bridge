@echo off
echo ================================================
echo TOS Bridge - Installing Dependencies
echo ================================================
echo.
echo This will install the winax module required to
echo communicate with ThinkOrSwim.
echo.
echo Prerequisites:
echo   - Node.js must be installed (https://nodejs.org/)
echo   - Visual Studio Build Tools may be required
echo.
pause

echo.
echo Installing winax globally...
npm install -g winax

echo.
echo ================================================
echo Installation complete!
echo ================================================
echo.
echo You can now run TOS Bridge.
echo Make sure ThinkOrSwim is running and logged in first.
echo.
pause
