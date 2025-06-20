#!/bin/bash

# React Frontend Deployment Script for DMGT AI Survey
# This script builds and deploys the React frontend to AWS S3 + CloudFront

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/react-frontend"

# Default values
ENVIRONMENT="dev"
OWNER=""
BUCKET_NAME=""
CLOUDFRONT_ID=""
API_URL=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy React frontend for DMGT AI Survey to AWS S3 + CloudFront

OPTIONS:
    --owner=NAME          Owner identifier for resource naming (required)
    --environment=ENV     Environment (dev/staging/prod) [default: dev]
    --bucket=BUCKET       S3 bucket name (optional, will auto-detect)
    --api-url=URL         API Gateway URL (optional, will auto-detect)
    --cloudfront=ID       CloudFront distribution ID (optional)
    --build-only          Only build, don't deploy
    --help               Show this help message

EXAMPLES:
    $0 --owner=pete
    $0 --owner=pete --environment=prod --api-url=https://api.example.com/prod
    $0 --owner=pete --build-only

NOTES:
    - AWS CLI must be configured with appropriate permissions
    - Node.js and npm must be installed
    - Backend must be deployed first to get API URL
EOF
}

# Parse command line arguments
BUILD_ONLY=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --owner=*)
            OWNER="${1#*=}"
            shift
            ;;
        --environment=*)
            ENVIRONMENT="${1#*=}"
            shift
            ;;
        --bucket=*)
            BUCKET_NAME="${1#*=}"
            shift
            ;;
        --api-url=*)
            API_URL="${1#*=}"
            shift
            ;;
        --cloudfront=*)
            CLOUDFRONT_ID="${1#*=}"
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$OWNER" ]]; then
    print_error "Owner is required. Use --owner=your-name"
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Environment must be one of: dev, staging, prod"
    exit 1
fi

print_status "Starting React frontend deployment..."
print_status "Owner: $OWNER"
print_status "Environment: $ENVIRONMENT"

# Check if we're in the right directory
if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
    print_error "React frontend directory not found at: $FRONTEND_DIR"
    print_error "Please run this script from the project root"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check Node.js and npm
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Install dependencies - using npm install instead of npm ci for better compatibility
print_status "Installing dependencies..."
npm install

# Auto-detect API URL if not provided
if [[ -z "$API_URL" ]]; then
    print_status "Auto-detecting API URL from backend deployment..."
    
    # Correct path to the API outputs file
    BACKEND_OUTPUT_FILE="$PROJECT_ROOT/backend/cdk/api-outputs.json"
    
    if [[ -f "$BACKEND_OUTPUT_FILE" ]]; then
        # Construct the expected stack name to match backend deployment
        API_STACK_NAME="baksh-audit-${OWNER}-${ENVIRONMENT}-Api"
        
        # Extract API URL using the correct stack structure
        API_URL=$(cat "$BACKEND_OUTPUT_FILE" | jq -r ".\"$API_STACK_NAME\".ApiUrl // empty" 2>/dev/null)
        
        if [[ -n "$API_URL" && "$API_URL" != "null" && "$API_URL" != "" ]]; then
            print_success "Detected API URL: $API_URL"
        else
            print_warning "Could not auto-detect API URL from backend outputs"
            print_warning "Backend output file contents:"
            if command -v jq &> /dev/null; then
                cat "$BACKEND_OUTPUT_FILE" | jq . 2>/dev/null || cat "$BACKEND_OUTPUT_FILE"
            else
                cat "$BACKEND_OUTPUT_FILE"
            fi
            print_warning "Using default localhost URL for development"
            API_URL="http://localhost:3001"
        fi
    else
        print_warning "Backend output file not found: $BACKEND_OUTPUT_FILE"
        print_warning "Make sure backend is deployed first, or provide --api-url manually"
        API_URL="http://localhost:3001"
    fi
fi

# Create environment file
print_status "Configuring environment variables..."
cat > .env << EOF
REACT_APP_API_URL=$API_URL
REACT_APP_ENVIRONMENT=$ENVIRONMENT
GENERATE_SOURCEMAP=false
EOF

print_status "Environment configuration:"
print_status "  REACT_APP_API_URL=$API_URL"
print_status "  REACT_APP_ENVIRONMENT=$ENVIRONMENT"

# Build the application
print_status "Building React application..."
npm run build

if [[ ! -d "build" ]]; then
    print_error "Build failed - build directory not found"
    exit 1
fi

print_success "React application built successfully"

# If build-only flag is set, exit here
if [[ "$BUILD_ONLY" == "true" ]]; then
    print_success "Build completed. Skipping deployment (--build-only flag)"
    print_status "Build files are in: $FRONTEND_DIR/build"
    exit 0
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
fi

