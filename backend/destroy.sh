#!/usr/bin/env bash
set -euo pipefail

#####################################
# destroy.sh - Cleanup script
# Destroys CDK infrastructure for Baksh Audit Form
#####################################

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CDK_DIR="$SCRIPT_DIR/cdk"

# Default values
OWNER_NAME=$(whoami)
ENVIRONMENT="dev"
VENV_ACTIVATE="$CDK_DIR/.venv/bin/activate"

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
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🗑️  Starting Baksh Audit Form cleanup..."
echo "📋 Configuration:"
echo "   Owner: $OWNER_NAME"
echo "   Environment: $ENVIRONMENT"
echo "   Infra Stack: $INFRA_STACK_NAME"
echo "   API Stack: $API_STACK_NAME"
echo ""

# Warning message
echo "⚠️  WARNING: This will permanently delete all infrastructure and data!"
echo "   - All survey responses will be lost"
echo "   - S3 buckets and their contents will be deleted"
echo "   - CloudFront distribution will be removed"
echo "   - Lambda functions will be deleted"
echo ""

# Confirmation prompt
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
if [[ "$confirmation" != "yes" ]]; then
    echo "❌ Destruction cancelled"
    exit 0
fi

echo ""
echo "🧹 Starting cleanup process..."

function activate_venv() {
    if [ -f "$VENV_ACTIVATE" ]; then
        source "$VENV_ACTIVATE"
        echo "✅ Virtual environment activated"
    else
        echo "❌ Virtual environment not found at $VENV_ACTIVATE"
        echo "   Please ensure CDK deployment was completed first"
        exit 1
    fi
}

function destroy_stacks() {
    echo "🗑️  Destroying CDK stacks..."
    
    cd "$CDK_DIR"
    activate_venv
    
    # Destroy API stack first (has dependencies on infra)
    echo "📦 Destroying API stack: $API_STACK_NAME"
    cdk destroy "$API_STACK_NAME" \
        --force \
        -c owner_name="$OWNER_NAME" \
        -c environment="$ENVIRONMENT" || echo "ℹ️  $API_STACK_NAME not found or already destroyed"
    
    # Destroy infrastructure stack
    echo "📦 Destroying infrastructure stack: $INFRA_STACK_NAME"
    cdk destroy "$INFRA_STACK_NAME" \
        --force \
        -c owner_name="$OWNER_NAME" \
        -c environment="$ENVIRONMENT" || echo "ℹ️  $INFRA_STACK_NAME not found or already destroyed"
    
    cd "$SCRIPT_DIR"
    echo "✅ CDK stacks destroyed"
}

function cleanup_files() {
    echo "🧹 Cleaning up local files..."
    
    # Remove CDK output files
    rm -f "$CDK_DIR/infra-outputs.json"
    rm -f "$CDK_DIR/api-outputs.json"
    
    # Remove generated frontend config
    rm -f "$SCRIPT_DIR/../frontend/js/config.js"
    
    # Clean up CDK synthesis artifacts
    rm -rf "$CDK_DIR/cdk.out"
    
    echo "✅ Local cleanup complete"
}

function cleanup_s3_buckets() {
    echo "🗑️  Cleaning up S3 buckets (if needed)..."
    
    # Try to identify and empty S3 buckets that might not have been deleted
    BUCKET_PREFIX="baksh-audit-${OWNER_NAME}-${ENVIRONMENT}"
    
    # List buckets with our prefix
    BUCKETS=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, \`${BUCKET_PREFIX}\`)].Name" --output text || echo "")
    
    if [[ -n "$BUCKETS" ]]; then
        echo "ℹ️  Found remaining buckets to clean:"
        for bucket in $BUCKETS; do
            echo "   - $bucket"
            
            # Try to empty the bucket
            echo "   🧹 Emptying bucket: $bucket"
            aws s3 rm "s3://$bucket" --recursive || echo "   ⚠️  Failed to empty $bucket"
            
            # Try to delete the bucket
            echo "   🗑️  Deleting bucket: $bucket"
            aws s3api delete-bucket --bucket "$bucket" || echo "   ⚠️  Failed to delete $bucket"
        done
    else
        echo "✅ No remaining S3 buckets found"
    fi
}

#########################
# Main Execution
#########################

echo "🏢 Baksh Audit Form - Destruction Script"
echo "========================================="

# Run cleanup steps
destroy_stacks
cleanup_s3_buckets
cleanup_files

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📊 Cleanup Summary:"
echo "   - CDK stacks destroyed: $API_STACK_NAME, $INFRA_STACK_NAME"
echo "   - S3 buckets cleaned up"
echo "   - Local files removed"
echo "   - Owner: $OWNER_NAME"
echo "   - Environment: $ENVIRONMENT"
echo ""
echo "ℹ️  Note: Some AWS resources may take a few minutes to fully delete."
echo "   Check the AWS Console to verify complete removal if needed."