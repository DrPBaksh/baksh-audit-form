import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const QuestionRenderer = ({ question, value, onChange, error }) => {
  const { id, text, type, options, required } = question;

  const renderInput = () => {
    switch (type?.toLowerCase()) {
      case 'text':
        return (
          <input
            type="text"
            id={id}
            value={value || ''}
            onChange={(e) => onChange(id, e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-colors duration-200 text-sm
              ${error ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
            placeholder="Enter your response..."
          />
        );

      case 'email':
        return (
          <input
            type="email"
            id={id}
            value={value || ''}
            onChange={(e) => onChange(id, e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-colors duration-200 text-sm
              ${error ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
            placeholder="Enter your email address..."
          />
        );

      case 'textarea':
        return (
          <textarea
            id={id}
            value={value || ''}
            onChange={(e) => onChange(id, e.target.value)}
            rows={3}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-colors duration-200 resize-vertical text-sm
              ${error ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
            placeholder="Enter your detailed response..."
          />
        );

      case 'select':
      case 'dropdown':
        return (
          <select
            id={id}
            value={value || ''}
            onChange={(e) => onChange(id, e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-colors duration-200 bg-white text-sm
              ${error ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
          >
            <option value="">Select an option...</option>
            {options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="grid md:grid-cols-2 gap-2">
            {options?.map((option, index) => (
              <motion.label
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex items-center space-x-2 p-2 rounded-md border cursor-pointer
                  transition-all duration-200 hover:bg-slate-50 text-sm
                  ${value === option 
                    ? 'border-blue-500 bg-blue-50' 
                    : error 
                    ? 'border-red-300' 
                    : 'border-slate-200'
                  }
                `}
              >
                <input
                  type="radio"
                  name={id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(id, e.target.value)}
                  className="w-3 h-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 flex-1">{option}</span>
              </motion.label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="grid md:grid-cols-2 gap-2">
            {options?.map((option, index) => {
              const currentValues = Array.isArray(value) ? value : [];
              const isChecked = currentValues.includes(option);
              
              return (
                <motion.label
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center space-x-2 p-2 rounded-md border cursor-pointer
                    transition-all duration-200 hover:bg-slate-50 text-sm
                    ${isChecked 
                      ? 'border-blue-500 bg-blue-50' 
                      : error 
                      ? 'border-red-300' 
                      : 'border-slate-200'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={isChecked}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option);
                      onChange(id, newValues);
                    }}
                    className="w-3 h-3 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-slate-700 flex-1">{option}</span>
                </motion.label>
              );
            })}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            id={id}
            value={value || ''}
            onChange={(e) => onChange(id, e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-colors duration-200 text-sm
              ${error ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
            placeholder="Enter a number..."
          />
        );

      case 'range':
        const min = 1;
        const max = 10;
        const numValue = Number(value) || min;
        
        return (
          <div className="space-y-2">
            <input
              type="range"
              id={id}
              min={min}
              max={max}
              value={numValue}
              onChange={(e) => onChange(id, e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{min}</span>
              <span className="font-medium text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded">
                {numValue}
              </span>
              <span>{max}</span>
            </div>
          </div>
        );

      case 'likert':
      case 'scale':
        const scaleOptions = options || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
        return (
          <div className="flex flex-wrap gap-2">
            {scaleOptions.map((option, index) => (
              <motion.label
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex-1 min-w-0 flex items-center justify-center space-x-1 p-2 rounded-md border cursor-pointer
                  transition-all duration-200 hover:bg-slate-50 text-xs text-center
                  ${value === option 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : error 
                    ? 'border-red-300' 
                    : 'border-slate-200'
                  }
                `}
              >
                <input
                  type="radio"
                  name={id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(id, e.target.value)}
                  className="sr-only"
                />
                <span className="truncate">{option}</span>
              </motion.label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={id}
            value={value || ''}
            onChange={(e) => onChange(id, e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-colors duration-200 text-sm
              ${error ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
            placeholder="Enter your response..."
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200"
    >
      <div className="space-y-3">
        {/* Question Text */}
        <div>
          <label 
            htmlFor={id} 
            className="block text-base font-medium text-slate-900 leading-6"
          >
            {text}
            {required && (
              <span className="text-red-500 ml-1" title="Required">*</span>
            )}
          </label>
          
          {/* Question type indicator */}
          <div className="mt-1 flex items-center space-x-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {type || 'text'}
            </span>
            {required && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                Required
              </span>
            )}
          </div>
        </div>

        {/* Input Field */}
        <div>
          {renderInput()}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-md"
          >
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Progress indicator for current question */}
        {value && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-1 text-xs text-green-600"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Answered</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionRenderer;