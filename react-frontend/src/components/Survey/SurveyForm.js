import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  BookmarkIcon,
  DocumentArrowDownIcon,
  BuildingOfficeIcon,
  UserIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';

import QuestionRenderer from './QuestionRenderer';
import FileUpload from './FileUpload';
import ProgressIndicator from './ProgressIndicator';
import apiService from '../../services/api';

const SurveyForm = ({ 
  surveyType, 
  title, 
  description,
  showFileUpload = false 
}) => {
  const navigate = useNavigate();
  
  // State management
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [files, setFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [debugging, setDebugging] = useState(false);
  
  // Form identification
  const [companyId, setCompanyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [companyStatus, setCompanyStatus] = useState(''); // 'unknown', 'existing', 'new'
  const [checkingCompany, setCheckingCompany] = useState(false);
  
  // Progress tracking
  const questionsPerPage = 3; // Reduced for better space utilization
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const currentQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  // Load questions on component mount
  useEffect(() => {
    loadQuestions();
  }, [surveyType]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (companyId && (surveyType === 'company' || employeeId)) {
        autoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [responses, companyId, employeeId, surveyType]);

  // Check company status when company ID changes
  useEffect(() => {
    if (companyId.trim()) {
      checkCompanyStatus(companyId.trim());
    } else {
      setCompanyStatus('');
    }
  }, [companyId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getQuestions(surveyType);
      
      if (data && data.questions) {
        setQuestions(data.questions);
      } else {
        throw new Error('Invalid questions format received');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error(`Failed to load ${surveyType} questions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCompanyStatus = async (companyIdToCheck) => {
    try {
      setCheckingCompany(true);
      const existingResponse = await apiService.getResponse(surveyType, companyIdToCheck, surveyType === 'employee' ? employeeId : null);
      
      if (existingResponse) {
        setCompanyStatus('existing');
        toast.success('Company recognized! You can load previous responses if needed.', { duration: 5000 });
      } else {
        setCompanyStatus('new');
        toast.info('New company detected. Starting fresh assessment.', { duration: 4000 });
      }
    } catch (error) {
      setCompanyStatus('new');
      toast.info('New company detected. Starting fresh assessment.', { duration: 4000 });
    } finally {
      setCheckingCompany(false);
    }
  };

  const loadExistingResponse = async () => {
    if (!companyId || (surveyType === 'employee' && !employeeId)) {
      toast.error('Please enter valid IDs first');
      return;
    }

    try {
      setLoading(true);
      const existingResponse = await apiService.getResponse(
        surveyType, 
        companyId, 
        surveyType === 'employee' ? employeeId : null
      );
      
      if (existingResponse && existingResponse.responses) {
        setResponses(existingResponse.responses);
        toast.success('Previous responses loaded successfully!');
      } else {
        toast.info('No previous responses found.');
      }
    } catch (error) {
      console.error('Error loading responses:', error);
      toast.error('Failed to load previous responses');
    } finally {
      setLoading(false);
    }
  };

  const autoSave = useCallback(async () => {
    if (!companyId || (surveyType === 'employee' && !employeeId)) return;
    
    try {
      const saveData = {
        type: surveyType,
        company_id: companyId,
        responses,
        auto_save: true
      };

      if (surveyType === 'employee') {
        saveData.employee_id = employeeId;
      }

      await apiService.saveResponse(saveData);
      console.log('Auto-saved successfully');
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }, [responses, companyId, employeeId, surveyType]);

  const saveCurrentProgress = async () => {
    if (!companyId || (surveyType === 'employee' && !employeeId)) {
      toast.error('Please enter valid IDs first');
      return;
    }

    try {
      setSaving(true);
      const saveData = {
        type: surveyType,
        company_id: companyId,
        responses,
        auto_save: false,
        page_save: true
      };

      if (surveyType === 'employee') {
        saveData.employee_id = employeeId;
      }

      await apiService.saveResponse(saveData);
      toast.success('Progress saved successfully!');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const debugFileUpload = async () => {
    if (!companyId || (surveyType === 'employee' && !employeeId)) {
      toast.error('Please enter valid IDs first');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select some files first');
      return;
    }

    try {
      setDebugging(true);
      
      const debugData = {
        type: surveyType,
        company_id: companyId,
        responses: responses
      };

      if (surveyType === 'employee') {
        debugData.employee_id = employeeId;
      }

      const debugInfo = await apiService.debugFileUpload(debugData, files);
      
      console.log('🐛 File Upload Debug Results:', debugInfo);
      
      // Show debug information in a toast
      const validFiles = debugInfo.validation.filter(v => v.valid).length;
      const invalidFiles = debugInfo.validation.filter(v => !v.valid).length;
      
      toast.success(
        `Debug complete: ${validFiles} valid files, ${invalidFiles} invalid files. Check console for details.`,
        { duration: 8000 }
      );

    } catch (error) {
      console.error('Debug failed:', error);
      toast.error('Debug failed: ' + error.message);
    } finally {
      setDebugging(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear error for this question if it exists
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateCurrentPage = () => {
    const newErrors = {};
    
    currentQuestions.forEach(question => {
      if (question.required) {
        const value = responses[question.id];
        if (!value || (Array.isArray(value) && value.length === 0) || String(value).trim() === '') {
          newErrors[question.id] = 'This field is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all required questions
    const allErrors = {};
    questions.forEach(question => {
      if (question.required) {
        const value = responses[question.id];
        if (!value || (Array.isArray(value) && value.length === 0) || String(value).trim() === '') {
          allErrors[question.id] = 'This field is required';
        }
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast.error('Please complete all required fields');
      // Navigate to first page with errors
      const firstErrorPage = Math.floor(
        questions.findIndex(q => allErrors[q.id]) / questionsPerPage
      );
      setCurrentPage(Math.max(0, firstErrorPage));
      return;
    }

    // Validate required IDs
    if (!companyId) {
      toast.error('Company ID is required');
      return;
    }

    if (surveyType === 'employee' && !employeeId) {
      toast.error('Employee ID is required');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        type: surveyType,
        company_id: companyId,
        responses,
        submitted: true
      };

      if (surveyType === 'employee') {
        submitData.employee_id = employeeId;
      }

      if (files.length > 0 && surveyType === 'employee') {
        console.log('📤 Submitting with files:', files.map(f => ({ name: f.name, size: f.size })));
        await apiService.saveResponseWithFiles(submitData, files);
      } else {
        await apiService.saveResponse(submitData);
      }

      toast.success('Survey submitted successfully!');
      navigate('/thank-you', { 
        state: { 
          surveyType, 
          companyId, 
          employeeId: surveyType === 'employee' ? employeeId : null 
        } 
      });
      
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error(`Failed to submit survey: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getCompletionPercentage = () => {
    const totalRequired = questions.filter(q => q.required).length;
    const completedRequired = questions.filter(q => 
      q.required && responses[q.id] && 
      (Array.isArray(responses[q.id]) ? responses[q.id].length > 0 : String(responses[q.id]).trim() !== '')
    ).length;
    
    return totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600">Loading {surveyType} survey...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center space-y-4 py-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto" />
        <h3 className="text-lg font-medium text-slate-900">No Questions Available</h3>
        <p className="text-slate-600">
          No questions found for the {surveyType} survey. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto">{description}</p>
        
        {/* Completion Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-900">
              Progress: {getCompletionPercentage()}% Complete
            </span>
            <span className="text-blue-700">
              {Object.keys(responses).length} / {questions.length} answered
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Progress Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <ProgressIndicator
            currentSection={currentPage}
            totalSections={totalPages}
            sections={Array.from({ length: totalPages }, (_, i) => `Page ${i + 1}`)}
          />
          
          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3">
            <h4 className="font-medium text-slate-900 text-sm">Quick Actions</h4>
            
            <button
              onClick={saveCurrentProgress}
              disabled={saving || !companyId || (surveyType === 'employee' && !employeeId)}
              className={`
                w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${saving || !companyId || (surveyType === 'employee' && !employeeId)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }
              `}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <BookmarkIcon className="w-4 h-4" />
                  <span>Save Page</span>
                </>
              )}
            </button>

            {companyStatus === 'existing' && (
              <button
                onClick={loadExistingResponse}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 border border-green-200 transition-colors"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Load Previous</span>
              </button>
            )}

            {/* Debug File Upload Button */}
            {files.length > 0 && surveyType === 'employee' && (
              <button
                onClick={debugFileUpload}
                disabled={debugging}
                className={`
                  w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${debugging
                    ? 'bg-orange-100 text-orange-400 cursor-not-allowed'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                  }
                `}
              >
                {debugging ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-600"></div>
                    <span>Debugging...</span>
                  </>
                ) : (
                  <>
                    <BugAntIcon className="w-4 h-4" />
                    <span>Debug Files</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Form Identification */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center space-x-2">
              {surveyType === 'company' ? (
                <BuildingOfficeIcon className="w-5 h-5" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
              <span>Survey Information</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="Enter company identifier"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {checkingCompany && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-600"></div>
                    </div>
                  )}
                </div>
                
                {/* Company Status Indicator */}
                {companyStatus && (
                  <div className={`mt-2 text-xs flex items-center space-x-1 ${
                    companyStatus === 'existing' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    <CheckCircleIcon className="w-3 h-3" />
                    <span>
                      {companyStatus === 'existing' 
                        ? 'Company recognized in system' 
                        : 'New company - will create fresh assessment'
                      }
                    </span>
                  </div>
                )}
              </div>
              
              {surveyType === 'employee' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter employee identifier"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {currentQuestions.map((question, index) => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  value={responses[question.id]}
                  onChange={handleResponseChange}
                  error={errors[question.id]}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* File Upload (Employee surveys only) */}
          {showFileUpload && surveyType === 'employee' && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-medium text-slate-900 mb-3 flex items-center space-x-2">
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>Supporting Documents</span>
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Upload any relevant documents that support your responses (optional).
              </p>
              <FileUpload
                files={files}
                onChange={setFiles}
                maxFiles={5}
                maxSizeInMB={10}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200
                ${currentPage === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-600 text-white hover:bg-slate-700'
                }
              `}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-4">
              {/* Save Progress Button */}
              <button
                onClick={saveCurrentProgress}
                disabled={saving || !companyId || (surveyType === 'employee' && !employeeId)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${saving || !companyId || (surveyType === 'employee' && !employeeId)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                  }
                `}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-yellow-600"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <BookmarkIcon className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-sm text-slate-500">
                  Page {currentPage + 1} of {totalPages}
                </span>
              </div>
            </div>

            {currentPage < totalPages - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                <span>Next</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !companyId || (surveyType === 'employee' && !employeeId)}
                className={`
                  flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors duration-200
                  ${submitting || !companyId || (surveyType === 'employee' && !employeeId)
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }
                `}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Submit Survey</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyForm;