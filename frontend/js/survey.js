/**
 * Survey form handling functions for Baksh Audit Form
 */

class SurveyManager {
    constructor() {
        this.currentSurvey = null;
        this.surveyData = null;
        this.currentResponses = {};
        this.uploadedFiles = [];
        this.validationErrors = [];
    }

    /**
     * Load and display survey questions
     * @param {string} type - 'company' or 'employee'
     * @param {string} companyId - Company identifier
     * @param {string} employeeId - Employee identifier (for employee surveys)
     */
    async loadSurvey(type, companyId, employeeId = null) {
        try {
            // Show loading indicator
            this.showLoading(true);
            
            // Load questions from API
            this.surveyData = await window.bakshAPI.getQuestions(type);
            
            // Store survey metadata
            this.currentSurvey = {
                type,
                companyId,
                employeeId,
                questions: this.surveyData.questions
            };
            
            // Try to load existing responses
            await this.loadExistingResponses();
            
            // Render the survey
            this.renderSurvey();
            
            // Hide loading indicator
            this.showLoading(false);
            
        } catch (error) {
            this.showError(`Failed to load survey: ${window.bakshAPI.getErrorMessage(error)}`);
            this.showLoading(false);
        }
    }

    /**
     * Render survey questions in the form
     */
    renderSurvey() {
        const surveyForm = document.getElementById('survey-questions-form');
        const surveyTitle = document.getElementById('survey-title');
        const surveySubtitle = document.getElementById('survey-subtitle');
        const progressTotal = document.getElementById('progress-total');
        const fileUploadSection = document.getElementById('file-upload-section');
        
        // Set survey title and subtitle
        if (this.currentSurvey.type === 'company') {
            surveyTitle.textContent = 'Company AI & Data Readiness Assessment';
            surveySubtitle.textContent = `Company ID: ${this.currentSurvey.companyId}`;
            fileUploadSection.classList.add('hidden');
        } else {
            surveyTitle.textContent = 'Employee AI & Data Readiness Assessment';
            surveySubtitle.textContent = `Company: ${this.currentSurvey.companyId} | Employee: ${this.currentSurvey.employeeId}`;
            fileUploadSection.classList.remove('hidden');
        }
        
        // Set progress total
        progressTotal.textContent = this.currentSurvey.questions.length;
        
        // Clear existing form content
        surveyForm.innerHTML = '';
        
        // Group questions by section
        const questionsBySection = this.groupQuestionsBySection(this.currentSurvey.questions);
        
        // Render each section
        Object.keys(questionsBySection).forEach((sectionName, index) => {
            const questions = questionsBySection[sectionName];
            
            // Add section divider (except for first section)
            if (index > 0) {
                const divider = document.createElement('div');
                divider.className = 'section-divider';
                surveyForm.appendChild(divider);
            }
            
            // Add section title
            if (sectionName && sectionName !== 'undefined') {
                const sectionTitle = document.createElement('h3');
                sectionTitle.className = 'section-title';
                sectionTitle.textContent = sectionName;
                surveyForm.appendChild(sectionTitle);
            }
            
            // Render questions in this section
            questions.forEach(question => {
                const questionElement = this.renderQuestion(question);
                surveyForm.appendChild(questionElement);
            });
        });
        
        // Setup form submission
        surveyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitSurvey();
        });
        
        // Setup file upload
        this.setupFileUpload();
        
        // Update progress
        this.updateProgress();
        
        // Show the form
        document.getElementById('survey-form').classList.remove('hidden');
    }

    /**
     * Group questions by section
     * @param {Array} questions - Array of question objects
     * @returns {Object} Questions grouped by section
     */
    groupQuestionsBySection(questions) {
        return questions.reduce((sections, question) => {
            const section = question.section || 'General';
            if (!sections[section]) {
                sections[section] = [];
            }
            sections[section].push(question);
            return sections;
        }, {});
    }

    /**
     * Render a single question
     * @param {Object} question - Question object
     * @returns {HTMLElement} Question element
     */
    renderQuestion(question) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item space-y-3';
        questionDiv.dataset.questionId = question.id;
        
        // Question label
        const label = document.createElement('label');
        label.className = 'block text-sm font-medium text-gray-700';
        label.innerHTML = `
            ${question.text}
            ${question.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
        `;
        questionDiv.appendChild(label);
        
        // Question input based on type
        const inputElement = this.createQuestionInput(question);
        questionDiv.appendChild(inputElement);
        
        // Error message container
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message hidden';
        errorDiv.id = `error-${question.id}`;
        questionDiv.appendChild(errorDiv);
        
        return questionDiv;
    }

    /**
     * Create input element based on question type
     * @param {Object} question - Question object
     * @returns {HTMLElement} Input element
     */
    createQuestionInput(question) {
        const inputContainer = document.createElement('div');
        
        switch (question.type.toLowerCase()) {
            case 'text':
                return this.createTextInput(question);
            case 'textarea':
                return this.createTextareaInput(question);
            case 'radio':
                return this.createRadioInput(question);
            case 'checkbox':
                return this.createCheckboxInput(question);
            case 'select':
                return this.createSelectInput(question);
            default:
                return this.createTextInput(question);
        }
    }

    /**
     * Create text input
     */
    createTextInput(question) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `question-${question.id}`;
        input.name = question.id;
        input.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent form-field';
        input.placeholder = 'Enter your response...';
        
        if (question.required) {
            input.required = true;
        }
        
        // Set existing value
        if (this.currentResponses[question.id]) {
            input.value = this.currentResponses[question.id];
        }
        
        // Add change listener
        input.addEventListener('change', () => this.updateProgress());
        
        return input;
    }

    /**
     * Create textarea input
     */
    createTextareaInput(question) {
        const textarea = document.createElement('textarea');
        textarea.id = `question-${question.id}`;
        textarea.name = question.id;
        textarea.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent form-field';
        textarea.placeholder = 'Enter your detailed response...';
        textarea.rows = 4;
        
        if (question.required) {
            textarea.required = true;
        }
        
        // Set existing value
        if (this.currentResponses[question.id]) {
            textarea.value = this.currentResponses[question.id];
        }
        
        // Add change listener
        textarea.addEventListener('change', () => this.updateProgress());
        
        return textarea;
    }

    /**
     * Create radio input
     */
    createRadioInput(question) {
        const container = document.createElement('div');
        container.className = 'space-y-2';
        
        question.options.forEach((option, index) => {
            const radioContainer = document.createElement('label');
            radioContainer.className = 'custom-radio';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.id = `question-${question.id}-${index}`;
            input.name = question.id;
            input.value = option;
            
            if (question.required) {
                input.required = true;
            }
            
            // Set existing value
            if (this.currentResponses[question.id] === option) {
                input.checked = true;
            }
            
            // Add change listener
            input.addEventListener('change', () => this.updateProgress());
            
            const radioMark = document.createElement('span');
            radioMark.className = 'radio-mark';
            
            const text = document.createElement('span');
            text.textContent = option;
            
            radioContainer.appendChild(input);
            radioContainer.appendChild(radioMark);
            radioContainer.appendChild(text);
            
            container.appendChild(radioContainer);
        });
        
        return container;
    }

    /**
     * Create checkbox input
     */
    createCheckboxInput(question) {
        const container = document.createElement('div');
        container.className = 'space-y-2';
        
        question.options.forEach((option, index) => {
            const checkboxContainer = document.createElement('label');
            checkboxContainer.className = 'custom-checkbox flex items-center py-2 px-3 rounded border border-gray-200 hover:bg-gray-50';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `question-${question.id}-${index}`;
            input.name = `${question.id}[]`;
            input.value = option;
            
            // Set existing values
            const existingValues = this.currentResponses[question.id];
            if (Array.isArray(existingValues) && existingValues.includes(option)) {
                input.checked = true;
            }
            
            // Add change listener
            input.addEventListener('change', () => this.updateProgress());
            
            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark mr-3';
            
            const text = document.createElement('span');
            text.textContent = option;
            
            checkboxContainer.appendChild(input);
            checkboxContainer.appendChild(checkmark);
            checkboxContainer.appendChild(text);
            
            container.appendChild(checkboxContainer);
        });
        
        return container;
    }

    /**
     * Create select input
     */
    createSelectInput(question) {
        const select = document.createElement('select');
        select.id = `question-${question.id}`;
        select.name = question.id;
        select.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent form-field';
        
        if (question.required) {
            select.required = true;
        }
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select an option...';
        select.appendChild(defaultOption);
        
        // Add options
        question.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            
            // Set existing value
            if (this.currentResponses[question.id] === option) {
                optionElement.selected = true;
            }
            
            select.appendChild(optionElement);
        });
        
        // Add change listener
        select.addEventListener('change', () => this.updateProgress());
        
        return select;
    }

    /**
     * Setup file upload functionality
     */
    setupFileUpload() {
        const fileInput = document.getElementById('file-input');
        const fileList = document.getElementById('file-list');
        
        if (!fileInput) return;
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });
        
        // Setup drag and drop
        const uploadSection = document.getElementById('file-upload-section');
        if (uploadSection) {
            uploadSection.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadSection.classList.add('dragover');
            });
            
            uploadSection.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadSection.classList.remove('dragover');
            });
            
            uploadSection.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadSection.classList.remove('dragover');
                this.handleFileSelection(e.dataTransfer.files);
            });
        }
    }

    /**
     * Handle file selection
     * @param {FileList} files - Selected files
     */
    handleFileSelection(files) {
        const fileList = document.getElementById('file-list');
        
        Array.from(files).forEach(file => {
            // Check if file already exists
            if (this.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
                return;
            }
            
            // Add to uploaded files list
            this.uploadedFiles.push(file);
            
            // Create file item element
            const fileItem = this.createFileItem(file);
            fileList.appendChild(fileItem);
        });
        
        // Clear the input
        document.getElementById('file-input').value = '';
    }

    /**
     * Create file item element
     * @param {File} file - File object
     * @returns {HTMLElement} File item element
     */
    createFileItem(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const sizeText = this.formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">📄</div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${sizeText}</div>
                </div>
            </div>
            <button type="button" class="remove-file" onclick="surveyManager.removeFile('${file.name}', ${file.size})">
                ❌
            </button>
        `;
        
        return fileItem;
    }

    /**
     * Remove uploaded file
     * @param {string} fileName - File name
     * @param {number} fileSize - File size
     */
    removeFile(fileName, fileSize) {
        // Remove from uploaded files array
        this.uploadedFiles = this.uploadedFiles.filter(f => 
            !(f.name === fileName && f.size === fileSize)
        );
        
        // Remove from DOM
        const fileList = document.getElementById('file-list');
        const fileItems = fileList.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            const nameElement = item.querySelector('.file-name');
            const sizeElement = item.querySelector('.file-size');
            if (nameElement && nameElement.textContent === fileName &&
                sizeElement && sizeElement.textContent === this.formatFileSize(fileSize)) {
                item.remove();
            }
        });
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Update progress indicator
     */
    updateProgress() {
        const form = document.getElementById('survey-questions-form');
        const progressCurrent = document.getElementById('progress-current');
        const progressBar = document.getElementById('progress-bar');
        
        if (!form) return;
        
        // Count answered questions
        let answeredCount = 0;
        const totalQuestions = this.currentSurvey.questions.length;
        
        this.currentSurvey.questions.forEach(question => {
            const value = this.getQuestionValue(question);
            if (value !== null && value !== '' && value !== []) {
                answeredCount++;
            }
        });
        
        // Update progress display
        progressCurrent.textContent = answeredCount;
        const percentage = (answeredCount / totalQuestions) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    /**
     * Get value for a question
     * @param {Object} question - Question object
     * @returns {any} Question value
     */
    getQuestionValue(question) {
        const form = document.getElementById('survey-questions-form');
        
        switch (question.type.toLowerCase()) {
            case 'checkbox':
                const checkboxes = form.querySelectorAll(`input[name="${question.id}[]"]:checked`);
                return Array.from(checkboxes).map(cb => cb.value);
            
            case 'radio':
                const radio = form.querySelector(`input[name="${question.id}"]:checked`);
                return radio ? radio.value : null;
            
            default:
                const input = form.querySelector(`[name="${question.id}"]`);
                return input ? input.value.trim() : null;
        }
    }

    /**
     * Collect all form responses
     * @returns {Object} Form responses
     */
    collectResponses() {
        const responses = {};
        
        this.currentSurvey.questions.forEach(question => {
            const value = this.getQuestionValue(question);
            if (value !== null && value !== '') {
                responses[question.id] = value;
            }
        });
        
        return responses;
    }

    /**
     * Validate form responses
     * @returns {boolean} True if valid
     */
    validateForm() {
        this.validationErrors = [];
        
        // Clear previous error displays
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });
        document.querySelectorAll('.field-error').forEach(el => {
            el.classList.remove('field-error');
        });
        
        // Validate required fields
        this.currentSurvey.questions.forEach(question => {
            if (question.required) {
                const value = this.getQuestionValue(question);
                
                if (value === null || value === '' || 
                    (Array.isArray(value) && value.length === 0)) {
                    
                    this.validationErrors.push({
                        questionId: question.id,
                        message: 'This field is required'
                    });
                    
                    // Show error in UI
                    this.showFieldError(question.id, 'This field is required');
                }
            }
        });
        
        return this.validationErrors.length === 0;
    }

    /**
     * Show field error
     * @param {string} questionId - Question ID
     * @param {string} message - Error message
     */
    showFieldError(questionId, message) {
        const errorElement = document.getElementById(`error-${questionId}`);
        const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
        const inputElement = questionElement?.querySelector('input, textarea, select');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        
        if (inputElement) {
            inputElement.classList.add('field-error');
        }
    }

    /**
     * Submit survey
     */
    async submitSurvey() {
        try {
            // Validate form
            if (!this.validateForm()) {
                this.showError('Please correct the errors below before submitting.');
                return;
            }
            
            // Disable submit button
            const submitButton = document.getElementById('submit-button');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            
            // Collect responses
            const responses = this.collectResponses();
            
            // Prepare submission data
            const submissionData = {
                type: this.currentSurvey.type,
                company_id: this.currentSurvey.companyId,
                responses: responses
            };
            
            if (this.currentSurvey.employeeId) {
                submissionData.employee_id = this.currentSurvey.employeeId;
            }
            
            // Process file uploads for employee surveys
            if (this.currentSurvey.type === 'employee' && this.uploadedFiles.length > 0) {
                try {
                    const files = await window.bakshAPI.convertFilesToBase64(this.uploadedFiles);
                    submissionData.files = files;
                } catch (error) {
                    throw new Error(`File upload error: ${error.message}`);
                }
            }
            
            // Submit to API
            const result = await window.bakshAPI.saveResponse(submissionData);
            
            // Show success
            this.showSuccess();
            
        } catch (error) {
            this.showError(`Submission failed: ${window.bakshAPI.getErrorMessage(error)}`);
            
            // Re-enable submit button
            const submitButton = document.getElementById('submit-button');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    /**
     * Save draft responses
     */
    async saveDraft() {
        try {
            const responses = this.collectResponses();
            
            // Store in localStorage for now
            const draftKey = `baksh-survey-draft-${this.currentSurvey.type}-${this.currentSurvey.companyId}`;
            if (this.currentSurvey.employeeId) {
                draftKey += `-${this.currentSurvey.employeeId}`;
            }
            
            localStorage.setItem(draftKey, JSON.stringify({
                responses,
                savedAt: new Date().toISOString()
            }));
            
            // Show feedback
            this.showMessage('Draft saved successfully!', 'success');
            
        } catch (error) {
            this.showError('Failed to save draft');
        }
    }

    /**
     * Load existing responses
     */
    async loadExistingResponses() {
        // Try to load from localStorage first (draft)
        const draftKey = `baksh-survey-draft-${this.currentSurvey.type}-${this.currentSurvey.companyId}`;
        if (this.currentSurvey.employeeId) {
            draftKey += `-${this.currentSurvey.employeeId}`;
        }
        
        const draftData = localStorage.getItem(draftKey);
        if (draftData) {
            try {
                const draft = JSON.parse(draftData);
                this.currentResponses = draft.responses || {};
                console.log('Loaded draft responses:', this.currentResponses);
            } catch (error) {
                console.warn('Failed to parse draft data:', error);
            }
        }
    }

    /**
     * Show loading indicator
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.classList.toggle('hidden', !show);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show success screen
     */
    showSuccess() {
        // Hide survey screen
        document.getElementById('survey-screen').classList.add('hidden');
        
        // Show success screen
        document.getElementById('success-screen').classList.remove('hidden');
        
        // Clear draft data
        const draftKey = `baksh-survey-draft-${this.currentSurvey.type}-${this.currentSurvey.companyId}`;
        if (this.currentSurvey.employeeId) {
            draftKey += `-${this.currentSurvey.employeeId}`;
        }
        localStorage.removeItem(draftKey);
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type ('error', 'success', 'info')
     */
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('message-display');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message-display';
            messageEl.className = 'fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50';
            document.body.appendChild(messageEl);
        }
        
        // Set message content and style
        messageEl.textContent = message;
        messageEl.className = `fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
        }`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageEl && messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
}

// Create global survey manager instance
window.surveyManager = new SurveyManager();