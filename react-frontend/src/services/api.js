import config, { getEndpointUrl } from '../config/api';

/**
 * API Service functions for interacting with the backend
 */
class ApiService {
  
  /**
   * Make HTTP request with proper error handling
   */
  async makeRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      console.log(`Making request to: ${url}`, finalOptions);
      
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data;
      
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * Get survey questions by type
   * @param {string} type - 'company' or 'employee'
   * @returns {Promise<Object>} Questions data
   */
  async getQuestions(type) {
    if (!['company', 'employee'].includes(type)) {
      throw new Error('Question type must be either "company" or "employee"');
    }

    const url = `${getEndpointUrl('questions')}?type=${type}`;
    return await this.makeRequest(url, { method: 'GET' });
  }

  /**
   * Save survey response
   * @param {Object} responseData - Response data to save
   * @returns {Promise<Object>} Save confirmation
   */
  async saveResponse(responseData) {
    const url = getEndpointUrl('saveResponse');
    
    return await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(responseData)
    });
  }

  /**
   * Get existing response
   * @param {string} type - 'company' or 'employee'
   * @param {string} companyId - Company identifier
   * @param {string} employeeId - Employee identifier (for employee responses)
   * @returns {Promise<Object>} Existing response data
   */
  async getResponse(type, companyId, employeeId = null) {
    let url = `${getEndpointUrl('getResponse')}?type=${type}&company_id=${companyId}`;
    
    if (type === 'employee' && employeeId) {
      url += `&employee_id=${employeeId}`;
    }

    try {
      return await this.makeRequest(url, { method: 'GET' });
    } catch (error) {
      // Return null for 404 (no existing response) instead of throwing
      if (error.message.includes('404') || error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if a company exists in the system
   * @param {string} companyId - Company identifier
   * @returns {Promise<boolean>} Whether company exists
   */
  async checkCompanyExists(companyId) {
    try {
      // Try to get any response for this company (start with company type)
      const companyResponse = await this.getResponse('company', companyId);
      if (companyResponse) return true;

      // If no company response, check if there are any employee responses
      // This is less efficient but more thorough
      const employeeResponse = await this.getResponse('employee', companyId, 'any');
      return !!employeeResponse;
    } catch (error) {
      return false;
    }
  }

  /**
   * Upload file as base64
   * @param {File} file - File to upload
   * @returns {Promise<Object>} File data ready for API
   */
  async prepareFileForUpload(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        // Remove data URL prefix to get just the base64 content
        const base64Content = reader.result.split(',')[1];
        
        resolve({
          filename: file.name,
          content: base64Content,
          content_type: file.type || 'application/octet-stream',
          size: file.size
        });
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @param {number} maxSizeInMB - Maximum file size in MB
   * @returns {Object} Validation result
   */
  validateFile(file, maxSizeInMB = 10) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    // Check file size
    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeInMB}MB limit`
      };
    }

    // Check file type (allow common document and image types)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload PDF, Word, Excel, image, or text files.'
      };
    }

    return { valid: true };
  }

  /**
   * Save response with file uploads
   * @param {Object} responseData - Response data
   * @param {File[]} files - Array of files to upload
   * @returns {Promise<Object>} Save confirmation
   */
  async saveResponseWithFiles(responseData, files = []) {
    try {
      // Validate all files first
      for (const file of files) {
        const validation = this.validateFile(file);
        if (!validation.valid) {
          throw new Error(`File validation failed for ${file.name}: ${validation.error}`);
        }
      }

      // Prepare files for upload
      const preparedFiles = await Promise.all(
        files.map(file => this.prepareFileForUpload(file))
      );

      // Add files to response data
      const dataWithFiles = {
        ...responseData,
        files: preparedFiles
      };

      return await this.saveResponse(dataWithFiles);
      
    } catch (error) {
      console.error('Error preparing files for upload:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Health check for API
   * @returns {Promise<boolean>} API availability
   */
  async healthCheck() {
    try {
      // Try to get company questions as a health check
      await this.getQuestions('company');
      return true;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  /**
   * Test file upload functionality
   * @returns {Promise<boolean>} File upload capability
   */
  async testFileUpload() {
    try {
      // Create a small test file
      const testContent = 'Test file for upload validation';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

      // Validate the test file
      const validation = this.validateFile(testFile, 1); // 1MB limit for test
      return validation.valid;
    } catch (error) {
      console.warn('File upload test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual functions for convenience
export const {
  getQuestions,
  saveResponse,
  getResponse,
  saveResponseWithFiles,
  healthCheck,
  checkCompanyExists,
  validateFile,
  testFileUpload
} = apiService;