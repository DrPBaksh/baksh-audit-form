# DMGT AI & Data Readiness Survey - React Frontend

Modern React-based frontend for the DMGT AI & Data Readiness Survey platform, built to replace the original vanilla JavaScript frontend with enhanced functionality and user experience.

## 🚀 Features

### Core Functionality
- **Dual Survey System**: Company and Employee assessments
- **Progressive Form Handling**: Multi-page surveys with validation
- **File Upload Support**: Drag-and-drop file uploads for employee surveys
- **Auto-save**: Automatic progress saving every 30 seconds
- **Real-time Validation**: Field-level validation with error handling
- **Responsive Design**: Mobile-first responsive layout

### Technical Features
- **React 18**: Latest React with concurrent features
- **Tailwind CSS**: Utility-first styling with custom design system
- **Framer Motion**: Smooth animations and transitions
- **React Router**: Client-side routing with navigation
- **React Hot Toast**: Elegant toast notifications
- **TypeScript Ready**: Prepared for TypeScript conversion

### UI/UX Enhancements
- **Modern Design**: Clean, professional interface
- **Loading States**: Elegant loading screens and spinners
- **Progress Tracking**: Visual progress indicators
- **API Health Monitoring**: Real-time API status checking
- **Accessibility**: WCAG compliant components

## 📁 Project Structure

```
react-frontend/
├── public/
│   ├── index.html          # Main HTML template
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── Layout.js   # Main layout component
│   │   └── Survey/
│   │       ├── SurveyForm.js        # Main survey form
│   │       ├── QuestionRenderer.js  # Question components
│   │       ├── FileUpload.js        # File upload component
│   │       └── ProgressIndicator.js # Progress tracking
│   ├── pages/
│   │   ├── HomePage.js      # Landing page
│   │   ├── CompanySurvey.js # Company assessment
│   │   ├── EmployeeSurvey.js# Employee assessment
│   │   └── ThankYou.js      # Completion page
│   ├── services/
│   │   └── api.js          # API service functions
│   ├── config/
│   │   └── api.js          # API configuration
│   ├── App.js              # Main app component
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
└── package.json            # Dependencies and scripts
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Backend API running (see backend documentation)

### Install Dependencies
```bash
cd react-frontend
npm install
```

### Environment Configuration
Create a `.env` file in the react-frontend directory:
```bash
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/dev
```

### Development Server
```bash
npm start
```
Opens [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
```
Creates optimized production build in the `build/` folder.

## 🔧 API Integration

### Configuration
The API base URL is configured in `src/config/api.js`:
```javascript
const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  // ...
};
```

### API Service
All API calls are handled through `src/services/api.js`:
- `getQuestions(type)` - Fetch survey questions
- `saveResponse(data)` - Save survey responses
- `saveResponseWithFiles(data, files)` - Save with file uploads
- `getResponse(type, companyId, employeeId)` - Fetch existing responses

### Backend Compatibility
This React frontend is fully compatible with the existing AWS Lambda backend:
- Uses the same API endpoints
- Maintains the same data structures
- Supports all existing features

## 📊 Survey Types

### Company Assessment
- **Route**: `/company`
- **Features**: Organizational assessment questions
- **No file uploads**
- **Focus**: AI strategy, data governance, infrastructure

### Employee Assessment  
- **Route**: `/employee`
- **Features**: Individual assessment with file uploads
- **File support**: Up to 5 files, 10MB each
- **Focus**: AI familiarity, training needs, usage patterns

## 🎨 Design System

### Color Palette
- **Primary**: Blue (`#2563eb`)
- **Secondary**: Indigo (`#4f46e5`)
- **Success**: Green (`#059669`)
- **Error**: Red (`#dc2626`)
- **Warning**: Yellow (`#d97706`)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Components
All components follow consistent design patterns:
- Rounded corners (`rounded-lg`)
- Consistent spacing (Tailwind spacing scale)
- Hover states and transitions
- Focus states for accessibility

## 🔄 State Management

### Local State
Uses React hooks for component state:
- `useState` for simple state
- `useEffect` for side effects
- `useCallback` for optimized functions

### Form State
- Responses stored in component state
- Auto-save functionality
- Validation state management
- File upload state

### Navigation State
- React Router for routing
- URL-based navigation
- State preservation during navigation

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

### Layout
- Mobile-first approach
- Responsive grid layouts
- Collapsible navigation
- Touch-friendly interactions

## 🚀 Deployment

### AWS S3 + CloudFront
1. Build the application:
   ```bash
   npm run build
   ```

2. Upload build files to S3 bucket

3. Configure CloudFront distribution

4. Update API configuration for production

### Environment Variables
Set production environment variables:
```bash
REACT_APP_API_URL=https://your-production-api.amazonaws.com/prod
```

## 🧪 Testing

### Available Scripts
```bash
npm test        # Run test suite
npm run build   # Production build
npm run eject   # Eject from Create React App
```

### Testing Strategy
- Component testing with React Testing Library
- API service testing
- Integration testing for survey flows
- Accessibility testing

## 🔍 Performance

### Optimizations
- Code splitting with React.lazy()
- Image optimization
- Bundle size optimization
- Caching strategies

### Monitoring
- API health checking
- Error boundary implementation
- Performance monitoring hooks

## 🛡️ Security

### Data Protection
- Secure API communication
- Input validation and sanitization
- File upload restrictions
- XSS protection

### Privacy
- No client-side data persistence
- Secure file handling
- GDPR compliance considerations

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes with small, frequent commits
3. Test thoroughly
4. Submit pull request

### Code Standards
- ESLint configuration
- Prettier formatting
- Component naming conventions
- Consistent file structure

## 📞 Support

### Common Issues
- **API Connection**: Check `REACT_APP_API_URL` configuration
- **Build Errors**: Ensure all dependencies are installed
- **Styling Issues**: Verify Tailwind CSS is properly configured

### Debugging
- Check browser console for errors
- Verify API responses in Network tab
- Use React Developer Tools for component debugging

## 🔄 Migration from Original Frontend

### Key Differences
- **Framework**: React vs Vanilla JavaScript
- **Build Process**: npm scripts vs direct deployment
- **State Management**: React state vs manual DOM manipulation
- **Styling**: Tailwind CSS vs custom CSS

### Migration Benefits
- Better maintainability
- Enhanced user experience
- Modern development practices
- Improved performance

---

**Built with ❤️ for DMGT** | **Powered by React & AWS**
