#!/bin/bash

# Avyra EDAI Backend Cloud Run Deployment Script
# This script deploys the backend to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="avyra-edai-api"
REGION="us-central1"
PROJECT_ID=""
REPOSITORY="avyra-backend"
IMAGE_NAME="us-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}"
MEMORY="512Mi"
CPU="1"
MAX_INSTANCES="10"
MIN_INSTANCES="0"
TIMEOUT="300"

echo -e "${BLUE}🚀 Avyra EDAI Backend Cloud Run Deployment${NC}"
echo "=============================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI (gcloud) is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated with Google Cloud.${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project)
if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${RED}❌ No Google Cloud project set.${NC}"
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

PROJECT_ID=$CURRENT_PROJECT
IMAGE_NAME="us-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}"

echo -e "${GREEN}✅ Using Google Cloud project: ${PROJECT_ID}${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed.${NC}"
    echo "Please install Docker to build the container image."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running.${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

# Check if .env file exists and validate required variables
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found.${NC}"
    echo "Please create a .env file with your configuration before deploying."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
REQUIRED_VARS=(
    "GOOGLE_CLOUD_PROJECT_ID"
    "CLOUD_STORAGE_BUCKET"
    "DOCUMENT_AI_PROCESSOR_ID"
    "SUPABASE_JWT_SECRET"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo "Please check your .env file and try again."
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Build the project
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please fix the errors and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Create Artifact Registry repository if it doesn't exist
echo -e "${BLUE}🏗️  Setting up Artifact Registry...${NC}"
gcloud artifacts repositories create ${REPOSITORY} \
    --repository-format=docker \
    --location=${REGION} \
    --description="Avyra Backend Docker Repository" \
    --quiet 2>/dev/null || echo "Repository already exists"

# Configure Docker to use gcloud as a credential helper
echo -e "${BLUE}🔐 Configuring Docker authentication...${NC}"
gcloud auth configure-docker us-docker.pkg.dev

# Build Docker image
echo -e "${BLUE}🐳 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME} .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed. Please check the Dockerfile and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Push Docker image to Artifact Registry
echo -e "${BLUE}📤 Pushing Docker image to Artifact Registry...${NC}"
docker push ${IMAGE_NAME}

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to push Docker image. Please check your permissions and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker image pushed successfully${NC}"

# Deploy to Cloud Run
echo -e "${BLUE}🚀 Deploying to Google Cloud Run...${NC}"

gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --memory ${MEMORY} \
    --cpu ${CPU} \
    --max-instances ${MAX_INSTANCES} \
    --min-instances ${MIN_INSTANCES} \
    --timeout ${TIMEOUT} \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="PORT=8080" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID}" \
    --set-env-vars="CLOUD_STORAGE_BUCKET=${CLOUD_STORAGE_BUCKET}" \
    --set-env-vars="DOCUMENT_AI_PROCESSOR_ID=${DOCUMENT_AI_PROCESSOR_ID}" \
    --set-env-vars="SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed. Please check the logs and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")

echo.
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "  Service Name: ${SERVICE_NAME}"
echo "  Region: ${REGION}"
echo "  Memory: ${MEMORY}"
echo "  CPU: ${CPU}"
echo "  Max Instances: ${MAX_INSTANCES}"
echo "  Min Instances: ${MIN_INSTANCES}"
echo "  Timeout: ${TIMEOUT}s"
echo "  URL: ${SERVICE_URL}"

echo.
echo -e "${BLUE}🔗 Test your API:${NC}"
echo "  Health Check: ${SERVICE_URL}/health"
echo "  API Info: ${SERVICE_URL}/api"
echo "  Ask Question: ${SERVICE_URL}/api/ask"
echo "  Upload Document: ${SERVICE_URL}/api/upload"
echo "  View Progress: ${SERVICE_URL}/api/progress/{studentId}"
echo "  Start Quiz: ${SERVICE_URL}/api/quiz/start"

echo.
echo -e "${GREEN}🎉 Your Avyra EDAI Backend is now running on Google Cloud Run!${NC}"
echo -e "${YELLOW}💡 Remember to update your frontend to use the new API URL: ${SERVICE_URL}${NC}"
