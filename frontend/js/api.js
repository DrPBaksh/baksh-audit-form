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
     * Save survey response
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
     * Convert files to base64 for upload
     * @param {FileList} files - Files to convert
     * @returns {Promise<Array>} Array of file objects with base64 content
     */
    async convertFilesToBase64(files) {
        const filePromises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                // Check file size (max 10MB per file)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    reject(new Error(`File "${file.name}" is too large. Maximum size is 10MB.`));
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1]; // Remove data:type/subtype;base64, prefix
                    resolve({
                        filename: file.name,
                        content: base64,
                        content_type: file.type || 'application/octet-stream',
                        size: file.size
                    });
                };
                
                reader.onerror = () => {
                    reject(new Error(`Failed to read file: ${file.name}`));
                };
                
                reader.readAsDataURL(file);
            });
        });

        try {
            return await Promise.all(filePromises);
        } catch (error) {
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
}

// Create global API instance
window.bakshAPI = new BakshAPI();

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BakshAPI;
}