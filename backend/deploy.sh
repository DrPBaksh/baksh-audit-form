#!/usr/bin/env bash
set -euo pipefail

#####################################
# deploy.sh - Backend deployment script
# Deploys CDK infrastructure and backend resources only for Baksh Audit Form
# Note: Frontend deployment is handled separately by react-frontend/deploy.sh
#####################################

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CDK_DIR="$SCRIPT_DIR/cdk"
LAMBDA_DIR="$SCRIPT_DIR/lambda"

# Default values
OWNER_NAME=$(whoami)
ENVIRONMENT="dev"
VENV_ACTIVATE="$CDK_DIR/.venv/bin/activate"

# Output files
INFRA_OUTPUTS_FILE="$CDK_DIR/infra-outputs.json"
API_OUTPUTS_FILE="$CDK_DIR/api-outputs.json"

# Stack names
INFRA_STACK_NAME="baksh-audit-${OWNER_NAME}-${ENVIRONMENT}-Infra"
API_STACK_NAME="baksh-audit-${OWNER_NAME}-${ENVIRONMENT}-Api"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --owner=*)
            OWNER_NAME="${1#*=}"
            INFRA_STACK_NAME="baksh-audit-${OWNER_NAME}-${ENVIRONMENT}-Infra"
            API_STACK_NAME="baksh-audit-${OWNER_NAME}-${ENVIRONMENT}-Api"
            shift
            ;;
        --environment=*)
            ENVIRONMENT="${1#*=}"
            INFRA_STACK_NAME="baksh-audit-${OWNER_NAME}-${ENVIRONMENT}-Infra"
            API_STACK_NAME="baksh-audit-${OWNER_NAME}-${ENVIRONMENT}-Api"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--owner=<n>] [--environment=<env>] [--help]"
            echo "  --owner=<n>        Set owner name for resource naming (default: current username)"
            echo "  --environment=<env>   Set environment (default: dev)"
            echo "  --help               Show this help message"
            echo ""
            echo "Note: This script deploys backend resources only."
            echo "For React frontend deployment, use: cd ../react-frontend && ./deploy.sh"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Starting Baksh Audit Form backend deployment..."
echo "📋 Configuration:"
echo "   Owner: $OWNER_NAME"
echo "   Environment: $ENVIRONMENT"
echo "   Infra Stack: $INFRA_STACK_NAME"
echo "   API Stack: $API_STACK_NAME"
echo "   Mode: Backend Only"
echo ""

##################
# Helper Functions
##################

function check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is required but not installed"
        exit 1
    fi
    
    # Check Node.js for CDK
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required for CDK but not installed"
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI is required but not installed"
        exit 1
    fi
    
    # Check CDK CLI
    if ! command -v cdk &> /dev/null; then
        echo "ℹ️  CDK CLI not found, installing..."
        npm install -g aws-cdk
    fi
    
    echo "✅ Prerequisites check passed"
}

function setup_python_venv() {
    echo "🐍 Setting up Python virtual environment..."
    
    cd "$CDK_DIR"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        echo "📦 Creating virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    source "$VENV_ACTIVATE"
    
    # Upgrade pip and install dependencies
    echo "📦 Installing CDK dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    cd "$SCRIPT_DIR"
    echo "✅ Virtual environment setup complete"
}

function build_lambda_layers() {
    echo "🔨 Building Lambda layers..."
    
    # Build shared layer if requirements exist
    SHARED_REQUIREMENTS="$LAMBDA_DIR/shared/requirements.txt"
    if [ -f "$SHARED_REQUIREMENTS" ]; then
        echo "📦 Building shared layer..."
        cd "$LAMBDA_DIR/shared"
        
        # Clean and create python directory for layer
        rm -rf python
        mkdir -p python
        
        # Install pip dependencies to python directory
        pip install -r requirements.txt -t python/ --upgrade
        
        # Copy custom Python modules to python directory
        echo "📦 Copying custom Python modules..."
        cp *.py python/ 2>/dev/null || echo "ℹ️  No .py files to copy"
        
        # Ensure __init__.py exists
        if [ ! -f "python/__init__.py" ]; then
            touch python/__init__.py
        fi
        
        echo "✅ Shared layer built successfully"
        echo "📋 Layer contents:"
        ls -la python/
        cd "$SCRIPT_DIR"
    fi
}

