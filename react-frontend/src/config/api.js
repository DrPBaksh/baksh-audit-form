// API Configuration
// This will be dynamically updated during deployment

const config = {
  // Default to localhost for development
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  
  // API endpoints
  endpoints: {
    questions: '/questions',
    saveResponse: '/response',
    getResponse: '/response'
  },
  
  // Development mode detection
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // App constants
  app: {
    title: 'DMGT AI & Data Readiness Survey',
    version: '2.0.0',
    description: 'Professional survey platform designed to assess company and employee AI & data readiness for DMGT'
  }
};

// Function to update API URL (called during deployment)
export const updateApiUrl = (newUrl) => {
  config.API_BASE_URL = newUrl;
};

// Function to get full endpoint URL
export const getEndpointUrl = (endpoint) => {
  return `${config.API_BASE_URL}${config.endpoints[endpoint]}`;
};

export default config;
