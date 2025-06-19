/**
 * Main application logic for Baksh Audit Form
 */

// Application state
let currentScreen = 'welcome';
let surveyType = null;
let companyId = null;
let employeeId = null;
let employeeName = null;
let pendingFormData = null; // For handling form exists warning

// Screen elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    companyId: document.getElementById('company-id-screen'),
    employeeId: document.getElementById('employee-id-screen'),
    survey: document.getElementById('survey-screen'),
    success: document.getElementById('success-screen')
};

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('🚀 Initializing Baksh Audit Form');
    
    // Check API connectivity
    checkAPIConnection();
    
    // Show welcome screen
    showScreen('welcome');
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyboardEvents);
    
    console.log('✅ Application initialized');
}

/**
 * Check API connectivity
 */
async function checkAPIConnection() {
    try {
        const isConnected = await window.bakshAPI.checkConnection();
        if (!isConnected) {
            showMessage('Warning: Unable to connect to the server. Some features may not work properly.', 'warning');
        }
    } catch (error) {
        console.warn('API connection check failed:', error);
    }
}

/**
 * Show a specific screen
 * @param {string} screenName - Name of the screen to show
 */
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.add('hidden');
        }
    });
    
    // Show target screen
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.add('fade-in');
        currentScreen = screenName;
        
        // Focus management
        focusFirstInput(screenName);
    }
    
    console.log(`📱 Showing screen: ${screenName}`);
}

/**
 * Focus first input on screen
 * @param {string} screenName - Screen name
 */
function focusFirstInput(screenName) {
    setTimeout(() => {
        const screen = screens[screenName];
        if (screen) {
            const firstInput = screen.querySelector('input, button');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }, 100);
}

/**
 * Handle keyboard events
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardEvents(event) {
    // Enter key handling for forms
    if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
        const form = event.target.closest('form');
        if (!form) {
            // Handle screen-specific enter key actions
            switch (currentScreen) {
                case 'companyId':
                    event.preventDefault();
                    proceedWithCompanyId();
                    break;
                case 'employeeId':
                    event.preventDefault();
                    proceedWithEmployeeInfo();
                    break;
            }
        }
    }
    
    // Escape key to go back
    if (event.key === 'Escape' && currentScreen !== 'welcome') {
        goBack();
    }
}

/**
 * Start company assessment
 */
function startCompanyAssessment() {
    console.log('🏢 Starting company assessment');
    surveyType = 'company';
    showScreen('companyId');
}

/**
 * Start employee assessment
 */
function startEmployeeAssessment() {
    console.log('👤 Starting employee assessment');
    surveyType = 'employee';
    showScreen('employeeId');
}

/**
 * Proceed with company ID
 */
async function proceedWithCompanyId() {
    const input = document.getElementById('company-id-input');
    const id = input.value.trim();
    
    if (!id) {
        showFieldError(input, 'Company ID is required');
        return;
    }
    
    // Validate company ID format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        showFieldError(input, 'Company ID can only contain letters, numbers, hyphens, and underscores');
        return;
    }
    
    companyId = id;
    console.log(`🏢 Company ID set: ${companyId}`);
    
    // Clear any previous error
    clearFieldError(input);
    
    // Check if form already exists
    const existingForm = await checkForExistingForm('company', companyId);
    if (existingForm && existingForm.submitted_at) {
        showFormExistsWarning('company', () => loadSurvey());
        return;
    }
    
    // Load company survey
    loadSurvey();
}

/**
 * Proceed with employee information (Company ID + Employee Name)
 */
async function proceedWithEmployeeInfo() {
    const companyInput = document.getElementById('emp-company-id-input');
    const employeeNameInput = document.getElementById('employee-name-input');
    
    const companyIdValue = companyInput.value.trim();
    const employeeNameValue = employeeNameInput.value.trim();
    
    let hasError = false;
    
    // Validate company ID
    if (!companyIdValue) {
        showFieldError(companyInput, 'Company ID is required');
        hasError = true;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(companyIdValue)) {
        showFieldError(companyInput, 'Company ID can only contain letters, numbers, hyphens, and underscores');
        hasError = true;
    } else {
        clearFieldError(companyInput);
    }
    
    // Validate employee name
    if (!employeeNameValue) {
        showFieldError(employeeNameInput, 'Employee name is required');
        hasError = true;
    } else if (employeeNameValue.length < 2) {
        showFieldError(employeeNameInput, 'Employee name must be at least 2 characters');
        hasError = true;
    } else {
        clearFieldError(employeeNameInput);
    }
    
    if (hasError) {
        return;
    }
    
    companyId = companyIdValue;
    employeeName = employeeNameValue;
    // Convert employee name to a safe ID for storage
    employeeId = employeeNameValue.toLowerCase()
        .replace(/\s+/g, '.')  // Replace spaces with dots
        .replace(/[^a-z0-9._-]/g, ''); // Remove invalid characters
    
    console.log(`👤 Employee assessment: ${employeeName} (${employeeId}) @ ${companyId}`);
    
    // Check if form already exists
    const existingForm = await checkForExistingForm('employee', companyId, employeeId);
    if (existingForm && existingForm.submitted_at) {
        showFormExistsWarning('employee', () => loadSurvey());
        return;
    }
    
    // Load employee survey
    loadSurvey();
}

/**
 * Check for existing form in S3
 * @param {string} type - 'company' or 'employee'
 * @param {string} companyId - Company ID
 * @param {string} employeeId - Employee ID (optional, for employee forms)
 */
async function checkForExistingForm(type, companyId, employeeId = null) {
    try {
        return await window.bakshAPI.getExistingResponse(type, companyId, employeeId);
    } catch (error) {
        console.log('No existing form found or error checking:', error.message);
        return null;
    }
}

/**
 * Show form exists warning modal
 * @param {string} type - 'company' or 'employee'
 * @param {Function} proceedCallback - Function to call if user chooses to proceed
 */
function showFormExistsWarning(type, proceedCallback) {
    const modal = document.getElementById('form-exists-modal');
    const typeSpan = document.getElementById('form-exists-type');
    
    typeSpan.textContent = type === 'company' ? 'company' : 'employee';
    pendingFormData = proceedCallback;
    
    modal.classList.remove('hidden');
}

/**
 * Close form exists modal
 */
function closeFormExistsModal() {
    const modal = document.getElementById('form-exists-modal');
    modal.classList.add('hidden');
    pendingFormData = null;
}

/**
 * Proceed with creating new form (overwrite existing)
 */
function proceedWithNewForm() {
    closeFormExistsModal();
    if (pendingFormData) {
        pendingFormData();
        pendingFormData = null;
    }
}

/**
 * Load existing company form
 */
async function loadExistingCompanyForm() {
    const input = document.getElementById('company-id-input');
    const id = input.value.trim();
    
    if (!id) {
        showFieldError(input, 'Please enter a Company ID first');
        return;
    }
    
    // Validate company ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        showFieldError(input, 'Company ID can only contain letters, numbers, hyphens, and underscores');
        return;
    }
    
    try {
        companyId = id;
        surveyType = 'company';
        clearFieldError(input);
        
        showMessage('Loading existing form...', 'info');
        await loadSurvey();
        
    } catch (error) {
        showMessage(`Failed to load existing form: ${window.bakshAPI.getErrorMessage(error)}`, 'error');
    }
}

/**
 * Load existing employee form
 */
async function loadExistingEmployeeForm() {
    const companyInput = document.getElementById('emp-company-id-input');
    const employeeNameInput = document.getElementById('employee-name-input');
    
    const companyIdValue = companyInput.value.trim();
    const employeeNameValue = employeeNameInput.value.trim();
    
    let hasError = false;
    
    if (!companyIdValue) {
        showFieldError(companyInput, 'Please enter a Company ID first');
        hasError = true;
    }
    
    if (!employeeNameValue) {
        showFieldError(employeeNameInput, 'Please enter an Employee Name first');
        hasError = true;
    }
    
    if (hasError) {
        return;
    }
    
    try {
        companyId = companyIdValue;
        employeeName = employeeNameValue;
        employeeId = employeeNameValue.toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[^a-z0-9._-]/g, '');
        surveyType = 'employee';
        
        clearFieldError(companyInput);
        clearFieldError(employeeNameInput);
        
        showMessage('Loading existing form...', 'info');
        await loadSurvey();
        
    } catch (error) {
        showMessage(`Failed to load existing form: ${window.bakshAPI.getErrorMessage(error)}`, 'error');
    }
}

/**
 * Load survey based on current type and IDs
 */
async function loadSurvey() {
    try {
        showScreen('survey');
        
        // Load survey using survey manager
        await window.surveyManager.loadSurvey(surveyType, companyId, employeeId, employeeName);
        
    } catch (error) {
        console.error('Failed to load survey:', error);
        showMessage(`Failed to load survey: ${window.bakshAPI.getErrorMessage(error)}`, 'error');
        
        // Go back to previous screen
        goBack();
    }
}

/**
 * Go back to previous screen
 */
function goBack() {
    switch (currentScreen) {
        case 'companyId':
        case 'employeeId':
            showScreen('welcome');
            break;
        case 'survey':
            if (surveyType === 'company') {
                showScreen('companyId');
            } else {
                showScreen('employeeId');
            }
            break;
        case 'success':
            showScreen('welcome');
            break;
        default:
            showScreen('welcome');
    }
}

/**
 * Start over - reset application state
 */
function startOver() {
    console.log('🔄 Starting over');
    
    // Reset state
    currentScreen = 'welcome';
    surveyType = null;
    companyId = null;
    employeeId = null;
    employeeName = null;
    pendingFormData = null;
    
    // Clear form inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
        clearFieldError(input);
    });
    
    // Reset survey manager
    if (window.surveyManager) {
        window.surveyManager.currentSurvey = null;
        window.surveyManager.surveyData = null;
        window.surveyManager.currentResponses = {};
        window.surveyManager.uploadedFiles = [];
        window.surveyManager.validationErrors = [];
    }
    
    // Show welcome screen
    showScreen('welcome');
}

