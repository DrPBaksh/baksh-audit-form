import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  BookmarkIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import apiService from '../services/api';
import config from '../config/api';

const HomePage = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [fileUploadSupported, setFileUploadSupported] = useState(null);

  useEffect(() => {
    checkApiHealth();
    testFileUploadSupport();
  }, []);

  const checkApiHealth = async () => {
    try {
      const isHealthy = await apiService.healthCheck();
      setApiStatus(isHealthy ? 'healthy' : 'error');
    } catch (error) {
      setApiStatus('error');
    }
  };

  const testFileUploadSupport = async () => {
    try {
      const supported = await apiService.testFileUpload();
      setFileUploadSupported(supported);
    } catch (error) {
      setFileUploadSupported(false);
    }
  };

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Dual Survey System',
      description: 'Company-level and employee-level assessments to capture comprehensive insights.'
    },
    {
      icon: BookmarkIcon,
      title: 'Page-by-Page Saving',
      description: 'Save progress after each page and resume at any time with load previous responses.'
    },
    {
      icon: DocumentArrowDownIcon,
      title: 'Smart Company Recognition',
      description: 'Automatically detects existing companies and offers to load previous responses.'
    },
    {
      icon: CloudArrowUpIcon,
      title: 'Enhanced File Uploads',
      description: 'Improved drag-and-drop file uploads with validation and progress indicators.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Compliant',
      description: 'AWS-native security with IAM least privilege principles and data encryption.'
    },
    {
      icon: CpuChipIcon,
      title: 'Optimized Performance',
      description: 'Better space utilization, faster loading, and responsive design improvements.'
    }
  ];

  const assessmentTypes = [
    {
      type: 'company',
      title: 'Company Assessment',
      icon: BuildingOfficeIcon,
      description: 'Evaluate organizational AI and data maturity across key business dimensions.',
      areas: [
        'AI Strategy & Leadership',
        'Data Governance & Quality',
        'Technology Infrastructure',
        'Workforce Readiness',
        'Risk Management'
      ],
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      path: '/company'
    },
    {
      type: 'employee',
      title: 'Employee Assessment',
      icon: UserGroupIcon,
      description: 'Assess individual AI familiarity, needs, and readiness for AI-driven workflows.',
      areas: [
        'Current AI Tool Usage',
        'Confidence & Comfort Levels',
        'Training Needs',
        'Workflow Automation',
        'Concerns & Barriers'
      ],
      color: 'from-indigo-600 to-indigo-700',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      path: '/employee'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          AI & Data Readiness Survey
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Enhanced assessment platform with improved user experience, page-by-page saving, 
          and smart company recognition for your organization's AI transformation.
        </p>
        
        {/* System Status */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* API Status */}
          <div className={`
            flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium
            ${apiStatus === 'healthy' 
              ? 'bg-green-100 text-green-800' 
              : apiStatus === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
            }
          `}>
            {apiStatus === 'healthy' ? (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                <span>System Online</span>
              </>
            ) : apiStatus === 'error' ? (
              <>
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                <span>System Unavailable</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />
                <span>Checking System...</span>
              </>
            )}
          </div>

          {/* File Upload Status */}
          {fileUploadSupported !== null && (
            <div className={`
              flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium
              ${fileUploadSupported 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
              }
            `}>
              <CloudArrowUpIcon className="w-4 h-4" />
              <span>
                File Uploads {fileUploadSupported ? 'Supported' : 'Limited'}
              </span>
            </div>
          )}
        </div>

        {/* New Features Alert */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 max-w-4xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center space-x-2">
            <CheckCircleIconSolid className="w-5 h-5 text-blue-600" />
            <span>✨ Enhanced Features Now Available</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <BookmarkIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Smart Saving</p>
                <p className="text-blue-700">Save progress after each page with instant feedback</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <DocumentArrowDownIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Company Recognition</p>
                <p className="text-blue-700">Automatic detection of existing companies</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CloudArrowUpIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Better File Handling</p>
                <p className="text-blue-700">Enhanced upload validation and progress tracking</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Assessment Types */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid md:grid-cols-2 gap-8"
      >
        {assessmentTypes.map((assessment, index) => (
          <motion.div
            key={assessment.type}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className={`p-6 ${assessment.bgColor}`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${assessment.color} rounded-lg flex items-center justify-center`}>
                  <assessment.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {assessment.title}
                  </h3>
                  <p className={`text-sm ${assessment.textColor} font-medium`}>
                    {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)} Level Analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-600">
                {assessment.description}
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Assessment Areas:</h4>
                <ul className="space-y-1">
                  {assessment.areas.map((area, areaIndex) => (
                    <motion.li
                      key={area}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + areaIndex * 0.1, duration: 0.3 }}
                      className="flex items-center space-x-2 text-sm text-slate-600"
                    >
                      <div className={`w-1.5 h-1.5 bg-gradient-to-r ${assessment.color} rounded-full`} />
                      <span>{area}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <Link
                to={assessment.path}
                className={`
                  w-full mt-6 bg-gradient-to-r ${assessment.color} 
                  text-white font-medium py-3 px-4 rounded-lg 
                  hover:shadow-lg transition-all duration-200 
                  flex items-center justify-center space-x-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                onClick={(e) => {
                  if (apiStatus !== 'healthy') {
                    e.preventDefault();
                  }
                }}
              >
                <span>Start {assessment.title}</span>
                <assessment.icon className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Enhanced Platform Features</h2>
          <p className="text-lg text-slate-600 mt-2">
            New improvements for better user experience and data management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -3 }}
              className="bg-white p-6 rounded-lg shadow-md border border-slate-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-slate-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-center text-white"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to Assess Your AI Readiness?
        </h2>
        <p className="text-lg mb-6 opacity-90">
          Experience the enhanced survey platform with smart saving, company recognition, 
          and improved file handling capabilities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/company"
            className="bg-white text-blue-600 font-medium py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            onClick={(e) => {
              if (apiStatus !== 'healthy') {
                e.preventDefault();
              }
            }}
          >
            Start Company Assessment
          </Link>
          <Link
            to="/employee"
            className="bg-blue-700 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-800 transition-colors duration-200"
            onClick={(e) => {
              if (apiStatus !== 'healthy') {
                e.preventDefault();
              }
            }}
          >
            Start Employee Assessment
          </Link>
        </div>
        
        {/* Quick Info */}
        <div className="mt-6 text-sm opacity-80">
          <p>✨ New: Save progress on each page • Load previous responses • Enhanced file uploads</p>
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;