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
   * Save response with file uploads
   * @param {Object} responseData - Response data
   * @param {File[]} files - Array of files to upload
   * @returns {Promise<Object>} Save confirmation
   */
  async saveResponseWithFiles(responseData, files = []) {
    try {
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
  healthCheck
} = apiService;
