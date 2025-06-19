# 🏢 Baksh Audit Form - AI & Data Readiness Survey

A professional survey platform designed to assess company and employee AI & data readiness for DMGT. Built with AWS CDK, Lambda functions, and a responsive frontend.

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured
- Python 3.8+
- Node.js 16+ (for CDK)
- Docker (for Lambda layers)

### Deploy
```bash
git clone https://github.com/DrPBaksh/baksh-audit-form.git
cd baksh-audit-form
chmod +x backend/deploy.sh
./backend/deploy.sh --owner=your-name
```

### Test Your Deployment
```bash
# Automatically test all API endpoints
chmod +x run_tests.sh
./run_tests.sh

# Quick diagnostic for survey loading issues
python3 diagnose_api.py https://your-api-url.com/dev
```

### Destroy
```bash
./backend/destroy.sh --owner=your-name
```

## 📋 Features

- 📊 **Dual Survey System** - Company-level and employee-level assessments
- 💾 **Progressive Saving** - Resume partially completed forms
- 📁 **File Uploads** - Employee document attachments
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔒 **Secure** - AWS-native security with IAM least privilege
- ⚡ **Serverless** - Cost-effective, auto-scaling architecture
- 🧪 **Automated Testing** - Comprehensive API validation suite

## 🏗️ Architecture

- **Frontend**: Static website (S3 + CloudFront)
- **Backend**: AWS Lambda functions
- **Storage**: S3 buckets for questions, responses, and uploads
- **API**: API Gateway with CORS support
- **Infrastructure**: AWS CDK (Python)

## 📝 Survey Structure

### Company Assessment
Evaluates organizational AI and data maturity:
- AI Strategy & Leadership
- Data Governance & Quality
- Technology Infrastructure
- Workforce Readiness
- Risk Management

### Employee Assessment
Assesses individual AI familiarity and needs:
- Current AI Tool Usage
- Confidence & Comfort Levels
- Training Needs
- Workflow Automation Opportunities
- Concerns & Barriers

## 🗂️ Data Storage

```
S3 Bucket Structure:
├── questions/
│   ├── company_questions.csv
│   └── employee_questions.csv
├── companies/
│   └── {company_id}/
│       ├── form.json (company responses)
│       └── employees/
│           └── {employee_id}/
│               ├── form.json (employee responses)
│               └── files/ (uploaded documents)
└── website/ (static frontend files)
```

## 🧪 Testing & Validation

### Automated API Testing
After deployment, validate all functionality:
```bash
# Run comprehensive test suite
./run_tests.sh

# Quick diagnostics for survey loading issues
python3 diagnose_api.py https://your-api-url.com/dev

# Manual testing with specific API URL
python3 test_api.py --api-url https://your-api-url.com/dev
```

**What gets tested:**
- ✅ Company question retrieval
- ✅ Employee question retrieval
- ✅ Response saving with file uploads
- ✅ Error handling and validation
- ✅ Performance and response times

**Expected Results:** 7/10 tests pass (3 expected failures for error validation)

See [API_TESTING.md](API_TESTING.md) for detailed testing documentation.

## 🔧 Development

### Local Testing
```bash
# Test Lambda functions locally
cd backend/lambda/get_questions
python lambda_function.py

# Test frontend locally
cd frontend
python -m http.server 8000
```

### Updating Questions
Edit CSV files in `/data/` directory and run:
```bash
python backend/setup_questions.py --upload
```

### Continuous Integration
```bash
# Deploy and test in one command
cd backend && ./deploy.sh --owner=pete && cd .. && ./run_tests.sh
```

## 🔍 Troubleshooting

### Common Issues

#### "Failed to load survey: Invalid questions format received from server"
This error indicates the frontend isn't receiving the expected questions data structure.

**Diagnosis Steps:**
1. **Quick Check**: Run the diagnostic script
   ```bash
   python3 diagnose_api.py https://your-api-url.com/dev
   ```

2. **Backend Issues** (if diagnostic fails):
   - Redeploy the backend: `cd backend && ./deploy.sh --owner=your-name`
   - Check Lambda logs: `aws logs tail /aws/lambda/baksh-audit-*-get-questions --follow`
   - Verify S3 questions files exist: Check S3 bucket for `questions/company_questions.csv`

3. **Frontend Issues** (if diagnostic passes):
   - Check browser console for JavaScript errors
   - Verify `frontend/js/config.js` has correct API URL
   - Clear browser cache and reload

#### Other Common Issues
- **CORS errors**: Verify API Gateway CORS configuration in CDK
- **File upload failures**: Check Lambda memory limits and timeout settings
- **Test failures**: Review deployment outputs and AWS resource permissions

### Debugging Commands
```bash
# Check deployment outputs
cat backend/cdk/api-outputs.json

# View Lambda logs
aws logs tail /aws/lambda/baksh-audit-*-get-questions --follow

# Test API endpoints directly
curl "$(cat backend/cdk/api-outputs.json | python3 -c "import json,sys; data=json.load(sys.stdin); print([v.get('ApiUrl') for v in data.values() if v.get('ApiUrl')][0])")/questions?type=company"

# Quick diagnosis
python3 diagnose_api.py https://your-api-url.com/dev
```

### Deployment Issues
If deployment fails:
1. Check AWS credentials are configured
2. Ensure CDK is bootstrapped: `cd backend/cdk && cdk bootstrap`
3. Verify Python virtual environment: `cd backend/cdk && source .venv/bin/activate`
4. Check CloudFormation stack events in AWS Console

## 📊 Project Structure

```
baksh-audit-form/
├── backend/                 # AWS CDK infrastructure
│   ├── cdk/                # CDK Python code
│   ├── lambda/             # Lambda function code
│   ├── deploy.sh           # Deployment script
│   └── api-outputs.json    # Generated deployment outputs
├── frontend/               # Static website files
│   ├── js/                 # JavaScript application
│   ├── css/                # Stylesheets
│   └── index.html          # Main entry point
├── data/                   # Survey questions (CSV)
├── test_api.py             # API test suite
├── diagnose_api.py         # Quick diagnostics script
├── run_tests.sh            # Automated test runner
└── API_TESTING.md          # Testing documentation
```

## 📞 Support

For issues or questions:
1. **Quick Diagnosis**: Run `python3 diagnose_api.py https://your-api-url.com/dev`
2. Check the [Troubleshooting](#-troubleshooting) section above
3. Review CloudWatch logs for detailed error information
4. Run `./run_tests.sh` to validate your deployment
5. Open an issue in this repository with test results

## 🔄 Recent Updates

### v2.1 - Enhanced Error Handling & Debugging
- **Fixed**: Improved Lambda function event handling for API Gateway proxy integration
- **Added**: Comprehensive diagnostic script (`diagnose_api.py`)
- **Enhanced**: Better error messages and logging in Lambda functions
- **Improved**: Troubleshooting documentation with specific solutions

### Common Solutions Applied
- **Survey Loading Issues**: Enhanced query parameter extraction in Lambda functions
- **API Integration**: Improved compatibility with AWS API Gateway proxy integration
- **Error Diagnostics**: Added detailed logging and structured error responses

---

**Built for DMGT** | **Powered by AWS** | **© 2025**
