/**
 * API communication functions for Baksh Audit Form
 */

class BakshAPI {
    constructor() {
        // Default configuration - will be overridden by config.js
        this.config = {
            API_URL: 'https://api.example.com/dev',
            OWNER: 'default',
            ENVIRONMENT: 'dev'
        };
        
        // Override with window config if available
        if (window.APP_CONFIG) {
            this.config = { ...this.config, ...window.APP_CONFIG };
        }
        
        this.baseURL = this.config.API_URL;
    }

    /**
     * Make HTTP request with error handling
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {Object} headers - Additional headers
     * @returns {Promise<Object>} Response data
     */
    async makeRequest(method, endpoint, data = null, headers = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data && method.toLowerCase() !== 'get') {
            config.body = JSON.stringify(data);
        }

        try {
            console.log(`📡 API Request: ${method.toUpperCase()} ${url}`, data);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log(`✅ API Response: ${method.toUpperCase()} ${url}`, responseData);
            
            return responseData;
        } catch (error) {
            console.error(`❌ API Error: ${method.toUpperCase()} ${url}`, error);
            throw error;
        }
    }

    /**
     * Get survey questions
     * @param {string} type - 'company' or 'employee'
     * @returns {Promise<Object>} Questions data
     */
    async getQuestions(type) {
        if (!type || !['company', 'employee'].includes(type)) {
            throw new Error('Type must be either "company" or "employee"');
        }

        try {
            const response = await this.makeRequest('GET', `/questions?type=${type}`);
            
            if (!response.questions || !Array.isArray(response.questions)) {
                throw new Error('Invalid questions format received from server');
            }

            return response;
        } catch (error) {
            throw new Error(`Failed to load ${type} questions: ${error.message}`);
        }
    }

    /**
     * Get existing response from S3
     * @param {string} type - 'company' or 'employee'
     * @param {string} companyId - Company ID
     * @param {string} employeeId - Employee ID (optional, for employee responses)
     * @returns {Promise<Object>} Existing response data
     */
    async getExistingResponse(type, companyId, employeeId = null) {
        if (!type || !['company', 'employee'].includes(type)) {
            throw new Error('Type must be either "company" or "employee"');
        }

        if (!companyId) {
            throw new Error('Company ID is required');
        }

        if (type === 'employee' && !employeeId) {
            throw new Error('Employee ID is required for employee responses');
        }

        try {
            let endpoint = `/responses?type=${type}&company_id=${encodeURIComponent(companyId)}`;
            if (employeeId) {
                endpoint += `&employee_id=${encodeURIComponent(employeeId)}`;
            }

            const response = await this.makeRequest('GET', endpoint);
            return response;
        } catch (error) {
            // If 404, no existing response found - this is expected
            if (error.message.includes('404') || error.message.includes('not found')) {
                return null;
            }
            throw new Error(`Failed to get existing response: ${error.message}`);
        }
    }

    /**
     * Save survey response (without marking as submitted)
     * @param {Object} responseData - Survey response data
     * @returns {Promise<Object>} Save response
     */
    async saveResponse(responseData) {
        try {
            // Validate required fields
            if (!responseData.type || !['company', 'employee'].includes(responseData.type)) {
                throw new Error('Invalid response type');
            }

            if (!responseData.company_id) {
                throw new Error('Company ID is required');
            }

            if (responseData.type === 'employee' && !responseData.employee_id) {
                throw new Error('Employee ID is required for employee responses');
            }

            if (!responseData.responses || typeof responseData.responses !== 'object') {
                throw new Error('Survey responses are required');
            }

            const response = await this.makeRequest('POST', '/responses', responseData);
            
            return response;
        } catch (error) {
            throw new Error(`Failed to save response: ${error.message}`);
        }
    }

    /**
     * Save draft responses (for progress saving)
     * @param {string} type - 'company' or 'employee'
     * @param {string} companyId - Company ID
     * @param {Object} responses - Survey responses
     * @param {string} employeeId - Employee ID (for employee surveys)
     * @param {string} employeeName - Employee name (for employee surveys)
     * @returns {Promise<Object>} Save response
     */
    async saveDraft(type, companyId, responses, employeeId = null, employeeName = null) {
        const draftData = {
            type,
            company_id: companyId,
            responses,
            is_draft: true
        };

        if (type === 'employee') {
            draftData.employee_id = employeeId;
            if (employeeName) {
                draftData.employee_name = employeeName;
            }
        }

        return await this.saveResponse(draftData);
    }

    /**
     * Submit final survey with files
     * @param {Object} formData - Complete form data
     * @param {Array} files - Array of File objects to upload
     * @returns {Promise<Object>} Submit response
     */
    async submitSurvey(formData, files = []) {
        try {
            console.log('🚀 Submitting survey with files:', { formData, fileCount: files.length });

            // Prepare the submission data
            const submissionData = {
                type: formData.type,
                company_id: formData.companyId,
                responses: formData.responses,
                submitted_at: formData.submittedAt || new Date().toISOString()
            };

            // Add employee information if applicable
            if (formData.type === 'employee') {
                submissionData.employee_id = formData.employeeId;
                if (formData.employeeName) {
                    submissionData.employee_name = formData.employeeName;
                }
            }

            // Convert files to base64 if any files are provided
            if (files && files.length > 0) {
                console.log(`📎 Converting ${files.length} files to base64...`);
                
                try {
                    const convertedFiles = await this.convertFilesToBase64(files);
                    submissionData.files = convertedFiles;
                    console.log(`✅ Successfully converted ${convertedFiles.length} files`);
                } catch (fileError) {
                    console.error('❌ File conversion failed:', fileError);
                    throw new Error(`Failed to process uploaded files: ${fileError.message}`);
                }
            }

            // Submit the survey
            console.log('📤 Submitting to API...');
            const response = await this.makeRequest('POST', '/responses', submissionData);
            
            console.log('✅ Survey submitted successfully:', response);
            return response;

        } catch (error) {
            console.error('❌ Survey submission failed:', error);
            throw new Error(`Failed to submit survey: ${error.message}`);
        }
    }

    /**
     * Convert files to base64 for upload
     * @param {FileList|Array} files - Files to convert
     * @returns {Promise<Array>} Array of file objects with base64 content
     */
    async convertFilesToBase64(files) {
        if (!files || files.length === 0) {
            return [];
        }

        const fileArray = Array.isArray(files) ? files : Array.from(files);
        
        const filePromises = fileArray.map((file, index) => {
            return new Promise((resolve, reject) => {
                // Validate file
                if (!file || !file.name) {
                    reject(new Error(`Invalid file at index ${index}`));
                    return;
                }

                // Check file size (max 10MB per file)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    reject(new Error(`File "${file.name}" is too large. Maximum size is 10MB.`));
                    return;
                }

                // Check file type
                const allowedTypes = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ];

                if (file.type && !allowedTypes.includes(file.type)) {
                    console.warn(`File type ${file.type} for "${file.name}" may not be supported`);
                }

                const reader = new FileReader();
                
                reader.onload = () => {
                    try {
                        const result = reader.result;
                        if (!result || typeof result !== 'string') {
                            reject(new Error(`Failed to read file: ${file.name}`));
                            return;
                        }

                        const base64 = result.split(',')[1]; // Remove data:type/subtype;base64, prefix
                        if (!base64) {
                            reject(new Error(`Failed to extract base64 content from: ${file.name}`));
                            return;
                        }

                        resolve({
                            filename: file.name,
                            content: base64,
                            content_type: file.type || 'application/octet-stream',
                            size: file.size,
                            uploaded_at: new Date().toISOString()
                        });
                    } catch (error) {
                        reject(new Error(`Error processing file ${file.name}: ${error.message}`));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error(`Failed to read file: ${file.name}`));
                };
                
                try {
                    reader.readAsDataURL(file);
                } catch (error) {
                    reject(new Error(`Failed to start reading file: ${file.name}`));
                }
            });
        });

        try {
            const results = await Promise.all(filePromises);
            console.log(`✅ Successfully converted ${results.length} files to base64`);
            return results;
        } catch (error) {
            console.error('❌ File conversion failed:', error);
            throw new Error(`File processing error: ${error.message}`);
        }
    }

    /**
     * Check API health/connectivity
     * @returns {Promise<boolean>} True if API is accessible
     */
    async checkConnection() {
        try {
            // Try to get company questions as a health check
            await this.getQuestions('company');
            return true;
        } catch (error) {
            console.warn('API connection check failed:', error);
            return false;
        }
    }

    /**
     * Get formatted error message for user display
     * @param {Error} error - Error object
     * @returns {string} User-friendly error message
     */
    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        }
        
        if (error.message.includes('404')) {
            return 'The requested resource was not found. Please refresh the page and try again.';
        }
        
        if (error.message.includes('500')) {
            return 'Server error occurred. Please try again later or contact support if the problem persists.';
        }
        
        if (error.message.includes('413')) {
            return 'The uploaded files are too large. Please reduce file sizes and try again.';
        }
        
        // Return the original error message if it's already user-friendly
        return error.message || 'An unexpected error occurred. Please try again.';
    }

    /**
     * Validate file before upload
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'];
        
        const result = {
            valid: true,
            errors: []
        };

        if (!file) {
            result.valid = false;
            result.errors.push('No file provided');
            return result;
        }

        if (file.size > maxSize) {
            result.valid = false;
            result.errors.push(`File is too large (${this.formatFileSize(file.size)}). Maximum size is 10MB.`);
        }

        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            result.valid = false;
            result.errors.push(`File type not supported (${extension}). Allowed types: ${allowedExtensions.join(', ')}`);
        }

        return result;
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create global API instance
window.bakshAPI = new BakshAPI();

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BakshAPI;
}
