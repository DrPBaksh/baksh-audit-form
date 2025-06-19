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
- **"Failed to load survey"**: Check Lambda function logs and S3 bucket contents
- **CORS errors**: Verify API Gateway CORS configuration
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
```

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
├── run_tests.sh            # Automated test runner
└── API_TESTING.md          # Testing documentation
```

## 📞 Support

For issues or questions:
1. Check the [API_TESTING.md](API_TESTING.md) troubleshooting section
2. Run `./run_tests.sh` to validate your deployment
3. Review CloudWatch logs for detailed error information
4. Open an issue in this repository with test results

---

**Built for DMGT** | **Powered by AWS** | **© 2025**