/**
 * Save draft - delegate to survey manager
 */
function saveDraft() {
    if (window.surveyManager && window.surveyManager.currentSurvey) {
        window.surveyManager.saveDraft();
    }
}

/**
 * Show field error
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showFieldError(input, message) {
    // Clear previous error
    clearFieldError(input);
    
    // Add error class
    input.classList.add('field-error');
    
    // Create or update error message
    let errorElement = input.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        input.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    // Focus the input
    input.focus();
}

/**
 * Clear field error
 * @param {HTMLElement} input - Input element
 */
function clearFieldError(input) {
    input.classList.remove('field-error');
    
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.classList.add('hidden');
        errorElement.textContent = '';
    }
}

/**
 * Show message to user
 * @param {string} message - Message text
 * @param {string} type - Message type ('error', 'success', 'info', 'warning')
 */
function showMessage(message, type = 'info') {
    // Remove existing message
    const existingMessage = document.getElementById('global-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.id = 'global-message';
    messageEl.className = `fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 slide-in-left ${getMessageClasses(type)}`;
    
    // Message content
    messageEl.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                ${getMessageIcon(type)}
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-4 flex-shrink-0">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none">
                    <span class="sr-only">Close</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Auto-hide after 7 seconds (unless it's an error)
    if (type !== 'error') {
        setTimeout(() => {
            if (messageEl && messageEl.parentNode) {
                messageEl.remove();
            }
        }, 7000);
    }
}

/**
 * Get message CSS classes based on type
 * @param {string} type - Message type
 * @returns {string} CSS classes
 */
function getMessageClasses(type) {
    switch (type) {
        case 'error':
            return 'bg-red-50 border border-red-200 text-red-800';
        case 'success':
            return 'bg-green-50 border border-green-200 text-green-800';
        case 'warning':
            return 'bg-yellow-50 border border-yellow-200 text-yellow-800';
        case 'info':
        default:
            return 'bg-blue-50 border border-blue-200 text-blue-800';
    }
}

/**
 * Get message icon based on type
 * @param {string} type - Message type
 * @returns {string} Icon HTML
 */
function getMessageIcon(type) {
    const iconClass = "h-5 w-5";
    
    switch (type) {
        case 'error':
            return `<svg class="${iconClass} text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>`;
        case 'success':
            return `<svg class="${iconClass} text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>`;
        case 'warning':
            return `<svg class="${iconClass} text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>`;
        case 'info':
        default:
            return `<svg class="${iconClass} text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>`;
    }
}

/**
 * Handle form submissions
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formId = form.id;
    
    switch (formId) {
        case 'survey-questions-form':
            // This is handled by the survey manager
            window.surveyManager.submitSurvey();
            break;
        default:
            console.warn('Unknown form submission:', formId);
    }
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Form submissions
    document.addEventListener('submit', handleFormSubmit);
    
    // Prevent accidental form submissions
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.tagName === 'TEXTAREA') {
            // Allow enter in textareas unless Ctrl+Enter
            if (event.ctrlKey) {
                event.preventDefault();
                const form = event.target.closest('form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            }
        }
    });
    
    // Handle window beforeunload to warn about unsaved changes
    window.addEventListener('beforeunload', (event) => {
        if (window.surveyManager && 
            window.surveyManager.currentSurvey && 
            currentScreen === 'survey') {
            
            const responses = window.surveyManager.collectResponses();
            if (Object.keys(responses).length > 0) {
                event.preventDefault();
                event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return event.returnValue;
            }
        }
    });
}

/**
 * Application cleanup
 */
function cleanup() {
    // Clear any timers
    // Remove event listeners if needed
    // Clear sensitive data
    console.log('🧹 Application cleanup completed');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Cleanup when page is unloaded
window.addEventListener('beforeunload', cleanup);

// Make functions globally available
window.startCompanyAssessment = startCompanyAssessment;
window.startEmployeeAssessment = startEmployeeAssessment;
window.proceedWithCompanyId = proceedWithCompanyId;
window.proceedWithEmployeeInfo = proceedWithEmployeeInfo;
window.loadExistingCompanyForm = loadExistingCompanyForm;
window.loadExistingEmployeeForm = loadExistingEmployeeForm;
window.closeFormExistsModal = closeFormExistsModal;
window.proceedWithNewForm = proceedWithNewForm;
window.goBack = goBack;
window.startOver = startOver;
window.saveDraft = saveDraft;
window.showMessage = showMessage;

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        showScreen,
        startCompanyAssessment,
        startEmployeeAssessment,
        proceedWithCompanyId,
        proceedWithEmployeeInfo,
        goBack,
        startOver,
        saveDraft
    };
}