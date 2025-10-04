
// =====================================================
// MODERN ADMIN DASHBOARD WITH DATABASE AUTHENTICATION
// =====================================================

// Supabase Configuration
/ Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA0MjczOCwiZXhwIjoyMDc0NjE4NzM4fQ.RIeMmmXUz4f2R3-3fhyu5neWt6e7ihVWuqXYe4ovhMg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State Management
window.adminState = {
    currentUser: null,
    sessionToken: null,
    websiteSettings: null,
    allAnimations: [],
    currentEmojiTarget: null,
    isLoading: false,
    sidebar: {
        collapsed: false,
        mobile: false
    }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// Show loading state
function showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';
    }
    window.adminState.isLoading = true;
}

// Hide loading state
function hideLoading() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
        window.adminState.isLoading = false;
    }, 800);
}

// Show success message
function showSuccess(element, message) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}

// Show error message
function showError(element, message) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}

// Generate session token
function generateSessionToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Get client IP (fallback)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return '127.0.0.1';
    }
}

// Get user agent
function getUserAgent() {
    return navigator.userAgent || 'Unknown';
}

// =====================================================
// AUTHENTICATION SYSTEM
// =====================================================

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Admin Dashboard Initializing...');
    checkAdminAuth();
    hideLoading();
    setupEventListeners();
});

// Check admin authentication
async function checkAdminAuth() {
    const sessionToken = localStorage.getItem('adminSessionToken');
    const rememberMe = localStorage.getItem('adminRememberMe') === 'true';
    
    if (!sessionToken) {
        showLogin();
        return;
    }

    try {
        showLoading();
        
        // Verify session with database
        const { data, error } = await supabase.rpc('verify_admin_session', {
            token: sessionToken
        });
        
        if (error) throw error;
        
        if (data && data.length > 0 && data[0].is_valid) {
            const adminData = data[0];
            window.adminState.currentUser = {
                id: adminData.admin_id,
                username: adminData.username,
                fullName: adminData.full_name
            };
            window.adminState.sessionToken = sessionToken;
            
            hideLoading();
            showDashboard();
        } else {
            // Invalid session
            localStorage.removeItem('adminSessionToken');
            localStorage.removeItem('adminRememberMe');
            hideLoading();
            showLogin();
        }
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        localStorage.removeItem('adminSessionToken');
        localStorage.removeItem('adminRememberMe');
        hideLoading();
        showLogin();
    }
}

// Show login screen
function showLogin() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    
    // Focus on username field
    setTimeout(() => {
        const usernameField = document.getElementById('adminUsername');
        if (usernameField) usernameField.focus();
    }, 100);
}

// Show dashboard
function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    
    // Update UI with user info
    updateUserInterface();
    
    // Load all data
    loadAllData();
}

// Update user interface with admin info
function updateUserInterface() {
    const { currentUser } = window.adminState;
    if (!currentUser) return;
    
    // Update admin name displays
    const adminNameElements = [
        document.getElementById('adminName'),
        document.getElementById('headerAdminName')
    ];
    
    adminNameElements.forEach(element => {
        if (element) {
            element.textContent = currentUser.fullName || currentUser.username;
        }
    });
}

// Handle login form submission
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Setup mobile menu and sidebar toggles
    setupNavigationEvents();
    
    // Setup modal events
    setupModalEvents();
    
    // Setup file upload events
    setupFileUploadEvents();
}

