// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentChatId = null;
let currentApiKey = null;
let uploadedFiles = [];
let generatedFiles = [];
let chatHistory = [];

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const deployBtn = document.getElementById('deployBtn');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadedFilesContainer = document.getElementById('uploadedFiles');
const previewPanel = document.getElementById('previewPanel');
const codeFilesContainer = document.getElementById('codeFiles');
const deployModal = document.getElementById('deployModal');
const currentApiKeyDisplay = document.getElementById('currentApiKey');

// Initialize the application
class AIWebsiteBuilder {
    constructor() {
        this.init();
    }

    async init() {
        await this.initializeDatabase();
        await this.generateOrRetrieveApiKey();
        this.setupEventListeners();
        await this.loadChatHistory();
        this.createNewChat();
    }

    async initializeDatabase() {
        try {
            // Create tables if they don't exist
            const { error: chatsError } = await supabase.rpc('create_chats_table');
            const { error: messagesError } = await supabase.rpc('create_messages_table');
            const { error: filesError } = await supabase.rpc('create_files_table');
            const { error: apiKeysError } = await supabase.rpc('create_api_keys_table');
            const { error: deploymentsError } = await supabase.rpc('create_deployments_table');

            console.log('Database initialization completed');
        } catch (error) {
            console.error('Database initialization error:', error);
        }
    }

    async generateOrRetrieveApiKey() {
        try {
            // Try to get existing API key
            const { data: existingKey, error } = await supabase
                .from('api_keys')
                .select('key')
                .eq('domain', window.location.hostname)
                .single();

            if (existingKey) {
                currentApiKey = existingKey.key;
            } else {
                // Generate new API key
                currentApiKey = this.generateApiKey();
                
                // Store in database
                const { error: insertError } = await supabase
                    .from('api_keys')
                    .insert([
                        {
                            key: currentApiKey,
                            domain: window.location.hostname,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (insertError) {
                    console.error('Error storing API key:', insertError);
                }
            }

            currentApiKeyDisplay.textContent = currentApiKey;
            console.log('API Key initialized:', currentApiKey);
        } catch (error) {
            console.error('API Key generation error:', error);
        }
    }

    generateApiKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'opper_';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    setupEventListeners() {
        // Chat functionality
        sendBtn.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // New chat
        newChatBtn.addEventListener('click', () => this.createNewChat());

        // File upload
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        // Deploy functionality
        deployBtn.addEventListener('click', () => this.showDeployModal());
        document.getElementById('confirmDeployBtn').addEventListener('click', () => this.deployWebsite());
        
        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            deployModal.style.display = 'none';
        });

        // Preview controls
        document.getElementById('previewBtn').addEventListener('click', () => this.previewWebsite());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllFiles());
        document.getElementById('fullDeployBtn').addEventListener('click', () => this.showDeployModal());
    }

