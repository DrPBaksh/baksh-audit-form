#!/bin/bash

#########################################
# verify_cors_fix.sh
# Quick verification script to test if the CORS fix resolves the issue
#########################################

echo "🔍 Verifying CORS Fix for Baksh Audit Form"
echo "=========================================="

# Get the current API URL from error message
API_URL="https://23k1arzku5.execute-api.eu-west-2.amazonaws.com/dev"

echo "📋 Testing API endpoints..."
echo ""

# Test 1: Check if GET /responses endpoint exists (this should work after deployment)
echo "🧪 Test 1: Checking GET /responses endpoint"
echo "URL: $API_URL/responses?type=company&company_id=test"

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -H "Accept: application/json" \
  -H "Origin: https://d38qkjqfzaecqv.cloudfront.net" \
  "$API_URL/responses?type=company&company_id=test")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

echo "Status: $http_status"
if [[ "$http_status" == "404" ]]; then
    echo "❌ EXPECTED: Endpoint missing (this confirms our diagnosis)"
    echo "🔧 SOLUTION: Deploy the updated CDK stack to add the missing endpoint"
elif [[ "$http_status" == "200" || "$http_status" == "404" ]]; then
    echo "✅ Endpoint exists - checking CORS headers..."
    
    # Check for CORS headers in the response
    cors_headers=$(curl -s -I \
      -H "Origin: https://d38qkjqfzaecqv.cloudfront.net" \
      "$API_URL/responses?type=company&company_id=test" | grep -i "access-control")
    
    if [[ -n "$cors_headers" ]]; then
        echo "✅ CORS headers present:"
        echo "$cors_headers"
    else
        echo "❌ CORS headers missing"
    fi
else
    echo "🔍 Response: $body"
fi

echo ""

# Test 2: OPTIONS preflight request
echo "🧪 Test 2: Checking OPTIONS preflight for /responses"
options_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X OPTIONS \
  -H "Origin: https://d38qkjqfzaecqv.cloudfront.net" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$API_URL/responses")

options_status=$(echo $options_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
echo "OPTIONS Status: $options_status"

if [[ "$options_status" == "200" ]]; then
    echo "✅ OPTIONS request successful"
else
    echo "❌ OPTIONS request failed"
fi

echo ""

# Test 3: Check existing endpoints
echo "🧪 Test 3: Checking existing endpoints"

echo "GET /questions:"
questions_status=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/questions?type=company")
echo "  Status: $questions_status"

echo "POST /responses (without data):"
post_status=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/responses")
echo "  Status: $post_status"

echo ""

echo "📋 Summary:"
echo "=========="
if [[ "$http_status" == "404" ]]; then
    echo "❌ ISSUE CONFIRMED: GET /responses endpoint is missing"
    echo "🔧 RESOLUTION: The CDK stack has been updated to include:"
    echo "   1. New get_response Lambda function"
    echo "   2. GET method for /responses endpoint"
    echo "   3. Proper IAM permissions"
    echo ""
    echo "📦 TO FIX: Deploy the updated infrastructure:"
    echo "   cd backend && ./deploy.sh"
    echo ""
    echo "🔍 EXPECTED AFTER DEPLOYMENT:"
    echo "   - GET /responses will return 200 or proper 404 with CORS headers"
    echo "   - Frontend will be able to load existing forms"
    echo "   - No more CORS errors in browser console"
else
    echo "✅ Endpoint appears to be working!"
    echo "🔍 If you're still seeing CORS errors, check:"
    echo "   1. Browser cache (try hard refresh)"
    echo "   2. CloudFront cache invalidation"
    echo "   3. API Gateway deployment status"
fi

echo ""
echo "🛠️  To deploy the fix:"
echo "   cd backend && ./deploy.sh"
echo ""
echo "🔍 After deployment, test the app at:"
echo "   https://d38qkjqfzaecqv.cloudfront.net"
