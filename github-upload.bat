@echo off
echo ===================================================
echo        JARVIS API - GITHUB DEPLOYMENT SCRIPT
echo ===================================================
echo.

echo [1/5] Checking git status...
git status
echo.

echo [2/5] Adding all files to git...
git add .
echo.

echo [3/5] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    git commit -m "Update JARVIS API with DigitalOcean deployment fixes"
) else (
    git commit -m "%commit_msg%"
)
echo.

echo [4/5] Pushing to GitHub...
set /p branch="Enter branch name (or press Enter for main): "
if "%branch%"=="" (
    git push origin main
) else (
    git push origin %branch%
)
echo.

echo [5/5] Deployment Instructions...
echo.
echo 🔧 IMPORTANT: After GitHub deployment, you need to set up API keys on your DigitalOcean server!
echo.
echo 📋 Quick Setup Steps:
echo    1. SSH into your server: ssh root@159.89.166.91
echo    2. Go to project: cd /home/pratham/jarvis-api
echo    3. Pull changes: git pull origin main
echo    4. Create .env file: nano .env
echo    5. Add your API keys ^(see DIGITALOCEAN-SETUP.md for details^)
echo    6. Restart app: pm2 restart jarvis-api
echo.
echo 🔍 Then test: curl -X GET http://159.89.166.91:3002/api/status
echo.

echo ===================================================
echo Deployment complete! Your code is now on GitHub.
echo ===================================================
echo.
pause
