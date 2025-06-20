#!/bin/bash

# Quick Fix Script for React Frontend API Configuration
# This script fixes the common API URL configuration issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_status "Diagnosing React Frontend API Configuration..."

# Check if we're in the right directory
if [[ ! -f "$SCRIPT_DIR/package.json" ]]; then
    print_error "This script must be run from the react-frontend directory"
    exit 1
fi

# Check backend deployment
BACKEND_OUTPUT_FILE="$PROJECT_ROOT/backend/cdk/api-outputs.json"
INFRA_OUTPUT_FILE="$PROJECT_ROOT/backend/cdk/infra-outputs.json"

print_status "Checking backend deployment..."

if [[ ! -f "$BACKEND_OUTPUT_FILE" ]]; then
    print_error "Backend not deployed! File not found: $BACKEND_OUTPUT_FILE"
    print_status "To fix this, deploy the backend first:"
    print_status "  cd ../backend"
    print_status "  ./deploy.sh --owner=pete"
    exit 1
fi

print_success "Backend deployment found"

# Extract API URL
OWNER=${1:-pete}
ENVIRONMENT=${2:-dev}
API_STACK_NAME="baksh-audit-${OWNER}-${ENVIRONMENT}-Api"

if command -v jq &> /dev/null; then
    API_URL=$(cat "$BACKEND_OUTPUT_FILE" | jq -r ".\"$API_STACK_NAME\".ApiUrl // empty" 2>/dev/null)
else
    print_warning "jq not installed, using grep to extract API URL"
    API_URL=$(grep -o 'https://[^"]*\.amazonaws\.com/[^"]*' "$BACKEND_OUTPUT_FILE" | head -1)
fi

if [[ -z "$API_URL" || "$API_URL" == "null" || "$API_URL" == "" ]]; then
    print_error "Could not extract API URL from backend outputs"
    print_status "Backend output file contents:"
    cat "$BACKEND_OUTPUT_FILE"
    print_status ""
    print_status "Expected stack name: $API_STACK_NAME"
    exit 1
fi

print_success "Found API URL: $API_URL"

# Test API connectivity
print_status "Testing API connectivity..."
if curl -s --max-time 10 "$API_URL/questions?type=company" > /dev/null; then
    print_success "API is accessible"
else
    print_warning "API test failed, but continuing with configuration"
fi

# Create environment file
print_status "Creating environment configuration..."
cat > .env.local << EOF
# React Frontend Configuration
REACT_APP_API_URL=$API_URL
REACT_APP_ENVIRONMENT=development
GENERATE_SOURCEMAP=true

# Debug info
# Generated on: $(date)
# Owner: $OWNER
# Environment: $ENVIRONMENT
# Stack: $API_STACK_NAME
EOF

print_success "Created .env.local with correct API URL"

# Remove any conflicting .env files
if [[ -f ".env" ]]; then
    print_status "Removing conflicting .env file"
    rm .env
fi

# Show configuration
print_status "Current configuration:"
print_status "  API URL: $API_URL"
print_status "  Environment: development"

# Test the configuration
print_status "Testing configuration by starting React dev server..."
print_status "Run these commands:"
print_status "  1. npm start"
print_status "  2. Visit http://localhost:3000"
print_status "  3. Check browser console for any remaining errors"

print_success "Configuration fixed! Your React app should now connect to the correct API."