# Auto-detect S3 bucket if not provided
if [[ -z "$BUCKET_NAME" ]]; then
    print_status "Auto-detecting S3 bucket name..."
    
    # Try to find bucket from infrastructure outputs
    INFRA_OUTPUT_FILE="$PROJECT_ROOT/backend/cdk/infra-outputs.json"
    
    if [[ -f "$INFRA_OUTPUT_FILE" ]]; then
        # Construct the expected stack name
        INFRA_STACK_NAME="baksh-audit-${OWNER}-${ENVIRONMENT}-Infra"
        
        # Extract bucket name using the correct stack structure
        BUCKET_NAME=$(cat "$INFRA_OUTPUT_FILE" | jq -r ".\"$INFRA_STACK_NAME\".WebsiteBucketName // empty" 2>/dev/null)
        
        if [[ -z "$BUCKET_NAME" || "$BUCKET_NAME" == "null" || "$BUCKET_NAME" == "" ]]; then
            # Fallback: construct bucket name
            BUCKET_NAME="baksh-audit-$OWNER-$ENVIRONMENT-website"
        fi
    else
        BUCKET_NAME="baksh-audit-$OWNER-$ENVIRONMENT-website"
    fi
    
    print_status "Using bucket name: $BUCKET_NAME"
fi

# Check if bucket exists
if ! aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    print_error "S3 bucket does not exist: $BUCKET_NAME"
    print_error "Make sure the backend is deployed first"
    exit 1
fi

# Deploy to S3
print_status "Deploying to S3 bucket: $BUCKET_NAME"

# Sync build files to S3
aws s3 sync build/ "s3://$BUCKET_NAME" \
    --delete \
    --cache-control "public,max-age=31536000" \
    --exclude "*.html" \
    --exclude "service-worker.js" \
    --exclude "manifest.json"

# Upload HTML files with no-cache headers
aws s3 sync build/ "s3://$BUCKET_NAME" \
    --exclude "*" \
    --include "*.html" \
    --include "service-worker.js" \
    --include "manifest.json" \
    --cache-control "public,max-age=0,must-revalidate"

print_success "Files uploaded to S3"

# Auto-detect CloudFront distribution ID if not provided
if [[ -z "$CLOUDFRONT_ID" ]]; then
    print_status "Auto-detecting CloudFront distribution ID..."
    
    if [[ -f "$INFRA_OUTPUT_FILE" ]]; then
        INFRA_STACK_NAME="baksh-audit-${OWNER}-${ENVIRONMENT}-Infra"
        CLOUDFRONT_ID=$(cat "$INFRA_OUTPUT_FILE" | jq -r ".\"$INFRA_STACK_NAME\".CloudFrontDistributionId // empty" 2>/dev/null)
        
        if [[ -n "$CLOUDFRONT_ID" && "$CLOUDFRONT_ID" != "null" && "$CLOUDFRONT_ID" != "" ]]; then
            print_status "Detected CloudFront distribution: $CLOUDFRONT_ID"
        fi
    fi
fi

# Invalidate CloudFront cache if distribution ID is available
if [[ -n "$CLOUDFRONT_ID" && "$CLOUDFRONT_ID" != "null" && "$CLOUDFRONT_ID" != "" ]]; then
    print_status "Invalidating CloudFront cache..."
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "CloudFront invalidation created: $INVALIDATION_ID"
    print_status "Cache invalidation may take a few minutes to complete"
else
    print_warning "CloudFront distribution ID not found - skipping cache invalidation"
fi

# Get website URL
WEBSITE_URL=""
if [[ -f "$INFRA_OUTPUT_FILE" ]]; then
    INFRA_STACK_NAME="baksh-audit-${OWNER}-${ENVIRONMENT}-Infra"
    CLOUDFRONT_DOMAIN=$(cat "$INFRA_OUTPUT_FILE" | jq -r ".\"$INFRA_STACK_NAME\".CloudFrontDomainName // empty" 2>/dev/null)
    
    if [[ -n "$CLOUDFRONT_DOMAIN" && "$CLOUDFRONT_DOMAIN" != "null" && "$CLOUDFRONT_DOMAIN" != "" ]]; then
        WEBSITE_URL="https://$CLOUDFRONT_DOMAIN"
        print_success "Website URL: $WEBSITE_URL"
    fi
fi

# Clean up
rm -f .env

print_success "React frontend deployment completed successfully!"
print_status ""
print_status "Deployment Summary:"
print_status "  Environment: $ENVIRONMENT"
print_status "  S3 Bucket: $BUCKET_NAME"
print_status "  API URL: $API_URL"

if [[ -n "$CLOUDFRONT_ID" && "$CLOUDFRONT_ID" != "null" && "$CLOUDFRONT_ID" != "" ]]; then
    print_status "  CloudFront: $CLOUDFRONT_ID"
fi

if [[ -n "$WEBSITE_URL" ]]; then
    print_status "  Website: $WEBSITE_URL"
fi

print_status ""
print_status "Next steps:"
print_status "  1. Wait for CloudFront cache invalidation to complete (if applicable)"
print_status "  2. Test the website functionality"
if [[ -n "$WEBSITE_URL" ]]; then
    print_status "  3. Visit: $WEBSITE_URL"
fi
print_status "  4. Run the test suite: cd $PROJECT_ROOT && ./run_tests.sh"
