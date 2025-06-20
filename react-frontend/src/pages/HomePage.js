import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

const HomePage = () => {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const isHealthy = await apiService.healthCheck();
      setApiStatus(isHealthy ? 'healthy' : 'error');
    } catch (error) {
      setApiStatus('error');
    }
  };

  const assessmentTypes = [
    {
      type: 'company',
      title: 'Company Assessment',
      icon: BuildingOfficeIcon,
      description: 'Evaluate organisational AI and data maturity across key business dimensions.',
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
      {/* Header with Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Company Logo" 
            className="h-16 w-auto"
            onError={(e) => {
              // Hide logo if not found
              e.target.style.display = 'none';
            }}
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          AI & Data Readiness Survey
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          System Only
        </p>
        
        {/* System Status */}
        <div className="flex justify-center">
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
        </div>
      </motion.div>

      {/* Assessment Types */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
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
    </div>
  );
};

export default HomePage;
