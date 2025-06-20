import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const ThankYou = () => {
  const location = useLocation();
  const { surveyType, companyId, employeeId } = location.state || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const nextSteps = [
    {
      icon: ChartBarIcon,
      title: 'Data Processing',
      description: 'Your responses are being processed and analyzed to generate insights.'
    },
    {
      icon: DocumentTextIcon,
      title: 'Report Generation',
      description: 'A comprehensive assessment report will be generated based on your input.'
    },
    {
      icon: UserGroupIcon,
      title: 'Follow-up',
      description: 'You may be contacted for additional information or clarification if needed.'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-3xl mx-auto text-center space-y-8"
    >
      {/* Success Header */}
      <motion.div variants={itemVariants} className="space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.3,
            type: "spring",
            stiffness: 260,
            damping: 20 
          }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </motion.div>
        
        <h1 className="text-4xl font-bold text-slate-900">
          Thank You!
        </h1>
        
        <p className="text-xl text-slate-600">
          Your {surveyType} assessment has been successfully submitted.
        </p>
      </motion.div>

      {/* Submission Details */}
      <motion.div 
        variants={itemVariants}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6"
      >
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          Submission Details
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Survey Type:</span>
            <span className="font-medium text-slate-900 capitalize">
              {surveyType || 'Unknown'} Assessment
            </span>
          </div>
          {companyId && (
            <div className="flex justify-between">
              <span className="text-slate-600">Company ID:</span>
              <span className="font-medium text-slate-900">{companyId}</span>
            </div>
          )}
          {employeeId && (
            <div className="flex justify-between">
              <span className="text-slate-600">Employee ID:</span>
              <span className="font-medium text-slate-900">{employeeId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-600">Submitted At:</span>
            <span className="font-medium text-slate-900">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">What Happens Next?</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {nextSteps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-slate-200"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                  <step.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Additional Information */}
      <motion.div 
        variants={itemVariants}
        className="bg-slate-50 border border-slate-200 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          Important Information
        </h3>
        <div className="text-left space-y-2 text-sm text-slate-600">
          <p>
            • Your responses have been securely stored and will be used exclusively for the AI & Data Readiness Assessment.
          </p>
          <p>
            • All data is protected according to DMGT's privacy and security policies.
          </p>
          <p>
            • Assessment results will be compiled and shared with authorized stakeholders only.
          </p>
          <p>
            • If you need to make changes to your submission, please contact the assessment team.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
      >
        <Link
          to="/"
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          <HomeIcon className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
        
        <Link
          to={surveyType === 'company' ? '/employee' : '/company'}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200"
        >
          {surveyType === 'company' ? (
            <>
              <UserGroupIcon className="w-4 h-4" />
              <span>Take Employee Survey</span>
            </>
          ) : (
            <>
              <ChartBarIcon className="w-4 h-4" />
              <span>Take Company Survey</span>
            </>
          )}
        </Link>
      </motion.div>

      {/* Support Contact */}
      <motion.div variants={itemVariants} className="text-center pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          Questions or need assistance? Contact the DMGT AI Assessment Team.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ThankYou;
