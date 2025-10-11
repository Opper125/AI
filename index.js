
// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';

// Initialize Supabase Client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized successfully');
} catch (error) {
    console.error('❌ Supabase initialization failed:', error);
}

// ========== GLOBAL STATE ==========
window.appState = {
    currentUser: null,
    websiteSettings: null,
    categories: [],
    payments: [],
    contacts: [],
    selectedMenuItem: null,
    currentMenu: null,
    selectedPayment: null,
    currentButtonId: null,
    currentTableData: {},
    allMenus: [],
    currentTables: [],
    currentBannerIndex: 0,
    bannerInterval: null,
    // NEW: Enhanced products state
    enhancedProducts: [],
    selectedEnhancedProduct: null,
    currentEnhancedProduct: null,
    currentProductBanners: [],
    currentProductContent: [],
    currentAds: [],
    isEnhancedProductMode: false
};

// ========== DISABLE RIGHT CLICK & CONTEXT MENU ==========
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('selectstart', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return true;
    }
    e.preventDefault();
    return false;
});

// Prevent F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
document.addEventListener('keydown', function(e) {
    // F12
    if (e.keyCode === 123) {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+I (Developer Tools)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+S (Save)
    if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
    }
});

// ========== TOAST NOTIFICATION SYSTEM ==========
function showToast(message, type = 'success', duration = 5000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '📢'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function removeToast(toast) {
    if (toast && toast.parentElement) {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}

// ========== ANIMATION STICKER SUPPORT ==========
function renderAnimatedContent(text) {
    if (!text) return '';
    
    const urlPattern = /(https?:\/\/[^\s]+\.(?:gif|png|jpg|jpeg|webp|mp4|webm)(\?[^\s]*)?)/gi;
    
    return text.replace(urlPattern, (url) => {
        const extension = url.split('.').pop().toLowerCase().split('?')[0];
        
        if (['mp4', 'webm'].includes(extension)) {
            return `<video class="inline-animation" autoplay loop muted playsinline><source src="${url}" type="video/${extension}"></video>`;
        }
        
        if (['gif', 'png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
            return `<img class="inline-animation" src="${url}" alt="sticker">`;
        }
        
        return url;
    });
}

function applyAnimationRendering(element, text) {
    if (!element || !text) return;
    element.innerHTML = renderAnimatedContent(text);
}

function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .inline-animation {
            display: inline-block;
            width: 20px;
            height: 20px;
            object-fit: contain;
            vertical-align: middle;
            margin: 0 2px;
            border-radius: 4px;
            pointer-events: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        .menu-item-name .inline-animation,
        .menu-item-amount .inline-animation {
            width: 18px;
            height: 18px;
        }
        
        .history-item .inline-animation,
        .contact-info .inline-animation {
            width: 16px;
            height: 16px;
        }
        
        .payment-info .inline-animation {
            width: 20px;
            height: 20px;
        }

        .order-summary .inline-animation {
            width: 20px;
            height: 20px;
        }

        /* Enhanced Product Styles */
        .enhanced-product-item {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: var(--shadow-md);
            transition: var(--transition);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .enhanced-product-item:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary-color);
        }

        .enhanced-product-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .enhanced-product-name {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .enhanced-product-price {
            font-size: 20px;
            font-weight: 700;
            color: var(--success-color);
        }

        .enhanced-product-original-price {
            font-size: 14px;
            color: var(--text-muted);
            text-decoration: line-through;
            margin-left: 8px;
        }

        .enhanced-product-sale-badge {
            background: var(--error-color);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 8px;
        }

        .enhanced-product-media-preview {
            width: 100%;
            height: 200px;
            background: var(--bg-glass);
            border-radius: var(--border-radius);
            margin-bottom: 12px;
            overflow: hidden;
            position: relative;
        }

        .enhanced-product-media-preview img,
        .enhanced-product-media-preview video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .enhanced-product-description {
            color: var(--text-secondary);
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .enhanced-product-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 8px;
            font-size: 12px;
            color: var(--text-muted);
        }

        .enhanced-product-detail {
            display: flex;
            flex-direction: column;
        }

        .enhanced-product-detail-label {
            font-weight: 600;
            margin-bottom: 2px;
        }

        .enhanced-product-gallery {
            display: flex;
            gap: 8px;
            margin: 16px 0;
            overflow-x: auto;
            padding: 8px 0;
        }

        .enhanced-product-gallery-item {
            min-width: 80px;
            height: 80px;
            border-radius: var(--border-radius);
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            transition: var(--transition);
        }

        .enhanced-product-gallery-item.active {
            border-color: var(--primary-color);
        }

        .enhanced-product-gallery-item img,
        .enhanced-product-gallery-item video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .enhanced-product-navigation {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 16px;
            margin: 16px 0;
        }

        .enhanced-product-nav-btn {
            background: var(--primary-color);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: var(--transition);
        }

        .enhanced-product-nav-btn:hover {
            background: var(--primary-dark);
            transform: scale(1.1);
        }

        .enhanced-product-nav-btn:disabled {
            background: var(--text-muted);
            cursor: not-allowed;
            transform: none;
        }

        .copy-btn {
            background: var(--accent-color);
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 8px;
            transition: var(--transition);
        }

        .copy-btn:hover {
            background: var(--primary-color);
        }

        .product-page-banner {
            width: 100%;
            margin-bottom: 20px;
            border-radius: var(--border-radius);
            overflow: hidden;
        }

        .product-page-content {
            background: var(--bg-card);
            padding: 20px;
            margin: 16px 0;
            border-radius: var(--border-radius);
            border-left: 4px solid var(--primary-color);
        }

        .ads-container {
            margin: 16px 0;
            text-align: center;
        }

        .category-button-info {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding: 12px;
            background: var(--bg-glass);
            border-radius: var(--border-radius);
        }

        .category-button-info img {
            width: 32px;
            height: 32px;
            border-radius: 50%;
        }

        .category-button-info h3 {
            color: var(--text-primary);
            font-size: 18px;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Gaming Store App initializing...');
    addAnimationStyles();
    await testDatabaseConnection();
    await loadWebsiteSettings();
    checkAuth();
    hideLoading();
});

// ========== DATABASE CONNECTION ==========
async function testDatabaseConnection() {
    const statusEl = document.getElementById('connectionStatus');
    const statusText = statusEl.querySelector('.status-text');
    const statusIcon = statusEl.querySelector('.status-icon');
    
    try {
        statusText.textContent = 'Testing database connection...';
        console.log('🔍 Testing database connection...');
        
        const { data, error } = await supabase
            .from('website_settings')
            .select('id')
            .limit(1);
        
        if (error) throw error;
        
        statusEl.classList.add('connected');
        statusIcon.textContent = '✅';
        statusText.textContent = 'Database connected successfully!';
        console.log('✅ Database connection successful');
        
        setTimeout(() => {
            statusEl.classList.add('hide');
            setTimeout(() => statusEl.style.display = 'none', 500);
        }, 3000);
        
    } catch (error) {
        statusEl.classList.add('error');
        statusIcon.textContent = '❌';
        statusText.textContent = 'Database connection failed!';
        console.error('❌ Database connection failed:', error);
        setTimeout(() => statusEl.classList.add('hide'), 10000);
    }
}

// ========== LOADING & AUTH ==========
function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 1000);
}

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        window.appState.currentUser = JSON.parse(user);
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    loadAppData();
}

function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('signupForm').classList.remove('active');
}

function showSignup() {
    document.getElementById('signupForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
}

// ========== SIGNUP & LOGIN ==========
async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const terms = document.getElementById('termsCheckbox').checked;

    if (!name || !username || !email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (!terms) {
        showToast('Please agree to the terms and conditions', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    showLoading();

    try {
        const { data: usernameCheck } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (usernameCheck) {
            hideLoading();
            showToast('Username already exists', 'error');
            return;
        }

        const { data: emailCheck } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (emailCheck) {
            hideLoading();
            showToast('Email already exists', 'error');
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .insert([{
                name: name,
                username: username,
                email: email,
                password: password,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        window.appState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        showToast(`Welcome ${name}! Account created successfully.`, 'success');
        showApp();

    } catch (error) {
        hideLoading();
        showToast('An error occurred during signup', 'error');
        console.error('❌ Signup error:', error);
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    showLoading();

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            hideLoading();
            showToast('No account found with this email', 'error');
            return;
        }

        if (data.password !== password) {
            hideLoading();
            showToast('Incorrect password', 'error');
            return;
        }

        hideLoading();
        window.appState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        showToast(`Welcome back, ${data.name}!`, 'success');
        showApp();

    } catch (error) {
        hideLoading();
        showToast('An error occurred during login', 'error');
        console.error('❌ Login error:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.appState.currentUser = null;
    showToast('Successfully logged out', 'success');
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// ========== WEBSITE SETTINGS ==========
async function loadWebsiteSettings() {
    try {
        const { data, error } = await supabase
            .from('website_settings')
            .select('*')
            .single();

        if (data) {
            window.appState.websiteSettings = data;
            applyWebsiteSettings();
        }
    } catch (error) {
        console.error('❌ Error loading settings:', error);
    }
}

function applyWebsiteSettings() {
    const settings = window.appState.websiteSettings;
    if (!settings) return;

    const logos = document.querySelectorAll('#authLogo, #appLogo');
    logos.forEach(logo => {
        if (settings.logo_url) {
            logo.src = settings.logo_url;
            logo.style.display = 'block';
        }
    });

    const names = document.querySelectorAll('#authWebsiteName, #appWebsiteName');
    names.forEach(name => {
        if (settings.website_name) {
            name.textContent = settings.website_name;
        }
    });

    if (settings.background_url) {
        const bgElement = document.getElementById('dynamicBackground');
        if (bgElement) {
            bgElement.style.backgroundImage = `url(${settings.background_url})`;
        }
    }

    if (settings.loading_animation_url) {
        applyLoadingAnimation(settings.loading_animation_url);
    }
}

function applyLoadingAnimation(animationUrl) {
    const loadingContainer = document.getElementById('loadingAnimation');
    if (!loadingContainer) return;

    const fileExt = animationUrl.split('.').pop().toLowerCase();
    const spinner = loadingContainer.querySelector('.spinner');
    if (spinner) spinner.remove();

    if (['gif', 'png', 'jpg', 'jpeg', 'json'].includes(fileExt)) {
        loadingContainer.innerHTML = `
            <img src="${animationUrl}" alt="Loading" style="max-width: 200px; max-height: 200px; pointer-events: none;">
            <p style="margin-top: 15px; color: white;">Loading...</p>
        `;
    } else if (['webm', 'mp4'].includes(fileExt)) {
        loadingContainer.innerHTML = `
            <video autoplay loop muted style="max-width: 200px; max-height: 200px; pointer-events: none;">
                <source src="${animationUrl}" type="video/${fileExt}">
            </video>
            <p style="margin-top: 15px; color: white;">Loading...</p>
        `;
    }
}

// ========== LOAD APP DATA ==========
async function loadAppData() {
    await Promise.all([
        loadBanners(),
        loadCategories(),
        loadPayments(),
        loadContacts(),
        loadProfile(),
        loadOrderHistory()
    ]);
}

// ========== IMPROVED BANNERS WITH PAGINATION ==========
async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            displayBanners(data);
        } else {
            document.getElementById('bannerSection').style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Error loading banners:', error);
        document.getElementById('bannerSection').style.display = 'none';
    }
}

function displayBanners(banners) {
    const container = document.getElementById('bannerContainer');
    const pagination = document.getElementById('bannerPagination');
    
    if (!container || !pagination) return;
    
    container.innerHTML = '';
    pagination.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'banner-wrapper';

    banners.forEach((banner, index) => {
        const item = document.createElement('div');
        item.className = 'banner-item';
        item.innerHTML = `<img src="${banner.image_url}" alt="Banner ${index + 1}">`;
        wrapper.appendChild(item);
    });

    container.appendChild(wrapper);

    // Create pagination dots
    if (banners.length > 1) {
        banners.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `banner-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => goToBanner(index, wrapper, banners.length));
            pagination.appendChild(dot);
        });

        // Auto-scroll every 5 seconds
        startBannerAutoScroll(wrapper, banners.length);
    }
}

function goToBanner(index, wrapper, totalBanners) {
    window.appState.currentBannerIndex = index;
    wrapper.style.transform = `translateX(-${index * 100}%)`;
    
    // Update pagination dots
    document.querySelectorAll('.banner-dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
    });
}

function startBannerAutoScroll(wrapper, totalBanners) {
    // Clear existing interval
    if (window.appState.bannerInterval) {
        clearInterval(window.appState.bannerInterval);
    }
    
    window.appState.bannerInterval = setInterval(() => {
        window.appState.currentBannerIndex = (window.appState.currentBannerIndex + 1) % totalBanners;
        goToBanner(window.appState.currentBannerIndex, wrapper, totalBanners);
    }, 5000);
}

// ========== IMPROVED CATEGORIES WITH HORIZONTAL SCROLL ==========
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            for (const category of data) {
                const { data: buttons } = await supabase
                    .from('category_buttons')
                    .select('*')
                    .eq('category_id', category.id)
                    .order('created_at', { ascending: true });
                
                category.category_buttons = buttons || [];
            }
            
            window.appState.categories = data;
            displayCategories(data);
        }
    } catch (error) {
        console.error('❌ Error loading categories:', error);
    }
}

function displayCategories(categories) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    categories.forEach(category => {
        if (category.category_buttons && category.category_buttons.length > 0) {
            const section = document.createElement('div');
            section.className = 'category-section';

            const titleDiv = document.createElement('h3');
            titleDiv.className = 'category-title';
            applyAnimationRendering(titleDiv, category.title);
            section.appendChild(titleDiv);
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'category-buttons';
            
            const buttonsWrapper = document.createElement('div');
            buttonsWrapper.className = 'category-buttons-wrapper';
            buttonsWrapper.id = `category-${category.id}`;
            
            buttonsContainer.appendChild(buttonsWrapper);
            section.appendChild(buttonsContainer);
            container.appendChild(section);
            
            displayCategoryButtons(category.id, category.category_buttons);
        }
    });
}

function displayCategoryButtons(categoryId, buttons) {
    const container = document.getElementById(`category-${categoryId}`);
    if (!container) return;

    buttons.forEach(button => {
        const btnEl = document.createElement('div');
        btnEl.className = 'category-button';
        btnEl.innerHTML = `
            <img src="${button.icon_url}" alt="${button.name}">
            <span></span>
        `;
        
        const nameSpan = btnEl.querySelector('span');
        applyAnimationRendering(nameSpan, button.name);
        
        btnEl.addEventListener('click', () => openCategoryPage(categoryId, button.id, button.name, button.icon_url));
        container.appendChild(btnEl);
    });
}

// ========== ENHANCED CATEGORY PAGE SYSTEM ==========
async function openCategoryPage(categoryId, buttonId, buttonName, buttonIcon) {
    console.log('\n🎮 ========== OPENING CATEGORY PAGE ==========');
    console.log('Category ID:', categoryId);
    console.log('Button ID:', buttonId);
    console.log('Button Name:', buttonName);
    
    showLoading();

    try {
        // Reset state
        window.appState.currentButtonId = buttonId;
        window.appState.selectedMenuItem = null;
        window.appState.currentMenu = null;
        window.appState.selectedEnhancedProduct = null;
        window.appState.currentEnhancedProduct = null;
        window.appState.currentTableData = {};
        window.appState.allMenus = [];
        window.appState.enhancedProducts = [];
        window.appState.currentTables = [];
        window.appState.currentProductBanners = [];
        window.appState.currentProductContent = [];
        window.appState.isEnhancedProductMode = false;
        
        // Load both original and enhanced products
        const [tablesResult, menusResult, videosResult, enhancedProductsResult, bannersResult, contentResult, adsResult] = await Promise.all([
            supabase.from('input_tables').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('menus').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.rpc('get_enhanced_products_with_details', { p_button_id: buttonId }),
            supabase.rpc('get_product_page_banners', { p_button_id: buttonId }),
            supabase.rpc('get_product_page_content', { p_button_id: buttonId }),
            supabase.rpc('get_active_ads')
        ]);

        if (menusResult.error) throw menusResult.error;
        if (tablesResult.error) throw tablesResult.error;
        if (videosResult.error) throw videosResult.error;
        if (enhancedProductsResult.error) throw enhancedProductsResult.error;

        const tables = tablesResult.data || [];
        const menus = menusResult.data || [];
        const videos = videosResult.data || [];
        const enhancedProducts = enhancedProductsResult.data || [];
        const banners = bannersResult.data || [];
        const content = contentResult.data || [];
        const ads = adsResult.data || [];

        // Store in global state
        window.appState.allMenus = menus;
        window.appState.enhancedProducts = enhancedProducts;
        window.appState.currentTables = tables;
        window.appState.currentProductBanners = banners;
        window.appState.currentProductContent = content;
        window.appState.currentAds = ads;

        console.log('✅ Loaded data:');
        console.log('  - Tables:', tables.length);
        console.log('  - Original Menus:', menus.length);
        console.log('  - Enhanced Products:', enhancedProducts.length);
        console.log('  - Videos:', videos.length);
        console.log('  - Banners:', banners.length);
        console.log('  - Content:', content.length);
        console.log('  - Ads:', ads.length);

        hideLoading();

        // Determine which system to use
        if (enhancedProducts.length > 0 || menus.length > 0) {
            showProductPage(buttonName, buttonIcon, tables, menus, enhancedProducts, videos, banners, content, ads);
        } else {
            showToast('No products available for this category', 'warning');
        }

    } catch (error) {
        hideLoading();
        console.error('❌ Error loading category data:', error);
        showToast('Error loading products. Please try again.', 'error');
    }
}

// Show Enhanced Product Page
function showProductPage(buttonName, buttonIcon, tables, originalMenus, enhancedProducts, videos, banners, content, ads) {
    const modal = document.getElementById('purchaseModal');
    const modalContent = document.getElementById('purchaseContent');
    
    let html = '<div class="enhanced-product-page">';
    
    // Category Button Info
    html += `
        <div class="category-button-info">
            <img src="${buttonIcon}" alt="${buttonName}">
            <h3>${renderAnimatedContent(buttonName)}</h3>
        </div>
    `;
    
    // Product Page Banners
    if (banners.length > 0) {
        html += '<div class="product-page-banners">';
        if (banners.length === 1) {
            html += `<img src="${banners[0].banner_url}" alt="Banner" class="product-page-banner">`;
        } else {
            html += `
                <div class="banner-container">
                    <div class="banner-wrapper" id="productBannerWrapper">
                        ${banners.map((banner, index) => `
                            <div class="banner-item">
                                <img src="${banner.banner_url}" alt="Banner ${index + 1}" class="product-page-banner">
                            </div>
                        `).join('')}
                    </div>
                    <div class="banner-pagination" id="productBannerPagination">
                        ${banners.map((_, index) => `
                            <div class="banner-dot ${index === 0 ? 'active' : ''}" onclick="goToProductBanner(${index})"></div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        html += '</div>';
    }
    
    // Ads between banners and content
    if (ads.length > 0) {
        html += '<div class="ads-container">';
        ads.forEach(ad => {
            html += `<div class="ad-banner" style="width: ${ad.banner_size}">${ad.script_code}</div>`;
        });
        html += '</div>';
    }
    
    // Product Page Content
    if (content.length > 0) {
        html += '<div class="product-page-content-section">';
        content.forEach(contentItem => {
            html += `<div class="product-page-content">${renderAnimatedContent(contentItem.content_text)}</div>`;
        });
        html += '</div>';
    }
    
    // Input Tables (if any)
    if (tables.length > 0) {
        html += '<div class="input-tables-section" style="margin-bottom: 24px;">';
        tables.forEach(table => {
            html += `
                <div class="form-group">
                    <label data-table-label="${table.id}" style="font-weight: 600; color: var(--text-primary);"></label>
                    <input type="text" 
                           id="table-${table.id}" 
                           data-table-id="${table.id}"
                           placeholder="${table.instruction || ''}"
                           required>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Products Section
    html += '<h3 style="margin: 20px 0 16px 0; font-size: 20px; font-weight: 700; color: var(--text-primary);">Select Product</h3>';
    
    // Enhanced Products (Priority)
    if (enhancedProducts.length > 0) {
        html += '<div class="enhanced-products-section">';
        enhancedProducts.forEach(product => {
            const firstMedia = product.media && product.media.length > 0 ? product.media[0] : null;
            html += `
                <div class="enhanced-product-item" data-enhanced-product-id="${product.id}">
                    <div class="enhanced-product-header">
                        <div class="enhanced-product-name" data-enhanced-product-name="${product.id}"></div>
                        <div class="enhanced-product-pricing">
                            <span class="enhanced-product-price">${product.current_price} ${product.currency_type}</span>
                            ${product.sale_percentage > 0 ? `
                                <span class="enhanced-product-original-price">${product.original_price} ${product.currency_type}</span>
                                <span class="enhanced-product-sale-badge">${product.sale_percentage}% OFF</span>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${firstMedia ? `
                        <div class="enhanced-product-media-preview">
                            ${firstMedia.type === 'video' ? `
                                <video autoplay loop muted>
                                    <source src="${firstMedia.url}" type="video/mp4">
                                </video>
                            ` : `
                                <img src="${firstMedia.url}" alt="${product.name}">
                            `}
                        </div>
                    ` : ''}
                    
                    <div class="enhanced-product-description" data-enhanced-product-description="${product.id}"></div>
                    
                    <div class="enhanced-product-details">
                        ${product.stock_quantity !== null ? `
                            <div class="enhanced-product-detail">
                                <div class="enhanced-product-detail-label">Stock</div>
                                <div>${product.stock_quantity}</div>
                            </div>
                        ` : ''}
                        ${product.delivery_time ? `
                            <div class="enhanced-product-detail">
                                <div class="enhanced-product-detail-label">Delivery</div>
                                <div>${product.delivery_time}</div>
                            </div>
                        ` : ''}
                        ${product.product_type ? `
                            <div class="enhanced-product-detail">
                                <div class="enhanced-product-detail-label">Type</div>
                                <div>${product.product_type}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Original Products (if no enhanced products or both exist)
    if (originalMenus.length > 0) {
        html += `<div class="original-products-section" ${enhancedProducts.length > 0 ? 'style="margin-top: 32px;"' : ''}>`;
        if (enhancedProducts.length > 0) {
            html += '<h4 style="margin-bottom: 16px; color: var(--text-secondary);">Classic Products</h4>';
        }
        html += '<div class="menu-items">';
        originalMenus.forEach(menu => {
            html += `
                <div class="menu-item" data-menu-id="${menu.id}">
                    ${menu.icon_url ? `<img src="${menu.icon_url}" class="menu-item-icon" alt="Product">` : '<div class="menu-item-icon" style="background: var(--bg-glass);"></div>'}
                    <div class="menu-item-info">
                        <div class="menu-item-name" data-menu-name="${menu.id}"></div>
                        <div class="menu-item-amount" data-menu-amount="${menu.id}"></div>
                        <div class="menu-item-price">${menu.price} MMK</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Video Tutorials
    if (videos.length > 0) {
        html += '<div class="video-section"><h3>Tutorials & Guides</h3>';
        videos.forEach(video => {
            html += `
                <div class="video-item" style="cursor:pointer;">
                    <img src="${video.banner_url}" alt="Tutorial Video">
                    <p data-video-desc="${video.id}"></p>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Continue Button
    html += `<button class="btn-primary" id="buyNowBtn" style="margin-top: 24px; width: 100%;">Continue to Purchase</button>`;
    html += '</div>';

    modalContent.innerHTML = html;
    modal.classList.add('active');

    // Apply animations and attach events
    setTimeout(() => {
        console.log('🎨 Applying animations and attaching events...');
        
        // Initialize product banners if multiple
        if (banners.length > 1) {
            startProductBannerAutoScroll();
        }
        
        // Render table labels
        tables.forEach(table => {
            const labelEl = document.querySelector(`[data-table-label="${table.id}"]`);
            if (labelEl) applyAnimationRendering(labelEl, table.name);
        });

        // Render enhanced products
        enhancedProducts.forEach(product => {
            const nameEl = document.querySelector(`[data-enhanced-product-name="${product.id}"]`);
            const descEl = document.querySelector(`[data-enhanced-product-description="${product.id}"]`);
            if (nameEl) applyAnimationRendering(nameEl, product.name);
            if (descEl) applyAnimationRendering(descEl, product.description || '');
        });

        // Render original menu items
        originalMenus.forEach(menu => {
            const nameEl = document.querySelector(`[data-menu-name="${menu.id}"]`);
            const amountEl = document.querySelector(`[data-menu-amount="${menu.id}"]`);
            if (nameEl) applyAnimationRendering(nameEl, menu.name);
            if (amountEl) applyAnimationRendering(amountEl, menu.amount);
        });

        // Render video descriptions
        videos.forEach(video => {
            const descEl = document.querySelector(`[data-video-desc="${video.id}"]`);
            if (descEl) applyAnimationRendering(descEl, video.description);
            
            // Add click event for video
            const videoItem = descEl.closest('.video-item');
            if (videoItem) {
                videoItem.addEventListener('click', () => {
                    window.open(video.video_url, '_blank');
                });
            }
        });

        // Attach enhanced product click events
        const enhancedProductItems = document.querySelectorAll('.enhanced-product-item');
        console.log('📌 Attaching click events to', enhancedProductItems.length, 'enhanced product items');
        
        enhancedProductItems.forEach(item => {
            const productId = parseInt(item.getAttribute('data-enhanced-product-id'));
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Enhanced product clicked:', productId);
                selectEnhancedProduct(productId);
            });
        });

        // Attach original menu item click events
        const menuItems = document.querySelectorAll('.menu-item');
        console.log('📌 Attaching click events to', menuItems.length, 'menu items');
        
        menuItems.forEach(item => {
            const menuId = parseInt(item.getAttribute('data-menu-id'));
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Menu item clicked:', menuId);
                selectMenuItem(menuId);
            });
        });

        // Attach buy button event
        const buyBtn = document.getElementById('buyNowBtn');
        if (buyBtn) {
            buyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🛒 Buy button clicked');
                proceedToPurchase();
            });
        }

        console.log('✅ Events attached successfully');
    }, 150);
}

// Product Banner Navigation
function goToProductBanner(index) {
    const wrapper = document.getElementById('productBannerWrapper');
    const dots = document.querySelectorAll('#productBannerPagination .banner-dot');
    
    if (wrapper) {
        wrapper.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === index);
        });
    }
}

function startProductBannerAutoScroll() {
    const wrapper = document.getElementById('productBannerWrapper');
    const dots = document.querySelectorAll('#productBannerPagination .banner-dot');
    let currentIndex = 0;
    
    if (wrapper && dots.length > 1) {
        setInterval(() => {
            currentIndex = (currentIndex + 1) % dots.length;
            goToProductBanner(currentIndex);
        }, 5000);
    }
}

// Enhanced Product Selection
function selectEnhancedProduct(productId) {
    console.log('\n🔍 ========== SELECTING ENHANCED PRODUCT ==========');
    console.log('Product ID:', productId, '(type:', typeof productId, ')');
    console.log('Available enhanced products:', window.appState.enhancedProducts.length);
    
    if (!productId || isNaN(productId)) {
        console.error('❌ Invalid enhanced product ID');
        showToast('Invalid product selection', 'error');
        return;
    }

    const parsedProductId = parseInt(productId);
    window.appState.selectedEnhancedProduct = parsedProductId;
    window.appState.isEnhancedProductMode = true;
    
    // Clear original product selection
    window.appState.selectedMenuItem = null;
    window.appState.currentMenu = null;
    
    // Find product in stored data
    const product = window.appState.enhancedProducts.find(p => p.id === parsedProductId);
    
    if (product) {
        window.appState.currentEnhancedProduct = product;
        console.log('✅ Enhanced Product found and stored:');
        console.log('  - ID:', product.id);
        console.log('  - Name:', product.name);
        console.log('  - Current Price:', product.current_price);
        console.log('  - Currency:', product.currency_type);
    } else {
        console.error('❌ Enhanced Product not found in stored products');
        console.log('Available enhanced product IDs:', window.appState.enhancedProducts.map(p => p.id));
        showToast('Product data not found. Please try again.', 'error');
        return;
    }

    // Update UI
    document.querySelectorAll('.enhanced-product-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-enhanced-product-id="${parsedProductId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        console.log('✅ UI updated - enhanced product marked as selected');
    } else {
        console.warn('⚠️ Could not find enhanced product element to mark as selected');
    }
}

// Original Menu Selection (updated)
function selectMenuItem(menuId) {
    console.log('\n🔍 ========== SELECTING MENU ITEM ==========');
    console.log('Menu ID:', menuId, '(type:', typeof menuId, ')');
    console.log('Available menus:', window.appState.allMenus.length);
    
    if (!menuId || isNaN(menuId)) {
        console.error('❌ Invalid menu ID');
        showToast('Invalid product selection', 'error');
        return;
    }

    const parsedMenuId = parseInt(menuId);
    window.appState.selectedMenuItem = parsedMenuId;
    window.appState.isEnhancedProductMode = false;
    
    // Clear enhanced product selection
    window.appState.selectedEnhancedProduct = null;
    window.appState.currentEnhancedProduct = null;
    
    // Find menu in stored data
    const menu = window.appState.allMenus.find(m => m.id === parsedMenuId);
    
    if (menu) {
        window.appState.currentMenu = menu;
        console.log('✅ Menu found and stored:');
        console.log('  - ID:', menu.id);
        console.log('  - Name:', menu.name);
        console.log('  - Price:', menu.price);
        console.log('  - Amount:', menu.amount);
    } else {
        console.error('❌ Menu not found in stored menus');
        console.log('Available menu IDs:', window.appState.allMenus.map(m => m.id));
        showToast('Product data not found. Please try again.', 'error');
        return;
    }

    // Update UI
    document.querySelectorAll('.enhanced-product-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-menu-id="${parsedMenuId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        console.log('✅ UI updated - menu item marked as selected');
    } else {
        console.warn('⚠️ Could not find menu item element to mark as selected');
    }
}

function closePurchaseModal() {
    console.log('🚪 Closing purchase modal');
    document.getElementById('purchaseModal').classList.remove('active');
}

// Updated Proceed to Purchase
async function proceedToPurchase() {
    console.log('\n🛒 ========== PROCEEDING TO PURCHASE ==========');
    console.log('Enhanced Product Mode:', window.appState.isEnhancedProductMode);
    console.log('Selected Enhanced Product ID:', window.appState.selectedEnhancedProduct);
    console.log('Selected Menu ID:', window.appState.selectedMenuItem);
    console.log('Button ID:', window.appState.currentButtonId);
    
    // Validation
    if (!window.appState.isEnhancedProductMode && !window.appState.selectedMenuItem) {
        console.error('❌ No product selected');
        showToast('Please select a product first', 'warning');
        return;
    }
    
    if (window.appState.isEnhancedProductMode && !window.appState.selectedEnhancedProduct) {
        console.error('❌ No enhanced product selected');
        showToast('Please select a product first', 'warning');
        return;
    }

    // Verify product data
    let currentProduct = null;
    if (window.appState.isEnhancedProductMode) {
        if (!window.appState.currentEnhancedProduct) {
            console.error('❌ Enhanced product data not found');
            const product = window.appState.enhancedProducts.find(p => p.id === window.appState.selectedEnhancedProduct);
            if (product) {
                window.appState.currentEnhancedProduct = product;
                console.log('✅ Enhanced product data recovered:', product);
            } else {
                console.error('❌ Could not recover enhanced product data');
                showToast('Product data not found. Please select the product again.', 'error');
                return;
            }
        }
        currentProduct = window.appState.currentEnhancedProduct;
    } else {
        if (!window.appState.currentMenu) {
            console.error('❌ Menu data not found');
            const menu = window.appState.allMenus.find(m => m.id === window.appState.selectedMenuItem);
            if (menu) {
                window.appState.currentMenu = menu;
                console.log('✅ Menu data recovered:', menu);
            } else {
                console.error('❌ Could not recover menu data');
                showToast('Product data not found. Please select the product again.', 'error');
                return;
            }
        }
        currentProduct = window.appState.currentMenu;
    }

    // Collect table data
    const tableData = {};
    let allFilled = true;

    console.log('📝 Collecting table data from', window.appState.currentTables.length, 'tables');
    
    window.appState.currentTables.forEach(table => {
        const inputEl = document.querySelector(`[data-table-id="${table.id}"]`);
        if (inputEl) {
            const value = inputEl.value.trim();
            console.log(`  - Table ${table.id} (${table.name}):`, value || '(empty)');
            if (!value) {
                allFilled = false;
            }
            tableData[table.name] = value; // Use table name as key
        } else {
            console.warn(`⚠️ Input element not found for table ${table.id}`);
        }
    });

    if (window.appState.currentTables.length > 0 && !allFilled) {
        console.error('❌ Not all required fields filled');
        showToast('Please fill in all required fields', 'warning');
        return;
    }

    window.appState.currentTableData = tableData;
    console.log('✅ Table data collected:', tableData);

    closePurchaseModal();
    
    console.log('➡️ Moving to payment modal...');
    await showPaymentModal();
}

// Updated Payment Modal
async function showPaymentModal() {
    console.log('\n💳 ========== SHOWING PAYMENT MODAL ==========');
    
    let currentProduct = null;
    if (window.appState.isEnhancedProductMode) {
        currentProduct = window.appState.currentEnhancedProduct;
    } else {
        currentProduct = window.appState.currentMenu;
    }
    
    if (!currentProduct) {
        console.error('❌ Product data not found in payment modal');
        showToast('Error: Product data not found. Please try again.', 'error');
        return;
    }

    console.log('✅ Product data available:');
    console.log('  - Name:', currentProduct.name);
    if (window.appState.isEnhancedProductMode) {
        console.log('  - Price:', currentProduct.current_price, currentProduct.currency_type);
    } else {
        console.log('  - Price:', currentProduct.price, 'MMK');
    }

    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');

    showLoading();

    // Load payments if not loaded
    if (!window.appState.payments || window.appState.payments.length === 0) {
        console.log('📥 Loading payment methods...');
        await loadPayments();
    }

    hideLoading();

    let availablePayments = [];
    
    if (window.appState.isEnhancedProductMode && currentProduct.payment_methods) {
        // Use product-specific payment methods for enhanced products
        availablePayments = currentProduct.payment_methods;
    } else {
        // Use all payment methods for original products
        availablePayments = window.appState.payments;
    }

    console.log('💳 Available payment methods:', availablePayments.length);

    let html = '<div class="payment-selection">';
    
    // Order Summary
    const productPrice = window.appState.isEnhancedProductMode ? 
        `${currentProduct.current_price} ${currentProduct.currency_type}` : 
        `${currentProduct.price} MMK`;
    
    html += `<div class="order-summary">
        <h3 data-order-summary-name style="font-size: 18px; font-weight: 700; margin-bottom: 8px;"></h3>
        <p data-order-summary-amount style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px;"></p>
        <p class="price">${productPrice}</p>
    </div>`;

    html += '<h3 style="margin: 24px 0 16px 0; font-size: 20px; font-weight: 700; color: var(--text-primary);">Select Payment Method</h3>';
    
    // Payment Methods
    if (availablePayments.length === 0) {
        html += '<div style="text-align: center; color: var(--warning-color); padding: 40px; background: rgba(245, 158, 11, 0.1); border-radius: var(--border-radius); margin: 20px 0;"><p>⚠️ No payment methods available</p><p style="font-size: 14px; margin-top: 8px; color: var(--text-muted);">Please contact admin to set up payment methods</p></div>';
    } else {
        html += '<div class="payment-methods">';
        availablePayments.forEach(payment => {
            html += `
                <div class="payment-method" data-payment-id="${payment.id}">
                    <img src="${payment.icon_url}" alt="${payment.name}">
                    <span data-payment-name="${payment.id}"></span>
                </div>
            `;
        });
        html += '</div>';
    }

    html += '<div id="paymentDetails" style="display:none;"></div>';
    html += `<button class="btn-primary" id="submitOrderBtn" style="margin-top: 24px; width: 100%;" ${availablePayments.length === 0 ? 'disabled' : ''}>Submit Order</button>`;
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    // Apply animations and attach events
    setTimeout(() => {
        console.log('🎨 Rendering payment modal content...');
        
        // Render order summary
        const summaryNameEl = document.querySelector('[data-order-summary-name]');
        const summaryAmountEl = document.querySelector('[data-order-summary-amount]');
        if (summaryNameEl) applyAnimationRendering(summaryNameEl, currentProduct.name);
        if (summaryAmountEl) {
            const amountText = window.appState.isEnhancedProductMode ? 
                (currentProduct.description || '') : 
                (currentProduct.amount || '');
            applyAnimationRendering(summaryAmountEl, amountText);
        }

        // Render payment names
        availablePayments.forEach(payment => {
            const nameEl = document.querySelector(`[data-payment-name="${payment.id}"]`);
            if (nameEl) applyAnimationRendering(nameEl, payment.name);
        });

        // Attach payment method click events
        const paymentMethods = document.querySelectorAll('.payment-method');
        console.log('📌 Attaching click events to', paymentMethods.length, 'payment methods');
        
        paymentMethods.forEach(item => {
            const paymentId = parseInt(item.getAttribute('data-payment-id'));
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Payment method clicked:', paymentId);
                selectPayment(paymentId);
            });
        });

        // Attach submit button event
        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📤 Submit order button clicked');
                submitOrder();
            });
        }

        console.log('✅ Payment modal events attached');
    }, 150);
}

// Rest of the functions remain similar with enhanced product support...
// Continue with selectPayment, submitOrder, loadPayments, etc. with enhanced product logic

async function loadPayments() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true});

        if (error) throw error;

        window.appState.payments = data || [];
        console.log(`✅ Loaded ${data?.length || 0} payment methods`);
        return data || [];
    } catch (error) {
        console.error('❌ Error loading payments:', error);
        window.appState.payments = [];
        return [];
    }
}

async function selectPayment(paymentId) {
    console.log('\n💳 ========== SELECTING PAYMENT ==========');
    console.log('Payment ID:', paymentId);
    
    window.appState.selectedPayment = parseInt(paymentId);

    // Update UI
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });

    const selectedEl = document.querySelector(`[data-payment-id="${paymentId}"]`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
        console.log('✅ Payment method marked as selected');
    }

    // Load payment details
    try {
        const { data: payment, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error) throw error;

        console.log('✅ Payment details loaded:', payment.name);

        const detailsDiv = document.getElementById('paymentDetails');
        if (detailsDiv && payment) {
            detailsDiv.style.display = 'block';
            detailsDiv.innerHTML = `
                <div class="payment-info">
                    <h4 data-payment-detail-name style="font-size: 18px; font-weight: 600; margin-bottom: 12px;"></h4>
                    <p data-payment-detail-instruction style="margin-bottom: 12px; line-height: 1.5;"></p>
                    <p style="margin-bottom: 16px;"><strong>Payment Address:</strong> 
                        <span data-payment-detail-address style="color: var(--accent-color); font-weight: 600;"></span>
                        <button class="copy-btn" onclick="copyToClipboard('${payment.address}')">Copy</button>
                    </p>
                    <div class="form-group" style="margin-top: 20px;">
                        <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px; display: block;">Transaction ID (Last 6 digits)</label>
                        <input type="text" id="transactionCode" maxlength="6" placeholder="Enter last 6 digits" required style="font-family: monospace; letter-spacing: 1px;">
                    </div>
                </div>
            `;

            // Render with animations
            setTimeout(() => {
                const nameEl = document.querySelector('[data-payment-detail-name]');
                const instructionEl = document.querySelector('[data-payment-detail-instruction]');
                const addressEl = document.querySelector('[data-payment-detail-address]');
                
                if (nameEl) applyAnimationRendering(nameEl, payment.name);
                if (instructionEl) applyAnimationRendering(instructionEl, payment.instructions || 'Please complete payment and enter transaction details below.');
                if (addressEl) applyAnimationRendering(addressEl, payment.address);
            }, 50);
        }
    } catch (error) {
        console.error('❌ Error loading payment details:', error);
        showToast('Error loading payment details', 'error');
    }
}

// Copy to clipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Payment address copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Failed to copy. Please copy manually.', 'error');
    });
}

function closePaymentModal() {
    console.log('🚪 Closing payment modal');
    document.getElementById('paymentModal').classList.remove('active');
}

// Updated Submit Order
async function submitOrder() {
    console.log('\n📤 ========== SUBMITTING ORDER ==========');
    console.log('Enhanced Product Mode:', window.appState.isEnhancedProductMode);
    console.log('State check:');
    console.log('  - User ID:', window.appState.currentUser?.id);
    console.log('  - Enhanced Product ID:', window.appState.selectedEnhancedProduct);
    console.log('  - Menu ID:', window.appState.selectedMenuItem);
    console.log('  - Button ID:', window.appState.currentButtonId);
    console.log('  - Payment ID:', window.appState.selectedPayment);
    console.log('  - Table data:', window.appState.currentTableData);

    // Validation
    if (!window.appState.selectedPayment) {
        console.error('❌ No payment method selected');
        showToast('Please select a payment method', 'warning');
        return;
    }

    const transactionCode = document.getElementById('transactionCode')?.value;
    if (!transactionCode || transactionCode.trim().length !== 6) {
        console.error('❌ Invalid transaction code');
        showToast('Please enter last 6 digits of transaction ID', 'warning');
        return;
    }

    if (window.appState.isEnhancedProductMode) {
        if (!window.appState.selectedEnhancedProduct || !window.appState.currentButtonId) {
            console.error('❌ Missing enhanced product order information');
            showToast('Error: Missing order information. Please try again.', 'error');
            return;
        }
    } else {
        if (!window.appState.selectedMenuItem || !window.appState.currentButtonId) {
            console.error('❌ Missing original product order information');
            showToast('Error: Missing order information. Please try again.', 'error');
            return;
        }
    }

    showLoading();

    try {
        let orderData = {};
        
        if (window.appState.isEnhancedProductMode) {
            // Enhanced product order
            const currentProduct = window.appState.currentEnhancedProduct;
            const selectedPaymentMethods = currentProduct.payment_methods ? 
                [window.appState.selectedPayment] : 
                [window.appState.selectedPayment];
            const selectedContacts = currentProduct.contacts ? 
                currentProduct.contacts.map(c => c.id) : 
                [];
            
            orderData = {
                user_id: parseInt(window.appState.currentUser.id),
                enhanced_product_id: parseInt(window.appState.selectedEnhancedProduct),
                selected_payment_methods: selectedPaymentMethods,
                selected_contacts: selectedContacts,
                table_data: window.appState.currentTableData,
                transaction_code: transactionCode.trim(),
                status: 'pending',
                created_at: new Date().toISOString()
            };

            console.log('📦 Enhanced order data prepared:', orderData);

            const { data, error } = await supabase
                .from('enhanced_orders')
                .insert([orderData])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Enhanced order submitted successfully:', data);
            showToast(`🎉 Order Placed Successfully! Order ID: #${data.id}`, 'success', 8000);
        } else {
            // Original product order
            orderData = {
                user_id: parseInt(window.appState.currentUser.id),
                menu_id: parseInt(window.appState.selectedMenuItem),
                button_id: parseInt(window.appState.currentButtonId),
                payment_method_id: parseInt(window.appState.selectedPayment),
                table_data: window.appState.currentTableData,
                transaction_code: transactionCode.trim(),
                status: 'pending',
                created_at: new Date().toISOString()
            };

            console.log('📦 Original order data prepared:', orderData);

            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Original order submitted successfully:', data);
            showToast(`🎉 Order Placed Successfully! Order ID: #${data.id}`, 'success', 8000);
        }

        hideLoading();
        closePaymentModal();
        
        // Reset state
        window.appState.selectedMenuItem = null;
        window.appState.selectedEnhancedProduct = null;
        window.appState.selectedPayment = null;
        window.appState.currentTableData = {};
        window.appState.currentMenu = null;
        window.appState.currentEnhancedProduct = null;
        window.appState.currentButtonId = null;
        window.appState.currentTables = [];
        window.appState.isEnhancedProductMode = false;
        
        // Reload history and switch to history page
        await loadOrderHistory();
        switchPage('history');

    } catch (error) {
        hideLoading();
        console.error('❌ Order submission failed:', error);
        showToast('Error submitting order: ' + error.message, 'error');
    }
}

// Updated Order History
async function loadOrderHistory() {
    try {
        // Load both original and enhanced orders
        const [originalOrdersResult, enhancedOrdersResult] = await Promise.all([
            supabase
                .from('orders')
                .select(`
                    *,
                    menus (name, price, amount),
                    payment_methods (name)
                `)
                .eq('user_id', window.appState.currentUser.id)
                .order('created_at', { ascending: false }),
            supabase
                .from('enhanced_orders')
                .select(`
                    *,
                    enhanced_products (name, current_price, currency_type, description),
                    users!inner(id)
                `)
                .eq('user_id', window.appState.currentUser.id)
                .order('created_at', { ascending: false })
        ]);

        if (originalOrdersResult.error) throw originalOrdersResult.error;
        if (enhancedOrdersResult.error) throw enhancedOrdersResult.error;

        const originalOrders = originalOrdersResult.data || [];
        const enhancedOrders = enhancedOrdersResult.data || [];

        // Combine and sort orders by date
        const allOrders = [
            ...originalOrders.map(order => ({ ...order, type: 'original' })),
            ...enhancedOrders.map(order => ({ ...order, type: 'enhanced' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        displayOrderHistory(allOrders);
    } catch (error) {
        console.error('❌ Error loading orders:', error);
    }
}

function displayOrderHistory(orders) {
    const container = document.getElementById('historyContainer');
    
    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px 20px;"><h3 style="margin-bottom:12px;">No Orders Yet</h3><p>Your order history will appear here once you make your first purchase.</p></div>';
        return;
    }

    container.innerHTML = '';

    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = `history-item ${order.type}-order`;

        let statusClass = 'pending';
        let statusIcon = '⏳';
        if (order.status === 'approved') {
            statusClass = 'approved';
            statusIcon = '✅';
        }
        if (order.status === 'rejected') {
            statusClass = 'rejected';
            statusIcon = '❌';
        }

        let productName, productPrice, productDescription;
        
        if (order.type === 'enhanced') {
            productName = order.enhanced_products?.name || 'Unknown Product';
            productPrice = `${order.enhanced_products?.current_price || 0} ${order.enhanced_products?.currency_type || 'MMK'}`;
            productDescription = order.enhanced_products?.description || '';
        } else {
            productName = order.menus?.name || 'Unknown Product';
            productPrice = `${order.menus?.price || 0} MMK`;
            productDescription = order.menus?.amount || '';
        }

        item.innerHTML = `
            <div class="history-status ${statusClass}">${statusIcon} ${order.status.toUpperCase()}</div>
            <div class="order-type-badge ${order.type}">${order.type === 'enhanced' ? '🎯 Enhanced' : '🛒 Classic'}</div>
            <h3 data-order-name="${order.id}" style="font-size: 18px; font-weight: 600; margin-bottom: 8px;"></h3>
            <p data-order-amount="${order.id}" style="color: var(--text-secondary); margin-bottom: 12px;"></p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
                <p><strong>Price:</strong> <span style="color: var(--success-color); font-weight: 600;">${productPrice}</span></p>
                <p><strong>Order ID:</strong> #${order.id}</p>
            </div>
            <p style="margin-bottom: 8px;"><strong>Payment:</strong> <span data-order-payment="${order.id}"></span></p>
            <p style="margin-bottom: 12px; color: var(--text-muted); font-size: 14px;"><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            ${order.admin_message ? `<div style="margin-top:16px;padding:16px;background:rgba(245,158,11,0.1);border-radius:var(--border-radius);border:1px solid var(--warning-color);" data-order-message="${order.id}"></div>` : ''}
        `;

        container.appendChild(item);

        // Apply animations
        setTimeout(() => {
            const nameEl = document.querySelector(`[data-order-name="${order.id}"]`);
            const amountEl = document.querySelector(`[data-order-amount="${order.id}"]`);
            const paymentEl = document.querySelector(`[data-order-payment="${order.id}"]`);
            const messageEl = document.querySelector(`[data-order-message="${order.id}"]`);

            if (nameEl) applyAnimationRendering(nameEl, productName);
            if (amountEl) applyAnimationRendering(amountEl, productDescription);
            if (paymentEl) {
                if (order.type === 'enhanced') {
                    // For enhanced orders, show multiple payment methods
                    const paymentIds = order.selected_payment_methods || [];
                    if (paymentIds.length > 0) {
                        applyAnimationRendering(paymentEl, `Multiple Methods (${paymentIds.length})`);
                    } else {
                        applyAnimationRendering(paymentEl, 'N/A');
                    }
                } else {
                    applyAnimationRendering(paymentEl, order.payment_methods?.name || 'N/A');
                }
            }
            if (messageEl) applyAnimationRendering(messageEl, `<strong style="color: var(--warning-color);">📢 Admin Message:</strong><br>${order.admin_message}`);
        }, 50);
    });
}

// ========== CONTACTS ==========
async function loadContacts() {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        displayContacts(data || []);
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
    }
}

function displayContacts(contacts) {
    const container = document.getElementById('contactsContainer');
    
    if (contacts.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px 20px;"><h3 style="margin-bottom:12px;">No Contacts Available</h3><p>Contact information will be displayed here when available.</p></div>';
        return;
    }

    container.innerHTML = '';

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';

        const isClickable = contact.link && contact.link.trim() !== '';

        item.innerHTML = `
            <div class="contact-icon">
                <img src="${contact.icon_url}" alt="${contact.name}">
            </div>
            <div class="contact-info">
                <h3 data-contact-name="${contact.id}"></h3>
                <p data-contact-description="${contact.id}"></p>
                ${contact.address ? `<p class="contact-address">${contact.address}</p>` : ''}
            </div>
            ${isClickable ? `<div class="contact-action">
                <button onclick="window.open('${contact.link}', '_blank')" class="btn-primary">
                    Connect
                </button>
            </div>` : ''}
        `;

        if (isClickable) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                window.open(contact.link, '_blank');
            });
        }

        container.appendChild(item);

        // Apply animations
        setTimeout(() => {
            const nameEl = document.querySelector(`[data-contact-name="${contact.id}"]`);
            const descEl = document.querySelector(`[data-contact-description="${contact.id}"]`);

            if (nameEl) applyAnimationRendering(nameEl, contact.name);
            if (descEl) applyAnimationRendering(descEl, contact.description || '');
        }, 50);
    });
}

// ========== PROFILE ==========
async function loadProfile() {
    const user = window.appState.currentUser;
    if (!user) return;

    document.getElementById('profileName').value = user.name;
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileEmail').value = user.email;

    // Create avatar with initials
    const avatar = document.getElementById('profileAvatar');
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    avatar.textContent = initials;
    avatar.style.background = `linear-gradient(135deg, ${generateColorFromString(user.name)}, ${generateColorFromString(user.email)})`;
}

function generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

async function updateProfile() {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const errorEl = document.getElementById('profileError');
    const successEl = document.getElementById('profileSuccess');

    // Clear previous messages
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!currentPassword) {
        errorEl.textContent = 'Please enter your current password to make changes';
        errorEl.style.display = 'block';
        return;
    }

    // Verify current password
    if (currentPassword !== window.appState.currentUser.password) {
        errorEl.textContent = 'Current password is incorrect';
        errorEl.style.display = 'block';
        return;
    }

    if (!newPassword) {
        errorEl.textContent = 'Please enter a new password';
        errorEl.style.display = 'block';
        return;
    }

    if (newPassword.length < 6) {
        errorEl.textContent = 'New password must be at least 6 characters long';
        errorEl.style.display = 'block';
        return;
    }

    showLoading();

    try {
        const { data, error } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', window.appState.currentUser.id)
            .select()
            .single();

        if (error) throw error;

        // Update local state
        window.appState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));

        hideLoading();
        successEl.textContent = 'Password updated successfully!';
        successEl.style.display = 'block';

        // Clear form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';

        showToast('Password updated successfully!', 'success');

    } catch (error) {
        hideLoading();
        errorEl.textContent = 'Error updating password: ' + error.message;
        errorEl.style.display = 'block';
        console.error('❌ Profile update error:', error);
    }
}

// ========== NAVIGATION ==========
function switchPage(pageName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName + 'Page').classList.add('active');

    // Load page-specific data
    switch(pageName) {
        case 'history':
            loadOrderHistory();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'mi':
            loadProfile();
            break;
    }
}

// ========== UTILITY FUNCTIONS ==========
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Clean up intervals on page unload
window.addEventListener('beforeunload', () => {
    if (window.appState.bannerInterval) {
        clearInterval(window.appState.bannerInterval);
    }
});

console.log('✅ Enhanced Gaming Store App initialized successfully!');