    async createNewChat() {
        try {
            const { data, error } = await supabase
                .from('chats')
                .insert([
                    {
                        title: 'New Website Project',
                        created_at: new Date().toISOString(),
                        api_key: currentApiKey
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            currentChatId = data.id;
            this.clearChatMessages();
            await this.loadChatHistory();
            this.showWelcomeMessage();
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    }

    clearChatMessages() {
        chatMessages.innerHTML = '';
        generatedFiles = [];
        this.updateCodeFilesDisplay();
    }

    showWelcomeMessage() {
        const welcomeHtml = `
            <div class="welcome-message">
                <h2>🎯 Welcome to AI Website Builder</h2>
                <p>I can help you create any website you want! Just describe what you need:</p>
                <ul>
                    <li>📱 Responsive websites with HTML, CSS, JavaScript</li>
                    <li>🎨 Custom designs from images or descriptions</li>
                    <li>🔗 Database integration with Supabase</li>
                    <li>🚀 Instant preview and deployment</li>
                    <li>📁 Multi-file projects with unlimited complexity</li>
                </ul>
                <p><strong>Start by describing your website or uploading a design image!</strong></p>
            </div>
        `;
        chatMessages.innerHTML = welcomeHtml;
    }

    async sendMessage() {
        const message = chatInput.value.trim();
        if (!message && uploadedFiles.length === 0) return;

        const messageText = message || "Please analyze the uploaded files and create a website.";
        
        // Add user message
        this.addMessage('user', messageText);
        chatInput.value = '';

        // Show loading
        const loadingMessage = this.addMessage('ai', 'Analyzing your request and generating code...');
        
        try {
            // Save message to database
            await this.saveMessage('user', messageText);

            // Process the request with AI
            const aiResponse = await this.processAIRequest(messageText, uploadedFiles);
            
            // Remove loading message
            loadingMessage.remove();
            
            // Add AI response
            this.addMessage('ai', aiResponse.text);
            await this.saveMessage('ai', aiResponse.text);

            // Handle generated files
            if (aiResponse.files && aiResponse.files.length > 0) {
                generatedFiles = aiResponse.files;
                this.updateCodeFilesDisplay();
            }

            // Clear uploaded files after processing
            uploadedFiles = [];
            this.updateUploadedFilesDisplay();

        } catch (error) {
            loadingMessage.remove();
            this.addMessage('ai', 'Sorry, there was an error processing your request. Please try again.');
            console.error('AI processing error:', error);
        }
    }

    async processAIRequest(message, files) {
        // Simulate AI processing - In real implementation, this would call your AI API
        return new Promise((resolve) => {
            setTimeout(() => {
                const response = this.generateAIResponse(message, files);
                resolve(response);
            }, 2000);
        });
    }

    generateAIResponse(message, files) {
        // This is a simplified AI response generator
        // In real implementation, this would use Claude or another AI model
        
        if (message.toLowerCase().includes('login') || message.toLowerCase().includes('auth')) {
            return {
                text: "I'll create a login system for you with a modern design and secure authentication.",
                files: [
                    {
                        name: 'index.html',
                        content: this.generateLoginHTML(),
                        type: 'html'
                    },
                    {
                        name: 'styles.css',
                        content: this.generateLoginCSS(),
                        type: 'css'
                    },
                    {
                        name: 'script.js',
                        content: this.generateLoginJS(),
                        type: 'javascript'
                    }
                ]
            };
        } else if (message.toLowerCase().includes('dashboard') || message.toLowerCase().includes('admin')) {
            return {
                text: "I'll create a modern dashboard interface with charts and data management.",
                files: [
                    {
                        name: 'dashboard.html',
                        content: this.generateDashboardHTML(),
                        type: 'html'
                    },
                    {
                        name: 'dashboard.css',
                        content: this.generateDashboardCSS(),
                        type: 'css'
                    },
                    {
                        name: 'dashboard.js',
                        content: this.generateDashboardJS(),
                        type: 'javascript'
                    }
                ]
            };
        } else {
            return {
                text: "I'll create a beautiful, responsive website based on your requirements.",
                files: [
                    {
                        name: 'index.html',
                        content: this.generateBasicHTML(message),
                        type: 'html'
                    },
                    {
                        name: 'styles.css',
                        content: this.generateBasicCSS(),
                        type: 'css'
                    },
                    {
                        name: 'script.js',
                        content: this.generateBasicJS(),
                        type: 'javascript'
                    }
                ]
            };
        }
    }

    generateBasicHTML(userRequest) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Custom Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <nav class="navbar">
            <div class="nav-brand">
                <h1>Your Website</h1>
            </div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="hero-content">
                <h2>Welcome to Your Website</h2>
                <p>This website was created based on your request: "${userRequest}"</p>
                <button class="cta-button">Get Started</button>
            </div>
        </section>

        <section id="about" class="section">
            <div class="container">
                <h2>About Us</h2>
                <p>We create amazing digital experiences that help businesses grow and connect with their customers.</p>
            </div>
        </section>

        <section id="services" class="section">
            <div class="container">
                <h2>Our Services</h2>
                <div class="services-grid">
                    <div class="service-card">
                        <h3>Web Development</h3>
                        <p>Custom websites built with modern technologies.</p>
                    </div>
                    <div class="service-card">
                        <h3>UI/UX Design</h3>
                        <p>Beautiful and intuitive user interfaces.</p>
                    </div>
                    <div class="service-card">
                        <h3>Digital Marketing</h3>
                        <p>Grow your online presence and reach more customers.</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="contact" class="section">
            <div class="container">
                <h2>Contact Us</h2>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <textarea placeholder="Your Message" required></textarea>
                    <button type="submit">Send Message</button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Your Website. All rights reserved.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
    }

    generateBasicCSS() {
        return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
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
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
    color: #667eea;
    font-size: 1.5rem;
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
    color: #667eea;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 120px 0 80px;
    text-align: center;
    margin-top: 70px;
}

.hero-content h2 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.cta-button {
    background: #48bb78;
    color: white;
    border: none;
    padding: 15px 30px;
    font-size: 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.cta-button:hover {
    transform: translateY(-2px);
}

/* Sections */
.section {
    padding: 80px 0;
}

.section:nth-child(even) {
    background: #f8f9fa;
}

.section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

/* Services */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    text-align: center;
    transition: transform 0.3s ease;
}

.service-card:hover {
    transform: translateY(-5px);
}

.service-card h3 {
    color: #667eea;
    margin-bottom: 1rem;
}

/* Contact Form */
.contact-form {
    max-width: 600px;
    margin: 0 auto;
}

.contact-form input,
.contact-form textarea {
    width: 100%;
    padding: 15px;
    margin-bottom: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-family: inherit;
}

.contact-form input:focus,
.contact-form textarea:focus {
    outline: none;
    border-color: #667eea;
}

.contact-form textarea {
    height: 120px;
    resize: vertical;
}

.contact-form button {
    background: #667eea;
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: background 0.3s ease;
}

.contact-form button:hover {
    background: #5a67d8;
}

/* Footer */
.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

/* Responsive */
@media (max-width: 768px) {
    .navbar {
        flex-direction: column;
        padding: 1rem;
    }

    .nav-menu {
        margin-top: 1rem;
        gap: 1rem;
    }

    .hero-content h2 {
        font-size: 2rem;
    }

    .services-grid {
        grid-template-columns: 1fr;
    }
}`;
    }

    generateBasicJS() {
        return `// Smooth scrolling for navigation links
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

// Contact form handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const message = this.querySelector('textarea').value;
    
    // Simple validation
    if (!name || !email || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    // Simulate form submission
    alert('Thank you for your message! We will get back to you soon.');
    this.reset();
});

// CTA button animation
document.querySelector('.cta-button').addEventListener('click', function() {
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 150);
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#fff';
        header.style.backdropFilter = 'none';
    }
});

// Service cards hover effect
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
    });
});