// Handle admin login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorEl = document.getElementById('loginError');
    const successEl = document.getElementById('loginSuccess');
    const loginBtn = document.getElementById('loginBtn');
    
    // Clear previous messages
    errorEl.classList.remove('show');
    successEl.classList.remove('show');
    
    // Validation
    if (!username || !password) {
        showError(errorEl, 'Please enter both username and password');
        return;
    }
    
    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    
    try {
        // Verify credentials with database
        const { data, error } = await supabase.rpc('verify_admin_password', {
            admin_username: username,
            plain_password: password
        });
        
        if (error) throw error;
        
        if (data && data.length > 0 && data[0].is_valid) {
            const adminData = data[0];
            
            // Get client information
            const clientIP = await getClientIP();
            const userAgent = getUserAgent();
            
            // Create session
            const { data: sessionData, error: sessionError } = await supabase.rpc('create_admin_session', {
                admin_id: adminData.admin_id,
                ip_addr: clientIP,
                user_agent_str: userAgent
            });
            
            if (sessionError) throw sessionError;
            
            if (sessionData && sessionData.length > 0) {
                const session = sessionData[0];
                
                // Store session
                localStorage.setItem('adminSessionToken', session.session_token);
                if (rememberMe) {
                    localStorage.setItem('adminRememberMe', 'true');
                }
                
                // Update global state
                window.adminState.currentUser = {
                    id: adminData.admin_id,
                    username: adminData.username,
                    fullName: adminData.full_name,
                    email: adminData.email
                };
                window.adminState.sessionToken = session.session_token;
                
                // Show success message
                showSuccess(successEl, 'Login successful! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    showDashboard();
                }, 1500);
                
            } else {
                throw new Error('Failed to create session');
            }
            
        } else {
            showError(errorEl, 'Invalid username or password');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.message.includes('locked')) {
            errorMessage = 'Account is temporarily locked due to multiple failed attempts';
        } else if (error.message.includes('inactive')) {
            errorMessage = 'Account is inactive. Contact administrator.';
        }
        
        showError(errorEl, errorMessage);
    } finally {
        // Hide loading state
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

// Toggle password visibility
function togglePassword() {
    const passwordField = document.getElementById('adminPassword');
    const toggleBtn = passwordField.nextElementSibling;
    const icon = toggleBtn.querySelector('i');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordField.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Admin logout
async function adminLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    showLoading();
    
    try {
        // Logout session from database
        if (window.adminState.sessionToken) {
            await supabase.rpc('logout_admin_session', {
                token: window.adminState.sessionToken
            });
        }
    } catch (error) {
        console.error('❌ Logout error:', error);
    } finally {
        // Clear local storage
        localStorage.removeItem('adminSessionToken');
        localStorage.removeItem('adminRememberMe');
        
        // Reset global state
        window.adminState.currentUser = null;
        window.adminState.sessionToken = null;
        
        // Redirect to login
        hideLoading();
        location.reload();
    }
}

// =====================================================
// NAVIGATION & UI
// =====================================================

// Setup navigation events
function setupNavigationEvents() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }
    
    // Sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Admin dropdown
    const adminDropdownBtn = document.querySelector('.admin-dropdown-btn');
    if (adminDropdownBtn) {
        adminDropdownBtn.addEventListener('click', toggleAdminDropdown);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        const dropdown = document.querySelector('.admin-dropdown');
        const dropdownMenu = document.getElementById('adminDropdownMenu');
        
        if (dropdown && !dropdown.contains(event.target)) {
            dropdownMenu?.classList.remove('active');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', handleWindowResize);
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth <= 768) {
        // Mobile mode
        sidebar?.classList.toggle('active');
        window.adminState.sidebar.mobile = sidebar?.classList.contains('active');
    } else {
        // Desktop mode
        sidebar?.classList.toggle('collapsed');
        window.adminState.sidebar.collapsed = sidebar?.classList.contains('collapsed');
        
        // Adjust main content margin
        if (mainContent) {
            const newMargin = window.adminState.sidebar.collapsed ? '70px' : '280px';
            const newWidth = window.adminState.sidebar.collapsed ? 'calc(100% - 70px)' : 'calc(100% - 280px)';
            mainContent.style.marginLeft = newMargin;
            mainContent.style.width = newWidth;
        }
    }
}

// Toggle admin dropdown
function toggleAdminDropdown() {
    const dropdownMenu = document.getElementById('adminDropdownMenu');
    dropdownMenu?.classList.toggle('active');
}

