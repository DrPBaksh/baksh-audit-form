/**
 * Main application logic for Baksh Audit Form
 * Enhanced with modern UI features and dark mode support
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
    console.log('🚀 Initializing DMGT AI Survey Platform');
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Check API connectivity
    checkAPIConnection();
    
    // Show welcome screen
    showScreen('welcome');
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyboardEvents);
    
    // Initialize theme toggle
    setupThemeToggle();
    
    console.log('✅ Application initialized with modern UI');
}

/**
 * Initialize dark mode based on saved preference or system preference
 */
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('dmgt-survey-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    if (shouldUseDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Update toggle button state
    updateThemeToggleButton(shouldUseDark);
}

/**
 * Setup theme toggle functionality
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('dmgt-survey-theme', 'light');
        updateThemeToggleButton(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('dmgt-survey-theme', 'dark');
        updateThemeToggleButton(true);
    }
    
    // Add smooth transition effect
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
        document.documentElement.style.transition = '';
    }, 300);
}

/**
 * Update theme toggle button appearance
 */
function updateThemeToggleButton(isDark) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const moonIcon = themeToggle.querySelector('.fa-moon');
    const sunIcon = themeToggle.querySelector('.fa-sun');
    
    if (isDark) {
        if (moonIcon) moonIcon.classList.add('hidden');
        if (sunIcon) sunIcon.classList.remove('hidden');
    } else {
        if (moonIcon) moonIcon.classList.remove('hidden');
        if (sunIcon) sunIcon.classList.add('hidden');
    }
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
 * Show a specific screen with enhanced animations
 * @param {string} screenName - Name of the screen to show
 */
function showScreen(screenName) {
    // Hide all screens with fade out
    Object.values(screens).forEach(screen => {
        if (screen && !screen.classList.contains('hidden')) {
            screen.style.opacity = '0';
            screen.style.transform = 'translateY(20px)';
            setTimeout(() => {
                screen.classList.add('hidden');
                screen.style.opacity = '';
                screen.style.transform = '';
            }, 200);
        }
    });
    
    // Show target screen with fade in
    setTimeout(() => {
        if (screens[screenName]) {
            screens[screenName].classList.remove('hidden');
            screens[screenName].style.opacity = '0';
            screens[screenName].style.transform = 'translateY(20px)';
            
            // Trigger reflow
            screens[screenName].offsetHeight;
            
            // Animate in
            screens[screenName].style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            screens[screenName].style.opacity = '1';
            screens[screenName].style.transform = 'translateY(0)';
            
            setTimeout(() => {
                screens[screenName].style.transition = '';
            }, 400);
            
            currentScreen = screenName;
            
            // Focus management
            focusFirstInput(screenName);
        }
    }, 200);
    
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
            if (firstInput && !isMobileDevice()) {
                firstInput.focus();
            }
        }
    }, 500);
}

/**
 * Detect if device is mobile
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
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
 * Start company assessment with enhanced feedback
 */
function startCompanyAssessment() {
    console.log('🏢 Starting company assessment');
    surveyType = 'company';
    
    // Add button feedback
    const button = event.target;
    if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }
    
    showScreen('companyId');
}

/**
 * Start employee assessment with enhanced feedback
 */