console.log('Website loaded successfully!');`;
    }

    generateLoginHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Secure Access</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1>Welcome Back</h1>
                <p>Sign in to your account</p>
            </div>
            
            <form class="login-form" id="loginForm">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <div class="form-options">
                    <label class="checkbox-label">
                        <input type="checkbox" id="remember">
                        <span>Remember me</span>
                    </label>
                    <a href="#" class="forgot-link">Forgot password?</a>
                </div>
                
                <button type="submit" class="login-btn">Sign In</button>
            </form>
            
            <div class="login-footer">
                <p>Don't have an account? <a href="#" id="signupLink">Sign up</a></p>
            </div>
        </div>
        
        <div class="signup-card hidden" id="signupCard">
            <div class="login-header">
                <h1>Create Account</h1>
                <p>Join us today</p>
            </div>
            
            <form class="login-form" id="signupForm">
                <div class="form-group">
                    <label for="fullname">Full Name</label>
                    <input type="text" id="fullname" name="fullname" required>
                </div>
                
                <div class="form-group">
                    <label for="signupEmail">Email Address</label>
                    <input type="email" id="signupEmail" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="signupPassword">Password</label>
                    <input type="password" id="signupPassword" name="password" required>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                </div>
                
                <button type="submit" class="login-btn">Create Account</button>
            </form>
            
            <div class="login-footer">
                <p>Already have an account? <a href="#" id="signinLink">Sign in</a></p>
            </div>
        </div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`;
    }

    generateLoginCSS() {
        return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.login-container {
    position: relative;
    width: 100%;
    max-width: 400px;
}

.login-card, .signup-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 2.5rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.hidden {
    display: none;
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.login-header h1 {
    color: #333;
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.login-header p {
    color: #666;
    font-size: 1rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    background: white;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 0.9rem;
    color: #666;
}

.checkbox-label input {
    margin-right: 0.5rem;
}

.forgot-link {
    color: #667eea;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s ease;
}

.forgot-link:hover {
    color: #5a67d8;
}

.login-btn {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.login-btn:hover {
    transform: translateY(-2px);
}

.login-footer {
    text-align: center;
    margin-top: 2rem;
    color: #666;
}

.login-footer a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
}

.login-footer a:hover {
    color: #5a67d8;
}

/* Animations */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-card, .signup-card {
    animation: slideIn 0.5s ease;
}

/* Responsive */
@media (max-width: 480px) {
    .login-card, .signup-card {
        padding: 2rem;
    }
    
    .login-header h1 {
        font-size: 1.8rem;
    }
}`;
    }

    generateLoginJS() {
        return `// DOM Elements
const loginCard = document.querySelector('.login-card');
const signupCard = document.getElementById('signupCard');
const signupLink = document.getElementById('signupLink');
const signinLink = document.getElementById('signinLink');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Switch between login and signup
signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginCard.classList.add('hidden');
    signupCard.classList.remove('hidden');
});

signinLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupCard.classList.add('hidden');
    loginCard.classList.remove('hidden');
});

