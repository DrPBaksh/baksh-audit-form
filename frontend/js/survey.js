/**
 * Survey form handling functions for Baksh Audit Form
 * Enhanced with modern UI components and better space utilization
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
     */
    async loadSurvey(type, companyId, employeeId = null, employeeName = null) {
        try {
            this.showLoading(true);
            this.surveyData = await window.bakshAPI.getQuestions(type);
            
            this.currentSurvey = {
                type, companyId, employeeId, employeeName,
                questions: this.surveyData.questions
            };
            
            await this.loadExistingResponses();
            this.renderSurvey();
            this.showLoading(false);
            
        } catch (error) {
            this.showError(`Failed to load survey: ${window.bakshAPI.getErrorMessage(error)}`);
            this.showLoading(false);
        }
    }

    /**
     * Render survey with modern styling
     */
    renderSurvey() {
        const surveyForm = document.getElementById('survey-questions-form');
        const surveyTitle = document.getElementById('survey-title');
        const surveySubtitle = document.getElementById('survey-subtitle');
        const progressTotal = document.getElementById('progress-total');
        const fileUploadSection = document.getElementById('file-upload-section');
        
        // Set enhanced titles
        if (this.currentSurvey.type === 'company') {
            surveyTitle.innerHTML = `<i class="fas fa-building text-primary-600 dark:text-primary-400 mr-3"></i>Company AI & Data Readiness Assessment`;
            surveySubtitle.innerHTML = `<div class="flex items-center space-x-2"><i class="fas fa-id-card text-gray-500 dark:text-gray-400"></i><span>Company ID: <strong>${this.currentSurvey.companyId}</strong></span></div>`;
            fileUploadSection.classList.add('hidden');
        } else {
            surveyTitle.innerHTML = `<i class="fas fa-users text-accent-600 dark:text-accent-400 mr-3"></i>Individual AI & Data Readiness Assessment`;
            surveySubtitle.innerHTML = `<div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0"><div class="flex items-center space-x-2"><i class="fas fa-building text-gray-500 dark:text-gray-400"></i><span>Company: <strong>${this.currentSurvey.companyId}</strong></span></div><div class="flex items-center space-x-2"><i class="fas fa-user text-gray-500 dark:text-gray-400"></i><span>Employee: <strong>${this.currentSurvey.employeeName || this.currentSurvey.employeeId}</strong></span></div></div>`;
            fileUploadSection.classList.remove('hidden');
        }
        
        progressTotal.textContent = this.currentSurvey.questions.length;
        surveyForm.innerHTML = '';
        
        const questionsBySection = this.groupQuestionsBySection(this.currentSurvey.questions);
        
        Object.keys(questionsBySection).forEach((sectionName, index) => {
            const questions = questionsBySection[sectionName];
            const sectionElement = this.createSection(sectionName, questions, index);
            surveyForm.appendChild(sectionElement);
        });
        
        surveyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitSurvey();
        });
        
        this.setupFileUpload();
        this.updateProgress();
        document.getElementById('survey-form').classList.remove('hidden');
        
        if (Object.keys(this.currentResponses).length > 0) {
            this.showMessage('Loaded existing form responses!', 'success');
        }
    }

    createSection(sectionName, questions, index) {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'survey-section mb-8 sm:mb-12';
        
        if (sectionName && sectionName !== 'undefined') {
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header mb-6 sm:mb-8';
            
            const sectionIcon = this.getSectionIcon(sectionName);
            
            sectionHeader.innerHTML = `
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                        <i class="${sectionIcon} text-white text-sm"></i>
                    </div>
                    <h3 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">${sectionName}</h3>
                    <div class="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 ml-11">${this.getSectionDescription(sectionName)}</p>
            `;
            
            sectionElement.appendChild(sectionHeader);
        }
        
        const questionsContainer = document.createElement('div');
        questionsContainer.className = 'questions-container space-y-6 sm:space-y-8';
        
        questions.forEach((question, qIndex) => {
            const questionElement = this.renderQuestion(question, qIndex);
            questionsContainer.appendChild(questionElement);
        });
        
        sectionElement.appendChild(questionsContainer);
        return sectionElement;
    }

    getSectionIcon(sectionName) {
        const iconMap = {
            'Company Information': 'fas fa-building', 'Personal Information': 'fas fa-user',
            'Digital Maturity': 'fas fa-chart-line', 'AI Strategy & Leadership': 'fas fa-chess-king',
            'Technology Familiarity': 'fas fa-laptop', 'Current AI Usage': 'fas fa-robot',
            'Data Governance & Quality': 'fas fa-database', 'Technology Infrastructure': 'fas fa-server',
            'Workforce Readiness': 'fas fa-users', 'Risk Management': 'fas fa-shield-alt',
            'Strategic Objectives': 'fas fa-target', 'Current Initiatives': 'fas fa-rocket',
            'Future Planning': 'fas fa-road', 'Performance Metrics': 'fas fa-chart-bar',
            'Data Culture': 'fas fa-brain', 'Security & Privacy': 'fas fa-lock',
            'Implementation Timeline': 'fas fa-calendar', 'AI Attitudes': 'fas fa-heart',
            'AI Confidence': 'fas fa-thumbs-up', 'Work Applications': 'fas fa-briefcase',
            'Learning Preferences': 'fas fa-graduation-cap', 'AI Concerns': 'fas fa-exclamation-triangle',
            'Management Support': 'fas fa-user-tie', 'Training Availability': 'fas fa-chalkboard-teacher',
            'Learning Investment': 'fas fa-clock', 'Training Preferences': 'fas fa-book',
            'Training Needs': 'fas fa-tools', 'Future Outlook': 'fas fa-crystal-ball',
            'Adoption Factors': 'fas fa-puzzle-piece', 'Data Challenges': 'fas fa-exclamation-circle',
            'Data-Driven Decisions': 'fas fa-chart-pie', 'Support Needs': 'fas fa-hands-helping',
            'Communication Preferences': 'fas fa-comments', 'Job Impact': 'fas fa-smile',
            'Advocacy': 'fas fa-megaphone', 'Feature Requests': 'fas fa-magic',
            'Success Metrics': 'fas fa-medal', 'Automation Preference': 'fas fa-cogs',
            'Additional Feedback': 'fas fa-comment-dots'
        };
        return iconMap[sectionName] || 'fas fa-question-circle';
    }

    getSectionDescription(sectionName) {
        const descriptions = {
            'Company Information': 'Basic information about your organization',
            'Personal Information': 'Your role and background information',
            'Digital Maturity': 'Current state of digital transformation',
            'AI Strategy & Leadership': 'Strategic approach to AI adoption',
            'Technology Familiarity': 'Your comfort level with technology',
            'Current AI Usage': 'How you currently use AI tools',
            'Data Governance & Quality': 'Data management and quality practices',
            'Technology Infrastructure': 'Technical capabilities and platforms',
            'Workforce Readiness': 'Employee skills and training',
            'Risk Management': 'Risk assessment and mitigation strategies'
        };
        return descriptions[sectionName] || 'Please provide your responses for this section';
    }

    groupQuestionsBySection(questions) {
        return questions.reduce((sections, question) => {
            const section = question.section || 'General';
            if (!sections[section]) sections[section] = [];
            sections[section].push(question);
            return sections;
        }, {});
    }

    renderQuestion(question, index = 0) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md';
        questionDiv.dataset.questionId = question.id;
        
        const questionHeader = document.createElement('div');
        questionHeader.className = 'question-header mb-4 flex items-start space-x-3';
        
        const questionNumber = document.createElement('div');
        questionNumber.className = 'inline-flex items-center justify-center w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold flex-shrink-0 mt-1';
        questionNumber.textContent = index + 1;
        
        const questionText = document.createElement('div');
        questionText.className = 'flex-1';
        
        const label = document.createElement('label');
        label.className = 'block text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed';
        label.innerHTML = `${question.text}${question.required ? '<span class="text-red-500 ml-1 text-lg">*</span>' : ''}`;
        
        questionText.appendChild(label);
        questionHeader.appendChild(questionNumber);
        questionHeader.appendChild(questionText);
        questionDiv.appendChild(questionHeader);
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'question-input mt-4';
        const inputElement = this.createQuestionInput(question);
        inputContainer.appendChild(inputElement);
        questionDiv.appendChild(inputContainer);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message hidden mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center';
        errorDiv.id = `error-${question.id}`;
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i><span></span>';
        questionDiv.appendChild(errorDiv);
        
        return questionDiv;
    }

    createQuestionInput(question) {
        switch (question.type.toLowerCase()) {
            case 'text': return this.createTextInput(question);
            case 'textarea': return this.createTextareaInput(question);
            case 'radio': return this.createRadioInput(question);
            case 'checkbox': return this.createCheckboxInput(question);
            case 'select': return this.createSelectInput(question);
            default: return this.createTextInput(question);
        }
    }

    createTextInput(question) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `question-${question.id}`;
        input.name = question.id;
        input.className = 'form-input w-full';
        input.placeholder = 'Enter your response...';
        
        if (question.required) input.required = true;
        if (this.currentResponses[question.id]) input.value = this.currentResponses[question.id];
        
        input.addEventListener('change', () => this.updateProgress());
        input.addEventListener('input', () => this.updateProgress());
        
        return input;
    }

    createTextareaInput(question) {
        const textarea = document.createElement('textarea');
        textarea.id = `question-${question.id}`;
        textarea.name = question.id;
        textarea.className = 'form-input w-full';
        textarea.placeholder = 'Enter your detailed response...';
        textarea.rows = 4;
        
        if (question.required) textarea.required = true;
        if (this.currentResponses[question.id]) textarea.value = this.currentResponses[question.id];
        
        textarea.addEventListener('change', () => this.updateProgress());
        textarea.addEventListener('input', () => this.updateProgress());
        
        return textarea;
    }

    createRadioInput(question) {
        const container = document.createElement('div');
        container.className = 'space-y-3';
        
        question.options.forEach((option, index) => {
            const radioContainer = document.createElement('label');
            radioContainer.className = 'radio-option group flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.id = `question-${question.id}-${index}`;
            input.name = question.id;
            input.value = option;
            input.className = 'hidden';
            
            if (question.required) input.required = true;
            
            if (this.currentResponses[question.id] === option) {
                input.checked = true;
                radioContainer.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
            }
            
            input.addEventListener('change', () => {
                container.querySelectorAll('.radio-option').forEach(opt => {
                    opt.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
                });
                if (input.checked) {
                    radioContainer.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
                }
                this.updateProgress();
            });
            
            const radioVisual = document.createElement('div');
            radioVisual.className = 'flex-shrink-0 w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full mr-3 flex items-center justify-center group-hover:border-primary-400 transition-colors';
            
            const radioInner = document.createElement('div');
            radioInner.className = 'w-2.5 h-2.5 bg-primary-600 rounded-full hidden';
            radioVisual.appendChild(radioInner);
            
            if (input.checked) {
                radioInner.classList.remove('hidden');
                radioVisual.classList.add('border-primary-600');
            }
            
            input.addEventListener('change', () => {
                container.querySelectorAll('.radio-option').forEach(opt => {
                    const visual = opt.querySelector('div div');
                    const border = opt.querySelector('div');
                    visual.classList.add('hidden');
                    border.classList.remove('border-primary-600');
                });
                if (input.checked) {
                    radioInner.classList.remove('hidden');
                    radioVisual.classList.add('border-primary-600');
                }
            });
            
            const text = document.createElement('span');
            text.className = 'text-gray-700 dark:text-gray-300 leading-relaxed';
            text.textContent = option;
            
            radioContainer.appendChild(input);
            radioContainer.appendChild(radioVisual);
            radioContainer.appendChild(text);
            container.appendChild(radioContainer);
        });
        
        return container;
    }

    createCheckboxInput(question) {
        const container = document.createElement('div');
        container.className = 'space-y-3';
        
        question.options.forEach((option, index) => {
            const checkboxContainer = document.createElement('label');
            checkboxContainer.className = 'checkbox-option group flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `question-${question.id}-${index}`;
            input.name = `${question.id}[]`;
            input.value = option;
            input.className = 'hidden';
            
            const existingValues = this.currentResponses[question.id];
            if (Array.isArray(existingValues) && existingValues.includes(option)) {
                input.checked = true;
                checkboxContainer.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
            }
            
            input.addEventListener('change', () => {
                if (input.checked) {
                    checkboxContainer.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
                } else {
                    checkboxContainer.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
                }
                this.updateProgress();
            });
            
            const checkboxVisual = document.createElement('div');
            checkboxVisual.className = 'flex-shrink-0 w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded mr-3 flex items-center justify-center group-hover:border-primary-400 transition-colors';
            
            const checkmark = document.createElement('i');
            checkmark.className = 'fas fa-check text-white text-xs hidden';
            checkboxVisual.appendChild(checkmark);
            
            if (input.checked) {
                checkmark.classList.remove('hidden');
                checkboxVisual.classList.add('bg-primary-600', 'border-primary-600');
            }
            
            input.addEventListener('change', () => {
                if (input.checked) {
                    checkmark.classList.remove('hidden');
                    checkboxVisual.classList.add('bg-primary-600', 'border-primary-600');
                } else {
                    checkmark.classList.add('hidden');
                    checkboxVisual.classList.remove('bg-primary-600', 'border-primary-600');
                }
            });
            
            const text = document.createElement('span');
            text.className = 'text-gray-700 dark:text-gray-300 leading-relaxed';
            text.textContent = option;
            
            checkboxContainer.appendChild(input);
            checkboxContainer.appendChild(checkboxVisual);
            checkboxContainer.appendChild(text);
            container.appendChild(checkboxContainer);
        });
        
        return container;
    }

    createSelectInput(question) {
        const select = document.createElement('select');
        select.id = `question-${question.id}`;
        select.name = question.id;
        select.className = 'form-input w-full';
        
        if (question.required) select.required = true;
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select an option...';
        select.appendChild(defaultOption);
        
        question.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            
            if (this.currentResponses[question.id] === option) {
                optionElement.selected = true;
            }
            
            select.appendChild(optionElement);
        });
        
        select.addEventListener('change', () => this.updateProgress());
        return select;
    }

    // Continue with utility methods
    setupFileUpload() {
        const fileInput =