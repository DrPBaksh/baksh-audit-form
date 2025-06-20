# 🏢 Baksh Audit Form - AI & Data Readiness Survey

A professional survey platform designed to assess company and employee AI & data readiness for DMGT. Built with AWS CDK, Lambda functions, and a modern React frontend.

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured
- Python 3.8+
- Node.js 16+ (for CDK and React)
- Docker (for Lambda layers)

### Deploy Backend
```bash
git clone https://github.com/DrPBaksh/baksh-audit-form.git
cd baksh-audit-form
chmod +x backend/deploy.sh
./backend/deploy.sh --owner=your-name
```

### Deploy React Frontend
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

## 📋 Features

- 📊 **Dual Survey System** - Company-level and employee-level assessments
- 💾 **Progressive Saving** - Resume partially completed forms
- 📁 **File Uploads** - Employee document attachments
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔒 **Secure** - AWS-native security with IAM least privilege
- ⚡ **Serverless** - Cost-effective, auto-scaling architecture
- 🧪 **Automated Testing** - Comprehensive API validation suite
- ⚛️ **Modern React Frontend** - Professional UI with smooth animations

## 🏗️ Architecture

### Frontend Options
- **React Frontend** (Recommended): Modern React application with enhanced UX
- **Original Frontend**: Vanilla JavaScript (legacy, still functional)

### Backend
- **API**: AWS Lambda functions with API Gateway
- **Storage**: S3 buckets for questions, responses, and uploads
- **Infrastructure**: AWS CDK (Python)
- **Hosting**: S3 + CloudFront for global distribution

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

## ⚛️ React Frontend

### Features
- **Modern UI**: Professional design with Tailwind CSS
- **Smooth Animations**: Framer Motion for enhanced UX
- **Progressive Forms**: Multi-page navigation with validation
- **File Upload**: Drag-and-drop with progress indicators
- **Auto-save**: Automatic progress saving every 30 seconds
- **Responsive Design**: Mobile-first approach

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

### Configuration
The React frontend automatically detects API endpoints from backend deployment:
- Reads from `backend/cdk/api-outputs.json`
- Configures endpoints: `/questions` and `/responses`
- Sets up CloudFront distribution for global delivery

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

### React Frontend Development
```bash
cd react-frontend

# Setup environment
./setup.sh

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Backend Development
```bash
# Test Lambda functions locally
cd backend/lambda/get_questions
python lambda_function.py

# Deploy changes
cd backend
./deploy.sh --owner=your-name
```

### Updating Questions
Edit CSV files in `/data/` directory and run:
```bash
python backend/setup_questions.py --upload
```

### Continuous Integration
```bash
# Deploy backend and React frontend in one command
cd backend && ./deploy.sh --owner=pete && cd ../react-frontend && ./deploy.sh --owner=pete
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
- Check `REACT_APP_API_URL` in `.env`
- Verify backend is deployed: `cat backend/cdk/api-outputs.json`
- Test API directly: `curl "$API_URL/questions?type=company"`

**Build failures:**
```bash
# Clear cache and rebuild
npm run build -- --verbose
```

#### Backend API Issues
**"Failed to load survey: Invalid questions format received from server"**

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
   - Clear browser cache and reload

#### Other Common Issues
- **CORS errors**: Verify API Gateway CORS configuration in CDK
- **File upload failures**: Check Lambda memory limits and timeout settings
- **Test failures**: Review deployment outputs and AWS resource permissions

### Debugging Commands
```bash
# Check deployment outputs
cat backend/cdk/api-outputs.json
cat backend/cdk/infra-outputs.json

# View Lambda logs
aws logs tail /aws/lambda/baksh-audit-*-get-questions --follow

# Test API endpoints directly
API_URL=$(cat backend/cdk/api-outputs.json | jq -r '.["baksh-audit-OWNER-dev-Api"].ApiUrl')
curl "$API_URL/questions?type=company"

# Quick diagnosis
python3 diagnose_api.py $API_URL
```

## 📊 Project Structure