// Login form handling
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Simulate login process
    showMessage('Signing in...', 'info');
    
    setTimeout(() => {
        // Simulate successful login
        showMessage('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            // In a real app, redirect to dashboard
            window.location.href = 'dashboard.html';
        }, 1000);
    }, 1500);
});

// Signup form handling
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!fullname || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Simulate signup process
    showMessage('Creating account...', 'info');
    
    setTimeout(() => {
        showMessage('Account created successfully!', 'success');
        
        setTimeout(() => {
            // Switch back to login
            signupCard.classList.add('hidden');
            loginCard.classList.remove('hidden');
        }, 1000);
    }, 1500);
});

// Message display function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = \`message \${type}\`;
    messageDiv.textContent = message;
    
    // Add styles
    messageDiv.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    \`;
    
    switch(type) {
        case 'success':
            messageDiv.style.background = '#48bb78';
            break;
        case 'error':
            messageDiv.style.background = '#f56565';
            break;
        case 'info':
            messageDiv.style.background = '#4299e1';
            break;
    }
    
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (messageDiv) {
            messageDiv.remove();
        }
    }, 3000);
}

// Add slide in animation
const style = document.createElement('style');
style.textContent = \`
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
\`;
document.head.appendChild(style);

// Input focus effects
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'translateY(-2px)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'translateY(0)';
    });
});

console.log('Login system initialized');`;
    }

    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Analytics & Management</title>
    <link rel="stylesheet" href="dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2>Dashboard</h2>
            </div>
            <nav class="sidebar-nav">
                <ul>
                    <li><a href="#overview" class="nav-link active">📊 Overview</a></li>
                    <li><a href="#analytics" class="nav-link">📈 Analytics</a></li>
                    <li><a href="#users" class="nav-link">👥 Users</a></li>
                    <li><a href="#products" class="nav-link">📦 Products</a></li>
                    <li><a href="#orders" class="nav-link">🛒 Orders</a></li>
                    <li><a href="#settings" class="nav-link">⚙️ Settings</a></li>
                </ul>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="dashboard-header">
                <div class="header-left">
                    <h1 id="pageTitle">Overview</h1>
                    <p>Welcome back! Here's what's happening with your business.</p>
                </div>
                <div class="header-right">
                    <button class="btn btn-primary">+ New Item</button>
                    <div class="user-profile">
                        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjdlZWEiLz48dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkE8L3RleHQ+PC9zdmc+" alt="User" class="user-avatar">
                        <span>Admin</span>
                    </div>
                </div>
            </header>

            <!-- Content Area -->
            <div class="content-area">
                <!-- Overview Section -->
                <section id="overview" class="content-section active">
                    <!-- Stats Cards -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-content">
                                <h3>Total Users</h3>
                                <div class="stat-number">12,345</div>
                                <div class="stat-change positive">+12% from last month</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-content">
                                <h3>Revenue</h3>
                                <div class="stat-number">$54,321</div>
                                <div class="stat-change positive">+8.5% from last month</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📦</div>
                            <div class="stat-content">
                                <h3>Orders</h3>
                                <div class="stat-number">1,234</div>
                                <div class="stat-change negative">-2.1% from last month</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⭐</div>
                            <div class="stat-content">
                                <h3>Rating</h3>
                                <div class="stat-number">4.8</div>
                                <div class="stat-change positive">+0.2 from last month</div>
                            </div>
                        </div>
                    </div>

                    <!-- Charts Row -->
                    <div class="charts-row">
                        <div class="chart-card">
                            <h3>Revenue Trend</h3>
                            <canvas id="revenueChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>User Growth</h3>
                            <canvas id="userChart"></canvas>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="activity-section">
                        <h3>Recent Activity</h3>
                        <div class="activity-list">
                            <div class="activity-item">
                                <div class="activity-icon">🛒</div>
                                <div class="activity-content">
                                    <p><strong>New order #1234</strong> from John Doe</p>
                                    <span class="activity-time">2 minutes ago</span>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-icon">👤</div>
                                <div class="activity-content">
                                    <p><strong>New user registered:</strong> jane@example.com</p>
                                    <span class="activity-time">15 minutes ago</span>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-icon">💰</div>
                                <div class="activity-content">
                                    <p><strong>Payment received:</strong> $299.99</p>
                                    <span class="activity-time">1 hour ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Other sections would be added here -->
                <section id="analytics" class="content-section">
                    <h2>Analytics Coming Soon</h2>
                    <p>Detailed analytics dashboard is being developed.</p>
                </section>

                <section id="users" class="content-section">
                    <h2>User Management</h2>
                    <p>User management features will be available here.</p>
                </section>
            </div>
        </main>
    </div>

    <script src="dashboard.js"></script>
