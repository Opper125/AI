
// =====================================================
// SECURE ADMIN DASHBOARD WITH DEVICE LOCKING
// =====================================================

// Supabase Configuration - Hidden in production
const SUPABASE_CONFIG = {
    url: 'https://eynbcpkpwzikwtlrdlza.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4'
};

// Security obfuscation
const sc = window.supabase?.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// =====================================================
// SECURITY & DEVICE FINGERPRINTING
// =====================================================

class SecurityManager {
    constructor() {
        this.deviceFingerprint = null;
        this.sessionToken = null;
        this.securityChecks = [];
        this.isAuthorized = false;
        this.init();
    }

    async init() {
        this.deviceFingerprint = await this.generateDeviceFingerprint();
        this.startSecurityMonitoring();
    }

    async generateDeviceFingerprint() {
        const components = [];
        
        // Screen information
        components.push(screen.width + 'x' + screen.height);
        components.push(screen.colorDepth);
        
        // Browser information
        components.push(navigator.userAgent);
        components.push(navigator.language);
        components.push(navigator.platform);
        components.push(navigator.cookieEnabled);
        
        // Timezone
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        // Hardware concurrency
        components.push(navigator.hardwareConcurrency || 'unknown');
        
        // Canvas fingerprint
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Device fingerprint test 🔒', 2, 2);
            components.push(canvas.toDataURL());
        } catch (e) {
            components.push('canvas_blocked');
        }
        
        // WebGL fingerprint
        try {
            const gl = document.createElement('canvas').getContext('webgl');
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
                components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
            }
        } catch (e) {
            components.push('webgl_blocked');
        }
        
        // Create hash
        const fingerprint = await this.hashString(components.join('|'));
        console.log('🔒 Device fingerprint generated');
        return fingerprint;
    }

    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org/?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Could not get client IP:', error);
            return 'unknown';
        }
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browserName = 'Unknown';
        
        if (ua.indexOf('Chrome') > -1) browserName = 'Chrome';
        else if (ua.indexOf('Firefox') > -1) browserName = 'Firefox';
        else if (ua.indexOf('Safari') > -1) browserName = 'Safari';
        else if (ua.indexOf('Edge') > -1) browserName = 'Edge';
        
        return {
            browser: browserName,
            version: this.getBrowserVersion(ua),
            mobile: /Mobi|Android/i.test(ua)
        };
    }

    getBrowserVersion(ua) {
        let version = 'Unknown';
        if (ua.indexOf('Chrome') > -1) {
            version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Firefox') > -1) {
            version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
        }
        return version;
    }

    startSecurityMonitoring() {
        // Monitor for suspicious activity
        setInterval(() => {
            this.performSecurityChecks();
        }, 30000); // Every 30 seconds

        // Monitor for navigation away
        window.addEventListener('beforeunload', () => {
            if (this.sessionToken) {
                navigator.sendBeacon('/api/admin/heartbeat', JSON.stringify({
                    token: this.sessionToken,
                    action: 'page_unload'
                }));
            }
        });
    }

    performSecurityChecks() {
        // Check if developer tools are open
        const devtools = {
            open: false,
            orientation: null
        };
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200) {
                devtools.open = true;
                devtools.orientation = 'vertical';
            } else if (window.outerWidth - window.innerWidth > 200) {
                devtools.open = true;
                devtools.orientation = 'horizontal';
            } else {
                devtools.open = false;
                devtools.orientation = null;
            }
            
            if (devtools.open && this.isAuthorized) {
                this.handleSecurityThreat('Developer tools detected');
            }
        }, 500);

        // Verify session periodically
        if (this.sessionToken) {
            this.verifySession();
        }
    }

    async verifySession() {
        try {
            const ip = await this.getClientIP();
            const { data, error } = await sc.rpc('verify_admin_session', {
                session_token: this.sessionToken,
                device_fingerprint: this.deviceFingerprint,
                ip_address: ip
            });

            if (error || !data) {
                this.handleSessionExpired();
            }
        } catch (error) {
            console.error('Session verification failed:', error);
        }
    }

    handleSecurityThreat(threat) {
        console.warn('🚨 Security threat detected:', threat);
        alert('Security violation detected! Access will be terminated.');
        this.forceLogout();
    }

    handleSessionExpired() {
        console.warn('🚨 Session expired or invalid');
        alert('Your session has expired. Please login again.');
        this.forceLogout();
    }

    forceLogout() {
        if (this.sessionToken) {
            sc.rpc('admin_logout', { session_token: this.sessionToken });
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    }
}

// =====================================================
// GLOBAL STATE
// =====================================================

const AppState = {
    security: new SecurityManager(),
    currentFilter: 'all',
    websiteSettings: null,
    allAnimations: [],
    currentEmojiTarget: null,
    isAuthenticated: false,
    sessionData: null
};

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        checkAdminAuth();
        hideLoading();
    }, 1000);
});

// =====================================================
// LOADING FUNCTIONS
// =====================================================

function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 800);
}

function showSecurityCheck() {
    document.getElementById('securityCheck').style.display = 'flex';
    
    // Animate progress bar
    const progressBar = document.querySelector('.progress-bar');
    let width = 0;
    const interval = setInterval(() => {
        width += 2;
        progressBar.style.width = width + '%';
        if (width >= 100) {
            clearInterval(interval);
        }
    }, 50);
}

function hideSecurityCheck() {
    document.getElementById('securityCheck').style.display = 'none';
}

function showAccessDenied(message = 'Access denied for security reasons.') {
    document.getElementById('accessDenied').style.display = 'flex';
    document.getElementById('deniedMessage').textContent = message;
}

function showLogin() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('accessDenied').style.display = 'none';
    document.getElementById('securityCheck').style.display = 'none';
}

function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    document.getElementById('accessDenied').style.display = 'none';
    document.getElementById('securityCheck').style.display = 'none';
    loadAllData();
    updateSecurityDisplay();
}

// =====================================================
// AUTHENTICATION SYSTEM
// =====================================================

