# 🚀 Deployment Guide - Baksh Audit Form

## Complete AI & Data Readiness Survey Platform

### 📋 What's Included

This repository contains a **production-ready survey platform** with:

✅ **AWS CDK Infrastructure** - Complete serverless architecture
✅ **Lambda Functions** - Get questions & save responses with file uploads
✅ **API Gateway** - RESTful API with CORS support
✅ **S3 Storage** - Secure data storage with proper IAM permissions
✅ **CloudFront CDN** - Global content delivery
✅ **Responsive Frontend** - Mobile-first design with Tailwind CSS
✅ **Professional UI** - Clean, modern interface optimized for surveys
✅ **Comprehensive Questions** - 20 company + 20 employee questions
✅ **File Upload Support** - Document attachments for employee surveys
✅ **Draft Saving** - Progressive form completion
✅ **Error Handling** - Robust validation and user feedback

### 🎯 Survey Coverage

**Company Assessment (20 Questions):**
- AI Strategy & Leadership
- Data Governance & Quality  
- Technology Infrastructure
- Workforce Readiness
- Risk Management

**Employee Assessment (20 Questions):**
- Role & Experience
- AI Familiarity & Current Usage
- Workflow Automation Opportunities
- Training Needs & Preferences
- Trust & Implementation Priorities

### 🛠️ One-Command Deployment

```bash
# Clone the repository
git clone https://github.com/DrPBaksh/baksh-audit-form.git
cd baksh-audit-form

# Make deploy script executable
chmod +x backend/deploy.sh

# Deploy everything (replace 'your-name' with your identifier)
./backend/deploy.sh --owner=your-name
```

**That's it!** The script will:
1. ✅ Check prerequisites (Python, Node.js, AWS CLI, CDK)
2. ✅ Set up Python virtual environment
3. ✅ Build Lambda layers and functions
4. ✅ Deploy AWS infrastructure via CDK
5. ✅ Build and deploy the frontend
6. ✅ Upload sample questions to S3
7. ✅ Provide you with the application URL

### 📊 What Gets Created

**AWS Resources:**
- **2 Lambda Functions** (get_questions, save_response)
- **1 Lambda Layer** (shared utilities)
- **1 API Gateway** (RESTful API)
- **3 S3 Buckets** (website, survey data, uploads)
- **1 CloudFront Distribution** (global CDN)
- **IAM Roles** (least privilege access)

**Cost Estimate:** ~£5-20/month depending on usage

### 🌐 Using Your Survey

After deployment, you'll get an application URL like:
`https://d1234567890abc.cloudfront.net`

**Company Survey Flow:**
1. Click "Start Company Survey"
2. Enter Company ID (e.g., "dmgt-london")
3. Complete 20 questions across 5 categories
4. Submit responses

**Employee Survey Flow:**
1. Click "Start Employee Survey" 
2. Enter Company ID and Employee ID
3. Complete 20 questions across 6 categories
4. Optional: Upload supporting documents
5. Submit responses

### 📁 Data Storage Structure

All responses are securely stored in S3:

```
S3 Bucket: baksh-audit-{owner}-{env}-survey-data/
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
```

### 🔧 Customization

**Add/Modify Questions:**
1. Edit `data/company_questions.csv` or `data/employee_questions.csv`
2. Run: `python backend/setup_questions.py --bucket=your-bucket-name`

**Update Frontend:**
1. Modify files in `frontend/`
2. Run: `./backend/deploy.sh --owner=your-name` (redeploys everything)

**Backend Changes:**
1. Modify Lambda functions in `backend/lambda/`
2. Update CDK stacks in `backend/cdk/src/stacks/`
3. Run: `./backend/deploy.sh --owner=your-name`

### 🗑️ Clean Up

To remove all AWS resources:

```bash
./backend/destroy.sh --owner=your-name
```

⚠️ **Warning:** This permanently deletes all survey data!

### 🔐 Security Features

- **HTTPS Enforced** - All traffic encrypted
- **CORS Configured** - Cross-origin requests properly handled
- **IAM Least Privilege** - Lambda functions have minimal required permissions
- **Data Validation** - Server-side input sanitization
- **File Upload Limits** - 10MB per file maximum
- **Secure Storage** - S3 server-side encryption enabled

### 📱 Mobile Optimization

- **Responsive Design** - Works perfectly on phones, tablets, desktops
- **Touch-Friendly** - 44px minimum touch targets
- **Fast Loading** - Optimized assets and CloudFront caching
- **Offline Support** - Draft saving in localStorage
- **Accessibility** - Proper focus management and screen reader support

### 🎨 Technical Highlights

**Frontend:**
- **Vanilla JavaScript** - No framework dependencies
- **Tailwind CSS** - Utility-first styling
- **Modern HTML5** - Semantic markup
- **Progressive Enhancement** - Works without JavaScript

**Backend:**
- **AWS CDK** - Infrastructure as Code
- **Python 3.11** - Modern Lambda runtime
- **Shared Layer** - Optimized code reuse
- **Error Handling** - Comprehensive logging and user feedback

### 📞 Support

This is a **complete, production-ready application**. You can:
- Deploy it immediately
- Customize questions easily
- Scale automatically with usage
- Monitor via AWS CloudWatch
- Export data from S3

### 🏆 Perfect For

- **DMGT AI Readiness Assessment**
- **Enterprise Survey Platforms** 
- **Employee Feedback Collection**
- **Training Needs Analysis**
- **Digital Transformation Planning**

---

**Built for DMGT** | **Ready to Deploy** | **© 2025**