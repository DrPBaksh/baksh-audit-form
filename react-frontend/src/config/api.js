// API Configuration
export const API_CONFIG = {
  // Default configuration - can be overridden by environment variables
  API_URL: process.env.REACT_APP_API_URL || 'https://23k1arzku5.execute-api.eu-west-2.amazonaws.com/dev',
  TIMEOUT: 30000, // 30 seconds
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'],
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// API Endpoints
export const ENDPOINTS = {
  QUESTIONS: '/questions',
  RESPONSES: '/responses',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later or contact support if the problem persists.',
  NOT_FOUND: 'The requested resource was not found. Please refresh the page and try again.',
  FILE_TOO_LARGE: 'The uploaded files are too large. Please reduce file sizes and try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};