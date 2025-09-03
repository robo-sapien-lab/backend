@echo off
REM Avyra EDAI Backend Cloud Run Deployment Script for Windows
REM This script deploys the backend to Google Cloud Run

setlocal enabledelayedexpansion

REM Colors for output (Windows compatible)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Configuration
set "SERVICE_NAME=avyra-edai-api"
set "REGION=us-central1"
set "PROJECT_ID="
set "REPOSITORY=avyra-backend"
set "IMAGE_NAME=us-docker.pkg.dev/%PROJECT_ID%/%REPOSITORY%/%SERVICE_NAME%"
set "MEMORY=512Mi"
set "CPU=1"
set "MAX_INSTANCES=10"
set "MIN_INSTANCES=0"
set "TIMEOUT=300"

echo %BLUE%🚀 Avyra EDAI Backend Cloud Run Deployment%NC%
echo ==============================================

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

set "PROJECT_ID=%CURRENT_PROJECT%"
set "IMAGE_NAME=us-docker.pkg.dev/%PROJECT_ID%/%REPOSITORY%/%SERVICE_NAME%"

echo %GREEN%✅ Using Google Cloud project: %PROJECT_ID%%NC%

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Docker is not installed.%NC%
    echo Please install Docker to build the container image.
    exit /b 1
)

REM Check if Docker daemon is running
docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Docker daemon is not running.%NC%
    echo Please start Docker and try again.
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo %YELLOW%⚠️  .env file not found.%NC%
    echo Please create a .env file with your configuration before deploying.
    exit /b 1
)

echo %GREEN%✅ Environment file found%NC%

REM Build the project
echo %BLUE%🔨 Building project...%NC%
call npm run build

if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Build failed. Please fix the errors and try again.%NC%
    exit /b 1
)

echo %GREEN%✅ Build completed successfully%NC%

REM Create Artifact Registry repository if it doesn't exist
echo %BLUE%🏗️  Setting up Artifact Registry...%NC%
gcloud artifacts repositories create %REPOSITORY% --repository-format=docker --location=%REGION% --description="Avyra Backend Docker Repository" --quiet 2>nul || echo Repository already exists

REM Configure Docker to use gcloud as a credential helper
echo %BLUE%🔐 Configuring Docker authentication...%NC%
gcloud auth configure-docker us-docker.pkg.dev

REM Build Docker image
echo %BLUE%🐳 Building Docker image...%NC%
docker build -t %IMAGE_NAME% .

if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Docker build failed. Please check the Dockerfile and try again.%NC%
    exit /b 1
)

echo %GREEN%✅ Docker image built successfully%NC%

REM Push Docker image to Artifact Registry
echo %BLUE%📤 Pushing Docker image to Artifact Registry...%NC%
docker push %IMAGE_NAME%

if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Failed to push Docker image. Please check your permissions and try again.%NC%
    exit /b 1
)

echo %GREEN%✅ Docker image pushed successfully%NC%

REM Deploy to Cloud Run
echo %BLUE%🚀 Deploying to Google Cloud Run...%NC%

gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --memory %MEMORY% ^
    --cpu %CPU% ^
    --max-instances %MAX_INSTANCES% ^
    --min-instances %MIN_INSTANCES% ^
    --timeout %TIMEOUT% ^
    --allow-unauthenticated ^
    --port 8080 ^
    --set-env-vars="NODE_ENV=production" ^
    --set-env-vars="PORT=8080"

if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Deployment failed. Please check the logs and try again.%NC%
    exit /b 1
)

echo %GREEN%✅ Deployment completed successfully!%NC%

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do set "SERVICE_URL=%%i"

echo.
echo %BLUE%📋 Deployment Summary:%NC%
echo   Service Name: %SERVICE_NAME%
echo   Region: %REGION%
echo   Memory: %MEMORY%
echo   CPU: %CPU%
echo   Max Instances: %MAX_INSTANCES%
echo   Min Instances: %MIN_INSTANCES%
echo   Timeout: %TIMEOUT%s
echo   URL: %SERVICE_URL%

echo.
echo %BLUE%🔗 Test your API:%NC%
echo   Health Check: %SERVICE_URL%/health
echo   API Info: %SERVICE_URL%/api
echo   Ask Question: %SERVICE_URL%/api/ask
echo   Upload Document: %SERVICE_URL%/api/upload
echo   View Progress: %SERVICE_URL%/api/progress/{studentId}
echo   Start Quiz: %SERVICE_URL%/api/quiz/start

echo.
echo %GREEN%🎉 Your Avyra EDAI Backend is now running on Google Cloud Run!%NC%
echo %YELLOW%💡 Remember to update your frontend to use the new API URL: %SERVICE_URL%%NC%
echo %YELLOW%⚠️  Note: You need to manually set environment variables in Cloud Run console%NC%