function startEmployeeAssessment() {
    console.log('👤 Starting employee assessment');
    surveyType = 'employee';
    
    // Add button feedback
    const button = event.target;
    if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }
    
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
    
    // Enhanced validation with better feedback
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        showFieldError(input, 'Company ID can only contain letters, numbers, hyphens, and underscores');
        return;
    }
    
    if (id.length < 3) {
        showFieldError(input, 'Company ID must be at least 3 characters long');
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
    } else if (companyIdValue.length < 3) {
        showFieldError(companyInput, 'Company ID must be at least 3 characters long');
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
 * Show field error with enhanced styling
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showFieldError(input, message) {
    // Clear previous error
    clearFieldError(input);
    
    // Add error classes for modern styling
    input.classList.add('border-red-500', 'ring-red-500', 'ring-2');
    input.classList.remove('border-gray-300', 'dark:border-gray-600');
    
    // Create or update error message
    let errorElement = input.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message text-red-600 dark:text-red-400 text-sm mt-2 flex items-center';
        input.parentNode.appendChild(errorElement);
    }
    
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle mr-2"></i>
        <span>${message}</span>
    `;
    errorElement.classList.remove('hidden');
    
    // Focus the input with animation
    input.focus();
    input.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        input.style.animation = '';
    }, 500);
}

/**
 * Clear field error with enhanced styling
 * @param {HTMLElement} input - Input element
 */
function clearFieldError(input) {
    input.classList.remove('border-red-500', 'ring-red-500', 'ring-2');
    input.classList.add('border-gray-300', 'dark:border-gray-600');
    
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.classList.add('hidden');
        errorElement.innerHTML = '';
    }
}

/**
 * Show message to user with enhanced modern styling
 * @param {string} message - Message text
 * @param {string} type - Message type ('error', 'success', 'info', 'warning')
 */
function showMessage(message, type = 'info') {
    // Remove existing message
    const existingMessage = document.getElementById('global-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element with modern styling
    const messageEl = document.createElement('div');
    messageEl.id = 'global-message';
    messageEl.className = `fixed top-4 right-4 max-w-md p-4 rounded-xl shadow-2xl z-50 ${getMessageClasses(type)} transition-all duration-300 transform translate-x-full`;
    
    // Enhanced message content
    messageEl.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                ${getMessageIcon(type)}
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-semibold">${message}</p>
            </div>
            <div class="ml-4 flex-shrink-0">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        class="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors">
                    <span class="sr-only">Close</span>
                    <i class="fas fa-times w-4 h-4"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Animate in
    setTimeout(() => {
        messageEl.classList.remove('translate-x-full');
    }, 10);
    
    // Auto-hide after 7 seconds (unless it's an error)
    if (type !== 'error') {
        setTimeout(() => {
            if (messageEl && messageEl.parentNode) {
                messageEl.classList.add('translate-x-full');
                setTimeout(() => {
                    messageEl.remove();
                }, 300);
            }
        }, 7000);
    }
}

/**
 * Get enhanced message CSS classes based on type
 * @param {string} type - Message type
 * @returns {string} CSS classes
 */
function getMessageClasses(type) {
    switch (type) {
        case 'error':
            return 'bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';
        case 'success':
            return 'bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200';
        case 'warning':
            return 'bg-yellow-50 dark:bg-yellow-900/90 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
        case 'info':
        default:
            return 'bg-blue-50 dark:bg-blue-900/90 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200';
    }
}

/**
 * Get enhanced message icon based on type
 * @param {string} type - Message type
 * @returns {string} Icon HTML
 */
function getMessageIcon(type) {
    const iconClass = "w-5 h-5";
    
    switch (type) {
        case 'error':
            return `<i class="fas fa-exclamation-circle ${iconClass} text-red-500"></i>`;
        case 'success':
            return `<i class="fas fa-check-circle ${iconClass} text-green-500"></i>`;
        case 'warning':
            return `<i class="fas fa-exclamation-triangle ${iconClass} text-yellow-500"></i>`;
        case 'info':
        default:
            return `<i class="fas fa-info-circle ${iconClass} text-blue-500"></i>`;
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
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const savedTheme = localStorage.getItem('dmgt-survey-theme');
        if (!savedTheme) {
            // Only update if user hasn't set a preference
            if (e.matches) {
                document.documentElement.classList.add('dark');
                updateThemeToggleButton(true);
            } else {
                document.documentElement.classList.remove('dark');
                updateThemeToggleButton(false);
            }
        }
    });
}

/**
 * Add CSS for shake animation
 */
function addShakeAnimation() {
    if (!document.getElementById('shake-styles')) {
        const style = document.createElement('style');
        style.id = 'shake-styles';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }
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
    addShakeAnimation();
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
window.toggleDarkMode = toggleDarkMode;

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
        saveDraft,
        toggleDarkMode
    };
}