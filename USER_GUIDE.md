# 📖 User Guide - Baksh Audit Form

## 🎯 Complete Guide to Deploy, Update, and Manage Your Survey App

This guide explains exactly how to deploy, update, and manage the Baksh Audit Form survey application.

---

## 🚀 **Initial Deployment (First Time Setup)**

### Prerequisites
Before you start, ensure you have:
- ✅ AWS CLI configured with appropriate permissions
- ✅ Python 3.8+ installed
- ✅ Node.js 16+ installed
- ✅ Git installed

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone https://github.com/DrPBaksh/baksh-audit-form.git
cd baksh-audit-form

# Switch to the final-changes branch (with latest improvements)
git checkout final-changes
```

### Step 2: Deploy Backend (Infrastructure + APIs)
```bash
# Make deploy script executable
chmod +x backend/deploy.sh

# Deploy backend infrastructure
cd backend
./deploy.sh --owner=your-name

# This creates:
# - Lambda functions for APIs
# - S3 buckets for data and hosting
# - CloudFront distribution
# - Uploads CSV questions from /data/ directory
```

**✅ Expected Output:**
- API endpoints in `backend/cdk/api-outputs.json`
- Infrastructure details in `backend/cdk/infra-outputs.json`
- Questions uploaded to S3

### Step 3: Deploy Frontend (React Application)
```bash
# Go to React frontend directory
cd ../react-frontend

# Make scripts executable
chmod +x setup.sh deploy.sh

# Setup development environment
./setup.sh

# Deploy frontend to AWS
./deploy.sh --owner=your-name

# This creates:
# - Builds React application
# - Uploads to S3 website bucket
# - Configures CloudFront for global delivery
```

### Step 4: Add Company Logo (Optional)
```bash
# Add your logo file
cp /path/to/your/logo.png react-frontend/public/logo.png

# Redeploy frontend to include logo
./deploy.sh --owner=your-name
```

### Step 5: Test Deployment
```bash
# Go back to root directory
cd ..

# Run automated tests
chmod +x run_tests.sh
./run_tests.sh

# Expected: 7/10 tests pass (3 expected failures for validation testing)
```

**🎉 Your app is now live!** The deployment output will show your application URL.

---

## 📋 **Updating Survey Questions**

You have **two methods** to update questions:

### Method 1: Quick Questions Update (Recommended)
Use this when you only want to update questions without touching infrastructure.

```bash
# 1. Edit your CSV files
nano data/company_questions.csv
nano data/employee_questions.csv

# 2. Get your S3 bucket name
BUCKET_NAME=$(cat backend/cdk/infra-outputs.json | jq -r '."baksh-audit-OWNER-dev-Infra"."SurveyBucketName"')
echo "Bucket: $BUCKET_NAME"

# 3. Preview what will be uploaded (optional)
python3 backend/setup_questions.py --bucket $BUCKET_NAME --dry-run

# 4. Upload the updated questions
python3 backend/setup_questions.py --bucket $BUCKET_NAME
```

**✅ Questions update immediately** - users will see new questions on next page load.

### Method 2: Full Backend Redeploy
Use this when you've made infrastructure changes or prefer the complete deployment approach.

```bash
# Edit your CSV files
nano data/company_questions.csv
nano data/employee_questions.csv

# Redeploy backend (includes question upload)
cd backend
./deploy.sh --owner=your-name
```

### CSV File Format
Your CSV files must follow this exact format:

```csv
id,question,type,required,options,section
1,"What is your company size?",select,true,"1-10,11-50,51-200,200+","Company Information"
2,"Describe your AI strategy",textarea,true,,"AI Strategy"
3,"Which tools do you use?",checkbox,false,"Tool A,Tool B,Tool C","Current Tools"
```

**Column Definitions:**
- **id**: Unique number for each question
- **question**: The question text shown to users
- **type**: Question type (`text`, `textarea`, `select`, `radio`, `checkbox`)
- **required**: `true` or `false` - whether question is mandatory
- **options**: Comma-separated choices for `select`/`radio`/`checkbox` types
- **section**: Grouping category (for organisation)

**⚠️ Important:** 
- Don't change existing question IDs (causes data mapping issues)
- Add new questions with new IDs
- Use British English in question text

---

## 🔄 **Regular Updates and Maintenance**

### Updating the Frontend Only
When you modify React components, styling, or frontend logic:

```bash
cd react-frontend
./deploy.sh --owner=your-name
```

### Updating the Backend Only
When you modify Lambda functions, APIs, or infrastructure:

```bash
cd backend
./deploy.sh --owner=your-name
```

### Updating Both
```bash
# Deploy backend first
cd backend
./deploy.sh --owner=your-name

# Then deploy frontend
cd ../react-frontend
./deploy.sh --owner=your-name
```

### Adding/Changing Logo
```bash
# Replace logo file
cp /path/to/new-logo.png react-frontend/public/logo.png

# Redeploy frontend
cd react-frontend
./deploy.sh --owner=your-name
```

---

## 🔍 **Managing Survey Data**

### Viewing Survey Responses
Responses are stored in S3. To access them:

```bash
# Get your bucket name
BUCKET_NAME=$(cat backend/cdk/infra-outputs.json | jq -r '."baksh-audit-OWNER-dev-Infra"."SurveyBucketName"')

