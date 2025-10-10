
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

        /* Ads Container Styles */
        .ads-container {
            margin: 16px 0;
            text-align: center;
        }

        .ad-banner {
            margin: 12px auto;
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow-sm);
            display: inline-block;
        }

        .ad-banner iframe,
        .ad-banner img {
            max-width: 100%;
            height: auto;
            display: block;
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

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
        loadActiveAds(),
        loadCategories(),
        loadPayments(),
        loadContacts(),
        loadProfile(),
        loadOrderHistory()
    ]);
}

// ========== LOAD ACTIVE ADS ==========
async function loadActiveAds() {
    try {
        const { data, error } = await supabase
            .rpc('get_active_ads');

        if (error) throw error;

        const adsSection = document.getElementById('adsSection');
        
        if (data && data.length > 0) {
            adsSection.innerHTML = '';
            data.forEach(ad => {
                const adDiv = document.createElement('div');
                adDiv.className = 'ad-banner';
                adDiv.style.width = ad.banner_size.split('x')[0] + 'px';
                adDiv.innerHTML = ad.script_code;
                adsSection.appendChild(adDiv);
            });
            adsSection.style.display = 'block';
        } else {
            adsSection.style.display = 'none';
        }
        
        window.appState.currentAds = data || [];
        
    } catch (error) {
        console.error('❌ Error loading active ads:', error);
        document.getElementById('adsSection').style.display = 'none';
    }
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
        const [tablesResult, menusResult, videosResult, enhancedProductsResult, bannersResult, contentResult] = await Promise.all([
            supabase.from('input_tables').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('menus').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.rpc('get_enhanced_products_with_details', { p_button_id: buttonId }),
            supabase.rpc('get_product_page_banners', { p_button_id: buttonId }),
            supabase.rpc('get_product_page_content', { p_button_id: buttonId })
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

        // Store in global state
        window.appState.allMenus = menus;
        window.appState.enhancedProducts = enhancedProducts;
        window.appState.currentTables = tables;
        window.appState.currentProductBanners = banners;
        window.appState.currentProductContent = content;

        console.log('✅ Loaded data:');
        console.log('  - Tables:', tables.length);
        console.log('  - Original Menus:', menus.length);
        console.log('  - Enhanced Products:', enhancedProducts.length);
        console.log('  - Videos:', videos.length);
        console.log('  - Banners:', banners.length);
        console.log('  - Content:', content.length);

        hideLoading();

        // Determine which system to use
        if (enhancedProducts.length > 0 || menus.length > 0) {
            showProductPage(buttonName, buttonIcon, tables, menus, enhancedProducts, videos, banners, content);
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
function showProductPage(buttonName, buttonIcon, tables, originalMenus, enhancedProducts, videos, banners, content) {
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
    if (window.appState.currentAds && window.appState.currentAds.length > 0) {
        html += '<div class="ads-container">';
        window.appState.currentAds.forEach(ad => {
            html += `<div class="ad-banner" style="width: ${ad.banner_size.split('x')[0]}px">${ad.script_code}</div>`;
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
                currentProduct = product;
            } else {
                showToast('Product data not found. Please try again.', 'error');
                return;
            }
        } else {
            currentProduct = window.appState.currentEnhancedProduct;
        }
    } else {
        if (!window.appState.currentMenu) {
            console.error('❌ Menu data not found');
            const menu = window.appState.allMenus.find(m => m.id === window.appState.selectedMenuItem);
            if (menu) {
                window.appState.currentMenu = menu;
                currentProduct = menu;
            } else {
                showToast('Product data not found. Please try again.', 'error');
                return;
            }
        } else {
            currentProduct = window.appState.currentMenu;
        }
    }

    // Collect table data if any
    const tableInputs = document.querySelectorAll('[data-table-id]');
    const tableData = {};
    let hasEmptyRequiredFields = false;

    tableInputs.forEach(input => {
        const tableId = input.getAttribute('data-table-id');
        const value = input.value.trim();
        
        if (!value) {
            hasEmptyRequiredFields = true;
            input.style.borderColor = 'var(--error-color)';
        } else {
            input.style.borderColor = '';
            const table = window.appState.currentTables.find(t => t.id == tableId);
            if (table) {
                tableData[table.name] = value;
            }
        }
    });

    if (hasEmptyRequiredFields) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }

    // Store table data
    window.appState.currentTableData = tableData;

    console.log('✅ Proceeding with purchase:');
    console.log('  - Product:', currentProduct.name);
    console.log('  - Type:', window.appState.isEnhancedProductMode ? 'Enhanced' : 'Original');
    console.log('  - Table Data:', tableData);

    // Close current modal and show payment selection
    closePurchaseModal();
    await showPaymentSelection();
}

// ========== PAYMENT SYSTEM ==========
async function loadPayments() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        window.appState.payments = data || [];
    } catch (error) {
        console.error('❌ Error loading payments:', error);
    }
}

async function showPaymentSelection() {
    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');
    
    if (!window.appState.payments || window.appState.payments.length === 0) {
        content.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No payment methods available</p>';
        modal.classList.add('active');
        return;
    }

    // Get payment methods for enhanced products
    let availablePayments = window.appState.payments;
    
    if (window.appState.isEnhancedProductMode && window.appState.currentEnhancedProduct) {
        const productPayments = window.appState.currentEnhancedProduct.payment_methods || [];
        if (productPayments.length > 0) {
            availablePayments = productPayments;
        }
    }

    let html = '<div class="payment-methods">';
    
    availablePayments.forEach(payment => {
        html += `
            <div class="payment-method" data-payment-id="${payment.id}">
                <img src="${payment.icon_url}" alt="${payment.name}">
                <span data-payment-name="${payment.id}"></span>
            </div>
        `;
    });
    
    html += '</div>';
    html += '<button class="btn-primary" onclick="selectPaymentMethod()" style="margin-top: 20px; width: 100%;">Continue</button>';
    
    content.innerHTML = html;
    modal.classList.add('active');

    // Apply animations
    setTimeout(() => {
        availablePayments.forEach(payment => {
            const nameEl = document.querySelector(`[data-payment-name="${payment.id}"]`);
            if (nameEl) applyAnimationRendering(nameEl, payment.name);
        });

        // Attach click events
        document.querySelectorAll('.payment-method').forEach(method => {
            const paymentId = parseInt(method.getAttribute('data-payment-id'));
            method.addEventListener('click', () => {
                // Clear previous selection
                document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
                method.classList.add('selected');
                window.appState.selectedPayment = availablePayments.find(p => p.id === paymentId);
            });
        });
    }, 100);
}

function selectPaymentMethod() {
    if (!window.appState.selectedPayment) {
        showToast('Please select a payment method', 'warning');
        return;
    }

    showPaymentDetails();
}

function showPaymentDetails() {
    const payment = window.appState.selectedPayment;
    const detailsDiv = document.getElementById('paymentDetails');
    const summaryDiv = document.getElementById('orderSummary');
    const transactionGroup = document.getElementById('transactionIdGroup');
    const submitBtn = document.getElementById('submitOrderBtn');

    // Show payment details
    let paymentHtml = `
        <div class="payment-info">
            <h3>Payment Information</h3>
            <div class="payment-details">
                <div class="payment-header">
                    <img src="${payment.icon_url}" alt="${payment.name}" style="width: 40px; height: 40px; border-radius: 50%;">
                    <h4 data-payment-detail-name="${payment.id}"></h4>
                </div>
                <div class="payment-address">
                    <strong>Address:</strong> ${payment.address}
                    <button class="copy-btn" onclick="copyToClipboard('${payment.address}')">Copy</button>
                </div>
                <div class="payment-instructions" data-payment-instructions="${payment.id}"></div>
            </div>
        </div>
    `;

    // Show order summary
    let price, currency, productName;
    if (window.appState.isEnhancedProductMode) {
        const product = window.appState.currentEnhancedProduct;
        price = product.current_price;
        currency = product.currency_type;
        productName = product.name;
    } else {
        const menu = window.appState.currentMenu;
        price = menu.price;
        currency = 'MMK';
        productName = menu.name;
    }

    let summaryHtml = `
        <div class="order-summary">
            <h3>Order Summary</h3>
            <p><strong>Product:</strong> <span data-summary-product-name></span></p>
            <p class="price">${price} ${currency}</p>
        </div>
    `;

    detailsDiv.innerHTML = paymentHtml;
    summaryDiv.innerHTML = summaryHtml;
    
    detailsDiv.style.display = 'block';
    summaryDiv.style.display = 'block';
    transactionGroup.style.display = 'block';
    submitBtn.style.display = 'block';

    // Apply animations
    setTimeout(() => {
        const nameEl = document.querySelector(`[data-payment-detail-name="${payment.id}"]`);
        const instructionsEl = document.querySelector(`[data-payment-instructions="${payment.id}"]`);
        const productNameEl = document.querySelector('[data-summary-product-name]');
        
        if (nameEl) applyAnimationRendering(nameEl, payment.name);
        if (instructionsEl) applyAnimationRendering(instructionsEl, payment.instructions || '');
        if (productNameEl) applyAnimationRendering(productNameEl, productName);
    }, 100);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy to clipboard', 'error');
    });
}

