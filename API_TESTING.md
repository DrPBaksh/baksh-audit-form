# 🧪 Baksh Audit Form API Testing Guide

This comprehensive test suite validates all backend API functionality with realistic test data and **automatically discovers your API URL** from CDK deployment outputs.

## 📋 What Gets Tested

### **Core API Endpoints:**
- ✅ **GET /questions?type=company** - Retrieve company survey questions
- ✅ **GET /questions?type=employee** - Retrieve employee survey questions  
- ✅ **POST /responses** - Save company responses
- ✅ **POST /responses** - Save employee responses with file uploads

### **Error Handling:**
- ❌ Invalid question types
- ❌ Missing parameters
- ❌ Invalid response data
- ❌ Network timeouts

### **Advanced Features:**
- 📁 File upload validation (employee responses)
- 🔄 Response updates (overwriting existing responses)
- 🌐 CORS header verification
- ⚡ Performance monitoring (response times)

## 🚀 Quick Start

### Option 1: Automated Test Runner (Recommended)
```bash
# After deploying your infrastructure
cd baksh-audit-form

# Make the script executable (first time only)
chmod +x run_tests.sh

# Run tests (automatically finds API URL from CDK outputs)
./run_tests.sh
```

The test runner will automatically:
- 🔍 **Find your API URL** from `backend/cdk/api-outputs.json`
- 📊 **Show deployment info** (stacks, functions, S3 bucket, frontend URL)
- 🧪 **Run all tests** with realistic data
- 📈 **Display results** with success rates and response times

### Option 2: Manual Python Script
```bash
# Install dependencies
pip3 install requests colorama

# Run tests with your API URL
python3 test_api.py --api-url https://your-api-gateway-url.com/dev
```

## 📊 Automatic Discovery

The test runner automatically finds your API URL from the CDK outputs file:

**File Location:** `backend/cdk/api-outputs.json`

**Expected Structure:**
```json
{
  "baksh-audit-owner-env-Api": {
    "ApiUrl": "https://abc123.execute-api.region.amazonaws.com/dev",
    "GetQuestionsFunctionName": "baksh-audit-owner-env-get-questions",
    "SaveResponseFunctionName": "baksh-audit-owner-env-save-response"
  },
  "baksh-audit-owner-env-Infra": {
    "SurveyBucketName": "baksh-audit-owner-env-survey-data",
    "CloudFrontDomainName": "d38qkjqfzaecqv.cloudfront.net"
  }
}
```

## 📈 Expected Results

### **Successful Test Run:**
```
🧪 Baksh Audit Form API Test Runner
================================================
✅ Found API URL from CDK outputs: https://23k1arzku5.execute-api.eu-west-2.amazonaws.com/dev

📊 Deployment Information:
   Stacks deployed:
     • baksh-audit-pete-dev-Infra
     • baksh-audit-pete-dev-Api
   Lambda Functions:
     • Questions: baksh-audit-pete-dev-get-questions
     • Responses: baksh-audit-pete-dev-save-response
   S3 Bucket: baksh-audit-pete-dev-survey-data
   Frontend URL: https://d38qkjqfzaecqv.cloudfront.net

🚀 Starting API tests...

✅ Get Company Questions: GET /questions?type=company (200, 245ms)
✅ Get Employee Questions: GET /questions?type=employee (200, 189ms)
✅ Save Company Response: POST /responses (200, 456ms)
✅ Save Employee Response: POST /responses (200, 523ms)
✅ Save Employee Response with Files: POST /responses (200, 1234ms)
✅ Response Update Test: POST /responses (200, 387ms)
❌ Get Questions - Invalid Type: GET /questions?type=invalid (400, 156ms)
❌ Get Questions - Missing Type: GET /questions (400, 145ms)
❌ Save Invalid Response: POST /responses (400, 167ms)

📊 Test Summary:
   Total Tests: 10
   Passed: 7
   Failed: 3
   Success Rate: 70.0%
   Avg Response Time: 342ms

🔗 Useful Links:
   Frontend: https://d38qkjqfzaecqv.cloudfront.net
   API Endpoint: https://23k1arzku5.execute-api.eu-west-2.amazonaws.com/dev
```

**Note:** The ❌ failed tests are **expected failures** that validate proper error handling (400 status codes for invalid requests).

## 📊 Test Data Overview

### **Company Test Data:**
- **Company ID:** `test-company-{random8chars}`
- **20 realistic responses** covering:
  - AI Strategy & Leadership (c001-c004)
  - Data Governance & Quality (c005-c008)  
  - Technology Infrastructure (c009-c010)
  - Workforce Readiness (c011-c012)
  - Risk Management (c013-c015)
  - Strategic Objectives (c016-c017)
  - Current Initiatives (c018-c019)
  - Future Planning (c020)

### **Employee Test Data:**
- **Employee ID:** `employee-{random8chars}`
- **20 realistic responses** covering:
  - Role & Experience (e001-e002)
  - AI Familiarity & Usage (e003-e005)
  - Workflow Needs (e006-e007)
  - Comfort & Attitudes (e008-e009)
  - Learning & Development (e010-e013)
  - Data Skills (e014-e015)
  - Trust & Implementation (e016-e018)
  - Specific Needs (e019-e020)

