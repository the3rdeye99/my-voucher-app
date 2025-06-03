@echo off
echo Starting Voucher System...

:: Start Backend Server
start cmd /k "cd backend && npm run dev"

:: Wait for 5 seconds
timeout /t 5

:: Start Frontend Server
start cmd /k "npm run dev"

echo Voucher System is starting...
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:5000 