async function submitOrder() {
    const transactionId = document.getElementById('transactionId').value.trim();
    
    if (!transactionId) {
        showToast('Please enter transaction ID', 'warning');
        return;
    }

    if (!window.appState.currentUser) {
        showToast('Please login first', 'error');
        return;
    }

    showLoading();

    try {
        let orderData;
        
        if (window.appState.isEnhancedProductMode) {
            // Enhanced product order
            const product = window.appState.currentEnhancedProduct;
            const contacts = product.contacts || [];
            
            orderData = {
                user_id: window.appState.currentUser.id,
                enhanced_product_id: product.id,
                selected_payment_methods: [window.appState.selectedPayment.id],
                selected_contacts: contacts.map(c => c.id),
                table_data: window.appState.currentTableData,
                transaction_code: transactionId,
                status: 'pending'
            };

            const { error } = await supabase
                .from('enhanced_orders')
                .insert([orderData]);

            if (error) throw error;
        } else {
            // Original menu order
            const menu = window.appState.currentMenu;
            
            orderData = {
                user_id: window.appState.currentUser.id,
                menu_id: menu.id,
                button_id: window.appState.currentButtonId,
                selected_payment: window.appState.selectedPayment.id,
                table_data: window.appState.currentTableData,
                transaction_code: transactionId,
                status: 'pending'
            };

            const { error } = await supabase
                .from('orders')
                .insert([orderData]);

            if (error) throw error;
        }

        hideLoading();
        showToast('Order submitted successfully!', 'success');
        
        // Close modals and reset state
        closePaymentModal();
        resetOrderState();
        
        // Refresh order history
        await loadOrderHistory();

    } catch (error) {
        hideLoading();
        console.error('❌ Error submitting order:', error);
        showToast('Error submitting order. Please try again.', 'error');
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    // Reset payment modal
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('orderSummary').style.display = 'none';
    document.getElementById('transactionIdGroup').style.display = 'none';
    document.getElementById('submitOrderBtn').style.display = 'none';
    document.getElementById('transactionId').value = '';
}

function resetOrderState() {
    window.appState.selectedMenuItem = null;
    window.appState.currentMenu = null;
    window.appState.selectedEnhancedProduct = null;
    window.appState.currentEnhancedProduct = null;
    window.appState.selectedPayment = null;
    window.appState.currentTableData = {};
    window.appState.isEnhancedProductMode = false;
}

// ========== CONTACTS ==========
async function loadContacts() {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        window.appState.contacts = data || [];
        displayContacts(data || []);
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
    }
}

