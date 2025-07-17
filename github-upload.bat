@echo off
echo ===================================================
echo        JARVIS API - GITHUB DEPLOYMENT SCRIPT
echo ===================================================
echo.

echo [1/4] Checking git status...
git status
echo.

echo [2/4] Adding all files to git...
git add .
echo.

echo [3/4] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    git commit -m "Update JARVIS API"
) else (
    git commit -m "%commit_msg%"
)
echo.

echo [4/4] Pushing to GitHub...
set /p branch="Enter branch name (or press Enter for clean-branch): "
if "%branch%"=="" (
    git push origin clean-branch
) else (
    git push origin %branch%
)
echo.

echo ===================================================
echo Deployment complete! Your code is now on GitHub.
echo ===================================================
echo.
pause 