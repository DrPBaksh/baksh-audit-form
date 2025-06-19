# 🧪 Baksh Audit Form API Testing Guide

This comprehensive test suite validates all backend API functionality with realistic test data.

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
# Make the script executable
chmod +x run_tests.sh

# Run tests (auto-discovers API URL)
./run_tests.sh
```

### Option 2: Manual Python Script
```bash
# Install dependencies
pip3 install requests colorama

# Run tests with your API URL
python3 test_api.py --api-url https://your-api-gateway-url.com/dev
```

## 📊 Test Data Overview

### **Company Test Data:**
- **Company ID:** `test-company-{random}`
- **20 realistic responses** covering:
  - AI Strategy & Leadership
  - Data Governance & Quality  
  - Technology Infrastructure
  - Workforce Readiness
  - Risk Management

### **Employee Test Data:**
- **Employee ID:** `employee-{random}`
- **20 realistic responses** covering:
  - Role & Experience
  - AI Familiarity & Usage
  - Training Needs
  - Comfort & Attitudes
  - Implementation Priorities

### **File Upload Test:**
- Test documents (.txt, .pdf)
- Base64 encoded content
- Multiple file upload validation

## 📈 Expected Results

### **Successful Test Run:**
```
✅ Get Company Questions: GET /questions?type=company (200, 245ms)
✅ Get Employee Questions: GET /questions?type=employee (200, 189ms)
✅ Save Company Response: POST /responses (200, 456ms)
✅ Save Employee Response: POST /responses (200, 523ms)
✅ Save Employee Response with Files: POST /responses (200, 1234ms)
✅ Response Update Test: POST /responses (200, 387ms)
❌ Get Questions - Invalid Type: GET /questions?type=invalid (400, 156ms)
❌ Get Questions - Missing Type: GET /questions (400, 145ms)
❌ Save Invalid Response: POST /responses (400, 167ms)

📊 Summary: 9/9 tests passed (100.0% success rate)
```

### **Response Validation:**
- **Questions endpoint** returns array of question objects with required fields
- **Responses endpoint** returns success message with IDs and metadata
- **Error endpoints** return proper 400 status codes
- **File uploads** report correct upload counts

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
./run_tests.sh  # Will use the environment variable
```

## 🐛 Troubleshooting

### **Common Issues:**

#### ❌ "Connection refused" or timeout errors
- **Check API URL**: Ensure the API Gateway is deployed and accessible
- **Check region**: Verify you're testing the correct AWS region
- **Check permissions**: Ensure API Gateway allows public access

#### ❌ "Invalid questions format received from server"
- **Check S3 bucket**: Ensure question CSV files are uploaded
- **Check Lambda permissions**: Verify Lambda can read from S3
- **Check logs**: Use AWS CloudWatch to examine Lambda function logs

#### ❌ "CORS errors" in browser
- **API Gateway CORS**: Verify CORS is enabled in API Gateway
- **Headers**: Check that proper headers are being sent
- **Preflight**: Ensure OPTIONS requests are handled

### **Debugging Steps:**

1. **Check AWS Resources:**
   ```bash
   # List API Gateways
   aws apigateway get-rest-apis
   
   # Check Lambda functions
   aws lambda list-functions --query "Functions[?contains(FunctionName, 'baksh')]"
   
   # Check S3 bucket
   aws s3 ls s3://your-survey-bucket/questions/
   ```

2. **Test Individual Endpoints:**
   ```bash
   # Test questions endpoint directly
   curl "https://your-api-url.com/dev/questions?type=company"
   
   # Test with verbose output
   curl -v "https://your-api-url.com/dev/questions?type=company"
   ```

3. **Check CloudWatch Logs:**
   ```bash
   # Get recent logs for get-questions function
   aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/baksh-audit"
   ```

## 📁 Test Results

### **Output Files:**
- **JSON Results:** `test-results/api_test_results_YYYYMMDD_HHMMSS.json`
- **Detailed Info:** Complete request/response data for debugging
- **Performance Metrics:** Response times and success rates

### **Result Structure:**
```json
{
  "total_tests": 10,
  "passed": 9,
  "failed": 1,
  "success_rate": 90.0,
  "total_time_seconds": 5.2,
  "average_response_time_ms": 342.5,
  "api_url": "https://abc123.execute-api.us-east-1.amazonaws.com/dev",
  "timestamp": "2025-06-19T04:30:00",
  "results": [...]
}
```

## 🔄 Continuous Testing

### **Integration with CI/CD:**
```yaml
# GitHub Actions example
- name: Test API
  run: |
    python3 test_api.py --api-url ${{ secrets.API_URL }}
```

### **Regular Health Checks:**
```bash
# Add to cron for daily testing
0 9 * * * /path/to/run_tests.sh > /var/log/api-tests.log 2>&1
```

## 📞 Support

If tests consistently fail:
1. Check the deployment logs
2. Verify AWS permissions
3. Ensure all resources are in the same region
4. Review the test output for specific error messages

The test suite provides detailed error information to help diagnose issues quickly.