function displayContacts(contacts) {
    const container = document.getElementById('contactsContainer');
    
    if (contacts.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px 20px;"><h3 style="margin-bottom:12px;">No Contacts Available</h3><p>Contact information will appear here.</p></div>';
        return;
    }

    container.innerHTML = '';

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';

        item.innerHTML = `
            <div class="contact-icon">
                <img src="${contact.icon_url}" alt="${contact.name}">
            </div>
            <div class="contact-info">
                <h3 data-contact-name="${contact.id}"></h3>
                <p data-contact-description="${contact.id}"></p>
                ${contact.address ? `<div class="contact-address">${contact.address}</div>` : ''}
            </div>
            ${contact.link ? `<div class="contact-action"><a href="${contact.link}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 8px 16px; font-size: 14px;">Contact</a></div>` : ''}
        `;

        container.appendChild(item);

        // Apply animations
        setTimeout(() => {
            const nameEl = item.querySelector(`[data-contact-name="${contact.id}"]`);
            const descEl = item.querySelector(`[data-contact-description="${contact.id}"]`);
            if (nameEl) applyAnimationRendering(nameEl, contact.name);
            if (descEl) applyAnimationRendering(descEl, contact.description || '');
        }, 50);
    });
}

// ========== PROFILE ==========
function loadProfile() {
    const user = window.appState.currentUser;
    if (!user) return;

    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileUsername').value = user.username || '';
    document.getElementById('profileEmail').value = user.email || '';

    // Set avatar
    const avatar = document.getElementById('profileAvatar');
    avatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
}

