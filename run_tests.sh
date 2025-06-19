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
FUNCTION_NAMES=""

# Method 1: Check for CDK API outputs file (correct path)
API_OUTPUTS_FILE="${SCRIPT_DIR}/backend/cdk/api-outputs.json"
if [ -f "$API_OUTPUTS_FILE" ]; then
    print_color "BLUE" "📄 Found CDK API outputs file..."
    
    # Extract API URL from the nested JSON structure
    API_URL=$(python3 -c "
import json, sys
try:
    with open('${API_OUTPUTS_FILE}', 'r') as f:
        outputs = json.load(f)
    
    # Look for the API stack (contains 'Api' in the name)
    for stack_name, stack_outputs in outputs.items():
        if 'Api' in stack_name and 'ApiUrl' in stack_outputs:
            print(stack_outputs['ApiUrl'])
            break
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
" 2>/dev/null)
    
    # Extract function names for additional validation
    FUNCTION_NAMES=$(python3 -c "
import json, sys
try:
    with open('${API_OUTPUTS_FILE}', 'r') as f:
        outputs = json.load(f)
    
    functions = []
    for stack_name, stack_outputs in outputs.items():
        if 'Api' in stack_name:
            if 'GetQuestionsFunctionName' in stack_outputs:
                functions.append(f\"GET_QUESTIONS={stack_outputs['GetQuestionsFunctionName']}\")
            if 'SaveResponseFunctionName' in stack_outputs:
                functions.append(f\"SAVE_RESPONSE={stack_outputs['SaveResponseFunctionName']}\")
    
    if functions:
        print(';'.join(functions))
except:
    pass
" 2>/dev/null)
    
    if [ ! -z "$API_URL" ]; then
        print_color "GREEN" "✅ Found API URL from CDK outputs: $API_URL"
        
        if [ ! -z "$FUNCTION_NAMES" ]; then
            print_color "BLUE" "📋 Found Lambda functions: $FUNCTION_NAMES"
        fi
    fi
fi

# Method 2: Try to get from AWS CLI if available (fallback)
if [ -z "$API_URL" ] && command -v aws &> /dev/null; then
    print_color "BLUE" "🔍 Searching for API Gateway in AWS..."
    
    # Try to find the API Gateway by name pattern
    API_ID=$(aws apigateway get-rest-apis --query "items[?contains(name, 'baksh-audit')].id" --output text 2>/dev/null | head -1)
    
    if [ ! -z "$API_ID" ] && [ "$API_ID" != "None" ]; then
        REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
        # Try to find the stage (usually 'dev' or 'prod')
        STAGE=$(aws apigateway get-stages --rest-api-id "$API_ID" --query "item[0].stageName" --output text 2>/dev/null || echo "dev")
        API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
        print_color "GREEN" "✅ Found API via AWS CLI: $API_URL"
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
    echo "Please ensure you have deployed the infrastructure first:"
    echo "  cd backend && ./deploy.sh --owner=your-name"
    echo ""
    echo "Or manually enter your API Gateway URL:"
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

# Show additional deployment info if available
if [ -f "$API_OUTPUTS_FILE" ]; then
    echo ""
    print_color "BLUE" "📊 Deployment Information:"
    
    # Extract and display key deployment details
    python3 -c "
import json
try:
    with open('${API_OUTPUTS_FILE}', 'r') as f:
        outputs = json.load(f)
    
    print('   Stacks deployed:')
    for stack_name in outputs.keys():
        print(f'     • {stack_name}')
    
    # Show API details
    for stack_name, stack_outputs in outputs.items():
        if 'Api' in stack_name:
            if 'GetQuestionsFunctionName' in stack_outputs:
                print(f'   Lambda Functions:')
                print(f'     • Questions: {stack_outputs[\"GetQuestionsFunctionName\"]}')
            if 'SaveResponseFunctionName' in stack_outputs:
                print(f'     • Responses: {stack_outputs[\"SaveResponseFunctionName\"]}')
    
    # Show infrastructure details
    for stack_name, stack_outputs in outputs.items():
        if 'Infra' in stack_name:
            if 'SurveyBucketName' in stack_outputs:
                print(f'   S3 Bucket: {stack_outputs[\"SurveyBucketName\"]}')
            if 'CloudFrontDomainName' in stack_outputs:
                print(f'   Frontend URL: https://{stack_outputs[\"CloudFrontDomainName\"]}')
                
except Exception as e:
    print(f'   Error reading deployment info: {e}')
"
fi

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

# Prepare environment variables for the test script
export BAKSH_API_URL="$API_URL"
if [ ! -z "$FUNCTION_NAMES" ]; then
    export BAKSH_FUNCTION_NAMES="$FUNCTION_NAMES"
fi

# Run Python test script with enhanced output
if python3 "$TEST_SCRIPT" --api-url "$API_URL" --output "$RESULTS_FILE"; then
    print_color "GREEN" "✅ All tests completed successfully!"
    
    # Show quick summary
    if [ -f "$RESULTS_FILE" ]; then
        TOTAL_TESTS=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(data['total_tests'])" 2>/dev/null || echo "?")
        PASSED_TESTS=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(data['passed'])" 2>/dev/null || echo "?")
        FAILED_TESTS=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(data['failed'])" 2>/dev/null || echo "?")
        SUCCESS_RATE=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(f\"{data['success_rate']:.1f}%\")" 2>/dev/null || echo "?")
        AVG_RESPONSE_TIME=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(f\"{data['average_response_time_ms']:.0f}ms\")" 2>/dev/null || echo "?")
        
        echo ""
        print_color "BLUE" "📊 Test Summary:"
        echo "   Total Tests: $TOTAL_TESTS"
        echo "   Passed: $PASSED_TESTS"
        echo "   Failed: $FAILED_TESTS"
        echo "   Success Rate: $SUCCESS_RATE"
        echo "   Avg Response Time: $AVG_RESPONSE_TIME"
        echo "   Results saved to: $RESULTS_FILE"
        
        # Show failed tests if any
        if [ "$FAILED_TESTS" != "0" ] && [ "$FAILED_TESTS" != "?" ]; then
            echo ""
            print_color "YELLOW" "⚠️  Failed Tests:"
            python3 -c "
import json
try:
    with open('$RESULTS_FILE', 'r') as f:
        data = json.load(f)
    
    for result in data.get('results', []):
        if not result.get('success', True):
            error_msg = result.get('error_message', f\"HTTP {result.get('status_code', '?')}\")
            print(f\"     • {result.get('test_name', 'Unknown')}: {error_msg}\")
except:
    print('     • Unable to parse failed test details')
"
        fi
    fi
else
    EXIT_CODE=$?
    print_color "RED" "❌ Some tests failed (exit code: $EXIT_CODE)"
    
    if [ -f "$RESULTS_FILE" ]; then
        print_color "YELLOW" "📋 Check detailed results in: $RESULTS_FILE"
        
        # Show quick failure summary
        FAILED_COUNT=$(python3 -c "import json; data=json.load(open('$RESULTS_FILE')); print(data.get('failed', 0))" 2>/dev/null || echo "?")
        if [ "$FAILED_COUNT" != "0" ] && [ "$FAILED_COUNT" != "?" ]; then
            print_color "RED" "❌ $FAILED_COUNT test(s) failed. Common issues:"
            echo "   • Check if the backend is fully deployed"
            echo "   • Verify S3 bucket has question CSV files"
            echo "   • Check Lambda function permissions"
            echo "   • Review CloudWatch logs for errors"
        fi
    fi
    
    exit $EXIT_CODE
fi

echo ""
print_color "GREEN" "🎉 API testing complete!"

# Show next steps
echo ""
print_color "BLUE" "🔗 Useful Links:"
if [ -f "$API_OUTPUTS_FILE" ]; then
    # Show frontend URL if available
    FRONTEND_URL=$(python3 -c "
import json
try:
    with open('${API_OUTPUTS_FILE}', 'r') as f:
        outputs = json.load(f)
    for stack_name, stack_outputs in outputs.items():
        if 'CloudFrontDomainName' in stack_outputs:
            print(f\"https://{stack_outputs['CloudFrontDomainName']}\")
            break
except:
    pass
" 2>/dev/null)
    
    if [ ! -z "$FRONTEND_URL" ]; then
        echo "   Frontend: $FRONTEND_URL"
    fi
fi
echo "   API Endpoint: $API_URL"
echo "   Test Results: $RESULTS_FILE"

# Optional: Open results file if available
if command -v code &> /dev/null && [ -f "$RESULTS_FILE" ]; then
    echo ""
    read -p "Open results in VS Code? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        code "$RESULTS_FILE"
    fi
fi

print_color "BLUE" "💡 Tips:"
echo "   • Set BAKSH_API_URL environment variable to skip auto-discovery"
echo "   • Run './run_tests.sh' anytime to validate your API"
echo "   • Check '$RESULTS_FILE' for detailed test results"
