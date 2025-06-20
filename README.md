# 🏢 Baksh Audit Form - AI & Data Readiness Survey

A professional survey platform designed to assess company and employee AI & data readiness for DMGT. Built with AWS CDK, Lambda functions, and a modern React frontend with enhanced save/reload capabilities.

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured
- Python 3.8+
- Node.js 16+ (for CDK and React)
- Docker (for Lambda layers)

### Deploy Backend (Backend Resources Only)
```bash
git clone https://github.com/DrPBaksh/baksh-audit-form.git
cd baksh-audit-form
chmod +x backend/deploy.sh
./backend/deploy.sh --owner=your-name
```

### Deploy React Frontend (Separately)
```bash
# Setup React development environment
cd react-frontend
chmod +x setup.sh deploy.sh
./setup.sh

# Deploy to AWS (after backend is deployed)
./deploy.sh --owner=your-name
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

## 📋 Enhanced Features

- 📊 **Dual Survey System** - Company-level and employee-level assessments
- 💾 **Enhanced Save/Reload Logic** - List available audits and load specific responses
- 📋 **Smart Audit Listing** - Browse existing company and employee audits before reloading
- 📁 **File Uploads** - Employee document attachments with validation
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔒 **Secure** - AWS-native security with IAM least privilege
- ⚡ **Serverless** - Cost-effective, auto-scaling architecture
- 🧪 **Automated Testing** - Comprehensive API validation suite
- ⚛️ **Modern React Frontend** - Professional UI with smooth animations
- 🇬🇧 **British English** - Consistent British spelling and formatting throughout

## 🏗️ Architecture

### Frontend
- **React Frontend**: Modern React application with enhanced UX and improved save/reload logic
- **Logo Support**: Place `logo.png` in `react-frontend/public/` directory

### Backend
- **API**: AWS Lambda functions with API Gateway
- **Storage**: S3 buckets for questions, responses, and uploads
- **Infrastructure**: AWS CDK (Python)
- **Hosting**: S3 + CloudFront for global distribution

## 📝 Survey Structure

### Company Assessment
Evaluates organisational AI and data maturity:
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

## 🔄 Enhanced Save/Reload Logic

### New Capabilities:
1. **List Available Audits** - Browse all existing company or employee audits
2. **Smart Company Recognition** - Automatic detection when entering existing company IDs
3. **Three Reload Options**:
   - "List Available" - Browse all audits in modal interface
   - "Load Current" - Load audit for current company/employee IDs
   - Individual audit selection from the list

### Save Options:
- **Auto-save** - Every 30 seconds in background
- **Manual Save** - Save current progress with visual feedback
- **File Integration** - Files are included in save operations for employee surveys

## 📋 CSV Questions Configuration

**Questions automatically update when CSV files are modified.**

### To Update Questions:
1. Edit CSV files in `/data/` directory
2. Redeploy backend: `./backend/deploy.sh --owner=your-name`
3. Questions are served from S3 and update immediately

See [CSV_QUESTIONS.md](CSV_QUESTIONS.md) for detailed CSV format and configuration.

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

## ⚛️ React Frontend

### Enhanced Features
- **Modern UI**: Professional design with Tailwind CSS
- **Smooth Animations**: Framer Motion for enhanced UX
- **Progressive Forms**: Multi-page navigation with validation
- **Enhanced File Upload**: Drag-and-drop with progress indicators
- **Smart Auto-save**: Automatic progress saving every 30 seconds
- **Audit Listing Modal**: Browse and select from available audits
- **Responsive Design**: Mobile-first approach
- **Logo Integration**: Automatic logo display from `/public/logo.png`

### Development
```bash
cd react-frontend

# Setup development environment
./setup.sh

# Start development server
npm start  # http://localhost:3000

# Build for production
npm run build

# Deploy to AWS
./deploy.sh --owner=your-name
```

### Logo Setup
Simply place your `logo.png` file in the `react-frontend/public/` directory. The homepage will automatically display it in the top-left area.

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

## 🔧 Development

### Backend Development (Backend Only)
The backend deploy script now only deploys backend resources:
```bash
cd backend
./deploy.sh --owner=your-name  # Backend resources only
```

### Frontend Development (Separate)
```bash
cd react-frontend
./deploy.sh --owner=your-name  # Frontend resources only
```

### Updating Questions
Edit CSV files in `/data/` directory and run:
```bash
cd backend
./deploy.sh --owner=your-name  # Uploads updated CSV files
```

### Full Deployment
```bash
# Deploy backend first
cd backend && ./deploy.sh --owner=your-name