function cdk_deploy() {
    echo "🏗️  Deploying CDK stacks..."
    
    cd "$CDK_DIR"
    source "$VENV_ACTIVATE"
    
    # Bootstrap CDK (idempotent)
    echo "🛠️  Bootstrapping CDK environment..."
    cdk bootstrap --require-approval never
    
    # Deploy infrastructure stack
    echo "📦 Deploying infrastructure stack: $INFRA_STACK_NAME"
    cdk deploy "$INFRA_STACK_NAME" \
        --outputs-file "$INFRA_OUTPUTS_FILE" \
        --require-approval never \
        -c owner_name="$OWNER_NAME" \
        -c environment="$ENVIRONMENT"
    
    # Deploy API stack
    echo "📦 Deploying API stack: $API_STACK_NAME"
    cdk deploy "$API_STACK_NAME" \
        --outputs-file "$API_OUTPUTS_FILE" \
        --require-approval never \
        -c owner_name="$OWNER_NAME" \
        -c environment="$ENVIRONMENT"
    
    cd "$SCRIPT_DIR"
    echo "✅ CDK deployment complete"
}

function get_stack_output() {
    local stack_name="$1"
    local output_key="$2"
    local outputs_file
    
    if [[ "$stack_name" == "$INFRA_STACK_NAME" ]]; then
        outputs_file="$INFRA_OUTPUTS_FILE"
    elif [[ "$stack_name" == "$API_STACK_NAME" ]]; then
        outputs_file="$API_OUTPUTS_FILE"
    else
        echo "❌ Unknown stack name: $stack_name"
        return 1
    fi
    
    if [[ -f "$outputs_file" ]]; then
        jq -r ".\"$stack_name\".\"$output_key\" // \"\"" "$outputs_file"
    else
        echo ""
    fi
}

function upload_sample_questions() {
    echo "📋 Uploading sample questions..."
    
    # Get survey bucket from stack outputs
    SURVEY_BUCKET=$(get_stack_output "$INFRA_STACK_NAME" "SurveyBucketName")
    
    if [[ -z "$SURVEY_BUCKET" ]]; then
        echo "❌ Could not get survey bucket name from stack outputs"
        exit 1
    fi
    
    # Upload question files if they exist
    if [[ -f "$SCRIPT_DIR/../data/company_questions.csv" ]]; then
        echo "📤 Uploading company questions..."
        aws s3 cp "$SCRIPT_DIR/../data/company_questions.csv" "s3://$SURVEY_BUCKET/questions/"
    fi
    
    if [[ -f "$SCRIPT_DIR/../data/employee_questions.csv" ]]; then
        echo "📤 Uploading employee questions..."
        aws s3 cp "$SCRIPT_DIR/../data/employee_questions.csv" "s3://$SURVEY_BUCKET/questions/"
    fi
    
    echo "✅ Questions upload complete"
}

function display_results() {
    echo ""
    echo "🎉 Backend deployment completed successfully!"
    echo ""
    
    # Get outputs
    API_URL=$(get_stack_output "$API_STACK_NAME" "ApiUrl")
    SURVEY_BUCKET=$(get_stack_output "$INFRA_STACK_NAME" "SurveyBucketName")
    WEBSITE_BUCKET=$(get_stack_output "$INFRA_STACK_NAME" "WebsiteBucketName")
    CLOUDFRONT_DOMAIN=$(get_stack_output "$INFRA_STACK_NAME" "CloudFrontDomainName")
    
    echo "📊 Backend Deployment Summary:"
    echo "   API Endpoint: $API_URL"
    echo "   Survey Data Bucket: $SURVEY_BUCKET"
    echo "   Website Bucket: $WEBSITE_BUCKET"
    echo "   CloudFront Domain: $CLOUDFRONT_DOMAIN"
    echo "   Owner: $OWNER_NAME"
    echo "   Environment: $ENVIRONMENT"
    echo ""
    echo "🔗 Next Steps:"
    echo "   1. Deploy React frontend: cd ../react-frontend && ./deploy.sh --owner=$OWNER_NAME"
    echo "   2. Test API endpoints: $API_URL"
    echo "   3. View responses in S3 bucket: $SURVEY_BUCKET"
    echo ""
    echo "💡 Note: Questions can be updated by modifying CSV files in ../data/ and running this script again."
    echo ""
}

#########################
# Main Execution
#########################

echo "🏢 Baksh Audit Form - Backend Deployment"
echo "=========================================="

# Run deployment steps
check_prerequisites
setup_python_venv
build_lambda_layers
cdk_deploy
upload_sample_questions
display_results

echo "✅ Backend deployment complete! Deploy frontend separately with react-frontend/deploy.sh"
