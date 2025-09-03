#!/bin/bash

# Avyra EDAI Backend Deployment Script
# This script deploys the backend to Google Cloud Functions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_NAME="avyra-edai-api"
REGION="us-central1"
RUNTIME="nodejs18"
MEMORY="512MB"
TIMEOUT="540s"
ENTRY_POINT="avyraEdaiApi"

echo -e "${BLUE}🚀 Avyra EDAI Backend Deployment${NC}"
echo "=================================="

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

echo -e "${GREEN}✅ Using Google Cloud project: ${CURRENT_PROJECT}${NC}"

# Build the project
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please fix the errors and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Check if .env file exists
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

# Deploy to Cloud Functions
echo -e "${BLUE}🚀 Deploying to Google Cloud Functions...${NC}"

gcloud functions deploy $FUNCTION_NAME \
    --runtime $RUNTIME \
    --trigger-http \
    --allow-unauthenticated \
    --entry-point $ENTRY_POINT \
    --source dist \
    --region $REGION \
    --memory $MEMORY \
    --timeout $TIMEOUT \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=$GOOGLE_CLOUD_PROJECT_ID" \
    --set-env-vars="GOOGLE_CLOUD_REGION=${GOOGLE_CLOUD_REGION:-us-central1}" \
    --set-env-vars="FIRESTORE_DATABASE_ID=${FIRESTORE_DATABASE_ID:-'(default)'}" \
    --set-env-vars="CLOUD_STORAGE_BUCKET=$CLOUD_STORAGE_BUCKET" \
    --set-env-vars="DOCUMENT_AI_LOCATION=${DOCUMENT_AI_LOCATION:-us}" \
    --set-env-vars="DOCUMENT_AI_PROCESSOR_ID=$DOCUMENT_AI_PROCESSOR_ID" \
    --set-env-vars="VERTEX_AI_LOCATION=${VERTEX_AI_LOCATION:-us-central1}" \
    --set-env-vars="VERTEX_AI_MODEL=${VERTEX_AI_MODEL:-gemini-1.5-flash}" \
    --set-env-vars="SUPABASE_URL=${SUPABASE_URL}" \
    --set-env-vars="SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
    --set-env-vars="SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET" \
    --set-env-vars="RATE_LIMIT_WINDOW_MS=${RATE_LIMIT_WINDOW_MS:-900000}" \
    --set-env-vars="RATE_LIMIT_MAX_REQUESTS=${RATE_LIMIT_MAX_REQUESTS:-100}" \
    --set-env-vars="ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-http://localhost:3000,http://localhost:5173}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    
    # Get the function URL
    FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --format="value(httpsTrigger.url)")
    
    echo ""
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    echo "  Function Name: $FUNCTION_NAME"
    echo "  Region: $REGION"
    echo "  Runtime: $RUNTIME"
    echo "  Memory: $MEMORY"
    echo "  Timeout: $TIMEOUT"
    echo "  URL: $FUNCTION_URL"
    
    echo ""
    echo -e "${BLUE}🔗 Test your API:${NC}"
    echo "  Health Check: $FUNCTION_URL/health"
    echo "  API Base: $FUNCTION_URL/api"
    
    echo ""
    echo -e "${GREEN}🎉 Your Avyra EDAI backend is now live on Google Cloud Functions!${NC}"
    
    # Update frontend environment variable
    echo ""
    echo -e "${YELLOW}⚠️  Don't forget to update your frontend .env file:${NC}"
    echo "  VITE_API_BASE_URL=$FUNCTION_URL"
    
else
    echo -e "${RED}❌ Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi
