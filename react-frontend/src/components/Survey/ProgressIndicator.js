import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const ProgressIndicator = ({ 
  currentSection = 0, 
  totalSections = 5, 
  sections = [], 
  className = '' 
}) => {
  const progressPercentage = totalSections > 0 ? (currentSection / totalSections) * 100 : 0;

  // Default section names if not provided
  const defaultSections = [
    'Basic Information',
    'Assessment Questions',
    'Additional Details',
    'Review & Submit',
    'Complete'
  ];

  const sectionNames = sections.length > 0 ? sections : defaultSections.slice(0, totalSections);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-900">
            Progress
          </h3>
          <span className="text-sm text-slate-500">
            {currentSection} of {totalSections} sections
          </span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-500">0%</span>
          <span className="text-xs font-medium text-blue-600">
            {Math.round(progressPercentage)}%
          </span>
          <span className="text-xs text-slate-500">100%</span>
        </div>
      </div>

      {/* Section Steps */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-900 mb-3">
          Sections
        </h4>
        
        <div className="space-y-2">
          {sectionNames.map((sectionName, index) => {
            const isCompleted = index < currentSection;
            const isCurrent = index === currentSection;
            const isUpcoming = index > currentSection;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                  ${isCurrent 
                    ? 'bg-blue-50 border border-blue-200' 
                    : isCompleted 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-slate-50 border border-slate-200'
                  }
                `}
              >
                {/* Step Indicator */}
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-300 text-slate-600'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Section Name */}
                <div className="flex-1">
                  <p className={`
                    text-sm font-medium
                    ${isCurrent 
                      ? 'text-blue-900' 
                      : isCompleted 
                      ? 'text-green-900' 
                      : 'text-slate-600'
                    }
                  `}>
                    {sectionName}
                  </p>
                  
                  <p className={`
                    text-xs
                    ${isCurrent 
                      ? 'text-blue-600' 
                      : isCompleted 
                      ? 'text-green-600' 
                      : 'text-slate-500'
                    }
                  `}>
                    {isCurrent 
                      ? 'In Progress' 
                      : isCompleted 
                      ? 'Completed' 
                      : 'Upcoming'
                    }
                  </p>
                </div>

                {/* Status Indicator */}
                {isCurrent && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-2 h-2 bg-blue-600 rounded-full"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Completion Message */}
      {currentSection >= totalSections && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Survey Completed!
              </p>
              <p className="text-xs text-green-700">
                Thank you for completing the assessment.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressIndicator;
