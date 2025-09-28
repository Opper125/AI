// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Variables
let currentChatId = null;
let currentProjectId = null;
let currentApiKey = null;
let uploadedFiles = [];
let generatedFiles = [];
let aiContext = {};
let isGenerating = false;
let currentDeployment = null;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const uploadedFilesContainer = document.getElementById('uploadedFiles');
const codePanel = document.getElementById('codePanel');
const codeFiles = document.getElementById('codeFiles');
const generationProgress = document.getElementById('generationProgress');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressSteps = document.getElementById('progressSteps');
const newProjectBtn = document.getElementById('newProjectBtn');
const projectList = document.getElementById('projectList');
const currentApiKeyDisplay = document.getElementById('currentApiKey');
const fileCount = document.getElementById('fileCount');

// Modals
const previewModal = document.getElementById('previewModal');
const deployModal = document.getElementById('deployModal');
const deployStatusModal = document.getElementById('deployStatusModal');
const previewFrame = document.getElementById('previewFrame');

// AI Response Templates and Logic
class AIWebsiteBuilder {
    constructor() {
        this.conversationTemplates = {
            greeting: [
                "Hello! I'm excited to help you create an amazing website. What kind of website would you like to build today?",
                "Hi there! I'm your AI website developer. Tell me about your project - I can create anything from simple landing pages to complex web applications!",
                "Welcome! I'm ready to turn your ideas into beautiful, functional websites. What's your vision?"
            ],
            websiteTypes: {
                'ecommerce': 'I\'ll create a professional e-commerce website with product catalogs, shopping cart, checkout system, and payment integration.',
                'portfolio': 'I\'ll build a stunning portfolio website to showcase your work with modern design and interactive galleries.',
                'business': 'I\'ll develop a professional business website with services, about section, contact forms, and corporate design.',
                'blog': 'I\'ll create a dynamic blog platform with article management, categories, search functionality, and responsive design.',
                'landing': 'I\'ll build a high-converting landing page with compelling design, call-to-actions, and lead capture forms.',
                'dashboard': 'I\'ll develop a comprehensive admin dashboard with data visualization, user management, and analytics.',
                'restaurant': 'I\'ll create a beautiful restaurant website with menu displays, online reservations, and location information.',
                'education': 'I\'ll build an educational platform with course listings, student portals, and learning management features.'
            },
            encouragement: [
                "Great choice! Let me start building that for you.",
                "Excellent idea! I'll create something amazing.",
                "Perfect! I'm already envisioning the design.",
                "Love it! This will be fantastic."
            ]
        };
        
        this.websiteTemplates = {
            ecommerce: this.getEcommerceTemplate(),
            portfolio: this.getPortfolioTemplate(),
            business: this.getBusinessTemplate(),
            blog: this.getBlogTemplate(),
            landing: this.getLandingTemplate(),
            dashboard: this.getDashboardTemplate(),
            restaurant: this.getRestaurantTemplate(),
            education: this.getEducationTemplate()
        };

        this.init();
    }

    async init() {
        try {
            console.log('Initializing AI Website Builder...');
            await this.generateOrRetrieveApiKey();
            this.setupEventListeners();
            await this.loadProjects();
            this.showWelcomeMessage();
            this.setupAutoResize();
            console.log('AI Website Builder initialized successfully!');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize the application. Please refresh the page.');
        }
    }

    async generateOrRetrieveApiKey() {
        try {
            const domain = window.location.hostname || 'localhost';
            console.log('Getting API key for domain:', domain);
            
            // Use the database function to get or create API key
            const { data, error } = await supabase
                .rpc('get_or_create_api_key', {
                    domain_name: domain
                });

            if (error) {
                console.error('API Key RPC error:', error);
                throw error;
            }

            currentApiKey = data;
            
            // Update display
            if (currentApiKeyDisplay) {
                currentApiKeyDisplay.textContent = currentApiKey.substring(0, 20) + '...';
            }
            
            // Update usage
            await this.updateApiKeyUsage();
            
            console.log('API Key initialized:', currentApiKey);
            
        } catch (error) {
            console.error('API Key generation error:', error);
            // Fallback to local generation
            currentApiKey = this.generateUniqueApiKey();
            if (currentApiKeyDisplay) {
                currentApiKeyDisplay.textContent = 'Generated locally';
            }
            
            // Try to save the locally generated key
            try {
                await supabase
                    .from('api_keys')
                    .insert([{
                        key: currentApiKey,
                        domain: window.location.hostname || 'localhost',
                        is_active: true
                    }]);
                console.log('Local API key saved to database');
            } catch (saveError) {
                console.error('Failed to save local API key:', saveError);
            }
        }
    }

    generateUniqueApiKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'opper_';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async updateApiKeyUsage() {
        try {
            if (!currentApiKey) return;
            
            const { error } = await supabase
                .rpc('update_api_key_usage', {
                    api_key_text: currentApiKey
                });

            if (error) {
                console.error('Usage update error:', error);
            }
        } catch (error) {
            console.error('Usage update error:', error);
        }
    }

    setupEventListeners() {
        // Chat functionality
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // File upload
        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        }
        
        // Drag and drop
        if (uploadZone) {
            uploadZone.addEventListener('click', () => fileInput?.click());
            uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadZone.addEventListener('drop', this.handleDrop.bind(this));
        }