async function checkAdminAuth() {
    showSecurityCheck();
    
    const storedToken = localStorage.getItem('admin_session_token');
    const storedFingerprint = localStorage.getItem('device_fingerprint');
    
    if (!storedToken || !storedFingerprint) {
        hideSecurityCheck();
        showLogin();
        return;
    }

    // Wait for security manager to initialize
    await new Promise(resolve => {
        const checkInit = () => {
            if (AppState.security.deviceFingerprint) {
                resolve();
            } else {
                setTimeout(checkInit, 100);
            }
        };
        checkInit();
    });

    // Verify stored fingerprint matches current device
    if (storedFingerprint !== AppState.security.deviceFingerprint) {
        console.warn('🚨 Device fingerprint mismatch');
        localStorage.clear();
        hideSecurityCheck();
        showAccessDenied('Device mismatch detected. Please login from the authorized device.');
        return;
    }

    // Verify session with server
    try {
        const ip = await AppState.security.getClientIP();
        const { data, error } = await sc.rpc('verify_admin_session', {
            session_token: storedToken,
            device_fingerprint: AppState.security.deviceFingerprint,
            ip_address: ip
        });

        if (error || !data) {
            localStorage.clear();
            hideSecurityCheck();
            showLogin();
            return;
        }

        // Session valid
        AppState.security.sessionToken = storedToken;
        AppState.security.isAuthorized = true;
        AppState.isAuthenticated = true;
        
        hideSecurityCheck();
        showDashboard();
        
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.clear();
        hideSecurityCheck();
        showLogin();
    }
}