```
baksh-audit-form/
├── backend/                 # AWS CDK infrastructure
│   ├── cdk/                # CDK Python code
│   │   ├── src/stacks/     # CDK stack definitions
│   │   ├── api-outputs.json # Generated API endpoints
│   │   └── infra-outputs.json # Generated infrastructure info
│   ├── lambda/             # Lambda function code
│   ├── deploy.sh           # Backend deployment script
│   └── destroy.sh          # Cleanup script
├── react-frontend/         # Modern React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── config/         # Configuration
│   ├── public/             # Static assets
│   ├── setup.sh            # Development setup
│   ├── deploy.sh           # Frontend deployment
│   └── package.json        # Dependencies
├── frontend/               # Original vanilla JS frontend (legacy)
├── data/                   # Survey questions (CSV)
├── test_api.py             # API test suite
├── diagnose_api.py         # Quick diagnostics script
├── run_tests.sh            # Automated test runner
└── README.md               # This file
```

## 🔄 Frontend Migration

### React vs Original Frontend

| Feature | React Frontend | Original Frontend |
|---------|----------------|-------------------|
| **Framework** | React 18 | Vanilla JavaScript |
| **Styling** | Tailwind CSS | Custom CSS |
| **Animations** | Framer Motion | CSS transitions |
| **State Management** | React hooks | Manual DOM manipulation |
| **Build Process** | Create React App | Direct deployment |
| **Development** | Hot reloading | Manual refresh |
| **Mobile Support** | Mobile-first responsive | Basic responsive |
| **File Upload UX** | Drag-and-drop with progress | Basic file input |
| **Form Validation** | Real-time with error states | Basic validation |
| **Auto-save** | Every 30 seconds | Manual save only |

### Migration Benefits
- **Better User Experience**: Smooth animations, better feedback
- **Improved Maintainability**: Component-based architecture
- **Modern Development**: Better tooling, debugging, testing
- **Enhanced Mobile Support**: Touch-friendly, responsive design
- **Professional Appearance**: Consistent DMGT branding

### Backward Compatibility
✅ **API Compatible**: Uses same Lambda backend  
✅ **Data Compatible**: Same request/response format  
✅ **Deployment Compatible**: Can coexist with original  

## 📞 Support

### Quick Diagnostics
1. **API Issues**: Run `python3 diagnose_api.py https://your-api-url.com/dev`
2. **React Issues**: Check browser console and `npm start` output
3. **Backend Issues**: Check [Troubleshooting](#-troubleshooting) section

### Getting Help
1. Review CloudWatch logs for detailed error information
2. Run `./run_tests.sh` to validate your deployment
3. Check the specific component README files:
   - [React Frontend README](react-frontend/README.md)
   - [API Testing Guide](API_TESTING.md)
4. Open an issue in this repository with test results

## 🔄 Recent Updates

### v3.0 - React Frontend Addition
- **Added**: Complete React frontend with modern UI/UX
- **Enhanced**: Multi-page survey navigation with progress tracking
- **Improved**: File upload with drag-and-drop functionality
- **Added**: Auto-save functionality and real-time validation
- **Enhanced**: Mobile-responsive design with professional branding

### v2.1 - Enhanced Error Handling & Debugging
- **Fixed**: Improved Lambda function event handling for API Gateway proxy integration
- **Added**: Comprehensive diagnostic script (`diagnose_api.py`)
- **Enhanced**: Better error messages and logging in Lambda functions
- **Improved**: Troubleshooting documentation with specific solutions

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
- [ ] Run `cd react-frontend && ./setup.sh`
- [ ] Run `./deploy.sh --owner=your-name`
- [ ] Test the deployed application

### Validation
- [ ] Run `./run_tests.sh` - expect 7/10 tests to pass
- [ ] Test both company and employee surveys
- [ ] Verify file upload functionality (employee survey)
- [ ] Check mobile responsiveness
- [ ] Confirm auto-save works (wait 30 seconds during form completion)

---

**Built for DMGT** | **Powered by AWS & React** | **© 2025**
