#!/bin/bash

# React Frontend Setup Script
# This script sets up the React development environment

set -e

# Colors for output
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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_status "Setting up React frontend development environment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. Please install Node.js 16+ and run this script again."
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_warning "npm is not installed. Please install npm and run this script again."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Install dependencies
print_status "Installing React dependencies..."
npm install

# Create development environment file if it doesn't exist
if [[ ! -f ".env.local" ]]; then
    print_status "Creating development environment file..."
    cat > .env.local << EOF
# Development environment configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
GENERATE_SOURCEMAP=true
EOF
    print_success "Created .env.local for local development"
else
    print_status ".env.local already exists, skipping creation"
fi

print_success "React frontend setup complete!"
print_status ""
print_status "Available commands:"
print_status "  npm start          - Start development server (http://localhost:3000)"
print_status "  npm run build      - Build for production"
print_status "  npm test           - Run tests"
print_status "  ./deploy.sh        - Deploy to AWS (requires backend deployment first)"
print_status ""
print_status "To start development:"
print_status "  npm start"
