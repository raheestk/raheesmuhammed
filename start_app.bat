@echo off
echo Starting DOZANDA HR Application...

:: Start Backend
start cmd /k "cd /d D:\DOZANDA FUEL TRADING HR DEPARTMENT\backend && npm start"

:: Wait few seconds
timeout /t 5

:: Start Frontend
start cmd /k "cd /d D:\DOZANDA FUEL TRADING HR DEPARTMENT\frontend && npm run dev"

:: Open Browser
timeout /t 5
start http://localhost:3000

echo Application Started Successfully!
pause