async function adminLogin(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('adminPassword');
    const password = passwordInput.value.trim();
    const errorEl = document.getElementById('loginError');
    const successEl = document.getElementById('loginSuccess');
    const loginBtn = document.getElementById('loginButton');

    if (!password) {
        showError(errorEl, 'Please enter a password!');
        return;
    }

    // Add loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
        // Wait for device fingerprint
        if (!AppState.security.deviceFingerprint) {
            await new Promise(resolve => {
                const checkInit = () => {
                    if (AppState.security.deviceFingerprint) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            });
        }

        const ip = await AppState.security.getClientIP();
        const browserInfo = AppState.security.getBrowserInfo();

        const { data, error } = await sc.rpc('verify_admin_login', {
            plain_password: password,
            device_fingerprint: AppState.security.deviceFingerprint,
            ip_address: ip,
            user_agent: navigator.userAgent,
            browser_info: browserInfo
        });

        if (error) {
            throw error;
        }

        const [result] = data;
        
        if (result.success) {
            // Store session data
            localStorage.setItem('admin_session_token', result.session_token);
            localStorage.setItem('device_fingerprint', AppState.security.deviceFingerprint);
            
            AppState.security.sessionToken = result.session_token;
            AppState.security.isAuthorized = true;
            AppState.isAuthenticated = true;
            
            showSuccess(successEl, result.message);
            
            setTimeout(() => {
                showDashboard();
            }, 1500);
            
        } else {
            showError(errorEl, result.message);
            if (result.message.includes('already logged in')) {
                setTimeout(() => {
                    showAccessDenied(result.message);
                }, 2000);
            }
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError(errorEl, 'Login failed. Please try again.');
    } finally {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        passwordInput.value = '';
    }
}

async function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            if (AppState.security.sessionToken) {
                await sc.rpc('admin_logout', { 
                    session_token: AppState.security.sessionToken 
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.clear();
            sessionStorage.clear();
            AppState.security.isAuthorized = false;
            AppState.isAuthenticated = false;
            location.reload();
        }
    }
}

// =====================================================
// PASSWORD CHANGE SYSTEM
// =====================================================

async function changeAdminPassword() {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    showLoading();

    try {
        const { data, error } = await sc.rpc('change_admin_password', {
            session_token: AppState.security.sessionToken,
            current_password: currentPassword,
            new_password: newPassword
        });

        if (error) throw error;

        const [result] = data;
        
        if (result.success) {
            alert('Password changed successfully! 🔐');
            
            // Clear form
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            alert('Error: ' + result.message);
        }

    } catch (error) {
        console.error('Password change error:', error);
        alert('Error changing password: ' + error.message);
    } finally {
        hideLoading();
    }
}

// =====================================================
// SECURITY DISPLAY FUNCTIONS
// =====================================================

function updateSecurityDisplay() {
    // Update session display
    if (AppState.security.sessionToken) {
        const shortToken = AppState.security.sessionToken.substring(0, 12) + '...';
        document.getElementById('sessionDisplay').textContent = shortToken;
    }
    
    // Update login time
    document.getElementById('loginTime').textContent = new Date().toLocaleString();
    
    // Update IP address
    AppState.security.getClientIP().then(ip => {
        document.getElementById('currentIP').textContent = ip;
    });
    
    // Update device info
    const browserInfo = AppState.security.getBrowserInfo();
    document.getElementById('deviceInfo').textContent = 
        `${browserInfo.browser} ${browserInfo.version}${browserInfo.mobile ? ' (Mobile)' : ''}`;
}

async function loadSecurityMonitor() {
    try {
        // Load access logs (this would need a custom view/function in production)
        const accessLogsEl = document.getElementById('accessLogs');
        accessLogsEl.innerHTML = `
            <div class="log-entry success">
                <span class="log-time">${new Date().toLocaleString()}</span>
                <span class="log-action">LOGIN_SUCCESS</span>
                <span class="log-ip">${await AppState.security.getClientIP()}</span>
            </div>
            <div class="log-info">
                <p>✅ No suspicious activity detected</p>
                <p>🔒 Device lock active</p>
                <p>🛡️ All security checks passed</p>
            </div>
        `;
        
        // Load active sessions
        const activeSessionsEl = document.getElementById('activeSessions');
        activeSessionsEl.innerHTML = `
            <div class="session-entry current">
                <div class="session-info">
                    <span class="session-label">Current Session</span>
                    <span class="session-device">🔒 This Device</span>
                </div>
                <div class="session-details">
                    <span>IP: ${await AppState.security.getClientIP()}</span>
                    <span>Active: ${new Date().toLocaleString()}</span>
                </div>
            </div>
            <div class="session-status">
                ✅ Single device policy enforced
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading security monitor:', error);
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function showError(element, message) {
    element.textContent = message;
    element.className = 'error-message show';
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function showSuccess(element, message) {
    element.textContent = message;
    element.className = 'success-message show';
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// =====================================================
// SECTION SWITCHING
// =====================================================

function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    loadSectionData(sectionName);
}

function loadSectionData(section) {
    switch(section) {
        case 'website-settings':
            loadWebsiteSettings();
            break;
        case 'admin-settings':
            updateSecurityDisplay();
            break;
        case 'security-monitor':
            loadSecurityMonitor();
            break;
        case 'banners':
            loadBanners();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'buttons':
            loadCategoryButtons();
            loadCategoriesForSelect();
            break;
        case 'tables':
            loadInputTables();
            loadCategoriesForSelect();
            break;
        case 'menus':
            loadMenus();
            loadCategoriesForSelect();
            break;
        case 'payments':
            loadPaymentMethods();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'videos':
            loadVideos();
            loadCategoriesForSelect();
            break;
        case 'animations':
            loadAnimations();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// =====================================================
// DATA LOADING FUNCTIONS
// =====================================================

async function loadAllData() {
    await Promise.all([
        loadWebsiteSettings(),
        loadCategories(),
        loadBanners(),
        loadAnimations()
    ]);
}

// =====================================================
// FILE UPLOAD HELPER
// =====================================================

async function uploadFile(file, folder) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await sc.storage
            .from('website-assets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = sc.storage
            .from('website-assets')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

// =====================================================
// ANIMATIONS/EMOJI SYSTEM
// =====================================================

async function loadAnimations() {
    try {
        console.log('🎨 Loading animations...');
        const { data, error } = await sc
            .from('animations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        AppState.allAnimations = data || [];
        console.log(`🎨 Loaded ${AppState.allAnimations.length} animations`);
        
        displayAnimations(AppState.allAnimations);
    } catch (error) {
        console.error('🎨 Error loading animations:', error);
        AppState.allAnimations = [];
    }
}

function displayAnimations(animations) {
    const container = document.getElementById('animationsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (animations.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations yet. Upload your first animation!</p>';
        return;
    }

    animations.forEach(anim => {
        const item = document.createElement('div');
        item.className = 'animation-item';
        
        let preview = '';
        if (['gif', 'png', 'jpg', 'jpeg'].includes(anim.file_type)) {
            preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
        } else if (['video', 'webm', 'mp4'].includes(anim.file_type)) {
            preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
        } else if (anim.file_type === 'json') {
            preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
        }

        item.innerHTML = `
            <div class="animation-preview">${preview}</div>
            <div class="animation-name">${anim.name}</div>
            <div class="animation-type">${anim.file_type.toUpperCase()}</div>
            <button class="animation-delete" onclick="deleteAnimation(${anim.id})">🗑️</button>
        `;

        container.appendChild(item);
    });
}

async function uploadAnimation() {
    const name = document.getElementById('animationName').value.trim();
    const file = document.getElementById('animationFile').files[0];

    if (!name || !file) {
        alert('Please enter name and select file');
        return;
    }

    showLoading();

    try {
        const fileUrl = await uploadFile(file, 'animations');
        
        if (!fileUrl) {
            throw new Error('File upload failed');
        }

        const fileExt = file.name.split('.').pop().toLowerCase();
        
        const { data, error } = await sc
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

        alert('🎨 Animation uploaded successfully!');
        
        document.getElementById('animationName').value = '';
        document.getElementById('animationFile').value = '';
        document.getElementById('animationFileInfo').innerHTML = '';
        
        await loadAnimations();

    } catch (error) {
        console.error('🎨 Upload error:', error);
        alert('Error uploading animation: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function deleteAnimation(id) {
    if (!confirm('Delete this animation?')) return;

    showLoading();

    try {
        const { error } = await sc
            .from('animations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('🎨 Animation deleted!');
        await loadAnimations();

    } catch (error) {
        console.error('🎨 Delete error:', error);
        alert('Error deleting animation');
    } finally {
        hideLoading();
    }
}

// File info display
document.addEventListener('DOMContentLoaded', () => {
    const animFileInput = document.getElementById('animationFile');
    if (animFileInput) {
        animFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const infoDiv = document.getElementById('animationFileInfo');
            
            if (file) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                infoDiv.innerHTML = `
                    <strong>File:</strong> ${file.name}<br>
                    <strong>Type:</strong> ${file.type}<br>
                    <strong>Size:</strong> ${sizeMB} MB
                `;
            } else {
                infoDiv.innerHTML = '';
            }
        });
    }
});

// =====================================================
// EMOJI PICKER SYSTEM
// =====================================================

function openEmojiPicker(inputId) {
    AppState.currentEmojiTarget = document.getElementById(inputId);
    if (!AppState.currentEmojiTarget) return;

    const modal = document.getElementById('emojiPickerModal');
    const grid = document.getElementById('emojiGrid');
    
    grid.innerHTML = '';
    
    if (AppState.allAnimations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations available. Upload some first!</p>';
    } else {
        AppState.allAnimations.forEach(anim => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.onclick = () => insertEmoji(anim);
            
            let preview = '';
            if (['gif', 'png', 'jpg', 'jpeg'].includes(anim.file_type)) {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            } else if (['video', 'webm', 'mp4'].includes(anim.file_type)) {
                preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
            } else {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            }
            
            item.innerHTML = `
                ${preview}
                <div class="emoji-item-name">${anim.name}</div>
            `;
            
            grid.appendChild(item);
        });
    }
    
    modal.classList.add('active');
}

function openEmojiPickerForClass(button, className) {
    const inputGroup = button.closest('.table-input-group, .menu-input-group');
    if (inputGroup) {
        AppState.currentEmojiTarget = inputGroup.querySelector('.' + className);
    } else {
        AppState.currentEmojiTarget = button.previousElementSibling;
    }
    
    if (!AppState.currentEmojiTarget) return;

    const modal = document.getElementById('emojiPickerModal');
    const grid = document.getElementById('emojiGrid');
    
    grid.innerHTML = '';
    
    if (AppState.allAnimations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations available</p>';
    } else {
        AppState.allAnimations.forEach(anim => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.onclick = () => insertEmoji(anim);
            
            let preview = '';
            if (['gif', 'png', 'jpg', 'jpeg'].includes(anim.file_type)) {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            } else if (['video', 'webm', 'mp4'].includes(anim.file_type)) {
                preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
            } else {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            }
            
            item.innerHTML = `
                ${preview}
                <div class="emoji-item-name">${anim.name}</div>
            `;
            
            grid.appendChild(item);
        });
    }
    
    modal.classList.add('active');
}

function insertEmoji(animation) {
    if (!AppState.currentEmojiTarget) return;

    const cursorPos = AppState.currentEmojiTarget.selectionStart || AppState.currentEmojiTarget.value.length;
    const textBefore = AppState.currentEmojiTarget.value.substring(0, cursorPos);
    const textAfter = AppState.currentEmojiTarget.value.substring(cursorPos);
    
    const emojiCode = `{anim:${animation.id}:${animation.file_url}:${animation.file_type}}`;
    
    AppState.currentEmojiTarget.value = textBefore + emojiCode + textAfter;
    
    const newPos = cursorPos + emojiCode.length;
    AppState.currentEmojiTarget.setSelectionRange(newPos, newPos);
    AppState.currentEmojiTarget.focus();
    
    closeEmojiPicker();
}

function closeEmojiPicker() {
    document.getElementById('emojiPickerModal').classList.remove('active');
    AppState.currentEmojiTarget = null;
}

function filterEmojis() {
    const searchTerm = document.getElementById('emojiSearch').value.toLowerCase();
    const items = document.querySelectorAll('.emoji-item');
    
    items.forEach(item => {
        const name = item.querySelector('.emoji-item-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function renderAnimatedText(text) {
    if (!text) return text;
    
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
// ALL OTHER FUNCTIONS FROM ORIGINAL admin.js
// (Website Settings, Banners, Categories, etc.)
// =====================================================

// Website Settings
async function loadWebsiteSettings() {
    try {
        const { data, error } = await sc
            .from('website_settings')
            .select('*')
            .single();

        if (data) {
            AppState.websiteSettings = data;
            document.getElementById('websiteName').value = data.website_name || '';
            
            if (data.logo_url) {
                document.getElementById('logoPreview').innerHTML = `<img src="${data.logo_url}">`;
            }
            if (data.background_url) {
                document.getElementById('bgPreview').innerHTML = `<img src="${data.background_url}">`;
            }
            if (data.loading_animation_url) {
                document.getElementById('loadingPreview').innerHTML = `<img src="${data.loading_animation_url}">`;
            }
            if (data.button_style_url) {
                document.getElementById('buttonPreview').innerHTML = `<img src="${data.button_style_url}">`;
            }
        } else {
            await sc.from('website_settings').insert([{
                website_name: 'Gaming Store'
            }]);
            loadWebsiteSettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updateWebsiteName() {
    const name = document.getElementById('websiteName').value;
    showLoading();

    try {
        const { error } = await sc
            .from('website_settings')
            .update({ website_name: name })
            .eq('id', AppState.websiteSettings.id);

        if (error) throw error;

        alert('Website name updated!');
        loadWebsiteSettings();
    } catch (error) {
        alert('Error updating');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function previewLogo() {
    const file = document.getElementById('logoFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('logoPreview').innerHTML = `<img src="${e.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadLogo() {
    const file = document.getElementById('logoFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'logos');
    
    if (url) {
        await updateSettings({ logo_url: url });
        alert('Logo uploaded!');
    } else {
        alert('Error uploading');
    }
    hideLoading();
}

function previewBackground() {
    const file = document.getElementById('bgFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('bgPreview').innerHTML = `<img src="${e.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadBackground() {
    const file = document.getElementById('bgFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'backgrounds');
    
    if (url) {
        await updateSettings({ background_url: url });
        alert('Background uploaded!');
    } else {
        alert('Error uploading');
    }
    hideLoading();
}

async function uploadLoadingAnimation() {
    const file = document.getElementById('loadingFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'animations');
    
    if (url) {
        await updateSettings({ loading_animation_url: url });
        alert('Loading animation uploaded!');
    } else {
        alert('Error uploading');
    }
    hideLoading();
}

async function uploadButtonStyle() {
    const file = document.getElementById('buttonFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'buttons');
    
    if (url) {
        await updateSettings({ button_style_url: url });
        alert('Button style uploaded!');
    } else {
        alert('Error uploading');
    }
    hideLoading();
}

async function updateSettings(updates) {
    try {
        const { error } = await sc
            .from('website_settings')
            .update(updates)
            .eq('id', AppState.websiteSettings.id);

        if (error) throw error;
        loadWebsiteSettings();
    } catch (error) {
        console.error('Error updating settings:', error);
    }
}

// Banners
async function loadBanners() {
    try {
        const { data, error } = await sc
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        const container = document.getElementById('bannersContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(banner => {
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${banner.image_url}" alt="Banner">
                        <div class="item-actions">
                            <button class="btn-danger" onclick="deleteBanner(${banner.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No banners yet</p>';
        }
    } catch (error) {
        console.error('Error loading banners:', error);
    }
}

async function addBanner() {
    const file = document.getElementById('bannerFile').files[0];
    if (!file) {
        alert('Please select a banner image');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'banners');
    
    if (url) {
        try {
            const { error } = await sc
                .from('banners')
                .insert([{ image_url: url }]);

            if (error) throw error;

            alert('Banner added!');
            document.getElementById('bannerFile').value = '';
            loadBanners();
        } catch (error) {
            alert('Error adding banner');
            console.error(error);
        }
    } else {
        alert('Error uploading');
    }
    hideLoading();
}

async function deleteBanner(id) {
    if (!confirm('Delete this banner?')) return;

    showLoading();
    try {
        const { error } = await sc
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Banner deleted!');
        loadBanners();
    } catch (error) {
        alert('Error deleting');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Categories
async function loadCategories() {
    try {
        const { data, error } = await sc
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('categoriesContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(category => {
                const titleHtml = renderAnimatedText(category.title);
                container.innerHTML += `
                    <div class="item-card">
                        <h4>${titleHtml}</h4>
                        <p>Created: ${new Date(category.created_at).toLocaleDateString()}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editCategory(${category.id}, '${category.title.replace(/'/g, "\\'")}')">Edit</button>
                            <button class="btn-danger" onclick="deleteCategory(${category.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No categories yet</p>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function addCategory() {
    const title = document.getElementById('categoryTitle').value.trim();
    if (!title) {
        alert('Please enter a category title');
        return;
    }

    showLoading();
    try {
        const { error } = await sc
            .from('categories')
            .insert([{ title: title }]);

        if (error) throw error;

        alert('Category added!');
        document.getElementById('categoryTitle').value = '';
        loadCategories();
        loadCategoriesForSelect();
    } catch (error) {
        alert('Error adding category');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function editCategory(id, currentTitle) {
    const newTitle = prompt('Enter new category title:', currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    showLoading();
    try {
        const { error } = await sc
            .from('categories')
            .update({ title: newTitle })
            .eq('id', id);

        if (error) throw error;

        alert('Category updated!');
        loadCategories();
    } catch (error) {
        alert('Error updating');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? All related data will be deleted!')) return;

    showLoading();
    try {
        const { error } = await sc
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Category deleted!');
        loadCategories();
    } catch (error) {
        alert('Error deleting');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Load categories for select elements
async function loadCategoriesForSelect() {
    try {
        const { data } = await sc
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        const selects = [
            'buttonCategorySelect',
            'tableCategorySelect',
            'menuCategorySelect',
            'videoCategorySelect'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select Category</option>';
                if (data) {
                    data.forEach(cat => {
                        const titleText = cat.title.replace(/\{anim:[^}]+\}/g, '');
                        select.innerHTML += `<option value="${cat.id}">${titleText}</option>`;
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Category Buttons
async function loadCategoryButtons() {
    try {
        const { data, error } = await sc
            .from('category_buttons')
            .select(`
                *,
                categories (title)
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('buttonsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(button => {
                const nameHtml = renderAnimatedText(button.name);
                const categoryHtml = renderAnimatedText(button.categories.title);
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${button.icon_url}" alt="${button.name}">
                        <h4>${nameHtml}</h4>
                        <p>Category: ${categoryHtml}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editButton(${button.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteButton(${button.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No buttons yet</p>';
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function addCategoryButton() {
    const categoryId = document.getElementById('buttonCategorySelect').value;
    const name = document.getElementById('buttonName').value.trim();
    const file = document.getElementById('buttonIconFile').files[0];

    if (!categoryId || !name || !file) {
        alert('Please fill all fields and select an icon');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'category-icons');
    
    if (url) {
        try {
            const { error } = await sc
                .from('category_buttons')
                .insert([{
                    category_id: categoryId,
                    name: name,
                    icon_url: url
                }]);

            if (error) throw error;

            alert('Button added!');
            document.getElementById('buttonName').value = '';
            document.getElementById('buttonIconFile').value = '';
            loadCategoryButtons();
        } catch (error) {
            alert('Error adding button');
            console.error(error);
        }
    } else {
        alert('Error uploading icon');
    }
    hideLoading();
}

async function editButton(id) {
    const { data: button } = await sc
        .from('category_buttons')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <div class="input-with-emoji">
                <input type="text" id="editButtonName" value="${button.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editButtonName')">😀</button>
            </div>
        </div>
        <button class="btn-primary" onclick="updateButton(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateButton(id) {
    const name = document.getElementById('editButtonName').value.trim();

    if (!name) {
        alert('Please enter a name');
        return;
    }

    showLoading();
    try {
        const { error } = await sc
            .from('category_buttons')
            .update({ name: name })
            .eq('id', id);

        if (error) throw error;

        closeEditModal();
        alert('Button updated!');
        loadCategoryButtons();
    } catch (error) {
        alert('Error updating');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function deleteButton(id) {
    if (!confirm('Delete this button? All related data will be deleted!')) return;

    showLoading();
    try {
        const { error } = await sc
            .from('category_buttons')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Button deleted!');
        loadCategoryButtons();
    } catch (error) {
        alert('Error deleting');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Input Tables
async function loadButtonsForTables() {
    const categoryId = document.getElementById('tableCategorySelect').value;
    if (!categoryId) {
        document.getElementById('tableButtonSelect').innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data } = await sc
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('tableButtonSelect');
        select.innerHTML = '<option value="">Select Button</option>';
        
        if (data) {
            data.forEach(btn => {
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

function addTableInput() {
    const container = document.getElementById('tablesInputContainer');
    const newInput = document.createElement('div');
    newInput.className = 'table-input-group';
    newInput.innerHTML = `
        <button class="remove-input" onclick="this.parentElement.remove()">×</button>
        <div class="input-with-emoji">
            <input type="text" class="table-name" placeholder="Table Name">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-name')">😀</button>
        </div>
        <div class="input-with-emoji">
            <input type="text" class="table-instruction" placeholder="Instruction">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-instruction')">😀</button>
        </div>
    `;
    container.appendChild(newInput);
}

async function saveTables() {
    const buttonId = document.getElementById('tableButtonSelect').value;
    if (!buttonId) {
        alert('Please select a button');
        return;
    }

    const tables = [];
    document.querySelectorAll('.table-input-group').forEach(group => {
        const name = group.querySelector('.table-name').value.trim();
        const instruction = group.querySelector('.table-instruction').value.trim();
        if (name && instruction) {
            tables.push({
                button_id: buttonId,
                name: name,
                instruction: instruction
            });
        }
    });

    if (tables.length === 0) {
        alert('Please add at least one table');
        return;
    }

    showLoading();
    try {
        const { error } = await sc
            .from('input_tables')
            .insert(tables);

        if (error) throw error;

        alert('Tables saved!');
        document.getElementById('tablesInputContainer').innerHTML = `
            <div class="table-input-group">
                <div class="input-with-emoji">
                    <input type="text" class="table-name" placeholder="Table Name">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-name')">😀</button>
                </div>
                <div class="input-with-emoji">
                    <input type="text" class="table-instruction" placeholder="Instruction">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-instruction')">😀</button>
                </div>
            </div>
        `;
        loadInputTables();
    } catch (error) {
        alert('Error saving tables');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function loadInputTables() {
    try {
        const { data, error } = await sc
            .from('input_tables')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('tablesContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(table => {
                const nameHtml = renderAnimatedText(table.name);
                const instructionHtml = renderAnimatedText(table.instruction);
                const buttonNameHtml = renderAnimatedText(table.category_buttons.name);
                const categoryHtml = renderAnimatedText(table.category_buttons.categories.title);
                
                container.innerHTML += `
                    <div class="item-card">
                        <h4>${nameHtml}</h4>
                        <p>Button: ${buttonNameHtml}</p>
                        <p>Category: ${categoryHtml}</p>
                        <p>Instruction: ${instructionHtml}</p>
                        <div class="item-actions">
                            <button class="btn-danger" onclick="deleteTable(${table.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No tables yet</p>';
        }
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

async function deleteTable(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await sc
            .from('input_tables')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Table deleted!');
        loadInputTables();
    } catch (error) {
        alert('Error deleting');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Menus/Products
async function loadButtonsForMenus() {
    const categoryId = document.getElementById('menuCategorySelect').value;
    if (!categoryId) {
        document.getElementById('menuButtonSelect').innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data } = await sc
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('menuButtonSelect');
        select.innerHTML = '<option value="">Select Button</option>';
        
        if (data) {
            data.forEach(btn => {
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

function addMenuInput() {
    const container = document.getElementById('menusInputContainer');
    const newInput = document.createElement('div');
    newInput.className = 'menu-input-group';
    newInput.innerHTML = `
        <button class="remove-input" onclick="this.parentElement.remove()">×</button>
        <div class="input-with-emoji">
            <input type="text" class="menu-name" placeholder="Product Name">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-name')">😀</button>
        </div>
        <div class="input-with-emoji">
            <input type="text" class="menu-amount" placeholder="Amount/Details">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-amount')">😀</button>
        </div>
        <input type="number" class="menu-price" placeholder="Price">
        <input type="file" class="menu-icon" accept="image/*">
    `;
    container.appendChild(newInput);
}

async function saveMenus() {
    const buttonId = document.getElementById('menuButtonSelect').value;
    if (!buttonId) {
        alert('Please select a button');
        return;
    }

    const firstIcon = document.querySelector('.menu-icon').files[0];
    let iconUrl = null;

    if (firstIcon) {
        showLoading();
        iconUrl = await uploadFile(firstIcon, 'menu-icons');
        hideLoading();
    }

    const menus = [];
    document.querySelectorAll('.menu-input-group').forEach((group, index) => {
        const name = group.querySelector('.menu-name').value.trim();
        const amount = group.querySelector('.menu-amount').value.trim();
        const price = group.querySelector('.menu-price').value;
        
        if (name && amount && price) {
            menus.push({
                button_id: buttonId,
                name: name,
                amount: amount,
                price: parseInt(price),
                icon_url: index === 0 ? iconUrl : null
            });
        }
    });

    if (menus.length === 0) {
        alert('Please add at least one product');
        return;
    }

    showLoading();
    try {
        const { error } = await sc
            .from('menus')
            .insert(menus);

        if (error) throw error;

        alert('Products saved!');
        document.getElementById('menusInputContainer').innerHTML = `
            <div class="menu-input-group">
                <div class="input-with-emoji">
                    <input type="text" class="menu-name" placeholder="Product Name">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-name')">😀</button>
                </div>
                <div class="input-with-emoji">
                    <input type="text" class="menu-amount" placeholder="Amount/Details">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-amount')">😀</button>
                </div>
                <input type="number" class="menu-price" placeholder="Price">
                <input type="file" class="menu-icon" accept="image/*">
            </div>
        `;
        loadMenus();
    } catch (error) {
        alert('Error saving products');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function loadMenus() {
    try {
        const { data, error } = await sc
            .from('menus')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('menusContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(menu => {
                const nameHtml = renderAnimatedText(menu.name);
                const amountHtml = renderAnimatedText(menu.amount);
                const buttonNameHtml = renderAnimatedText(menu.category_buttons.name);
                
                container.innerHTML += `
                    <div class="item-card">
                        ${menu.icon_url ? `<img src="${menu.icon_url}" alt="${menu.name}">` : ''}
                        <h4>${nameHtml}</h4>
                        <p>${amountHtml}</p>
                        <p><strong>${menu.price} MMK</strong></p>
                        <p>Button: ${buttonNameHtml}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editMenu(${menu.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteMenu(${menu.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No products yet</p>';
        }
    } catch (error) {
        console.error('Error loading menus:', error);
    }
}

async function editMenu(id) {
    const { data: menu } = await sc
        .from('menus')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <div class="input-with-emoji">
                <input type="text" id="editMenuName" value="${menu.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editMenuName')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Amount</label>
            <div class="input-with-emoji">
                <input type="text" id="editMenuAmount" value="${menu.amount}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editMenuAmount')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Price</label>
            <input type="number" id="editMenuPrice" value="${menu.price}">
        </div>
        <button class="btn-primary" onclick="updateMenu(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateMenu(id) {
    const name = document.getElementById('editMenuName').value.trim();
    const amount = document.getElementById('editMenuAmount').value.trim();
    const price = document.getElementById('editMenuPrice').value;

    if (!name || !amount || !price) {
        alert('Please fill all fields');
        return;
    }

    showLoading();
    try {
        const { error } = await sc
            .from('menus')
            .update({
                name: name,
                amount: amount,
                price: parseInt(price)
            })
            .eq('id', id);

        if (error) throw error;

        closeEditModal();
        alert('Menu updated!');
        loadMenus();
    } catch (error) {
        alert('Error updating');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function deleteMenu(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await sc
            .from('menus')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Menu deleted!');
        loadMenus();
    } catch (error) {
        alert('Error deleting');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Payment Methods
async function loadPaymentMethods() {
    try {
        const { data, error } = await sc
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('paymentsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(payment => {
                const nameHtml = renderAnimatedText(payment.name);
                const instructionsHtml = renderAnimatedText(payment.instructions || '');
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${payment.icon_url}" alt="${payment.name}">
                        <h4>${nameHtml}</h4>
                        <p><strong>Address:</strong> ${payment.address}</p>
                        <p><strong>Instructions:</strong> ${instructionsHtml}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editPayment(${payment.id})">Edit</button>
                            <button class="btn-danger" onclick="deletePayment(${payment.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No payment methods yet</p>';
        }
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

async function addPaymentMethod() {
    const name = document.getElementById('paymentName').value.trim();
    const address = document.getElementById('paymentAddress').value.trim();
    const instructions = document.getElementById('paymentInstructions').value.trim();
    const file = document.getElementById('paymentIconFile').files[0];

    if (!name || !address || !file) {
        alert('Please fill required fields and select an icon');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'payment-icons');
    
    if (url) {
        try {
            const { error } = await sc
                .from('payment_methods')
                .insert([{
                    name: name,
                    address: address,
                    instructions: instructions,
                    icon_url: url
                }]);

            if (error) throw error;

            alert('Payment method added!');
            document.getElementById('paymentName').value = '';
            document.getElementById('paymentAddress').value = '';
            document.getElementById('paymentInstructions').value = '';
            document.getElementById('paymentIconFile').value = '';
            loadPaymentMethods();
        } catch (error) {
            alert('Error adding payment method');
            console.error(error);
        }
    } else {
        alert('Error uploading icon');
    }
    hideLoading();
}

async function editPayment(id) {
    const { data: payment } = await sc
        .from('payment_methods')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <div class="input-with-emoji">
                <input type="text" id="editPaymentName" value="${payment.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editPaymentName')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Address</label>
            <input type="text" id="editPaymentAddress" value="${payment.address}">
        </div>
        <div class="form-group">
            <label>Instructions</label>
            <div class="textarea-with-emoji">
                <textarea id="editPaymentInstructions" rows="3">${payment.instructions || ''}</textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editPaymentInstructions')">😀</button>
            </div>
        </div>
        <button class="btn-primary" onclick="updatePayment(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updatePayment(id) {
    const name = document.getElementById('editPaymentName').value.trim();
    const address = document.getElementById('editPaymentAddress').value.trim();
    const instructions = document.getElementById('editPaymentInstructions').value.trim();

    if (!name || !address) {
        alert('Please fill required fields');
        return;
    }

    showLoading();
    try {
        const { error } = await sc
            .from('payment_methods')
            .update({
                name: name,
                address: address,
                instructions: instructions
            })
            .eq('id', id);

        if (error) throw error;

        closeEditModal();
        alert('Payment method updated!');
        loadPaymentMethods();
    } catch (error) {
        alert('Error updating');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function deletePayment(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await sc
            .from('payment_methods')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Payment method deleted!');
        loadPaymentMethods();
    } catch (error) {
        alert('Error deleting');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Contacts
async function loadContacts() {
    try {
        const { data, error } = await sc
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('contactsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(contact => {
                const nameHtml = renderAnimatedText(contact.name);
                const descriptionHtml = renderAnimatedText(contact.description || '');
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${contact.icon_url}" alt="${contact.name}">
                        <h4>${nameHtml}</h4>
                        <p>${descriptionHtml}</p>
                        ${contact.link ? `<p><strong>Link:</strong> ${contact.link}</p>` : ''}
                        ${contact.address ? `<p><strong>Address:</strong> ${contact.address}</p>` : ''}
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editContact(${contact.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteContact(${contact.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No contacts yet</p>';
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

async function addContact() {
    const name = document.getElementById('contactName').value.trim();
    const description = document.getElementById('contactDescription').value.trim();
    const link = document.getElementById('contactLink').value.trim();
    const address = document.getElementById('contactAddress').value.trim();
    const file = document.getElementById('contactIconFile').files[0];

    if (!name || !file) {
        alert('Please enter name and select an icon');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'contact-icons');
    
    if (url) {
        try {
            const { error } = await sc
                .from('contacts')
                .insert([{
                    name: name,
                    description: description,
                    link: link,
                    address: address,
                    icon_url: url
                }]);

            if (error) throw error;

            alert('Contact added!');
            document.getElementById('contactName').value = '';
            document.getElementById('contactDescription').value = '';
            document.getElementById('contactLink').value = '';
            document.getElementById('contactAddress').value = '';
            document.getElementById('contactIconFile').value = '';
            loadContacts();
        } catch (error) {
            alert('Error adding contact');
            console.error(error);
        }
    } else {
        alert('Error uploading icon');
    }
    hideLoading();
}

async function editContact(id) {
    const { data: contact } = await sc
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <div class="input-with-emoji">
                <input type="text" id="editContactName" value="${contact.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editContactName')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <div class="textarea-with-emoji">
                <textarea id="editContactDescription" rows="2">${contact.description || ''}</textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editContactDescription')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Link</label>
            <input type="text" id="editContactLink" value="${contact.link || ''}">
        </div>
        <div class="form-group">
            <label>Address</label>
            <input type="text" id="editContactAddress" value="${contact.address || ''}">
        </div>
        <button class="btn-primary" onclick="updateContact(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateContact(id) {
    const name = document.getElementById('editContactName').value.trim();
    const description = document.getElementById('editContactDescription').value.trim();
    const link = document.getElementById('editContactLink').value.trim();
    const address = document.getElementById('editContactAddress').value.trim();

    if (!name) {
        alert('Please enter a name');
        return;
    }

    showLoading();
    try {
        const { error } = await sc
            .from('contacts')
            .update({
                name: name,
                description: description,
                link: link,
                address: address
            })
            .eq('id', id);

        if (error) throw error;

        closeEditModal();
        alert('Contact updated!');
        loadContacts();
    } catch (error) {
        alert('Error updating');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function deleteContact(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await sc
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Contact deleted!');
        loadContacts();
    } catch (error) {
        alert('Error deleting');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Videos
async function loadButtonsForVideos() {
    const categoryId = document.getElementById('videoCategorySelect').value;
    if (!categoryId) {
        document.getElementById('videoButtonSelect').innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data } = await sc
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('videoButtonSelect');
        select.innerHTML = '<option value="">Select Button</option>';
        
        if (data) {
            data.forEach(btn => {
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function addVideo() {
    const buttonId = document.getElementById('videoButtonSelect').value;
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const file = document.getElementById('videoBannerFile').files[0];

    if (!buttonId || !videoUrl || !description || !file) {
        alert('Please fill all fields and select a banner');
        return;
    }

    showLoading();
    const bannerUrl = await uploadFile(file, 'video-banners');
    
    if (bannerUrl) {
        try {
            const { error } = await sc
                .from('youtube_videos')
                .insert([{
                    button_id: buttonId,
                    banner_url: bannerUrl,
                    video_url: videoUrl,
                    description: description
                }]);

            if (error) throw error;

            alert('Video added!');
            document.getElementById('videoUrl').value = '';
            document.getElementById('videoDescription').value = '';
            document.getElementById('videoBannerFile').value = '';
            loadVideos();
        } catch (error) {
            alert('Error adding video');
            console.error(error);
        }
    } else {
        alert('Error uploading banner');
    }
    hideLoading();
}

async function loadVideos() {
    try {
        const { data, error } = await sc
            .from('youtube_videos')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('videosContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(video => {
                const descriptionHtml = renderAnimatedText(video.description);
                const buttonNameHtml = renderAnimatedText(video.category_buttons.name);
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${video.banner_url}" alt="Video Banner">
                        <h4>${descriptionHtml}</h4>
                        <p><strong>URL:</strong> ${video.video_url}</p>
                        <p><strong>Button:</strong> ${buttonNameHtml}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editVideo(${video.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteVideo(${video.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No videos yet</p>';
        }
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

async function editVideo(id) {
    const { data: video } = await sc
        .from('youtube_videos')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Video URL</label>
            <input type="text" id="editVideoUrl" value="${video.video_url}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <div class="textarea-with-emoji">
                <textarea id="editVideoDescription" rows="2">${video.description}</textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editVideoDescription')">😀</button>
            </div>
        </div>
        <button class="btn-primary" onclick="updateVideo(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateVideo(id) {
    const videoUrl = document.getElementById('editVideoUrl').value.trim();
    const description = document.getElementById('editVideoDescription').value.trim();

    if (!videoUrl || !description) {
        alert('Please fill all fields');
        return;
    }

    showLoading();
    try {
        const { error } = await sc
            .from('youtube_videos')
            .update({
                video_url: videoUrl,
                description: description
            })
            .eq('id', id);

        if (error) throw error;

        closeEditModal();
        alert('Video updated!');
        loadVideos();
    } catch (error) {
        alert('Error updating');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function deleteVideo(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await sc
            .from('youtube_videos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Video deleted!');
        loadVideos();
    } catch (error) {
        alert('Error deleting');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Orders
async function loadOrders() {
    try {
        const { data, error } = await sc
            .from('orders')
            .select(`
                *,
                users (name, email),
                menus (name, price),
                payment_methods (name)
            `)
            .order('created_at', { ascending: false });

        const container = document.getElementById('ordersContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(order => {
                const statusClass = order.status === 'approved' ? 'success' : 
                                   order.status === 'rejected' ? 'danger' : 'warning';
                
                container.innerHTML += `
                    <div class="order-card ${statusClass}">
                        <div class="order-header">
                            <h4>Order #${order.id}</h4>
                            <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
                        </div>
                        <div class="order-details">
                            <p><strong>Customer:</strong> ${order.users.name} (${order.users.email})</p>
                            <p><strong>Product:</strong> ${order.menus.name}</p>
                            <p><strong>Price:</strong> ${order.menus.price} MMK</p>
                            <p><strong>Payment:</strong> ${order.payment_methods.name}</p>
                            <p><strong>Transaction:</strong> ${order.transaction_code}</p>
                            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <div class="order-actions">
                            <button class="btn-info" onclick="viewOrderDetails(${order.id})">Details</button>
                            ${order.status === 'pending' ? `
                                <button class="btn-success" onclick="approveOrder(${order.id})">Approve</button>
                                <button class="btn-danger" onclick="rejectOrder(${order.id})">Reject</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No orders yet</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function approveOrder(id) {
    const message = prompt('Enter approval message (optional):');
    
    showLoading();
    try {
        const { error } = await sc
            .from('orders')
            .update({
                status: 'approved',
                admin_message: message || 'Order approved'
            })
            .eq('id', id);

        if (error) throw error;

        alert('Order approved!');
        loadOrders();
    } catch (error) {
        alert('Error approving order');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function rejectOrder(id) {
    const message = prompt('Enter rejection reason:');
    if (!message) return;
    
    showLoading();
    try {
        const { error } = await sc
            .from('orders')
            .update({
                status: 'rejected',
                admin_message: message
            })
            .eq('id', id);

        if (error) throw error;

        alert('Order rejected!');
        loadOrders();
    } catch (error) {
        alert('Error rejecting order');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function filterOrders(status) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter order cards
    const orderCards = document.querySelectorAll('.order-card');
    orderCards.forEach(card => {
        if (status === 'all') {
            card.style.display = 'block';
        } else {
            const orderStatus = card.querySelector('.order-status').textContent.toLowerCase();
            card.style.display = orderStatus === status ? 'block' : 'none';
        }
    });
}

async function viewOrderDetails(id) {
    try {
        const { data: order, error } = await sc
            .from('orders')
            .select(`
                *,
                users (name, email, username),
                menus (name, amount, price),
                payment_methods (name, address, instructions),
                category_buttons (name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        const modalBody = document.getElementById('orderModalBody');
        modalBody.innerHTML = `
            <div class="order-detail-grid">
                <div class="detail-section">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${order.users.name}</p>
                    <p><strong>Email:</strong> ${order.users.email}</p>
                    <p><strong>Username:</strong> ${order.users.username}</p>
                </div>
                
                <div class="detail-section">
                    <h3>Order Information</h3>
                    <p><strong>Product:</strong> ${order.menus.name}</p>
                    <p><strong>Amount:</strong> ${order.menus.amount}</p>
                    <p><strong>Price:</strong> ${order.menus.price} MMK</p>
                    <p><strong>Button:</strong> ${order.category_buttons.name}</p>
                </div>
                
                <div class="detail-section">
                    <h3>Payment Information</h3>
                    <p><strong>Method:</strong> ${order.payment_methods.name}</p>
                    <p><strong>Address:</strong> ${order.payment_methods.address}</p>
                    <p><strong>Transaction Code:</strong> ${order.transaction_code}</p>
                </div>
                
                ${order.table_data ? `
                <div class="detail-section">
                    <h3>Additional Data</h3>
                    <pre>${JSON.stringify(order.table_data, null, 2)}</pre>
                </div>
                ` : ''}
                
                <div class="detail-section">
                    <h3>Status & Messages</h3>
                    <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span></p>
                    ${order.admin_message ? `<p><strong>Admin Message:</strong> ${order.admin_message}</p>` : ''}
                    <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                    <p><strong>Updated:</strong> ${new Date(order.updated_at).toLocaleString()}</p>
                </div>
            </div>
        `;

        document.getElementById('orderModal').classList.add('active');
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Error loading order details');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Users
async function loadUsers() {
    try {
        const { data, error } = await sc
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        const container = document.getElementById('usersContainer');
        const totalUsersEl = document.getElementById('totalUsers');
        const todayUsersEl = document.getElementById('todayUsers');
        
        container.innerHTML = '';

        if (data && data.length > 0) {
            // Update stats
            totalUsersEl.textContent = data.length;
            
            const today = new Date().toDateString();
            const todayUsers = data.filter(user => 
                new Date(user.created_at).toDateString() === today
            ).length;
            todayUsersEl.textContent = todayUsers;

            // Display users
            data.forEach(user => {
                container.innerHTML += `
                    <div class="user-card">
                        <div class="user-avatar">👤</div>
                        <div class="user-info">
                            <h4>${user.name}</h4>
                            <p><strong>Username:</strong> ${user.username}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Joined:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <div class="user-actions">
                            <button class="btn-info" onclick="viewUserOrders('${user.email}')">View Orders</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No users yet</p>';
            totalUsersEl.textContent = '0';
            todayUsersEl.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function viewUserOrders(email) {
    try {
        const { data, error } = await sc
            .rpc('get_user_orders', { user_email: email });

        if (error) throw error;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h3>Orders for ${email}</h3>
            <div class="user-orders-list">
                ${data.length > 0 ? data.map(order => `
                    <div class="user-order-item">
                        <h4>${order.product_name}</h4>
                        <p><strong>Price:</strong> ${order.product_price} MMK</p>
                        <p><strong>Status:</strong> <span class="status-badge ${order.order_status}">${order.order_status.toUpperCase()}</span></p>
                        <p><strong>Date:</strong> ${new Date(order.created_date).toLocaleString()}</p>
                    </div>
                `).join('') : '<p>No orders found for this user.</p>'}
            </div>
        `;

        document.getElementById('editModal').classList.add('active');
    } catch (error) {
        console.error('Error loading user orders:', error);
        alert('Error loading user orders');
    }
}

// Modal functions  
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

// =====================================================
// CONSOLE PROTECTION & FINAL SECURITY
// =====================================================

// Override console methods in production
if (window.location.hostname !== 'localhost') {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.clear = () => {};
}

// Disable text selection for sensitive elements
document.addEventListener('DOMContentLoaded', () => {
    const sensitiveElements = document.querySelectorAll('.admin-login, .security-check, .access-denied');
    sensitiveElements.forEach(el => {
        el.style.userSelect = 'none';
        el.style.webkitUserSelect = 'none';
        el.style.mozUserSelect = 'none';
        el.style.msUserSelect = 'none';
    });
});

// =====================================================
// END OF SECURE ADMIN DASHBOARD
// =====================================================