# Then deploy frontend
cd ../react-frontend && ./deploy.sh --owner=your-name
```

## 🔍 Troubleshooting

### Common Issues

#### React Frontend Issues
**"Module not found" errors:**
```bash
cd react-frontend
rm -rf node_modules package-lock.json
npm install
```

**API connection issues:**
- Check backend is deployed: `cat backend/cdk/api-outputs.json`
- Test API directly: `curl "$API_URL/questions?type=company"`

#### Backend API Issues
**"Failed to load survey: Invalid questions format received from server"**

**Diagnosis Steps:**
1. Run diagnostic: `python3 diagnose_api.py https://your-api-url.com/dev`
2. Redeploy backend: `cd backend && ./deploy.sh --owner=your-name`
3. Check Lambda logs: `aws logs tail /aws/lambda/baksh-audit-*-get-questions --follow`

### Debugging Commands
```bash
# Check deployment outputs
cat backend/cdk/api-outputs.json

# Test API endpoints
API_URL=$(cat backend/cdk/api-outputs.json | jq -r '.[\"baksh-audit-OWNER-dev-Api\"].ApiUrl')
curl "$API_URL/questions?type=company"
```

## 📊 Project Structure

```
baksh-audit-form/
├── backend/                 # AWS CDK infrastructure (backend only)
│   ├── cdk/                # CDK Python code
│   ├── lambda/             # Lambda function code
│   ├── deploy.sh           # Backend deployment script (backend only)
│   └── destroy.sh          # Cleanup script
├── react-frontend/         # Modern React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components (simplified HomePage)
│   │   ├── services/       # API service layer (enhanced)
│   │   └── config/         # Configuration
│   ├── public/             # Static assets (place logo.png here)
│   ├── setup.sh            # Development setup
│   ├── deploy.sh           # Frontend deployment (frontend only)
│   └── package.json        # Dependencies
├── data/                   # Survey questions (CSV) - editable
├── CSV_QUESTIONS.md        # CSV configuration guide
├── test_api.py             # API test suite
├── diagnose_api.py         # Quick diagnostics script
├── run_tests.sh            # Automated test runner
└── README.md               # This file
```

## 🎯 Deployment Checklist

### Backend Deployment
- [ ] AWS CLI configured with appropriate permissions
- [ ] Python 3.8+ installed
- [ ] CDK CLI installed (`npm install -g aws-cdk`)
- [ ] Run `./backend/deploy.sh --owner=your-name`
- [ ] Verify outputs in `backend/cdk/api-outputs.json`

### React Frontend Deployment
- [ ] Node.js 16+ installed
- [ ] Backend deployed successfully
- [ ] Add `logo.png` to `react-frontend/public/` (optional)
- [ ] Run `cd react-frontend && ./setup.sh`
- [ ] Run `./deploy.sh --owner=your-name`
- [ ] Test the deployed application

### Validation
- [ ] Run `./run_tests.sh` - expect 7/10 tests to pass
- [ ] Test both company and employee surveys
- [ ] Test enhanced save/reload logic with "List Available" button
- [ ] Verify file upload functionality (employee survey)
- [ ] Check mobile responsiveness
- [ ] Confirm auto-save works (wait 30 seconds during form completion)
- [ ] Verify logo displays correctly (if added)

## 🔄 Recent Updates - Final Changes

### v3.1 - Enhanced Save/Reload and British English
- **Enhanced**: Smart audit listing with modal interface for both company and employee surveys
- **Added**: "List Available" button to browse existing audits before reloading
- **Improved**: Three-tier reload system (List Available, Load Current, Individual Selection)
- **Enhanced**: Company recognition with clear status indicators
- **Added**: Logo support - place `logo.png` in `react-frontend/public/`
- **Updated**: Simplified homepage with "System Only" subtitle, removed features section
- **Improved**: Backend deploy script now deploys backend resources only
- **Standardised**: British English throughout (recognised, utilisation, etc.)
- **Added**: CSV questions configuration documentation
- **Enhanced**: File upload integration with save operations
- **Improved**: Mobile responsiveness and user experience

### Previous Updates
- **v3.0**: Complete React frontend with modern UI/UX
- **v2.1**: Enhanced error handling and debugging capabilities

---

**Built for DMGT** | **Powered by AWS & React** | **© 2025**
