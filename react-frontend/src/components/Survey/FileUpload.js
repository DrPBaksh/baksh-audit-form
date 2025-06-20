import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  DocumentIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const FileUpload = ({ files = [], onChange, maxFiles = 5, maxSizeInMB = 10 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
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
    
    return errors;
  };

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    let allErrors = [];
    let validFiles = [];

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      allErrors.push(`Maximum ${maxFiles} files allowed. Currently have ${files.length} files.`);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        allErrors = [...allErrors, ...fileErrors];
      } else {
        validFiles.push(file);
      }
    });

    setErrors(allErrors);

    // Add valid files
    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
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
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    onChange(updatedFiles);
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
      default:
        return <DocumentIcon className={`${iconClass} text-slate-500`} />;
    }
  };

  return (
    <div className="space-y-4">
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
              <span>Uploaded Files ({files.length})</span>
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
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.name)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFile(index)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors duration-200"
                    title="Remove file"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
