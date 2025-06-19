#!/bin/bash
# Baksh Audit Form API Test Runner
# Automatically discovers API URL and runs comprehensive tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${!1}%s${NC}\n" "$2"
}

print_color "PURPLE" "🧪 Baksh Audit Form API Test Runner"
print_color "BLUE" "================================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    print_color "RED" "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if required Python packages are available
python3 -c "import requests" 2>/dev/null || {
    print_color "YELLOW" "⚠️  Installing required Python packages..."
    pip3 install requests colorama
}

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Look for CDK outputs to get API URL
API_URL=""

# Method 1: Check for CDK output files
if [ -f "${SCRIPT_DIR}/backend/cdk/cdk-outputs.json" ]; then
    print_color "BLUE" "📄 Found CDK outputs file..."
    API_URL=$(python3 -c "
import json, sys
try:
    with open('${SCRIPT_DIR}/backend/cdk/cdk-outputs.json', 'r') as f:
        outputs = json.load(f)
    for stack_name, stack_outputs in outputs.items():
        if 'ApiUrl' in stack_outputs:
            print(stack_outputs['ApiUrl'])
            break
except:
    pass
" 2>/dev/null)
fi

# Method 2: Try to get from AWS CLI if available
if [ -z "$API_URL" ] && command -v aws &> /dev/null; then
    print_color "BLUE" "🔍 Searching for API Gateway in AWS..."
    
    # Try to find the API Gateway by name pattern
    API_ID=$(aws apigateway get-rest-apis --query "items[?contains(name, 'baksh-audit')].id" --output text 2>/dev/null | head -1)
    
    if [ ! -z "$API_ID" ] && [ "$API_ID" != "None" ]; then
        REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
        # Try to find the stage (usually 'dev' or 'prod')
        STAGE=$(aws apigateway get-stages --rest-api-id "$API_ID" --query "item[0].stageName" --output text 2>/dev/null || echo "dev")
        API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
        print_color "GREEN" "✅ Found API: $API_URL"
    fi
fi

# Method 3: Check environment variable
if [ -z "$API_URL" ] && [ ! -z "$BAKSH_API_URL" ]; then
    API_URL="$BAKSH_API_URL"
    print_color "BLUE" "📝 Using API URL from environment variable"
fi

# Method 4: Prompt user
if [ -z "$API_URL" ]; then
    print_color "YELLOW" "❓ Could not automatically discover API URL."
    echo "Please enter your API Gateway URL:"
    echo "Format: https://your-api-id.execute-api.region.amazonaws.com/stage"
    echo "Example: https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev"
    echo ""
    read -p "API URL: " API_URL
    
    if [ -z "$API_URL" ]; then
        print_color "RED" "❌ API URL is required to run tests"
        exit 1
    fi
fi

# Validate API URL format
if [[ ! $API_URL =~ ^https?:// ]]; then
    print_color "RED" "❌ Invalid API URL format. Must start with http:// or https://"
    exit 1
fi

print_color "GREEN" "🎯 Testing API: $API_URL"
echo ""

# Create test results directory
TEST_RESULTS_DIR="${SCRIPT_DIR}/test-results"
mkdir -p "$TEST_RESULTS_DIR"

# Generate timestamp for results file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="${TEST_RESULTS_DIR}/api_test_results_${TIMESTAMP}.json"

# Create the test script if it doesn't exist in the current directory
TEST_SCRIPT="${SCRIPT_DIR}/test_api.py"

if [ ! -f "$TEST_SCRIPT" ]; then
    print_color "YELLOW" "📝 Test script not found. Please ensure test_api.py is in the same directory."
    print_color "BLUE" "You can download it from the project repository or copy it from the artifacts."
    exit 1
fi

# Run the tests
print_color "BLUE" "🚀 Starting API tests..."
echo ""

# Run Python test script
if python3 "$TEST_SCRIPT" --api-url "$API_URL" --output "$RESULTS_FILE"; then
    print_color "GREEN" "✅ All tests completed successfully!"
    
    # Show quick summary
    if [ -f "$RESULTS_FILE" ]; then
        TOTAL_TESTS=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(data['total_tests'])" 2>/dev/null || echo "?")
        PASSED_TESTS=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(data['passed'])" 2>/dev/null || echo "?")
        SUCCESS_RATE=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(f\"{data['success_rate']:.1f}%\")" 2>/dev/null || echo "?")
        
        echo ""
        print_color "BLUE" "📊 Quick Summary:"
        echo "   Total Tests: $TOTAL_TESTS"
        echo "   Passed: $PASSED_TESTS"
        echo "   Success Rate: $SUCCESS_RATE"
        echo "   Results saved to: $RESULTS_FILE"
    fi
else
    EXIT_CODE=$?
    print_color "RED" "❌ Some tests failed (exit code: $EXIT_CODE)"
    
    if [ -f "$RESULTS_FILE" ]; then
        print_color "YELLOW" "📋 Check detailed results in: $RESULTS_FILE"
    fi
    
    exit $EXIT_CODE
fi

echo ""
print_color "GREEN" "🎉 API testing complete!"

# Optional: Open results file if available
if command -v code &> /dev/null && [ -f "$RESULTS_FILE" ]; then
    read -p "Open results in VS Code? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        code "$RESULTS_FILE"
    fi
fi

print_color "BLUE" "💡 Tip: Set BAKSH_API_URL environment variable to skip URL input next time"
echo "   export BAKSH_API_URL=\"$API_URL\""