### **File Upload Test:**
- **2 test files:** `test_document.txt` and `resume.pdf`
- **Base64 encoded** content for API transmission
- **Validates** upload count and file metadata

## 🔧 Configuration Options

### **Command Line Arguments:**
```bash
python3 test_api.py \
    --api-url https://your-api.com/dev \
    --timeout 60 \
    --output results.json
```

### **Environment Variables:**
```bash
export BAKSH_API_URL="https://your-api.com/dev"
./run_tests.sh  # Will use the environment variable if CDK outputs not found
```

## 🐛 Troubleshooting

### **Common Issues:**

#### ❌ "Could not automatically discover API URL"
- **Ensure deployment is complete:** Run `cd backend && ./deploy.sh --owner=your-name`
- **Check outputs file exists:** `ls -la backend/cdk/api-outputs.json`
- **Verify file format:** Ensure JSON is valid and contains `ApiUrl`

#### ❌ "Connection refused" or timeout errors
- **Check API Gateway is deployed:** Look for API URL in outputs
- **Verify region:** Ensure you're testing the correct AWS region
- **Check CORS:** API Gateway should have CORS enabled

#### ❌ "Invalid questions format received from server"
- **Check S3 bucket:** Ensure question CSV files are uploaded to `questions/` prefix
- **Check Lambda permissions:** Verify Lambda can read from S3
- **Check logs:** `aws logs tail /aws/lambda/baksh-audit-*-get-questions --follow`

#### ❌ High failure rate (>30% failed)
- **Backend not fully deployed:** Wait for deployment to complete
- **Missing resources:** Check all CDK stacks deployed successfully
- **Permission issues:** Verify IAM roles have correct permissions

### **Debugging Steps:**

1. **Verify Deployment:**
   ```bash
   # Check if all resources exist
   cat backend/cdk/api-outputs.json
   
   # List Lambda functions
   aws lambda list-functions --query "Functions[?contains(FunctionName, 'baksh')]"
   
   # Check S3 bucket contents
   aws s3 ls s3://$(cat backend/cdk/api-outputs.json | python3 -c "import json,sys; data=json.load(sys.stdin); print([v.get('SurveyBucketName') for v in data.values() if v.get('SurveyBucketName')][0])")/questions/
   ```

2. **Test Individual Endpoints:**
   ```bash
   # Get API URL from outputs
   API_URL=$(cat backend/cdk/api-outputs.json | python3 -c "import json,sys; data=json.load(sys.stdin); print([v.get('ApiUrl') for v in data.values() if v.get('ApiUrl')][0])")
   
   # Test questions endpoint
   curl "$API_URL/questions?type=company"
   
   # Test with verbose output
   curl -v "$API_URL/questions?type=company"
   ```

3. **Check Lambda Logs:**
   ```bash
   # Get function names from outputs
   GET_QUESTIONS_FUNC=$(cat backend/cdk/api-outputs.json | python3 -c "import json,sys; data=json.load(sys.stdin); print([v.get('GetQuestionsFunctionName') for v in data.values() if v.get('GetQuestionsFunctionName')][0])")
   
   # View recent logs
   aws logs tail "/aws/lambda/$GET_QUESTIONS_FUNC" --follow
   ```

## 📁 Test Results

### **Output Files:**
- **JSON Results:** `test-results/api_test_results_YYYYMMDD_HHMMSS.json`
- **Detailed Info:** Complete request/response data for debugging
- **Performance Metrics:** Response times and success rates
- **Deployment Info:** Extracted from CDK outputs for reference

### **Result Structure:**
```json
{
  "total_tests": 10,
  "passed": 7,
  "failed": 3,
  "success_rate": 70.0,
  "total_time_seconds": 5.2,
  "average_response_time_ms": 342.5,
  "api_url": "https://23k1arzku5.execute-api.eu-west-2.amazonaws.com/dev",
  "timestamp": "2025-06-19T04:30:00",
  "results": [
    {
      "test_name": "Get Company Questions",
      "endpoint": "/questions?type=company",
      "method": "GET",
      "status_code": 200,
      "success": true,
      "response_time_ms": 245.3
    }
  ]
}
```

## 🔄 Integration with Deployment

### **Post-Deployment Testing:**
```bash
# Deploy infrastructure
cd backend
./deploy.sh --owner=pete

# Automatically test API (no manual URL needed!)
cd ..
./run_tests.sh
```

### **CI/CD Integration:**
```yaml
# GitHub Actions example
- name: Deploy Infrastructure
  run: |
    cd backend
    ./deploy.sh --owner=${{ github.actor }}

- name: Test API
  run: |
    ./run_tests.sh
```

### **Continuous Monitoring:**
```bash
# Add to cron for daily health checks
0 9 * * * cd /path/to/baksh-audit-form && ./run_tests.sh > /var/log/api-health.log 2>&1
```

## 📞 Support

The test suite provides detailed error information to help diagnose issues quickly:

1. **Review test output** for specific error messages
2. **Check CDK outputs file** exists and has correct structure
3. **Verify AWS deployment** completed successfully
4. **Examine CloudWatch logs** for Lambda function errors
5. **Validate S3 bucket** contains required CSV files

**Expected Success Rate:** 70% (7 successful + 3 expected failures)
**Acceptable Response Time:** < 2000ms average
**Required Files:** Company and employee question CSVs in S3
