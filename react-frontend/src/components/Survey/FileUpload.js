import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  CloudArrowUpIcon, 
  DocumentIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const FileUpload = ({ files = [], onChange, maxFiles = 5, maxSizeInMB = 10 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxSizeInBytes) {
      errors.push(`File "${file.name}" is too large. Maximum size is ${maxSizeInMB}MB.`);
    }
    
    // Check if file already exists
    if (files.some(existingFile => existingFile.name === file.name)) {
      errors.push(`File "${file.name}" is already uploaded.`);
    }

    // Check file type (allow common document and image types)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type) && file.type !== '') {
      errors.push(`File "${file.name}" type (${file.type}) is not supported. Please upload PDF, Word, Excel, image, or text files.`);
    }
    
    return errors;
  };

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    let allErrors = [];
    let validFiles = [];

    setUploadStatus(`Processing ${fileArray.length} file(s)...`);

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      allErrors.push(`Maximum ${maxFiles} files allowed. Currently have ${files.length} files.`);
      setUploadStatus('');
      setErrors(allErrors);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      console.log('📁 File Details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        allErrors = [...allErrors, ...fileErrors];
      } else {
        validFiles.push(file);
      }
    });

    setErrors(allErrors);
    setUploadStatus('');

    // Add valid files
    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
      toast.success(`${validFiles.length} file(s) ready for upload`);
      
      // Log file upload details for debugging
      console.log('📤 Files ready for upload:', validFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      })));
    }

    // Clear errors after 5 seconds
    if (allErrors.length > 0) {
      setTimeout(() => setErrors([]), 5000);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    const removedFile = files[indexToRemove];
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    onChange(updatedFiles);
    toast.success(`Removed ${removedFile.name}`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "w-8 h-8";
    
    switch (extension) {
      case 'pdf':
        return <DocumentIcon className={`${iconClass} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <DocumentIcon className={`${iconClass} text-blue-500`} />;
      case 'xls':
      case 'xlsx':
        return <DocumentIcon className={`${iconClass} text-green-500`} />;
      case 'ppt':
      case 'pptx':
        return <DocumentIcon className={`${iconClass} text-orange-500`} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <DocumentIcon className={`${iconClass} text-purple-500`} />;
      case 'txt':
      case 'csv':
        return <DocumentIcon className={`${iconClass} text-gray-500`} />;
      default:
        return <DocumentIcon className={`${iconClass} text-slate-500`} />;
    }
  };

  const getFileTypeDisplay = (file) => {
    if (file.type) {
      return file.type;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? `*.${extension}` : 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Debug Information */}
      {files.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Upload Status</p>
              <p className="text-blue-700">
                {files.length} file(s) selected. Files will be uploaded when you submit the survey.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-yellow-600"></div>
            <span className="text-sm text-yellow-800">{uploadStatus}</span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400'
          }
          ${files.length >= maxFiles 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-slate-50'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (files.length < maxFiles && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={files.length >= maxFiles}
        />

        <div className="space-y-4">
          <motion.div
            animate={{ scale: dragActive ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <CloudArrowUpIcon className={`
              w-12 h-12 mx-auto
              ${dragActive ? 'text-blue-500' : 'text-slate-400'}
            `} />
          </motion.div>

          <div>
            <p className="text-lg font-medium text-slate-900">
              {dragActive 
                ? 'Drop files here' 
                : files.length >= maxFiles
                ? 'Maximum files reached'
                : 'Upload supporting documents'
              }
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {files.length >= maxFiles 
                ? `Remove files to upload more (${files.length}/${maxFiles})`
                : `Drag and drop files here, or click to browse (${files.length}/${maxFiles})`
              }
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Supported: PDF, Word, Excel, PowerPoint, Images, Text files<br/>
              Maximum file size: {maxSizeInMB}MB per file
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-slate-900 flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span>Files Ready for Upload ({files.length})</span>
            </h4>

            <div className="space-y-2">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {getFileIcon(file.name)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{getFileTypeDisplay(file)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFile(index)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors duration-200 flex-shrink-0"
                    title="Remove file"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* File Upload Instructions */}
            <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border">
              <p>💡 <strong>Note:</strong> Files will be uploaded to S3 when you submit the survey. Make sure to complete all required fields before submitting.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;