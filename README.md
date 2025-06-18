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

## 📞 Support

For issues or questions, please open an issue in this repository.

---

**Built for DMGT** | **Powered by AWS** | **© 2025**