@echo off
REM Avyra EDAI Backend Deployment Script for Windows
REM This script deploys the backend to Google Cloud Functions

setlocal enabledelayedexpansion

REM Colors for output (Windows compatible)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Configuration
set "FUNCTION_NAME=avyra-edai-api"
set "REGION=us-central1"
set "RUNTIME=nodejs18"
set "MEMORY=512MB"
set "TIMEOUT=540s"
set "ENTRY_POINT=avyraEdaiApi"

echo %BLUE%🚀 Avyra EDAI Backend Deployment%NC%
echo ==================================

REM Check if gcloud is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Google Cloud CLI (gcloud) is not installed.%NC%
    echo Please install it from: https://cloud.google.com/sdk/docs/install
    exit /b 1
)

REM Check if user is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr . >nul
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%⚠️  Not authenticated with Google Cloud.%NC%
    echo Please run: gcloud auth login
    exit /b 1
)

REM Get current project
for /f "tokens=*" %%i in ('gcloud config get-value project') do set "CURRENT_PROJECT=%%i"
if "%CURRENT_PROJECT%"=="" (
    echo %RED%❌ No Google Cloud project set.%NC%
    echo Please run: gcloud config set project YOUR_PROJECT_ID
    exit /b 1
)

echo %GREEN%✅ Using Google Cloud project: %CURRENT_PROJECT%%NC%

REM Build the project
echo %BLUE%🔨 Building project...%NC%
call npm run build

if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Build failed. Please fix the errors and try again.%NC%
    exit /b 1
)

echo %GREEN%✅ Build completed successfully%NC%

REM Check if .env file exists
if not exist .env (
    echo %YELLOW%⚠️  .env file not found.%NC%
    echo Please create a .env file with your configuration before deploying.
    exit /b 1
)

REM Deploy to Cloud Functions
echo %BLUE%🚀 Deploying to Google Cloud Functions...%NC%

gcloud functions deploy %FUNCTION_NAME% ^
    --runtime %RUNTIME% ^
    --trigger-http ^
    --allow-unauthenticated ^
    --entry-point %ENTRY_POINT% ^
    --source dist ^
    --region %REGION% ^
    --memory %MEMORY% ^
    --timeout %TIMEOUT% ^
    --set-env-vars="NODE_ENV=production"

if %ERRORLEVEL% equ 0 (
    echo %GREEN%✅ Deployment completed successfully!%NC%
    
    REM Get the function URL
    for /f "tokens=*" %%i in ('gcloud functions describe %FUNCTION_NAME% --region=%REGION% --format="value(httpsTrigger.url)"') do set "FUNCTION_URL=%%i"
    
    echo.
    echo %BLUE%📋 Deployment Summary:%NC%
    echo   Function Name: %FUNCTION_NAME%
    echo   Region: %REGION%
    echo   Runtime: %RUNTIME%
    echo   Memory: %MEMORY%
    echo   Timeout: %TIMEOUT%
    echo   URL: %FUNCTION_URL%
    
    echo.
    echo %BLUE%🔗 Test your API:%NC%
    echo   Health Check: %FUNCTION_URL%/health
    echo   API Base: %FUNCTION_URL%/api
    
    echo.
    echo %GREEN%🎉 Your Avyra EDAI backend is now live on Google Cloud Functions!%NC%
    
    REM Update frontend environment variable
    echo.
    echo %YELLOW%⚠️  Don't forget to update your frontend .env file:%NC%
    echo   VITE_API_BASE_URL=%FUNCTION_URL%
    
) else (
    echo %RED%❌ Deployment failed. Please check the error messages above.%NC%
    exit /b 1
)

pause
