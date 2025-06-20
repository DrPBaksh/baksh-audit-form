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
     * Render survey with modern styling and improved layout
     */
    renderSurvey() {
        const surveyForm = document.getElementById('survey-questions-form');
        const surveyTitle = document.getElementById('survey-title');
        const surveySubtitle = document.getElementById('survey-subtitle');
        const progressTotal = document.getElementById('progress-total');
        const fileUploadSection = document.getElementById('file-upload-section');
        
        // Set enhanced titles with better spacing
        if (this.currentSurvey.type === 'company') {
            surveyTitle.innerHTML = `<i class="fas fa-building text-primary-600 dark:text-primary-400 mr-3"></i>Company AI & Data Readiness Assessment`;
            surveySubtitle.innerHTML = `<div class="flex items-center space-x-2 text-base"><i class="fas fa-id-card text-gray-500 dark:text-gray-400"></i><span>Company ID: <strong class="text-primary-600 dark:text-primary-400">${this.currentSurvey.companyId}</strong></span></div>`;
            fileUploadSection.classList.add('hidden');
        } else {
            surveyTitle.innerHTML = `<i class="fas fa-users text-accent-600 dark:text-accent-400 mr-3"></i>Individual AI & Data Readiness Assessment`;
            surveySubtitle.innerHTML = `<div class="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-base"><div class="flex items-center space-x-2"><i class="fas fa-building text-gray-500 dark:text-gray-400"></i><span>Company: <strong class="text-primary-600 dark:text-primary-400">${this.currentSurvey.companyId}</strong></span></div><div class="flex items-center space-x-2"><i class="fas fa-user text-gray-500 dark:text-gray-400"></i><span>Employee: <strong class="text-accent-600 dark:text-accent-400">${this.currentSurvey.employeeName || this.currentSurvey.employeeId}</strong></span></div></div>`;
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
            this.showMessage('✅ Loaded existing form responses!', 'success');
        }
    }

    createSection(sectionName, questions, index) {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'survey-section mb-10 sm:mb-12';
        
        if (sectionName && sectionName !== 'undefined') {
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header mb-8';
            
            const sectionIcon = this.getSectionIcon(sectionName);
            
            sectionHeader.innerHTML = `
                <div class="flex items-center space-x-4 mb-4">
                    <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                        <i class="${sectionIcon} text-white text-lg"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">${sectionName}</h3>
                        <div class="h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mt-2"></div>
                    </div>
                </div>
                <p class="text-gray-600 dark:text-gray-400 ml-14 text-lg leading-relaxed">${this.getSectionDescription(sectionName)}</p>
            `;
            
            sectionElement.appendChild(sectionHeader);
        }
        
        const questionsContainer = document.createElement('div');
        questionsContainer.className = 'questions-container space-y-8 sm:space-y-10';
        
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
            'Company Information': 'Basic information about your organization and current technology landscape',
            'Personal Information': 'Your role, background, and experience with technology',
            'Digital Maturity': 'Current state of digital transformation and technology adoption',
            'AI Strategy & Leadership': 'Strategic approach to AI adoption and organizational leadership',
            'Technology Familiarity': 'Your comfort level and experience with various technologies',
            'Current AI Usage': 'How you currently use AI tools and technologies in your work',
            'Data Governance & Quality': 'Data management practices, quality control, and governance frameworks',
            'Technology Infrastructure': 'Technical capabilities, platforms, and infrastructure readiness',
            'Workforce Readiness': 'Employee skills, training programs, and organizational capacity',
            'Risk Management': 'Risk assessment strategies and mitigation approaches for AI adoption'
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
        questionDiv.className = 'question-item bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-8 transition-all duration-300 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600';
        questionDiv.dataset.questionId = question.id;
        
        const questionHeader = document.createElement('div');
        questionHeader.className = 'question-header mb-6 flex items-start space-x-4';
        
        const questionNumber = document.createElement('div');
        questionNumber.className = 'inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-xl text-sm font-bold flex-shrink-0 mt-1 shadow-md';
        questionNumber.textContent = index + 1;
        
        const questionText = document.createElement('div');
        questionText.className = 'flex-1';
        
        const label = document.createElement('label');
        label.className = 'block text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-relaxed';
        label.innerHTML = `${question.text}${question.required ? '<span class="text-red-500 ml-2 text-xl">*</span>' : ''}`;
        
        questionText.appendChild(label);
        questionHeader.appendChild(questionNumber);
        questionHeader.appendChild(questionText);
        questionDiv.appendChild(questionHeader);
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'question-input mt-6';
        const inputElement = this.createQuestionInput(question);
        inputContainer.appendChild(inputElement);
        questionDiv.appendChild(inputContainer);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message hidden mt-4 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r-lg text-red-700 dark:text-red-300 text-sm flex items-center';
        errorDiv.id = `error-${question.id}`;
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-3 text-lg"></i><span></span>';
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
        input.className = 'form-input w-full px-4 py-4 text-lg';
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
        textarea.className = 'form-input w-full px-4 py-4 text-lg resize-y';
        textarea.placeholder = 'Enter your detailed response...';
        textarea.rows = 5;
        
        if (question.required) textarea.required = true;
        if (this.currentResponses[question.id]) textarea.value = this.currentResponses[question.id];
        
        textarea.addEventListener('change', () => this.updateProgress());
        textarea.addEventListener('input', () => this.updateProgress());
        
        return textarea;
    }

    createRadioInput(question) {
        const container = document.createElement('div');
        container.className = 'space-y-4';
        
        question.options.forEach((option, index) => {
            const radioContainer = document.createElement('label');
            radioContainer.className = 'radio-option group flex items-start p-5 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-md';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.id = `question-${question.id}-${index}`;
            input.name = question.id;
            input.value = option;
            input.className = 'hidden';
            
            if (question.required) input.required = true;
            
            if (this.currentResponses[question.id] === option) {
                input.checked = true;
                radioContainer.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'shadow-md');
            }
            
            input.addEventListener('change', () => {
                container.querySelectorAll('.radio-option').forEach(opt => {
                    opt.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'shadow-md');
                });
                if (input.checked) {
                    radioContainer.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'shadow-md');
                }
                this.updateProgress();
            });
            
            const radioVisual = document.createElement('div');
            radioVisual.className = 'flex-shrink-0 w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full mr-4 flex items-center justify-center group-hover:border-primary-400 transition-colors';
            
            const radioInner = document.createElement('div');
            radioInner.className = 'w-3 h-3 bg-primary-600 rounded-full hidden';
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
            text.className = 'text-gray-700 dark:text-gray-300 leading-relaxed text-lg';
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
        container.className = 'space-y-4';
        
        question.options.forEach((option, index) => {
            const checkboxContainer = document.createElement('label');
            checkboxContainer.className = 'checkbox-option group flex items-start p-5 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-md';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `question-${question.id}-${index}`;
            input.name = `${question.id}[]`;
            input.value = option;
            input.className = 'hidden';
            
            const existingValues = this.currentResponses[question.id];
            if (Array.isArray(existingValues) && existingValues.includes(option)) {
                input.checked = true;
                checkboxContainer.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'shadow-md');
            }
            
            input.addEventListener('change', () => {
                if (input.checked) {
                    checkboxContainer.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'shadow-md');
                } else {
                    checkboxContainer.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'shadow-md');
                }
                this.updateProgress();
            });
            
            const checkboxVisual = document.createElement('div');
            checkboxVisual.className = 'flex-shrink-0 w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-md mr-4 flex items-center justify-center group-hover:border-primary-400 transition-colors';
            
            const checkmark = document.createElement('i');
            checkmark.className = 'fas fa-check text-white text-sm hidden';
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
            text.className = 'text-gray-700 dark:text-gray-300 leading-relaxed text-lg';
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
        select.className = 'form-input w-full px-4 py-4 text-lg';
        
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

    /**
     * Setup enhanced file upload functionality with better UX
     */
    setupFileUpload() {
        const fileInput = document.getElementById('file-input');
        const fileList = document.getElementById('file-list');
        
        if (!fileInput || !fileList) return;
        
        // Clear any existing files
        this.uploadedFiles = [];
        fileList.innerHTML = '';
        
        fileInput.addEventListener('change', (event) => {
            const files = Array.from(event.target.files);
            
            if (files.length === 0) return;
            
            console.log(`📁 Processing ${files.length} selected files`);
            
            let processedCount = 0;
            let errorCount = 0;
            
            files.forEach(file => {
                // Validate file
                const validation = window.bakshAPI.validateFile(file);
                if (!validation.valid) {
                    this.showMessage(`❌ ${file.name}: ${validation.errors.join(', ')}`, 'error');
                    errorCount++;
                    return;
                }
                
                // Check if file already exists
                if (this.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    this.showMessage(`⚠️ File "${file.name}" is already uploaded.`, 'warning');
                    errorCount++;
                    return;
                }
                
                // Add file to uploaded files
                this.uploadedFiles.push(file);
                this.addFileToList(file);
                processedCount++;
            });
            
            // Clear the input so same files can be selected again if needed
            fileInput.value = '';
            
            // Show summary message
            if (processedCount > 0) {
                this.showMessage(`✅ Successfully added ${processedCount} file(s) for upload.`, 'success');
            }
            
            if (errorCount > 0) {
                this.showMessage(`⚠️ ${errorCount} file(s) could not be added due to validation errors.`, 'warning');
            }
            
            console.log(`📊 File upload status: ${processedCount} added, ${errorCount} rejected. Total files: ${this.uploadedFiles.length}`);
        });
        
        // Add drag and drop functionality
        this.setupDragAndDrop(fileInput);
    }

    /**
     * Setup drag and drop for file uploads
     */
    setupDragAndDrop(fileInput) {
        const uploadSection = document.getElementById('file-upload-section');
        if (!uploadSection) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadSection.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadSection.addEventListener(eventName, () => {
                uploadSection.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadSection.addEventListener(eventName, () => {
                uploadSection.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
            }, false);
        });
        
        uploadSection.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            // Trigger the same logic as file input change
            const event = new Event('change');
            Object.defineProperty(event, 'target', {
                value: { files },
                enumerable: true
            });
            
            fileInput.dispatchEvent(event);
        }, false);
    }

    /**
     * Add file to the display list with enhanced UI
     */
    addFileToList(file) {
        const fileList = document.getElementById('file-list');
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center space-x-4';
        
        const fileIcon = document.createElement('i');
        fileIcon.className = `fas ${this.getFileIcon(file.name)} text-2xl text-primary-600 dark:text-primary-400`;
        
        const fileDetails = document.createElement('div');
        fileDetails.innerHTML = `
            <div class="font-semibold text-gray-900 dark:text-white text-lg">${file.name}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">${this.formatFileSize(file.size)} • ${file.type || 'Unknown type'}</div>
        `;
        
        fileInfo.appendChild(fileIcon);
        fileInfo.appendChild(fileDetails);
        
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'flex items-center justify-center w-10 h-10 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200';
        removeButton.innerHTML = '<i class="fas fa-times text-lg"></i>';
        removeButton.title = 'Remove file';
        removeButton.addEventListener('click', () => {
            this.removeFile(file.name, file.size);
            fileItem.remove();
            this.showMessage(`🗑️ Removed "${file.name}" from upload list.`, 'info');
        });
        
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeButton);
        fileList.appendChild(fileItem);
        
        // Add animation
        fileItem.style.opacity = '0';
        fileItem.style.transform = 'translateY(10px)';
        setTimeout(() => {
            fileItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            fileItem.style.opacity = '1';
            fileItem.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * Remove file from uploaded files
     */
    removeFile(fileName, fileSize) {
        this.uploadedFiles = this.uploadedFiles.filter(file => 
            !(file.name === fileName && file.size === fileSize)
        );
        console.log(`🗑️ Removed file: ${fileName}. Remaining files: ${this.uploadedFiles.length}`);
    }

    /**
     * Get appropriate icon for file type
     */
    getFileIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'txt': 'fa-file-alt',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'xlsx': 'fa-file-excel',
            'xls': 'fa-file-excel'
        };
        return iconMap[extension] || 'fa-file';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Load existing responses if any
     */
    async loadExistingResponses() {
        try {
            const existing = await window.bakshAPI.getExistingResponse(
                this.currentSurvey.type,
                this.currentSurvey.companyId,
                this.currentSurvey.employeeId
            );
            
            if (existing && existing.data && existing.data.responses) {
                this.currentResponses = existing.data.responses;
                console.log('📋 Loaded existing responses:', Object.keys(this.currentResponses).length);
            }
        } catch (error) {
            console.log('ℹ️ No existing responses found:', error.message);
        }
    }

    /**
     * Update progress indicator
     */
    updateProgress() {
        const responses = this.collectResponses();
        const totalQuestions = this.currentSurvey.questions.length;
        const answeredQuestions = Object.keys(responses).length;
        
        const progressCurrent = document.getElementById('progress-current');
        const progressBar = document.getElementById('progress-bar');
        
        if (progressCurrent) {
            progressCurrent.textContent = answeredQuestions;
        }
        
        if (progressBar) {
            const percentage = (answeredQuestions / totalQuestions) * 100;
            progressBar.style.width = `${percentage}%`;
            
            // Add color coding for progress
            progressBar.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500');
            if (percentage < 30) {
                progressBar.classList.add('bg-red-500');
            } else if (percentage < 70) {
                progressBar.classList.add('bg-yellow-500');
            } else {
                progressBar.classList.add('bg-green-500');
            }
        }
    }

    /**
     * Collect all responses from the form
     */
    collectResponses() {
        const responses = {};
        
        this.currentSurvey.questions.forEach(question => {
            const input = document.querySelector(`[name="${question.id}"]`);
            
            if (input) {
                if (input.type === 'radio') {
                    const checked = document.querySelector(`[name="${question.id}"]:checked`);
                    if (checked) {
                        responses[question.id] = checked.value;
                    }
                } else if (input.type === 'checkbox') {
                    const checked = document.querySelectorAll(`[name="${question.id}[]"]:checked`);
                    if (checked.length > 0) {
                        responses[question.id] = Array.from(checked).map(cb => cb.value);
                    }
                } else if (input.value && input.value.trim() !== '') {
                    responses[question.id] = input.value.trim();
                }
            }
        });
        
        return responses;
    }

    /**
     * Validate form responses with enhanced error messages
     */
    validateResponses(responses) {
        this.validationErrors = [];
        
        this.currentSurvey.questions.forEach((question, index) => {
            if (question.required && !responses[question.id]) {
                this.validationErrors.push({
                    questionId: question.id,
                    message: 'This field is required',
                    questionText: question.text,
                    questionIndex: index + 1
                });
            }
        });
        
        return this.validationErrors.length === 0;
    }

    /**
     * Display validation errors with improved UX
     */
    showValidationErrors() {
        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(error => {
            error.classList.add('hidden');
        });
        
        this.validationErrors.forEach(error => {
            const errorElement = document.getElementById(`error-${error.questionId}`);
            if (errorElement) {
                errorElement.classList.remove('hidden');
                errorElement.querySelector('span').textContent = error.message;
                
                // Scroll to first error with better positioning
                if (error === this.validationErrors[0]) {
                    const questionElement = document.querySelector(`[data-question-id="${error.questionId}"]`);
                    if (questionElement) {
                        questionElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        
                        // Add attention animation
                        questionElement.style.animation = 'pulse 1s ease-in-out 3';
                    }
                }
            }
        });
        
        // Show summary message with better formatting
        const errorCount = this.validationErrors.length;
        const message = errorCount === 1 
            ? '❌ Please complete the required field above.'
            : `❌ Please complete ${errorCount} required fields above.`;
        
        this.showMessage(message, 'error');
    }

    /**
     * Save draft responses
     */
    async saveDraft() {
        try {
            const responses = this.collectResponses();
            
            if (Object.keys(responses).length === 0) {
                this.showMessage('ℹ️ No responses to save yet.', 'info');
                return;
            }
            
            const button = document.getElementById('save-draft-button');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
            button.disabled = true;
            
            await window.bakshAPI.saveDraft(
                this.currentSurvey.type,
                this.currentSurvey.companyId,
                responses,
                this.currentSurvey.employeeId,
                this.currentSurvey.employeeName
            );
            
            this.showMessage('💾 Progress saved successfully!', 'success');
            
            button.innerHTML = originalText;
            button.disabled = false;
            
        } catch (error) {
            console.error('❌ Save draft failed:', error);
            this.showMessage(`❌ Failed to save progress: ${window.bakshAPI.getErrorMessage(error)}`, 'error');
            
            const button = document.getElementById('save-draft-button');
            button.innerHTML = '<i class="fas fa-save mr-2"></i>Save Progress';
            button.disabled = false;
        }
    }

    /**
     * Submit the survey with enhanced file upload handling
     */
    async submitSurvey() {
        try {
            console.log('🚀 Starting survey submission...');
            
            const responses = this.collectResponses();
            
            // Validate responses
            if (!this.validateResponses(responses)) {
                this.showValidationErrors();
                return;
            }
            
            const button = document.getElementById('submit-button');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
            button.disabled = true;
            
            // Show file upload status if files are present
            if (this.uploadedFiles.length > 0) {
                this.showMessage(`📎 Uploading ${this.uploadedFiles.length} file(s) with your responses...`, 'info');
            }
            
            // Prepare form data
            const formData = {
                type: this.currentSurvey.type,
                companyId: this.currentSurvey.companyId,
                responses: responses,
                submittedAt: new Date().toISOString()
            };
            
            // Add employee info if it's an employee survey
            if (this.currentSurvey.type === 'employee') {
                formData.employeeId = this.currentSurvey.employeeId;
                formData.employeeName = this.currentSurvey.employeeName;
            }
            
            console.log('📋 Form data prepared:', {
                type: formData.type,
                responseCount: Object.keys(responses).length,
                fileCount: this.uploadedFiles.length
            });
            
            // Submit the survey with files
            const result = await window.bakshAPI.submitSurvey(formData, this.uploadedFiles);
            
            console.log('✅ Survey submission successful:', result);
            
            // Show success message with file confirmation
            if (this.uploadedFiles.length > 0) {
                const uploadedCount = result.uploaded_files || this.uploadedFiles.length;
                this.showMessage(`🎉 Survey submitted successfully with ${uploadedCount} file(s) uploaded!`, 'success');
            } else {
                this.showMessage('🎉 Survey submitted successfully!', 'success');
            }
            
            // Show success screen
            this.showSuccessScreen();
            
        } catch (error) {
            console.error('❌ Survey submission failed:', error);
            this.showMessage(`❌ Failed to submit survey: ${window.bakshAPI.getErrorMessage(error)}`, 'error');
            
            const button = document.getElementById('submit-button');
            button.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit Survey';
            button.disabled = false;
        }
    }

    /**
     * Show success screen with enhanced feedback
     */
    showSuccessScreen() {
        // Hide survey screen and show success screen
        document.getElementById('survey-screen').classList.add('hidden');
        document.getElementById('success-screen').classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update success screen with specific details
        const successScreen = document.getElementById('success-screen');
        const existingMessage = successScreen.querySelector('p');
        if (existingMessage && this.uploadedFiles.length > 0) {
            existingMessage.innerHTML = `Thank you for completing the AI & Data Readiness Assessment.<br><strong>${this.uploadedFiles.length} file(s) were successfully uploaded</strong> with your responses.`;
        }
        
        // Clear form data
        this.currentSurvey = null;
        this.surveyData = null;
        this.currentResponses = {};
        this.uploadedFiles = [];
        this.validationErrors = [];
        
        console.log('🎊 Survey completed and data cleared');
    }

    /**
     * Show loading state
     */
    showLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        const surveyForm = document.getElementById('survey-form');
        
        if (show) {
            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
            if (surveyForm) surveyForm.classList.add('hidden');
        } else {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            if (surveyForm) surveyForm.classList.remove('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message using the global message system
     */
    showMessage(message, type = 'info') {
        if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            // Fallback alert if global message system not available
            console.log(`${type.toUpperCase()}: ${message}`);
            alert(message);
        }
    }

    /**
     * Get question by ID
     */
    getQuestionById(questionId) {
        return this.currentSurvey?.questions?.find(q => q.id === questionId);
    }

    /**
     * Check if survey is complete
     */
    isSurveyComplete() {
        const responses = this.collectResponses();
        const requiredQuestions = this.currentSurvey.questions.filter(q => q.required);
        
        return requiredQuestions.every(question => {
            const response = responses[question.id];
            return response !== undefined && response !== null && response !== '';
        });
    }

    /**
     * Get completion percentage
     */
    getCompletionPercentage() {
        const responses = this.collectResponses();
        const totalQuestions = this.currentSurvey.questions.length;
        const answeredQuestions = Object.keys(responses).length;
        
        return Math.round((answeredQuestions / totalQuestions) * 100);
    }

    /**
     * Auto-save functionality
     */
    enableAutoSave() {
        let autoSaveTimer;
        
        const handleChange = () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                this.saveDraft();
            }, 30000); // Auto-save after 30 seconds of inactivity
        };
        
        // Add listeners to all form inputs
        document.addEventListener('change', handleChange);
        document.addEventListener('input', handleChange);
    }

    /**
     * Handle keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+S or Cmd+S to save draft
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                this.saveDraft();
            }
            
            // Ctrl+Enter or Cmd+Enter to submit
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                this.submitSurvey();
            }
        });
    }

    /**
     * Export responses as JSON (for debugging/backup)
     */
    exportResponses() {
        const responses = this.collectResponses();
        const data = {
            survey: this.currentSurvey,
            responses: responses,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-responses-${this.currentSurvey.type}-${this.currentSurvey.companyId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Import responses from JSON (for debugging/restore)
     */
    importResponses(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.responses) {
                this.currentResponses = data.responses;
                this.renderSurvey(); // Re-render to show imported responses
                this.showMessage('📥 Responses imported successfully!', 'success');
            }
        } catch (error) {
            this.showMessage('❌ Failed to import responses: Invalid JSON format', 'error');
        }
    }

    /**
     * Reset survey (clear all responses)
     */
    resetSurvey() {
        if (confirm('⚠️ Are you sure you want to clear all responses? This action cannot be undone.')) {
            this.currentResponses = {};
            this.uploadedFiles = [];
            this.validationErrors = [];
            
            // Clear form
            const form = document.getElementById('survey-questions-form');
            if (form) {
                form.reset();
                
                // Clear custom styled elements
                form.querySelectorAll('.radio-option, .checkbox-option').forEach(option => {
                    option.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'shadow-md');
                });
                
                form.querySelectorAll('.error-message').forEach(error => {
                    error.classList.add('hidden');
                });
            }
            
            // Clear file list
            const fileList = document.getElementById('file-list');
            if (fileList) {
                fileList.innerHTML = '';
            }
            
            this.updateProgress();
            this.showMessage('🔄 Survey reset successfully!', 'success');
        }
    }

    /**
     * Print survey (for offline completion)
     */
    printSurvey() {
        const printWindow = window.open('', '_blank');
        const questions = this.currentSurvey.questions;
        
        let html = `
            <html>
            <head>
                <title>${this.currentSurvey.type} Survey - ${this.currentSurvey.companyId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .question { margin-bottom: 20px; page-break-inside: avoid; }
                    .question-number { font-weight: bold; color: #666; }
                    .question-text { font-weight: bold; margin: 5px 0; }
                    .options { margin-left: 20px; }
                    .option { margin: 5px 0; }
                    .required { color: red; }
                    .section-header { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${this.currentSurvey.type.charAt(0).toUpperCase() + this.currentSurvey.type.slice(1)} AI & Data Readiness Survey</h1>
                    <p>Company ID: ${this.currentSurvey.companyId}</p>
                    ${this.currentSurvey.employeeName ? `<p>Employee: ${this.currentSurvey.employeeName}</p>` : ''}
                    <p>Generated: ${new Date().toLocaleDateString()}</p>
                </div>
        `;
        
        const questionsBySection = this.groupQuestionsBySection(questions);
        let questionCounter = 1;
        
        Object.keys(questionsBySection).forEach(sectionName => {
            if (sectionName && sectionName !== 'undefined') {
                html += `<div class="section-header">${sectionName}</div>`;
            }
            
            questionsBySection[sectionName].forEach(question => {
                html += `
                    <div class="question">
                        <div class="question-number">Question ${questionCounter}</div>
                        <div class="question-text">
                            ${question.text}
                            ${question.required ? '<span class="required">*</span>' : ''}
                        </div>
                `;
                
                if (question.options && question.options.length > 0) {
                    html += '<div class="options">';
                    question.options.forEach(option => {
                        const inputType = question.type === 'checkbox' ? '☐' : '○';
                        html += `<div class="option">${inputType} ${option}</div>`;
                    });
                    html += '</div>';
                } else {
                    html += '<div style="border-bottom: 1px solid #ccc; height: 40px; margin: 10px 0;"></div>';
                }
                
                html += '</div>';
                questionCounter++;
            });
        });
        
        html += `
                <div class="no-print" style="margin-top: 40px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">Print Survey</button>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
    }
}

// Initialize the survey manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.surveyManager = new SurveyManager();
    console.log('✅ Survey Manager initialized with enhanced features');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SurveyManager;
}