# List all company responses
aws s3 ls s3://$BUCKET_NAME/companies/ --recursive

# Download specific company responses
aws s3 cp s3://$BUCKET_NAME/companies/YourCompanyID/form.json ./company-responses.json

# Download employee responses
aws s3 cp s3://$BUCKET_NAME/companies/YourCompanyID/employees/EmployeeID/form.json ./employee-responses.json
```

### Data Structure in S3
```
S3 Bucket:
├── questions/
│   ├── company_questions.csv
│   └── employee_questions.csv
├── companies/
│   └── {company_id}/
│       ├── form.json (company responses)
│       └── employees/
│           └── {employee_id}/
│               ├── form.json (employee responses)
│               └── files/ (uploaded files)
```

---

## 🧪 **Testing Your Changes**

### Automated Testing
```bash
# Run full test suite
./run_tests.sh

# Test specific API endpoint
python3 test_api.py --api-url https://your-api-url.com/dev
```

### Manual Testing Checklist
- [ ] Homepage loads correctly with logo
- [ ] Company survey loads questions
- [ ] Employee survey loads questions  
- [ ] "List Available" button shows existing audits
- [ ] Save progress works
- [ ] File upload works (employee survey)
- [ ] Form submission completes successfully
- [ ] Thank you page displays

### Quick Diagnostics
```bash
# Get your API URL
API_URL=$(cat backend/cdk/api-outputs.json | jq -r '."baksh-audit-OWNER-dev-Api".ApiUrl')

# Run diagnostics
python3 diagnose_api.py $API_URL
```

---

## 🚨 **Troubleshooting Common Issues**

### "Questions not loading"
```bash
# Check if questions exist in S3
BUCKET_NAME=$(cat backend/cdk/infra-outputs.json | jq -r '."baksh-audit-OWNER-dev-Infra"."SurveyBucketName"')
aws s3 ls s3://$BUCKET_NAME/questions/

# If missing, upload them
python3 backend/setup_questions.py --bucket $BUCKET_NAME
```

### "API not responding"
```bash
# Redeploy backend
cd backend
./deploy.sh --owner=your-name

# Check Lambda logs
aws logs tail /aws/lambda/baksh-audit-*-get-questions --follow
```

### "Frontend won't load"
```bash
# Redeploy frontend
cd react-frontend
./deploy.sh --owner=your-name

# Clear browser cache and try again
```

### "Deploy script permissions"
```bash
# Fix script permissions
chmod +x backend/deploy.sh
chmod +x react-frontend/deploy.sh
chmod +x react-frontend/setup.sh
chmod +x run_tests.sh
```

---

## 🗑️ **Cleanup and Removal**

### Remove Everything
```bash
# Destroy all AWS resources
cd backend
chmod +x destroy.sh
./destroy.sh --owner=your-name
```

### Remove Just Frontend
```bash
# Get bucket names
WEBSITE_BUCKET=$(cat backend/cdk/infra-outputs.json | jq -r '."baksh-audit-OWNER-dev-Infra"."WebsiteBucketName"')

# Empty website bucket
aws s3 rm s3://$WEBSITE_BUCKET --recursive
```

---

## 📞 **Getting Help**

### Check Deployment Status
```bash
# View backend outputs
cat backend/cdk/api-outputs.json
cat backend/cdk/infra-outputs.json

# Test API health
python3 diagnose_api.py https://your-api-url.com/dev
```

### Common Commands Reference
```bash
# Get API URL
cat backend/cdk/api-outputs.json | jq -r '."baksh-audit-OWNER-dev-Api".ApiUrl'

# Get S3 bucket name
cat backend/cdk/infra-outputs.json | jq -r '."baksh-audit-OWNER-dev-Infra"."SurveyBucketName"'

# Get website URL
cat backend/cdk/infra-outputs.json | jq -r '."baksh-audit-OWNER-dev-Infra"."CloudFrontDomainName"'

# Check Lambda logs
aws logs tail /aws/lambda/baksh-audit-*-get-questions --follow
```

---

## 🎉 **Quick Reference Card**

| Task | Command |
|------|---------|
| **First deployment** | `backend/deploy.sh --owner=name` → `react-frontend/deploy.sh --owner=name` |
| **Update questions only** | Edit CSV → `python3 backend/setup_questions.py --bucket $BUCKET` |
| **Update frontend only** | `cd react-frontend && ./deploy.sh --owner=name` |
| **Update backend only** | `cd backend && ./deploy.sh --owner=name` |
| **Add/change logo** | Copy to `react-frontend/public/logo.png` → redeploy frontend |
| **Test deployment** | `./run_tests.sh` |
| **Troubleshoot** | `python3 diagnose_api.py $API_URL` |
| **Remove everything** | `backend/destroy.sh --owner=name` |

---

**📋 Remember:** Always replace `your-name` with your actual identifier, and ensure your AWS credentials are properly configured before running any deployment commands.