// Handle window resize
function handleWindowResize() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth > 768) {
        // Desktop mode - reset mobile classes
        sidebar?.classList.remove('active');
        
        // Restore desktop sidebar state
        if (window.adminState.sidebar.collapsed) {
            sidebar?.classList.add('collapsed');
            if (mainContent) {
                mainContent.style.marginLeft = '70px';
                mainContent.style.width = 'calc(100% - 70px)';
            }
        } else {
            sidebar?.classList.remove('collapsed');
            if (mainContent) {
                mainContent.style.marginLeft = '280px';
                mainContent.style.width = 'calc(100% - 280px)';
            }
        }
    } else {
        // Mobile mode - reset desktop classes
        sidebar?.classList.remove('collapsed');
        if (mainContent) {
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100%';
        }
    }
}

// Switch section
function switchSection(sectionName) {
    // Update active section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName)?.classList.add('active');

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const sectionTitles = {
            'website-settings': 'Website Settings',
            'banners': 'Banner Management',
            'categories': 'Categories',
            'buttons': 'Category Buttons',
            'tables': 'Input Tables',
            'menus': 'Products',
            'payments': 'Payment Methods',
            'contacts': 'Contacts',
            'videos': 'YouTube Videos',
            'animations': 'Animations',
            'orders': 'Orders',
            'users': 'Users'
        };
        pageTitle.textContent = sectionTitles[sectionName] || 'Dashboard';
    }

    // Load section data
    loadSectionData(sectionName);
    
    // Close mobile sidebar after navigation
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        sidebar?.classList.remove('active');
    }
}

// =====================================================
// DATA LOADING & MANAGEMENT
// =====================================================

