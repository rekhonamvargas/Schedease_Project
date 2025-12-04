@echo off
cd /d c:\Users\Aaliyah\Schedease_Project\schedease_frontend
echo Installing dependencies...
call npm install --loglevel=error
echo Starting React app on port 3000...
call npm start
pause