async function updateProfile() {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();

    if (!currentPassword) {
        showToast('Please enter current password', 'warning');
        return;
    }

    if (!newPassword || newPassword.length < 6) {
        showToast('New password must be at least 6 characters', 'warning');
        return;
    }

    const user = window.appState.currentUser;
    
    if (user.password !== currentPassword) {
        showToast('Current password is incorrect', 'error');
        return;
    }

    showLoading();

    try {
        const { error } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', user.id);

        if (error) throw error;

        // Update stored user data
        user.password = newPassword;
        localStorage.setItem('currentUser', JSON.stringify(user));

        hideLoading();
        showToast('Password updated successfully!', 'success');
        
        // Clear form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';

    } catch (error) {
        hideLoading();
        console.error('❌ Error updating profile:', error);
        showToast('Error updating profile', 'error');
    }
}

// ========== ORDER HISTORY ==========
async function loadOrderHistory() {
    if (!window.appState.currentUser) return;

    try {
        // Load both original and enhanced orders
        const [originalOrdersResult, enhancedOrdersResult] = await Promise.all([
            supabase
                .from('orders')
                .select(`
                    *,
                    menus (name, price),
                    payment_methods (name, icon_url)
                `)
                .eq('user_id', window.appState.currentUser.id)
                .order('created_at', { ascending: false }),
            supabase
                .from('enhanced_orders')
                .select(`
                    *,
                    enhanced_products (name, current_price, currency_type)
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
        console.error('❌ Error loading order history:', error);
    }
}

function displayOrderHistory(orders) {
    const container = document.getElementById('historyContainer');
    
    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px 20px;"><h3 style="margin-bottom:12px;">No Orders Yet</h3><p>Your order history will appear here.</p></div>';
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

        let productInfo, price;
        if (order.type === 'enhanced') {
            productInfo = order.enhanced_products?.name || 'Unknown Product';
            price = `${order.enhanced_products?.current_price || 0} ${order.enhanced_products?.currency_type || 'MMK'}`;
        } else {
            productInfo = order.menus?.name || 'Unknown Product';
            price = `${order.menus?.price || 0} MMK`;
        }

        item.innerHTML = `
            <div class="history-status ${statusClass}">${statusIcon} ${order.status.toUpperCase()}</div>
            <h3 data-history-product="${order.id}"></h3>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Price:</strong> ${price}</p>
            <p><strong>Transaction:</strong> ${order.transaction_code}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Type:</strong> ${order.type === 'enhanced' ? 'Enhanced Product' : 'Classic Product'}</p>
            ${order.admin_message ? `<p><strong>Admin Message:</strong> ${order.admin_message}</p>` : ''}
        `;

        container.appendChild(item);

        // Apply animation to product name
        setTimeout(() => {
            const productEl = item.querySelector(`[data-history-product="${order.id}"]`);
            if (productEl) applyAnimationRendering(productEl, productInfo);
        }, 50);
    });
}

// ========== PAGE NAVIGATION ==========
function switchPage(pageName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Show page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}Page`).classList.add('active');

    // Load page-specific data
    if (pageName === 'history') {
        loadOrderHistory();
    }
}

// ========== MODAL FUNCTIONS ==========
function closeEnhancedProductModal() {
    document.getElementById('enhancedProductModal').classList.remove('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.remove('active');
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').classList.remove('active');
}

// ========== ERROR HANDLING ==========
window.addEventListener('error', (event) => {
    console.error('❌ Global error:', event.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred', 'error');
    event.preventDefault();
});

console.log('🎮 Gaming Store App loaded successfully!');