// Load all data
async function loadAllData() {
    try {
        await Promise.all([
            loadWebsiteSettings(),
            loadCategories(),
            loadBanners(),
            loadAnimations(),
            loadOrdersCount(),
            loadUsersCount()
        ]);
        console.log('✅ All data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// Load section-specific data
async function loadSectionData(section) {
    try {
        switch(section) {
            case 'website-settings':
                await loadWebsiteSettings();
                break;
            case 'banners':
                await loadBanners();
                break;
            case 'categories':
                await loadCategories();
                break;
            case 'buttons':
                await loadCategoryButtons();
                await loadCategoriesForSelect();
                break;
            case 'tables':
                await loadInputTables();
                await loadCategoriesForSelect();
                break;
            case 'menus':
                await loadMenus();
                await loadCategoriesForSelect();
                break;
            case 'payments':
                await loadPaymentMethods();
                break;
            case 'contacts':
                await loadContacts();
                break;
            case 'videos':
                await loadVideos();
                await loadCategoriesForSelect();
                break;
            case 'animations':
                await loadAnimations();
                break;
            case 'orders':
                await loadOrders();
                break;
            case 'users':
                await loadUsers();
                break;
        }
    } catch (error) {
        console.error(`❌ Error loading ${section} data:`, error);
    }
}

// Load orders count for header
async function loadOrdersCount() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('status', { count: 'exact' });

        if (error) throw error;

        const totalOrdersEl = document.getElementById('totalOrdersHeader');
        const ordersBadgeEl = document.getElementById('ordersBadge');
        
        if (totalOrdersEl) {
            totalOrdersEl.textContent = data?.length || 0;
        }
        
        // Count pending orders for badge
        const pendingCount = data?.filter(order => order.status === 'pending').length || 0;
        if (ordersBadgeEl) {
            ordersBadgeEl.textContent = pendingCount;
            ordersBadgeEl.style.display = pendingCount > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('❌ Error loading orders count:', error);
    }
}

// Load users count for header
async function loadUsersCount() {
    try {
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        const totalUsersEl = document.getElementById('totalUsersHeader');
        if (totalUsersEl) {
            totalUsersEl.textContent = count || 0;
        }
    } catch (error) {
        console.error('❌ Error loading users count:', error);
    }
}

// =====================================================
// FILE UPLOAD HELPER
// =====================================================

async function uploadFile(file, folder) {
    try {
        if (!file) return null;
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('website-assets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('website-assets')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('❌ Upload error:', error);
        return null;
    }
}

// Setup file upload events
function setupFileUploadEvents() {
    // Logo upload
    const logoFile = document.getElementById('logoFile');
    if (logoFile) {
        logoFile.addEventListener('change', previewLogo);
    }
    
    // Background upload
    const bgFile = document.getElementById('bgFile');
    if (bgFile) {
        bgFile.addEventListener('change', previewBackground);
    }
    
    // Animation file info
    const animFile = document.getElementById('animationFile');
    if (animFile) {
        animFile.addEventListener('change', showAnimationFileInfo);
    }
}

// Show animation file info
function showAnimationFileInfo(event) {
    const file = event.target.files[0];
    const infoDiv = document.getElementById('animationFileInfo');
    
    if (file && infoDiv) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        infoDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-file-alt" style="color: var(--accent);"></i>
                <div>
                    <strong>File:</strong> ${file.name}<br>
                    <strong>Type:</strong> ${file.type}<br>
                    <strong>Size:</strong> ${sizeMB} MB
                </div>
            </div>
        `;
    } else if (infoDiv) {
        infoDiv.innerHTML = '';
    }
}

// =====================================================
// WEBSITE SETTINGS
// =====================================================

async function loadWebsiteSettings() {
    try {
        const { data, error } = await supabase
            .from('website_settings')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
            window.adminState.websiteSettings = data;
            
            // Update form fields
            const websiteNameEl = document.getElementById('websiteName');
            if (websiteNameEl) {
                websiteNameEl.value = data.website_name || '';
            }
            
            // Update preview images
            updatePreviewImage('logoPreview', data.logo_url);
            updatePreviewImage('bgPreview', data.background_url);
            updatePreviewImage('loadingPreview', data.loading_animation_url);
            updatePreviewImage('buttonPreview', data.button_style_url);
        } else {
            // Create default settings
            await supabase.from('website_settings').insert([{
                website_name: 'Gaming Store'
            }]);
            loadWebsiteSettings();
        }
    } catch (error) {
        console.error('❌ Error loading website settings:', error);
    }
}

// Update preview image
function updatePreviewImage(elementId, imageUrl) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (imageUrl) {
        element.innerHTML = `<img src="${imageUrl}" alt="Preview" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 8px;">`;
        element.onclick = () => window.open(imageUrl, '_blank');
        element.style.cursor = 'pointer';
    } else {
        element.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to upload or drag and drop</p>
        `;
        element.onclick = null;
        element.style.cursor = 'default';
    }
}

// Preview logo
function previewLogo() {
    previewImageFile('logoFile', 'logoPreview');
}

// Preview background
function previewBackground() {
    previewImageFile('bgFile', 'bgPreview');
}

// Preview image file
function previewImageFile(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
    }
}

// Update website name
async function updateWebsiteName() {
    const name = document.getElementById('websiteName')?.value?.trim();
    if (!name) {
        alert('Please enter a website name');
        return;
    }

    showLoading();

    try {
        const { error } = await supabase
            .from('website_settings')
            .upsert({ 
                id: window.adminState.websiteSettings?.id || 1,
                website_name: name 
            });

        if (error) throw error;

        hideLoading();
        alert('✅ Website name updated successfully!');
        await loadWebsiteSettings();
    } catch (error) {
        hideLoading();
        console.error('❌ Error updating website name:', error);
        alert('❌ Error updating website name');
    }
}

// Upload logo
async function uploadLogo() {
    const file = document.getElementById('logoFile')?.files[0];
    if (!file) {
        alert('Please select a logo file');
        return;
    }

    showLoading();
    
    try {
        const url = await uploadFile(file, 'logos');
        
        if (url) {
            await updateSettings({ logo_url: url });
            hideLoading();
            alert('✅ Logo uploaded successfully!');
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ Error uploading logo:', error);
        alert('❌ Error uploading logo');
    }
}

// Upload background
async function uploadBackground() {
    const file = document.getElementById('bgFile')?.files[0];
    if (!file) {
        alert('Please select a background file');
        return;
    }

    showLoading();
    
    try {
        const url = await uploadFile(file, 'backgrounds');
        
        if (url) {
            await updateSettings({ background_url: url });
            hideLoading();
            alert('✅ Background uploaded successfully!');
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ Error uploading background:', error);
        alert('❌ Error uploading background');
    }
}

// Upload loading animation
async function uploadLoadingAnimation() {
    const file = document.getElementById('loadingFile')?.files[0];
    if (!file) {
        alert('Please select an animation file');
        return;
    }

    showLoading();
    
    try {
        const url = await uploadFile(file, 'animations');
        
        if (url) {
            await updateSettings({ loading_animation_url: url });
            hideLoading();
            alert('✅ Loading animation uploaded successfully!');
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ Error uploading loading animation:', error);
        alert('❌ Error uploading loading animation');
    }
}

// Upload button style
async function uploadButtonStyle() {
    const file = document.getElementById('buttonFile')?.files[0];
    if (!file) {
        alert('Please select a button style file');
        return;
    }

    showLoading();
    
    try {
        const url = await uploadFile(file, 'buttons');
        
        if (url) {
            await updateSettings({ button_style_url: url });
            hideLoading();
            alert('✅ Button style uploaded successfully!');
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ Error uploading button style:', error);
        alert('❌ Error uploading button style');
    }
}

// Update settings helper
async function updateSettings(updates) {
    try {
        const { error } = await supabase
            .from('website_settings')
            .upsert({
                id: window.adminState.websiteSettings?.id || 1,
                ...updates
            });

        if (error) throw error;
        await loadWebsiteSettings();
    } catch (error) {
        console.error('❌ Error updating settings:', error);
        throw error;
    }
}

// =====================================================
// ANIMATIONS/EMOJI SYSTEM (Enhanced)
// =====================================================

// Load all animations
async function loadAnimations() {
    try {
        console.log('🎭 Loading animations...');
        const { data, error } = await supabase
            .from('animations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        window.adminState.allAnimations = data || [];
        console.log(`✅ Loaded ${window.adminState.allAnimations.length} animations`);
        
        displayAnimations(window.adminState.allAnimations);
    } catch (error) {
        console.error('❌ Error loading animations:', error);
        window.adminState.allAnimations = [];
    }
}

// Display animations
function displayAnimations(animations) {
    const container = document.getElementById('animationsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (animations.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <i class="fas fa-magic" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3 style="margin-bottom: 10px; color: var(--text-secondary);">No animations yet</h3>
                <p>Upload your first animation to get started!</p>
            </div>
        `;
        return;
    }

    animations.forEach(anim => {
        const item = document.createElement('div');
        item.className = 'animation-item';
        
        let preview = '';
        if (['gif', 'png', 'jpg', 'jpeg'].includes(anim.file_type)) {
            preview = `<img src="${anim.file_url}" alt="${anim.name}" loading="lazy">`;
        } else if (['video', 'webm', 'mp4'].includes(anim.file_type)) {
            preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
        } else if (anim.file_type === 'json') {
            preview = `<img src="${anim.file_url}" alt="${anim.name}" loading="lazy">`;
        }

        item.innerHTML = `
            <div class="animation-preview">${preview}</div>
            <div class="animation-name">${anim.name}</div>
            <div class="animation-type">${anim.file_type.toUpperCase()}</div>
            <button class="animation-delete" onclick="deleteAnimation(${anim.id})" title="Delete animation">
                <i class="fas fa-trash"></i>
            </button>
        `;

        container.appendChild(item);
    });
}

// Upload animation
async function uploadAnimation() {
    const name = document.getElementById('animationName')?.value?.trim();
    const file = document.getElementById('animationFile')?.files[0];

    if (!name || !file) {
        alert('Please enter name and select file');
        return;
    }

    showLoading();

    try {
        // Upload file
        const fileUrl = await uploadFile(file, 'animations');
        
        if (!fileUrl) {
            throw new Error('File upload failed');
        }

        // Get file type
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        // Insert into database
        const { data, error } = await supabase
            .from('animations')
            .insert([{
                name: name,
                file_url: fileUrl,
                file_type: fileExt,
                file_size: file.size,
                width: null,
                height: null
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        alert('✅ Animation uploaded successfully!');
        
        // Reset form
        document.getElementById('animationName').value = '';
        document.getElementById('animationFile').value = '';
        document.getElementById('animationFileInfo').innerHTML = '';
        
        // Reload animations
        await loadAnimations();

    } catch (error) {
        hideLoading();
        console.error('❌ Upload error:', error);
        alert('❌ Error uploading animation: ' + error.message);
    }
}

// Delete animation
async function deleteAnimation(id) {
    if (!confirm('Are you sure you want to delete this animation?')) return;

    showLoading();

    try {
        const { error } = await supabase
            .from('animations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('✅ Animation deleted successfully!');
        await loadAnimations();

    } catch (error) {
        hideLoading();
        console.error('❌ Delete error:', error);
        alert('❌ Error deleting animation');
    }
}

// =====================================================
// EMOJI PICKER SYSTEM (Enhanced)
// =====================================================

// Open emoji picker for specific input
function openEmojiPicker(inputId) {
    window.adminState.currentEmojiTarget = document.getElementById(inputId);
    if (!window.adminState.currentEmojiTarget) return;

    showEmojiModal();
}

// Open emoji picker for class-based inputs
function openEmojiPickerForClass(button, className) {
    const inputGroup = button.closest('.table-input-group, .menu-input-group');
    if (inputGroup) {
        window.adminState.currentEmojiTarget = inputGroup.querySelector('.' + className);
    } else {
        window.adminState.currentEmojiTarget = button.previousElementSibling;
    }
    
    if (!window.adminState.currentEmojiTarget) return;

    showEmojiModal();
}

// Show emoji modal
function showEmojiModal() {
    const modal = document.getElementById('emojiPickerModal');
    const grid = document.getElementById('emojiGrid');
    const searchInput = document.getElementById('emojiSearch');
    
    if (!modal || !grid) return;
    
    // Clear search
    if (searchInput) searchInput.value = '';
    
    // Load emoji grid
    loadEmojiGrid();
    
    // Show modal
    modal.classList.add('active');
    
    // Focus search input
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 100);
}

// Load emoji grid
function loadEmojiGrid(searchTerm = '') {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const { allAnimations } = window.adminState;
    
    if (allAnimations.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-magic" style="font-size: 32px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>No animations available.<br>Upload some animations first!</p>
            </div>
        `;
        return;
    }
    
    const filteredAnimations = searchTerm 
        ? allAnimations.filter(anim => 
            anim.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allAnimations;
    
    if (filteredAnimations.length === 0 && searchTerm) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 32px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>No animations found for "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    filteredAnimations.forEach(anim => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.onclick = () => insertEmoji(anim);
        
        let preview = '';
        if (['gif', 'png', 'jpg', 'jpeg'].includes(anim.file_type)) {
            preview = `<img src="${anim.file_url}" alt="${anim.name}" loading="lazy">`;
        } else if (['video', 'webm', 'mp4'].includes(anim.file_type)) {
            preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
        } else {
            preview = `<img src="${anim.file_url}" alt="${anim.name}" loading="lazy">`;
        }
        
        item.innerHTML = `
            ${preview}
            <div class="emoji-item-name">${anim.name}</div>
        `;
        
        grid.appendChild(item);
    });
}

// Insert emoji into target input
function insertEmoji(animation) {
    const target = window.adminState.currentEmojiTarget;
    if (!target) return;

    const cursorPos = target.selectionStart || target.value.length;
    const textBefore = target.value.substring(0, cursorPos);
    const textAfter = target.value.substring(cursorPos);
    
    // Insert emoji marker: {anim:ID:URL:TYPE}
    const emojiCode = `{anim:${animation.id}:${animation.file_url}:${animation.file_type}}`;
    
    target.value = textBefore + emojiCode + textAfter;
    
    // Set cursor position after emoji
    const newPos = cursorPos + emojiCode.length;
    target.setSelectionRange(newPos, newPos);
    target.focus();
    
    closeEmojiPicker();
}

// Close emoji picker
function closeEmojiPicker() {
    const modal = document.getElementById('emojiPickerModal');
    modal?.classList.remove('active');
    window.adminState.currentEmojiTarget = null;
}

// Filter emojis
function filterEmojis() {
    const searchTerm = document.getElementById('emojiSearch')?.value || '';
    loadEmojiGrid(searchTerm);
}

// Render animated text
function renderAnimatedText(text) {
    if (!text) return text;
    
    // Replace {anim:ID:URL:TYPE} with actual HTML
    return text.replace(/\{anim:(\d+):([^:]+):([^}]+)\}/g, (match, id, url, type) => {
        if (['gif', 'png', 'jpg', 'jpeg'].includes(type)) {
            return `<span class="animated-emoji"><img src="${url}" alt="emoji"></span>`;
        } else if (['video', 'webm', 'mp4'].includes(type)) {
            return `<span class="animated-emoji"><video autoplay loop muted><source src="${url}" type="video/${type}"></video></span>`;
        } else {
            return `<span class="animated-emoji"><img src="${url}" alt="emoji"></span>`;
        }
    });
}

// =====================================================
// MODAL SYSTEM (Enhanced)
// =====================================================

// Setup modal events
function setupModalEvents() {
    // Close modals when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModals();
        }
    });
    
    // Close modals with escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModals();
        }
    });
}

// Close all modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    window.adminState.currentEmojiTarget = null;
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal?.classList.remove('active');
}

// Close order modal
function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal?.classList.remove('active');
}

// Show profile (placeholder)
function showProfile() {
    alert('Profile management coming soon!');
}

// Show settings (placeholder)
function showSettings() {
    alert('Additional settings coming soon!');
}

// =====================================================
// PLACEHOLDER FUNCTIONS FOR OTHER SECTIONS
// =====================================================

// These functions would contain the same logic as the original admin.js
// but with enhanced error handling, loading states, and modern UI feedback

async function loadBanners() {
    console.log('📷 Loading banners...');
    // Implement banner loading logic here
}

async function loadCategories() {
    console.log('📁 Loading categories...');
    // Implement category loading logic here
}

async function loadCategoriesForSelect() {
    console.log('📁 Loading categories for select...');
    // Implement categories for select loading logic here
}

async function loadCategoryButtons() {
    console.log('🎮 Loading category buttons...');
    // Implement category buttons loading logic here
}

async function loadInputTables() {
    console.log('📝 Loading input tables...');
    // Implement input tables loading logic here
}

async function loadMenus() {
    console.log('🛒 Loading menus...');
    // Implement menus loading logic here
}

async function loadPaymentMethods() {
    console.log('💳 Loading payment methods...');
    // Implement payment methods loading logic here
}

async function loadContacts() {
    console.log('📞 Loading contacts...');
    // Implement contacts loading logic here
}

async function loadVideos() {
    console.log('🎥 Loading videos...');
    // Implement videos loading logic here
}

async function loadOrders() {
    console.log('📦 Loading orders...');
    // Implement orders loading logic here
}

async function loadUsers() {
    console.log('👥 Loading users...');
    // Implement users loading logic here
}

// Add banner
async function addBanner() {
    console.log('📷 Adding banner...');
    // Implement add banner logic here
}

// Add category
async function addCategory() {
    console.log('📁 Adding category...');
    // Implement add category logic here
}

// Filter orders
function filterOrders(status) {
    console.log(`📦 Filtering orders by status: ${status}`);
    // Implement order filtering logic here
}

// =====================================================
// INITIALIZATION COMPLETE
// =====================================================

console.log('✅ Modern Admin Dashboard initialized successfully!');
console.log('🔐 Database authentication enabled');
console.log('🎨 Professional UI/UX loaded');
console.log('🚀 Ready for administration!');

// Export for debugging (development only)
if (typeof window !== 'undefined') {
    window.adminDebug = {
        state: window.adminState,
        supabase: supabase,
        functions: {
            showLoading,
            hideLoading,
            loadAnimations,
            uploadAnimation,
            renderAnimatedText
        }
    };
}