</body>
</html>`;
    }

    generateDashboardCSS() {
        return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f8fafc;
    color: #333;
}

.dashboard-container {
    display: grid;
    grid-template-columns: 250px 1fr;
    min-height: 100vh;
}

/* Sidebar */
.sidebar {
    background: #1a202c;
    color: white;
    padding: 0;
}

.sidebar-header {
    padding: 2rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
}

.sidebar-nav ul {
    list-style: none;
    padding: 1rem 0;
}

.nav-link {
    display: block;
    padding: 1rem 1.5rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;
}

.nav-link:hover,
.nav-link.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-left-color: #667eea;
}

/* Main Content */
.main-content {
    overflow-y: auto;
}

.dashboard-header {
    background: white;
    padding: 2rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #1a202c;
}

.header-left p {
    color: #666;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5a67d8;
    transform: translateY(-2px);
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

/* Content Area */
.content-area {
    padding: 2rem;
}

.content-section {
    display: none;
}

.content-section.active {
    display: block;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-icon {
    font-size: 2.5rem;
    padding: 1rem;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
}

.stat-content h3 {
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 0.5rem;
}

.stat-change {
    font-size: 0.8rem;
    font-weight: 500;
}

.stat-change.positive {
    color: #48bb78;
}

.stat-change.negative {
    color: #f56565;
}

/* Charts */
.charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.chart-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.chart-card h3 {
    margin-bottom: 1rem;
    color: #1a202c;
}

.chart-card canvas {
    max-height: 300px;
}

/* Activity Section */
.activity-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.activity-section h3 {
    margin-bottom: 1.5rem;
    color: #1a202c;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    transition: background 0.3s ease;
}

.activity-item:hover {
    background: #e2e8f0;
}

.activity-icon {
    font-size: 1.5rem;
    padding: 0.5rem;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 6px;
}

.activity-content p {
    margin-bottom: 0.25rem;
}

.activity-time {
    font-size: 0.8rem;
    color: #666;
}

/* Responsive */
@media (max-width: 768px) {
    .dashboard-container {
        grid-template-columns: 1fr;
    }
    
    .sidebar {
        display: none;
    }
    
    .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .charts-row {
        grid-template-columns: 1fr;
    }
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.content-section.active {
    animation: fadeIn 0.5s ease;
}`;
    }

    generateDashboardJS() {
        return `// Dashboard Navigation
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Get target section
        const targetId = link.getAttribute('href').substring(1);
        
        // Hide all sections
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Update page title
            const linkText = link.textContent.trim();
            pageTitle.textContent = linkText.split(' ').slice(1).join(' ') || linkText;
        }
    });
});

// Initialize Charts
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    startRealTimeUpdates();
});

function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // User Growth Chart
    const userCtx = document.getElementById('userChart');
    if (userCtx) {
        new Chart(userCtx, {
            type: 'doughnut',
            data: {
                labels: ['New Users', 'Returning Users', 'Inactive'],
                datasets: [{
                    data: [300, 150, 50],
                    backgroundColor: [
                        '#667eea',
                        '#48bb78',
                        '#f56565'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
}

// Simulate real-time updates
function startRealTimeUpdates() {
    setInterval(() => {
        updateStatNumbers();
        addNewActivity();
    }, 30000); // Update every 30 seconds
}

function updateStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const currentValue = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
        const change = Math.floor(Math.random() * 10) - 5; // Random change between -5 and 5
        const newValue = Math.max(0, currentValue + change);
        
        if (stat.textContent.includes('$')) {
            stat.textContent = \`$\${newValue.toLocaleString()}\`;
        } else if (stat.textContent.includes('.')) {
            stat.textContent = (newValue / 1000).toFixed(1);
        } else {
            stat.textContent = newValue.toLocaleString();
        }
    });
}

function addNewActivity() {
    const activityList = document.querySelector('.activity-list');
    const activities = [
        { icon: '🛒', text: 'New order #' + Math.floor(Math.random() * 9999), time: 'Just now' },
        { icon: '👤', text: 'New user registered', time: 'Just now' },
        { icon: '💰', text: 'Payment received: $' + Math.floor(Math.random() * 500), time: 'Just now' },
        { icon: '⭐', text: 'New review received: 5 stars', time: 'Just now' }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.style.animation = 'fadeIn 0.5s ease';
    activityItem.innerHTML = \`
        <div class="activity-icon">\${randomActivity.icon}</div>
        <div class="activity-content">
            <p><strong>\${randomActivity.text}</strong></p>
            <span class="activity-time">\${randomActivity.time}</span>
        </div>
    \`;
    
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Remove oldest activity if more than 5
    if (activityList.children.length > 5) {
        activityList.removeChild(activityList.lastChild);
    }
}

// Stat card hover effects
document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    });
});

// Button click animations
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
});

console.log('Dashboard initialized successfully!');`;
    }

    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }

    async saveMessage(sender, content) {
        try {
            const { error } = await supabase
                .from('messages')
                .insert([
                    {
                        chat_id: currentChatId,
                        sender: sender,
                        content: content,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }

    async handleFileUpload(files) {
        const fileArray = Array.from(files);
        
        for (const file of fileArray) {
            // Upload to Supabase storage
            const fileName = `${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('files')
                .upload(fileName, file);

            if (error) {
                console.error('Upload error:', error);
                continue;
            }

            // Add to uploaded files list
            uploadedFiles.push({
                name: file.name,
                url: data.path,
                type: file.type,
                size: file.size
            });
        }

        this.updateUploadedFilesDisplay();
    }

    updateUploadedFilesDisplay() {
        uploadedFilesContainer.innerHTML = '';
        
        uploadedFiles.forEach((file, index) => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';
            fileDiv.innerHTML = `
                <span title="${file.name}">${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</span>
                <button class="file-remove" onclick="removeFile(${index})">×</button>
            `;
            uploadedFilesContainer.appendChild(fileDiv);
        });
    }

    updateCodeFilesDisplay() {
        codeFilesContainer.innerHTML = '';
        
        generatedFiles.forEach((file, index) => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'code-file';
            fileDiv.innerHTML = `
                <div class="code-file-header">
                    <span class="code-file-name">${file.name}</span>
                    <div class="code-actions">
                        <button class="btn btn-secondary" onclick="copyCode(${index})">📋 Copy</button>
                        <button class="btn btn-secondary" onclick="downloadFile(${index})">📥 Download</button>
                    </div>
                </div>
                <div class="code-content">
                    <pre><code class="language-${file.type}">${this.escapeHtml(file.content)}</code></pre>
                </div>
            `;
            codeFilesContainer.appendChild(fileDiv);
        });

        // Show preview panel if files were generated
        if (generatedFiles.length > 0) {
            previewPanel.style.display = 'flex';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadChatHistory() {
        try {
            const { data: chats, error } = await supabase
                .from('chats')
                .select('*')
                .eq('api_key', currentApiKey)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const chatList = document.getElementById('chatList');
            chatList.innerHTML = '';

            chats.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.className = 'chat-item';
                chatItem.innerHTML = `
                    <div>${chat.title}</div>
                    <small>${new Date(chat.created_at).toLocaleDateString()}</small>
                `;
                chatItem.addEventListener('click', () => this.loadChat(chat.id));
                chatList.appendChild(chatItem);
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    async loadChat(chatId) {
        try {
            currentChatId = chatId;
            
            // Load messages for this chat
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Clear current messages
            this.clearChatMessages();

            // Display messages
            messages.forEach(message => {
                this.addMessage(message.sender, message.content);
            });

            // Update active chat in sidebar
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');

        } catch (error) {
            console.error('Error loading chat:', error);
        }
    }

    previewWebsite() {
        if (generatedFiles.length === 0) {
            alert('No files to preview. Generate some code first!');
            return;
        }

        // Find the main HTML file
        const htmlFile = generatedFiles.find(f => f.name.includes('index.html') || f.type === 'html');
        if (!htmlFile) {
            alert('No HTML file found to preview.');
            return;
        }

        // Create a blob URL for the HTML content
        let htmlContent = htmlFile.content;
        
        // Inject other files (CSS, JS) into the HTML
        generatedFiles.forEach(file => {
            if (file.type === 'css') {
                htmlContent = htmlContent.replace(
                    `<link rel="stylesheet" href="${file.name}">`,
                    `<style>${file.content}</style>`
                );
            } else if (file.type === 'javascript') {
                htmlContent = htmlContent.replace(
                    `<script src="${file.name}"></script>`,
                    `<script>${file.content}</script>`
                );
            }
        });

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Show preview
        const previewFrame = document.getElementById('previewFrame');
        const previewContainer = document.getElementById('previewContainer');
        
        previewFrame.src = url;
        previewContainer.style.display = 'block';
    }

    showDeployModal() {
        if (generatedFiles.length === 0) {
            alert('No files to deploy. Generate some code first!');
            return;
        }
        deployModal.style.display = 'block';
    }

    async deployWebsite() {
        const domainName = document.getElementById('domainName').value.trim();
        if (!domainName) {
            alert('Please enter a domain name');
            return;
        }

        const connectDatabase = document.getElementById('connectDatabase').checked;
        
        try {
            // Save deployment info
            const { data, error } = await supabase
                .from('deployments')
                .insert([
                    {
                        chat_id: currentChatId,
                        domain_name: domainName,
                        files: generatedFiles,
                        connect_database: connectDatabase,
                        deployed_url: `https://${domainName}.opper.app`,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Show success message
            const deployResult = document.getElementById('deployResult');
            deployResult.style.display = 'block';
            deployResult.innerHTML = `
                <div class="deploy-success">✅ Deployment Successful!</div>
                <div class="deploy-link">
                    Your website is live at: 
                    <a href="https://${domainName}.opper.app" target="_blank">
                        https://${domainName}.opper.app
                    </a>
                </div>
            `;

        } catch (error) {
            console.error('Deployment error:', error);
            alert('Deployment failed. Please try again.');
        }
    }

    downloadAllFiles() {
        if (generatedFiles.length === 0) {
            alert('No files to download');
            return;
        }

        generatedFiles.forEach(file => {
            const blob = new Blob([file.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}

// Global functions for button actions
window.removeFile = function(index) {
    uploadedFiles.splice(index, 1);
    app.updateUploadedFilesDisplay();
};

window.copyCode = function(index) {
    const file = generatedFiles[index];
    navigator.clipboard.writeText(file.content).then(() => {
        alert(`Code for ${file.name} copied to clipboard!`);
    });
};

window.downloadFile = function(index) {
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
};

// Initialize the application
const app = new AIWebsiteBuilder();