        // Project management
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => this.createNewProject());
        }

        // Code panel actions
        const previewBtn = document.getElementById('previewBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        const deployBtn = document.getElementById('deployBtn');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewWebsite());
        }
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => this.downloadAllFiles());
        }
        if (deployBtn) {
            deployBtn.addEventListener('click', () => this.showDeployModal());
        }

        // Modal controls
        const closePreview = document.getElementById('closePreview');
        const closeDeploy = document.getElementById('closeDeploy');
        const confirmDeployBtn = document.getElementById('confirmDeployBtn');
        
        if (closePreview) {
            closePreview.addEventListener('click', () => this.closeModal('previewModal'));
        }
        if (closeDeploy) {
            closeDeploy.addEventListener('click', () => this.closeModal('deployModal'));
        }
        if (confirmDeployBtn) {
            confirmDeployBtn.addEventListener('click', () => this.deployWebsite());
        }

        // Domain name preview
        const domainNameInput = document.getElementById('domainName');
        if (domainNameInput) {
            domainNameInput.addEventListener('input', this.updateDomainPreview.bind(this));
        }

        // Clear chat
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChat());
        }

        // Device selector for preview
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changePreviewDevice(e.target.dataset.device));
        });
    }

    setupAutoResize() {
        if (chatInput) {
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            });
        }
    }

    showWelcomeMessage() {
        // Welcome message is already in HTML
        this.scrollToBottom();
    }

    async createNewProject() {
        try {
            console.log('Creating new project...');
            
            // First ensure we have an API key
            if (!currentApiKey) {
                await this.generateOrRetrieveApiKey();
            }

            const projectName = `Project ${new Date().toLocaleDateString()}`;
            
            console.log('Using API key:', currentApiKey);
            
            // Use the database function to create project and chat
            const { data, error } = await supabase
                .rpc('create_project_with_chat', {
                    project_name: projectName,
                    project_description: 'New AI-generated website project',
                    api_key_text: currentApiKey
                });

            if (error) {
                console.error('Database RPC error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('No data returned from database function');
            }

            const result = data[0];
            currentProjectId = result.project_id;
            currentChatId = result.chat_id;
            
            console.log('Project created successfully:', result);
            
            this.clearChatMessages();
            this.showWelcomeMessage();
            await this.loadProjects();
            
            this.showNotification('New project created successfully!', 'success');
            
        } catch (error) {
            console.error('Error creating new project:', error);
            this.showError(`Failed to create new project: ${error.message || 'Unknown error'}`);
        }
    }

    async loadProjects() {
        try {
            if (!currentApiKey) {
                await this.generateOrRetrieveApiKey();
            }

            console.log('Loading projects for API key:', currentApiKey);

            const { data: projects, error } = await supabase
                .from('projects')
                .select(`
                    id,
                    name,
                    description,
                    status,
                    created_at,
                    chats (id, title, created_at)
                `)
                .eq('api_key', currentApiKey)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Projects loading error:', error);
                throw error;
            }

            console.log('Projects loaded:', projects);
            this.renderProjects(projects || []);
            
        } catch (error) {
            console.error('Error loading projects:', error);
            // Create empty state if no projects
            this.renderProjects([]);
        }
    }

    renderProjects(projects) {
        if (!projectList) return;
        
        projectList.innerHTML = '';
        
        if (!projects || projects.length === 0) {
            projectList.innerHTML = '<div class="empty-state"><p>No projects yet. Create your first project!</p></div>';
            return;
        }

        projects.forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.className = 'project-item';
            if (project.id === currentProjectId) {
                projectElement.classList.add('active');
            }
            
            projectElement.innerHTML = `
                <h4>${project.name}</h4>
                <span>${new Date(project.created_at).toLocaleDateString()}</span>
                <small>${project.status}</small>
            `;
            
            projectElement.addEventListener('click', () => this.loadProject(project));
            projectList.appendChild(projectElement);
        });
    }

    async loadProject(project) {
        try {
            currentProjectId = project.id;
            
            // Get the latest chat for this project
            const { data: chats, error } = await supabase
                .from('chats')
                .select('*')
                .eq('project_id', project.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (chats && chats.length > 0) {
                const chat = chats[0];
                currentChatId = chat.id;
                await this.loadChatMessages();
                await this.loadGeneratedFiles();
            }

            // Update UI
            document.querySelectorAll('.project-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Find the clicked project item and make it active
            const projectItems = document.querySelectorAll('.project-item');
            projectItems.forEach(item => {
                if (item.querySelector('h4').textContent === project.name) {
                    item.classList.add('active');
                }
            });
            
        } catch (error) {
            console.error('Error loading project:', error);
            this.showError('Failed to load project');
        }
    }

    async loadChatMessages() {
        try {
            if (!currentChatId) return;

            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', currentChatId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            this.clearChatMessages();
            
            if (messages && messages.length > 0) {
                messages.forEach(message => {
                    this.addMessage(message.sender, message.content, false);
                });
            } else {
                this.showWelcomeMessage();
            }
            
        } catch (error) {
            console.error('Error loading chat messages:', error);
        }
    }

    async loadGeneratedFiles() {
        try {
            if (!currentChatId) return;

            const { data: files, error } = await supabase
                .from('generated_files')
                .select('*')
                .eq('chat_id', currentChatId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (files && files.length > 0) {
                generatedFiles = files.map(file => ({
                    name: file.filename,
                    content: file.content,
                    type: file.file_type,
                    language: file.language
                }));
                
                this.updateCodeFilesDisplay();
            }
            
        } catch (error) {
            console.error('Error loading generated files:', error);
        }
    }

    clearChatMessages() {
        if (!chatMessages) return;
        
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }
    }

    clearChat() {
        this.clearChatMessages();
        generatedFiles = [];
        this.updateCodeFilesDisplay();
        this.showWelcomeMessage();
        this.showNotification('Chat cleared', 'info');
    }

    async sendMessage() {
        const message = chatInput?.value?.trim();
        
        if (!message && uploadedFiles.length === 0) {
            this.showError('Please enter a message or upload files.');
            return;
        }

        if (isGenerating) {
            this.showError('Please wait for the current generation to complete.');
            return;
        }

        const messageText = message || 'Please analyze the uploaded files and create a website.';
        
        // Add user message
        this.addMessage('user', messageText);
        if (chatInput) {
            chatInput.value = '';
            chatInput.style.height = 'auto';
        }

        // Save user message
        await this.saveMessage('user', messageText);

        // Show typing indicator
        const typingMessage = this.showTypingIndicator();
        
        try {
            // Process with AI
            const aiResponse = await this.processWithAI(messageText, uploadedFiles);
            
            // Remove typing indicator
            if (typingMessage) {
                typingMessage.remove();
            }
            
            // Add AI response
            this.addMessage('ai', aiResponse.text);
            await this.saveMessage('ai', aiResponse.text);

            // Update AI context
            aiContext.lastUserMessage = messageText;
            aiContext.lastResponse = aiResponse.text;

            // Handle file generation if needed
            if (aiResponse.shouldGenerateFiles) {
                await this.generateWebsiteFiles(aiResponse.websiteType, messageText);
            }

            // Clear uploaded files
            uploadedFiles = [];
            this.updateUploadedFilesDisplay();

        } catch (error) {
            if (typingMessage) {
                typingMessage.remove();
            }
            this.addMessage('ai', 'I apologize, but I encountered an error. Please try again or rephrase your request.');
            console.error('AI processing error:', error);
        }
    }

    showTypingIndicator() {
        if (!chatMessages) return null;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        return typingDiv;
    }

    async processWithAI(message, files) {
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const lowerMessage = message.toLowerCase();
        let websiteType = 'business';
        let shouldGenerateFiles = false;
        let responseText = '';

        // Analyze message for website type
        for (const [type, description] of Object.entries(this.conversationTemplates.websiteTypes)) {
            if (lowerMessage.includes(type) || 
                lowerMessage.includes(type.replace('ecommerce', 'shop')) ||
                lowerMessage.includes(type.replace('ecommerce', 'store'))) {
                websiteType = type;
                shouldGenerateFiles = true;
                responseText = description;
                break;
            }
        }

        // Check for specific website requests
        if (lowerMessage.includes('website') || lowerMessage.includes('create') || lowerMessage.includes('build') || lowerMessage.includes('make')) {
            shouldGenerateFiles = true;
            if (!responseText) {
                responseText = "I'll create a professional website based on your requirements. Let me build that for you with modern design and full functionality.";
            }
        }

        // Check for modification requests
        if (lowerMessage.includes('change') || lowerMessage.includes('modify') || lowerMessage.includes('update') || 
            lowerMessage.includes('fix') || lowerMessage.includes('improve')) {
            if (generatedFiles.length > 0) {
                shouldGenerateFiles = true;
                responseText = "I'll update your website with those changes. Let me modify the code for you.";
            } else {
                responseText = "I'd be happy to help you modify a website, but I don't see any generated code yet. Please ask me to create a website first!";
            }
        }

        // Handle file uploads
        if (files && files.length > 0) {
            shouldGenerateFiles = true;
            responseText = `I can see you've uploaded ${files.length} file(s). I'll analyze them and create a website based on what I find. Let me process these files and build something amazing!`;
        }

        // Default conversational responses
        if (!shouldGenerateFiles) {
            if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
                responseText = this.getRandomResponse(this.conversationTemplates.greeting);
            } else {
                responseText = "I'd love to help you create a website! Please tell me what kind of website you need - for example: e-commerce store, portfolio, business website, blog, landing page, or dashboard. You can also upload design images or existing files for me to work with.";
            }
        }

        return {
            text: responseText,
            websiteType: websiteType,
            shouldGenerateFiles: shouldGenerateFiles
        };
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async generateWebsiteFiles(websiteType, userMessage) {
        if (!currentChatId) {
            await this.createNewProject();
        }

        isGenerating = true;
        this.showGenerationProgress();

        try {
            const template = this.websiteTemplates[websiteType] || this.websiteTemplates.business;
            const steps = [
                'Analyzing requirements...',
                'Designing layout structure...',
                'Creating HTML foundation...',
                'Styling with CSS...',
                'Adding JavaScript functionality...',
                'Optimizing for responsiveness...',
                'Finalizing components...',
                'Ready for preview!'
            ];

            let progress = 0;
            const stepIncrement = 100 / steps.length;

            for (let i = 0; i < steps.length; i++) {
                this.updateProgress(progress, steps[i]);
                
                // Simulate work time for each step
                await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
                
                progress += stepIncrement;
            }

            // Generate files based on template
            generatedFiles = await this.customizeTemplate(template, userMessage);

            // Save generated files to database
            await this.saveGeneratedFiles();

            this.updateProgress(100, 'Complete!');
            setTimeout(() => {
                this.hideGenerationProgress();
                this.updateCodeFilesDisplay();
            }, 1000);

        } catch (error) {
            console.error('Generation error:', error);
            this.hideGenerationProgress();
            this.showError('Failed to generate website files. Please try again.');
        } finally {
            isGenerating = false;
        }
    }

    async customizeTemplate(template, userMessage) {
        // Customize the template based on user message
        const customizedFiles = template.map(file => {
            let content = file.content;
            
            // Replace placeholders with user-specific content
            content = content.replace(/\{PROJECT_NAME\}/g, this.extractProjectName(userMessage));
            content = content.replace(/\{USER_MESSAGE\}/g, userMessage);
            content = content.replace(/\{CURRENT_YEAR\}/g, new Date().getFullYear());
            content = content.replace(/\{RANDOM_COLOR\}/g, this.getRandomColor());
            
            return {
                ...file,
                content: content
            };
        });

        return customizedFiles;
    }

    extractProjectName(message) {
        // Simple project name extraction
        const words = message.split(' ').filter(word => word.length > 3);
        return words.slice(0, 2).join(' ') || 'My Website';
    }

    getRandomColor() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showGenerationProgress() {
        if (generationProgress) {
            generationProgress.classList.remove('hidden');
            this.scrollToBottom();
        }
    }

    hideGenerationProgress() {
        if (generationProgress) {
            generationProgress.classList.add('hidden');
        }
    }

    updateProgress(percentage, step) {
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(percentage)}%`;
        }
        
        if (progressSteps) {
            progressSteps.innerHTML = `
                <div class="progress-step active">
                    <i class="fas fa-cog fa-spin"></i>
                    <span>${step}</span>
                </div>
            `;
        }
    }

    async saveMessage(sender, content) {
        if (!currentChatId) return;

        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    chat_id: currentChatId,
                    sender: sender,
                    content: content,
                    metadata: {
                        files_attached: uploadedFiles.length,
                        timestamp: new Date().toISOString()
                    }
                }]);

            if (error) {
                console.error('Error saving message:', error);
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }

    async saveGeneratedFiles() {
        if (!currentChatId || !generatedFiles.length) return;

        try {
            const filesToSave = generatedFiles.map(file => ({
                chat_id: currentChatId,
                project_id: currentProjectId,
                filename: file.name,
                file_type: file.type,
                content: file.content,
                language: file.language || file.type,
                file_size: file.content.length,
                is_main_file: file.name.includes('index'),
                metadata: {
                    generated_at: new Date().toISOString(),
                    file_category: file.category || 'main'
                }
            }));

            // Delete existing files for this chat
            await supabase
                .from('generated_files')
                .delete()
                .eq('chat_id', currentChatId);

            // Insert new files
            const { error } = await supabase
                .from('generated_files')
                .insert(filesToSave);

            if (error) {
                console.error('Error saving generated files:', error);
            }

        } catch (error) {
            console.error('Error saving generated files:', error);
        }
    }

    addMessage(sender, content, save = true) {
        if (!chatMessages) return null;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatarIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                ${this.formatMessageContent(content)}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }

    formatMessageContent(content) {
        // Format links, code, etc.
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // File Upload Handlers
    handleDragOver(e) {
        e.preventDefault();
        if (uploadZone) {
            uploadZone.classList.add('dragover');
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        if (uploadZone) {
            uploadZone.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        if (uploadZone) {
            uploadZone.classList.remove('dragover');
        }
        this.handleFileUpload(e.dataTransfer.files);
    }

    async handleFileUpload(files) {
        const fileArray = Array.from(files);
        
        for (const file of fileArray) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                this.showError(`File ${file.name} is too large. Maximum size is 10MB.`);
                continue;
            }

            try {
                // Upload to Supabase storage
                const fileName = `${Date.now()}_${file.name}`;
                const { data, error } = await supabase.storage
                    .from('files')
                    .upload(fileName, file);

                if (error) throw error;

                // Add to uploaded files list
                uploadedFiles.push({
                    name: file.name,
                    originalName: file.name,
                    url: data.path,
                    type: file.type,
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                });

                // Save file info to database
                if (currentChatId) {
                    await supabase
                        .from('files')
                        .insert([{
                            chat_id: currentChatId,
                            project_id: currentProjectId,
                            filename: fileName,
                            original_filename: file.name,
                            file_path: data.path,
                            file_type: file.type,
                            file_size: file.size,
                            mime_type: file.type,
                            status: 'uploaded'
                        }]);
                }

            } catch (error) {
                console.error('Upload error:', error);
                this.showError(`Failed to upload ${file.name}`);
            }
        }

        this.updateUploadedFilesDisplay();
    }

    updateUploadedFilesDisplay() {
        if (!uploadedFilesContainer) return;
        
        uploadedFilesContainer.innerHTML = '';
        
        if (uploadedFiles.length === 0) {
            uploadedFilesContainer.innerHTML = '<p style="text-align: center; color: #6b7280; font-size: 0.875rem;">No files uploaded</p>';
            return;
        }

        uploadedFiles.forEach((file, index) => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'uploaded-file';
            
            const fileIcon = this.getFileIcon(file.type);
            const fileSize = this.formatFileSize(file.size);
            
            fileDiv.innerHTML = `
                <div class="file-info">
                    <i class="${fileIcon} file-icon"></i>
                    <div class="file-details">
                        <span title="${file.name}">${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</span>
                        <small>${fileSize}</small>
                    </div>
                </div>
                <button class="file-remove" onclick="app.removeFile(${index})" title="Remove file">×</button>
            `;
            
            uploadedFilesContainer.appendChild(fileDiv);
        });
    }

    removeFile(index) {
        uploadedFiles.splice(index, 1);
        this.updateUploadedFilesDisplay();
    }

    getFileIcon(mimeType) {
        if (!mimeType) return 'fas fa-file';
        
        if (mimeType.startsWith('image/')) return 'fas fa-image';
        if (mimeType.startsWith('video/')) return 'fas fa-video';
        if (mimeType.startsWith('audio/')) return 'fas fa-music';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word')) return 'fas fa-file-word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'fas fa-file-archive';
        return 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    updateCodeFilesDisplay() {
        if (!codeFiles) return;
        
        if (generatedFiles.length === 0) {
            codeFiles.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <p>Generated code files will appear here</p>
                </div>
            `;
            if (fileCount) {
                fileCount.textContent = '0 files';
            }
            return;
        }

        if (fileCount) {
            fileCount.textContent = `${generatedFiles.length} files`;
        }
        
        codeFiles.innerHTML = '';

        generatedFiles.forEach((file, index) => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'code-file';
            
            const fileIcon = this.getLanguageIcon(file.type);
            
            fileDiv.innerHTML = `
                <div class="code-file-header">
                    <div class="file-info-header">
                        <div class="file-icon-header">
                            <i class="${fileIcon}"></i>
                        </div>
                        <span class="file-name">${file.name}</span>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-secondary" onclick="app.copyCode(${index})" title="Copy code">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="app.downloadFile(${index})" title="Download file">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                <div class="code-content">
                    <pre><code class="language-${file.type}">${this.escapeHtml(file.content)}</code></pre>
                </div>
            `;
            
            codeFiles.appendChild(fileDiv);
        });

        // Show code panel if hidden
        if (codePanel) {
            codePanel.style.display = 'flex';
        }
    }

    getLanguageIcon(type) {
        const icons = {
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'javascript': 'fab fa-js-square',
            'js': 'fab fa-js-square',
            'json': 'fas fa-code',
            'php': 'fab fa-php',
            'python': 'fab fa-python',
            'java': 'fab fa-java',
            'cpp': 'fas fa-code',
            'c': 'fas fa-code'
        };
        return icons[type] || 'fas fa-code';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    copyCode(index) {
        if (!generatedFiles[index]) return;
        
        const file = generatedFiles[index];
        navigator.clipboard.writeText(file.content).then(() => {
            this.showNotification(`Code for ${file.name} copied to clipboard!`, 'success');
        }).catch(() => {
            this.showError('Failed to copy code to clipboard');
        });
    }

    downloadFile(index) {
        if (!generatedFiles[index]) return;
        
        const file = generatedFiles[index];
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadAllFiles() {
        if (generatedFiles.length === 0) {
            this.showError('No files to download');
            return;
        }

        generatedFiles.forEach((file, index) => {
            setTimeout(() => this.downloadFile(index), 100 * index);
        });

        this.showNotification('Downloading all files...', 'success');
    }

    // Preview functionality
    previewWebsite() {
        if (generatedFiles.length === 0) {
            this.showError('No files to preview. Generate some code first!');
            return;
        }

        const htmlFile = generatedFiles.find(f => f.name.toLowerCase().includes('index.html') || f.type === 'html');
        if (!htmlFile) {
            this.showError('No HTML file found to preview.');
            return;
        }

        let htmlContent = htmlFile.content;

        // Inject CSS and JS files
        generatedFiles.forEach(file => {
            if (file.type === 'css') {
                htmlContent = htmlContent.replace(
                    `<link rel="stylesheet" href="${file.name}">`,
                    `<style>${file.content}</style>`
                );
                if (!htmlContent.includes('<style>')) {
                    htmlContent = htmlContent.replace('</head>', `<style>${file.content}</style></head>`);
                }
            } else if (file.type === 'javascript' || file.type === 'js') {
                htmlContent = htmlContent.replace(
                    `<script src="${file.name}"></script>`,
                    `<script>${file.content}</script>`
                );
                if (!htmlContent.includes('<script>')) {
                    htmlContent = htmlContent.replace('</body>', `<script>${file.content}</script></body>`);
                }
            }
        });

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        if (previewFrame) {
            previewFrame.src = url;
        }
        this.showModal('previewModal');
    }

    changePreviewDevice(device) {
        document.querySelectorAll('.device-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-device="${device}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        const frame = previewFrame;
        if (!frame) return;
        
        switch (device) {
            case 'mobile':
                frame.style.width = '375px';
                frame.style.height = '667px';
                break;
            case 'tablet':
                frame.style.width = '768px';
                frame.style.height = '1024px';
                break;
            default:
                frame.style.width = '100%';
                frame.style.height = '100%';
        }
    }

    // Deploy functionality
    showDeployModal() {
        if (generatedFiles.length === 0) {
            this.showError('No files to deploy. Generate some code first!');
            return;
        }

        // Check if this is a redeploy
        if (currentDeployment) {
            const redeployOption = document.getElementById('redeployOption');
            if (redeployOption) {
                redeployOption.style.display = 'block';
            }
            const domainNameInput = document.getElementById('domainName');
            if (domainNameInput && currentDeployment.subdomain) {
                domainNameInput.value = currentDeployment.subdomain;
            }
        }

        this.showModal('deployModal');
    }

    updateDomainPreview() {
        const domainInput = document.getElementById('domainName');
        const preview = document.getElementById('fullDomainPreview');
        if (domainInput && preview) {
            const domain = domainInput.value;
            preview.textContent = `${domain}.opper.app`;
        }
    }

    async deployWebsite() {
        const websiteNameInput = document.getElementById('websiteName');
        const domainNameInput = document.getElementById('domainName');
        const connectDatabaseInput = document.getElementById('connectDatabase');
        
        const websiteName = websiteNameInput?.value?.trim() || 'My Website';
        const domainName = domainNameInput?.value?.trim();
        const connectDatabase = connectDatabaseInput?.checked || false;

        if (!domainName) {
            this.showError('Please enter a domain name');
            return;
        }

        if (!/^[a-z0-9-]+$/.test(domainName)) {
            this.showError('Domain name can only contain lowercase letters, numbers, and hyphens');
            return;
        }

        this.closeModal('deployModal');
        this.showModal('deployStatusModal');

        try {
            // Check if domain is available
            const { data: existingDeployment } = await supabase
                .from('deployments')
                .select('id')
                .eq('subdomain', domainName)
                .eq('status', 'deployed')
                .single();

            if (existingDeployment && (!currentDeployment || currentDeployment.subdomain !== domainName)) {
                throw new Error('Domain name is already taken. Please choose another one.');
            }

            await this.simulateDeployment(websiteName, domainName, connectDatabase);

        } catch (error) {
            this.closeModal('deployStatusModal');
            this.showError(error.message || 'Deployment failed. Please try again.');
        }
    }

    async simulateDeployment(websiteName, domainName, connectDatabase) {
        const steps = [
            { id: 'step1', text: 'Preparing files', duration: 2000 },
            { id: 'step2', text: 'Building website', duration: 3000 },
            { id: 'step3', text: 'Deploying to server', duration: 2500 },
            { id: 'step4', text: 'Setting up domain', duration: 1500 }
        ];

        const deployLogs = document.getElementById('deployLogs');
        if (deployLogs) {
            deployLogs.innerHTML = '';
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepElement = document.getElementById(step.id);
            
            if (stepElement) {
                // Update step status
                stepElement.classList.add('active');
                const icon = stepElement.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-spinner fa-spin';
                }
            }
            
            // Add log
            this.addDeployLog(`${step.text}...`);
            
            await new Promise(resolve => setTimeout(resolve, step.duration));
            
            if (stepElement) {
                // Complete step
                stepElement.classList.remove('active');
                stepElement.classList.add('completed');
                const icon = stepElement.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-check';
                }
            }
            
            this.addDeployLog(`✓ ${step.text} completed`);
        }

        // Save deployment to database
        try {
            const deploymentData = {
                chat_id: currentChatId,
                project_id: currentProjectId,
                domain_name: websiteName,
                subdomain: domainName,
                deployed_url: `https://${domainName}.opper.app`,
                files: generatedFiles,
                status: 'deployed',
                connect_database: connectDatabase,
                deployment_type: currentDeployment ? 'redeploy' : 'new',
                parent_deployment_id: currentDeployment?.id || null
            };

            const { data: deployment, error } = await supabase
                .from('deployments')
                .insert([deploymentData])
                .select()
                .single();

            if (error) throw error;

            currentDeployment = deployment;
            
            this.addDeployLog('🎉 Deployment successful!');
            this.addDeployLog(`🌐 Your website is live at: https://${domainName}.opper.app`);

            // Show success message
            setTimeout(() => {
                this.closeModal('deployStatusModal');
                this.showNotification('Website deployed successfully!', 'success');
                
                // Open deployed website
                window.open(`https://${domainName}.opper.app`, '_blank');
            }, 2000);

        } catch (error) {
            this.addDeployLog(`❌ Deployment failed: ${error.message}`);
            throw error;
        }
    }

    addDeployLog(message) {
        const deployLogs = document.getElementById('deployLogs');
        if (!deployLogs) return;
        
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        deployLogs.appendChild(logEntry);
        deployLogs.scrollTop = deployLogs.scrollHeight;
    }

    // Modal functionality
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">×</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    // Website Templates
    getEcommerceTemplate() {
        return [
            {
                name: 'index.html',
                type: 'html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{PROJECT_NAME} - Premium E-commerce Store</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <header class="header">
        <nav class="navbar">
            <div class="nav-brand">
                <h1>{PROJECT_NAME}</h1>
            </div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#products">Products</a></li>
                <li><a href="#categories">Categories</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <div class="nav-actions">
                <button class="search-btn"><i class="fas fa-search"></i></button>
                <button class="cart-btn"><i class="fas fa-shopping-cart"></i> <span class="cart-count">0</span></button>
                <button class="account-btn"><i class="fas fa-user"></i></button>
            </div>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="hero-content">
                <h2>Welcome to {PROJECT_NAME}</h2>
                <p>Discover amazing products at unbeatable prices</p>
                <button class="cta-button">Shop Now</button>
            </div>
            <div class="hero-image">
                <img src="https://via.placeholder.com/600x400/{RANDOM_COLOR}/ffffff?text=Hero+Product" alt="Hero Product">
            </div>
        </section>

        <section id="featured" class="featured-products">
            <div class="container">
                <h2>Featured Products</h2>
                <div class="products-grid">
                    <div class="product-card">
                        <img src="https://via.placeholder.com/300x300/f093fb/ffffff?text=Product+1" alt="Product 1">
                        <h3>Premium Product 1</h3>
                        <p class="price">$99.99</p>
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                    <div class="product-card">
                        <img src="https://via.placeholder.com/300x300/4facfe/ffffff?text=Product+2" alt="Product 2">
                        <h3>Premium Product 2</h3>
                        <p class="price">$149.99</p>
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                    <div class="product-card">
                        <img src="https://via.placeholder.com/300x300/43e97b/ffffff?text=Product+3" alt="Product 3">
                        <h3>Premium Product 3</h3>
                        <p class="price">$79.99</p>
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                    <div class="product-card">
                        <img src="https://via.placeholder.com/300x300/f6d365/ffffff?text=Product+4" alt="Product 4">
                        <h3>Premium Product 4</h3>
                        <p class="price">$199.99</p>
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                </div>
            </div>
        </section>

        <section class="features">
            <div class="container">
                <div class="features-grid">
                    <div class="feature">
                        <i class="fas fa-shipping-fast"></i>
                        <h3>Free Shipping</h3>
                        <p>Free shipping on orders over $50</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-undo"></i>
                        <h3>Easy Returns</h3>
                        <p>30-day return policy</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-lock"></i>
                        <h3>Secure Payment</h3>
                        <p>100% secure checkout</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-headset"></i>
                        <h3>24/7 Support</h3>
                        <p>Round-the-clock customer service</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>{PROJECT_NAME}</h3>
                    <p>Your trusted online shopping destination</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#products">Products</a></li>
                        <li><a href="#categories">Categories</a></li>
                        <li><a href="#about">About Us</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Customer Service</h4>
                    <ul>
                        <li><a href="#shipping">Shipping Info</a></li>
                        <li><a href="#returns">Returns</a></li>
                        <li><a href="#faq">FAQ</a></li>
                        <li><a href="#support">Support</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Follow Us</h4>
                    <div class="social-links">
                        <a href="#"><i class="fab fa-facebook"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; {CURRENT_YEAR} {PROJECT_NAME}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`
            },
            {
                name: 'styles.css',
                type: 'css',
                content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
.header {
    background: #fff;
    box-shadow: 0 2px 20px rgba(0,0,0,0.1);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
}

.nav-brand h1 {
    color: {RANDOM_COLOR};
    font-size: 1.8rem;
    font-weight: 700;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: {RANDOM_COLOR};
}

.nav-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.nav-actions button {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #333;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.nav-actions button:hover {
    background: #f0f0f0;
}

.cart-count {
    background: {RANDOM_COLOR};
    color: white;
    border-radius: 50%;
    padding: 0.2rem 0.5rem;
    font-size: 0.8rem;
    margin-left: 0.5rem;
}

/* Hero Section */
.hero {
    display: flex;
    align-items: center;
    min-height: 100vh;
    padding: 120px 2rem 2rem;
    background: linear-gradient(135deg, {RANDOM_COLOR} 0%, #764ba2 100%);
    color: white;
}

.hero-content {
    flex: 1;
    max-width: 500px;
}

.hero-content h2 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    font-weight: 700;
}

.hero-content p {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.cta-button {
    background: white;
    color: {RANDOM_COLOR};
    border: none;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: 600;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.cta-button:hover {
    transform: translateY(-3px);
}

.hero-image {
    flex: 1;
    text-align: center;
}

.hero-image img {
    max-width: 100%;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

/* Featured Products */
.featured-products {
    padding: 5rem 0;
    background: #f8f9fa;
}

.featured-products h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
}

.product-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.product-card:hover {
    transform: translateY(-5px);
}

.product-card img {
    width: 100%;
    height: 250px;
    object-fit: cover;
}

.product-card h3 {
    padding: 1rem;
    font-size: 1.3rem;
    color: #333;
}

.product-card .price {
    padding: 0 1rem;
    font-size: 1.5rem;
    color: {RANDOM_COLOR};
    font-weight: 700;
}

.add-to-cart {
    width: 100%;
    padding: 1rem;
    background: {RANDOM_COLOR};
    color: white;
    border: none;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease;
}

.add-to-cart:hover {
    background: #5a67d8;
}

/* Features */
.features {
    padding: 5rem 0;
    background: white;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 3rem;
}

.feature {
    text-align: center;
    padding: 2rem;
}

.feature i {
    font-size: 3rem;
    color: {RANDOM_COLOR};
    margin-bottom: 1rem;
}

.feature h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
}

.feature p {
    color: #666;
    font-size: 1.1rem;
}

/* Footer */
.footer {
    background: #1a202c;
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
    margin-bottom: 1rem;
    color: {RANDOM_COLOR};
}

.footer-section ul {
    list-style: none;
}

.footer-section ul li {
    margin-bottom: 0.5rem;
}

.footer-section a {
    color: #ccc;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-section a:hover {
    color: {RANDOM_COLOR};
}

.social-links {
    display: flex;
    gap: 1rem;
}

.social-links a {
    font-size: 1.5rem;
}

.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #333;
    color: #999;
}

/* Responsive */
@media (max-width: 768px) {
    .navbar {
        flex-direction: column;
        gap: 1rem;
    }
    
    .hero {
        flex-direction: column;
        text-align: center;
    }
    
    .hero-content h2 {
        font-size: 2.5rem;
    }
    
    .products-grid {
        grid-template-columns: 1fr;
    }
}`
            },
            {
                name: 'script.js',
                type: 'javascript',
                content: `// E-commerce functionality
class EcommerceStore {
    constructor() {
        this.cart = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    setupEventListeners() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                this.addToCart(e.target.closest('.product-card'));
            });
        });

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Search functionality
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.showSearchModal();
            });
        }

        // Cart button
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.showCartModal();
            });
        }
    }

    addToCart(productCard) {
        if (!productCard) return;
        
        const product = {
            id: Date.now(),
            name: productCard.querySelector('h3')?.textContent || 'Product',
            price: productCard.querySelector('.price')?.textContent || '$0',
            image: productCard.querySelector('img')?.src || ''
        };

        this.cart.push(product);
        this.updateCartDisplay();
        this.showNotification('Product added to cart!', 'success');
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.cart.length;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = \`
            position: fixed;
            top: 100px;
            right: 20px;
            background: \${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        \`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    showSearchModal() {
        alert('Search functionality would be implemented here');
    }

    showCartModal() {
        if (this.cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        const cartItems = this.cart.map(item => 
            \`\${item.name} - \${item.price}\`
        ).join('\\n');
        
        alert(\`Cart Items:\\n\${cartItems}\`);
    }
}

// Initialize store
document.addEventListener('DOMContentLoaded', () => {
    new EcommerceStore();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = \`
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
\`;
document.head.appendChild(style);`
            }
        ];
    }

    getPortfolioTemplate() {
        return [
            {
                name: 'index.html',
                type: 'html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{PROJECT_NAME} - Creative Portfolio</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">{PROJECT_NAME}</div>
        <ul class="nav-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#portfolio">Portfolio</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
        <button class="nav-toggle">☰</button>
    </nav>

    <section id="home" class="hero">
        <div class="hero-content">
            <h1>Creative Designer & Developer</h1>
            <p>I create beautiful, functional designs that tell your story</p>
            <div class="hero-buttons">
                <a href="#portfolio" class="btn-primary">View My Work</a>
                <a href="#contact" class="btn-secondary">Get In Touch</a>
            </div>
        </div>
        <div class="hero-image">
            <img src="https://via.placeholder.com/500x500/{RANDOM_COLOR}/ffffff?text=Profile" alt="Profile">
        </div>
    </section>

    <section id="about" class="about">
        <div class="container">
            <h2>About Me</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>I'm a passionate designer and developer with over 5 years of experience creating digital experiences that matter. I specialize in web design, branding, and user experience design.</p>
                    <div class="skills">
                        <div class="skill">
                            <span>UI/UX Design</span>
                            <div class="skill-bar"><div class="skill-progress" style="width: 90%"></div></div>
                        </div>
                        <div class="skill">
                            <span>Web Development</span>
                            <div class="skill-bar"><div class="skill-progress" style="width: 85%"></div></div>
                        </div>
                        <div class="skill">
                            <span>Graphic Design</span>
                            <div class="skill-bar"><div class="skill-progress" style="width: 95%"></div></div>
                        </div>
                    </div>
                </div>
                <div class="about-stats">
                    <div class="stat">
                        <h3>50+</h3>
                        <p>Projects Completed</p>
                    </div>
                    <div class="stat">
                        <h3>30+</h3>
                        <p>Happy Clients</p>
                    </div>
                    <div class="stat">
                        <h3>5+</h3>
                        <p>Years Experience</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="portfolio" class="portfolio">
        <div class="container">
            <h2>My Portfolio</h2>
            <div class="portfolio-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="web">Web Design</button>
                <button class="filter-btn" data-filter="branding">Branding</button>
                <button class="filter-btn" data-filter="mobile">Mobile Apps</button>
            </div>
            <div class="portfolio-grid">
                <div class="portfolio-item" data-category="web">
                    <img src="https://via.placeholder.com/400x300/f093fb/ffffff?text=Web+Project+1" alt="Web Project 1">
                    <div class="portfolio-overlay">
                        <h3>E-commerce Website</h3>
                        <p>Modern shopping experience</p>
                        <button class="view-project">View Project</button>
                    </div>
                </div>
                <div class="portfolio-item" data-category="branding">
                    <img src="https://via.placeholder.com/400x300/4facfe/ffffff?text=Brand+Project+1" alt="Brand Project 1">
                    <div class="portfolio-overlay">
                        <h3>Brand Identity</h3>
                        <p>Complete brand makeover</p>
                        <button class="view-project">View Project</button>
                    </div>
                </div>
                <div class="portfolio-item" data-category="mobile">
                    <img src="https://via.placeholder.com/400x300/43e97b/ffffff?text=Mobile+App+1" alt="Mobile App 1">
                    <div class="portfolio-overlay">
                        <h3>Mobile Application</h3>
                        <p>iOS & Android app design</p>
                        <button class="view-project">View Project</button>
                    </div>
                </div>
                <div class="portfolio-item" data-category="web">
                    <img src="https://via.placeholder.com/400x300/f6d365/ffffff?text=Web+Project+2" alt="Web Project 2">
                    <div class="portfolio-overlay">
                        <h3>Corporate Website</h3>
                        <p>Professional business site</p>
                        <button class="view-project">View Project</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="services" class="services">
        <div class="container">
            <h2>My Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-icon">🎨</div>
                    <h3>UI/UX Design</h3>
                    <p>Creating intuitive and beautiful user experiences that convert visitors into customers.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">💻</div>
                    <h3>Web Development</h3>
                    <p>Building responsive, fast, and scalable websites using modern technologies.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">📱</div>
                    <h3>Mobile Design</h3>
                    <p>Designing mobile-first experiences that work perfectly on all devices.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">🚀</div>
                    <h3>Branding</h3>
                    <p>Developing strong brand identities that stand out in the marketplace.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Let's Work Together</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Get in touch</h3>
                    <p>I'm always interested in new projects and opportunities.</p>
                    <div class="contact-item">
                        <strong>Email:</strong> hello@{PROJECT_NAME}.com
                    </div>
                    <div class="contact-item">
                        <strong>Phone:</strong> +1 (555) 123-4567
                    </div>
                    <div class="social-links">
                        <a href="#"><i class="fab fa-linkedin"></i></a>
                        <a href="#"><i class="fab fa-dribbble"></i></a>
                        <a href="#"><i class="fab fa-behance"></i></a>
                        <a href="#"><i class="fab fa-github"></i></a>
                    </div>
                </div>
                <form class="contact-form">
                    <div class="form-group">
                        <input type="text" placeholder="Your Name" required>
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Your Email" required>
                    </div>
                    <div class="form-group">
                        <textarea placeholder="Your Message" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p>&copy; {CURRENT_YEAR} {PROJECT_NAME}. All rights reserved.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`
            }
        ];
    }

    // Implement other template methods...
    getBusinessTemplate() { return []; }
    getBlogTemplate() { return []; }
    getLandingTemplate() { return []; }
    getDashboardTemplate() { return []; }
    getRestaurantTemplate() { return []; }
    getEducationTemplate() { return []; }
}

// Global functions for button actions (needed for onclick handlers)
window.app = null;

window.removeFile = function(index) {
    if (window.app) {
        window.app.removeFile(index);
    }
};

window.copyCode = function(index) {
    if (window.app) {
        window.app.copyCode(index);
    }
};

window.downloadFile = function(index) {
    if (window.app) {
        window.app.downloadFile(index);
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AI Website Builder...');
    window.app = new AIWebsiteBuilder();
});

// Add necessary CSS for notifications and animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .typing-indicator .typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #999;
        animation: typing 1.4s infinite;
    }
    
    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
        }
        30% {
            transform: translateY(-10px);
            opacity: 1;
        }
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.2rem;
        margin-left: auto;
    }
`;
document.head.appendChild(notificationStyles);
