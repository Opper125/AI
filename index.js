
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
    // Enhanced product system state
    enhancedProducts: [],
    currentCategoryId: null,
    currentButtonData: null,
    productBanners: [],
    productDescriptions: [],
    currentProductBannerIndex: 0,
    productBannerInterval: null,
    selectedEnhancedProduct: null
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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
        
        btnEl.addEventListener('click', () => openEnhancedCategoryPage(categoryId, button.id, button));
        container.appendChild(btnEl);
    });
}

// ========== ENHANCED CATEGORY PAGE SYSTEM ==========

// Fixed openEnhancedCategoryPage function for index.js
// Replace the existing function with this improved version

async function openEnhancedCategoryPage(categoryId, buttonId, buttonData) {
    console.log('🎮 Opening Enhanced Category Page:', categoryId, buttonId);
    
    showLoading();

    try {
        // Store current state
        window.appState.currentCategoryId = categoryId;
        window.appState.currentButtonId = buttonId;
        window.appState.currentButtonData = buttonData;
        
        // Try to load enhanced products first
        const { data: enhancedProducts, error: productsError } = await supabase
            .from('enhanced_products')
            .select('*')
            .eq('button_id', buttonId)
            .order('created_at', { ascending: true });

        // Check if we have enhanced products AND no critical errors
        if (enhancedProducts && enhancedProducts.length > 0 && !productsError) {
            console.log(`✅ Found ${enhancedProducts.length} enhanced products`);
            
            // Load other enhanced content in parallel
            const [
                { data: productBanners },
                { data: productDescriptions },
                { data: ads }
            ] = await Promise.all([
                supabase.from('product_banners').select('*').eq('category_id', categoryId).eq('button_id', buttonId).order('created_at', { ascending: true }),
                supabase.from('product_descriptions').select('*').eq('category_id', categoryId).eq('button_id', buttonId).order('created_at', { ascending: true }),
                supabase.from('category_ads').select('*').eq('category_id', categoryId).eq('button_id', buttonId).order('created_at', { ascending: true })
            ]);

            // Store in state
            window.appState.enhancedProducts = enhancedProducts;
            window.appState.productBanners = productBanners || [];
            window.appState.productDescriptions = productDescriptions || [];
            window.appState.categoryAds = ads || [];

            hideLoading();
            showEnhancedProductsPage();
            return;
        }

        // If no enhanced products or error, fall back to legacy system
        console.log('⚠️ No enhanced products found or error occurred, using legacy menu system');
        if (productsError) {
            console.log('Enhanced products error:', productsError);
        }
        
        await openCategoryPage(categoryId, buttonId);

    } catch (error) {
        hideLoading();
        console.error('❌ Error in enhanced category system:', error);
        
        // Final fallback: try legacy system
        console.log('🔄 Trying legacy system as final fallback');
        try {
            await openCategoryPage(categoryId, buttonId);
        } catch (legacyError) {
            console.error('❌ Legacy system also failed:', legacyError);
            showToast('Error loading products. Please try again later.', 'error');
        }
    }
}

// Improved legacy openCategoryPage function with better error handling
async function openCategoryPage(categoryId, buttonId) {
    console.log('🎮 Opening Legacy Category Page:', categoryId, buttonId);
    
    showLoading();

    try {
        // Reset state
        window.appState.currentButtonId = buttonId;
        window.appState.selectedMenuItem = null;
        window.appState.currentMenu = null;
        window.appState.currentTableData = {};
        window.appState.allMenus = [];
        window.appState.currentTables = [];
        
        // Load legacy data with better error handling
        const [tablesResult, menusResult, videosResult] = await Promise.all([
            supabase.from('input_tables').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('menus').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId).order('created_at', { ascending: true })
        ]);

        // Check for errors
        if (menusResult.error) {
            console.error('❌ Menus query error:', menusResult.error);
            throw new Error('Failed to load menu items: ' + menusResult.error.message);
        }
        
        if (tablesResult.error) {
            console.error('❌ Tables query error:', tablesResult.error);
            // Tables error is not critical, continue
        }
        
        if (videosResult.error) {
            console.error('❌ Videos query error:', videosResult.error);
            // Videos error is not critical, continue
        }

        const tables = tablesResult.data || [];
        const menus = menusResult.data || [];
        const videos = videosResult.data || [];

        console.log(`📊 Legacy data loaded: ${menus.length} menus, ${tables.length} tables, ${videos.length} videos`);

        // Store in global state
        window.appState.allMenus = menus;
        window.appState.currentTables = tables;

        hideLoading();

        if (menus.length === 0) {
            showToast('No products available for this category', 'warning');
            return;
        }

        showPurchaseModal(tables, menus, videos);

    } catch (error) {
        hideLoading();
        console.error('❌ Error loading legacy category data:', error);
        showToast('Error loading products: ' + error.message, 'error');
    }
}

// ========== PRODUCT BANNERS SYSTEM ==========
function displayProductBanners() {
    const container = document.getElementById('productBannerContainer');
    const pagination = document.getElementById('productBannerPagination');
    const bannerSection = document.getElementById('productBanners');
    
    if (!container || !pagination) return;

    const banners = window.appState.productBanners;
    
    if (!banners || banners.length === 0) {
        bannerSection.style.display = 'none';
        return;
    }

    bannerSection.style.display = 'block';
    container.innerHTML = '';
    pagination.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'product-banner-wrapper';

    banners.forEach((banner, index) => {
        const item = document.createElement('div');
        item.className = 'product-banner-item';
        item.innerHTML = `<img src="${banner.banner_url}" alt="Product Banner ${index + 1}">`;
        wrapper.appendChild(item);
    });

    container.appendChild(wrapper);

    // Create pagination dots
    if (banners.length > 1) {
        banners.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `product-banner-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => goToProductBanner(index, wrapper, banners.length));
            pagination.appendChild(dot);
        });

        // Auto-scroll every 5 seconds
        startProductBannerAutoScroll(wrapper, banners.length);
    }
}

function goToProductBanner(index, wrapper, totalBanners) {
    window.appState.currentProductBannerIndex = index;
    wrapper.style.transform = `translateX(-${index * 100}%)`;
    
    // Update pagination dots
    document.querySelectorAll('.product-banner-dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
    });
}

function startProductBannerAutoScroll(wrapper, totalBanners) {
    // Clear existing interval
    if (window.appState.productBannerInterval) {
        clearInterval(window.appState.productBannerInterval);
    }
    
    window.appState.productBannerInterval = setInterval(() => {
        window.appState.currentProductBannerIndex = (window.appState.currentProductBannerIndex + 1) % totalBanners;
        goToProductBanner(window.appState.currentProductBannerIndex, wrapper, totalBanners);
    }, 5000);
}

// ========== PRODUCT DESCRIPTIONS SYSTEM ==========
function displayProductDescriptions() {
    const container = document.getElementById('productDescriptions');
    if (!container) return;

    const descriptions = window.appState.productDescriptions;
    
    if (!descriptions || descriptions.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = '';

    descriptions.forEach(desc => {
        const descElement = document.createElement('div');
        descElement.className = 'product-description-item';
        applyAnimationRendering(descElement, desc.content);
        container.appendChild(descElement);
    });
}

// ========== ENHANCED PRODUCTS DISPLAY ==========
function displayEnhancedProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;

    const products = window.appState.enhancedProducts;
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="no-products">No products available for this category.</div>';
        return;
    }

    container.innerHTML = '';

    products.forEach(product => {
        const productEl = document.createElement('div');
        productEl.className = 'enhanced-product-item';
        
        // Calculate discount price if available
        let priceDisplay = `${product.price} ${product.currency}`;
        if (product.discount_percentage && product.discount_percentage > 0) {
            const discountedPrice = product.price * (1 - product.discount_percentage / 100);
            priceDisplay = `
                <span class="original-price">${product.price} ${product.currency}</span>
                <span class="discounted-price">${discountedPrice.toFixed(0)} ${product.currency}</span>
                <span class="discount-badge">-${product.discount_percentage}%</span>
            `;
        }

        // Get first image
        const images = product.images ? JSON.parse(product.images) : [];
        const firstImage = images.length > 0 ? images[0] : null;

        productEl.innerHTML = `
            <div class="product-image">
                ${firstImage ? `<img src="${firstImage}" alt="${product.name}">` : '<div class="no-image">No Image</div>'}
                ${product.discount_percentage ? `<div class="discount-indicator">-${product.discount_percentage}%</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-details">
                    <span class="product-price">${priceDisplay}</span>
                    <span class="product-stock">Stock: ${product.stock_quantity || 'N/A'}</span>
                </div>
                <button class="btn-view-details" onclick="viewEnhancedProductDetails(${product.id})">
                    View Details
                </button>
            </div>
        `;

        container.appendChild(productEl);
    });
}

// ========== CATEGORY ADS SYSTEM ==========
function displayCategoryAds() {
    const container = document.getElementById('adsSection');
    if (!container) return;

    const ads = window.appState.categoryAds;
    
    if (!ads || ads.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = '';

    ads.forEach(ad => {
        const adElement = document.createElement('div');
        adElement.className = 'ad-container';
        adElement.innerHTML = ad.script_code;
        container.appendChild(adElement);
    });
}

// ========== ENHANCED PRODUCT DETAILS ==========
async function viewEnhancedProductDetails(productId) {
    console.log('🔍 Viewing Enhanced Product Details:', productId);
    
    const product = window.appState.enhancedProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    window.appState.selectedEnhancedProduct = product;

    // Display detailed modal
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('productDetailsContent');

    // Parse images
    const images = product.images ? JSON.parse(product.images) : [];
    
    // Calculate discount price
    let priceDisplay = `${product.price} ${product.currency}`;
    let finalPrice = product.price;
    
    if (product.discount_percentage && product.discount_percentage > 0) {
        finalPrice = product.price * (1 - product.discount_percentage / 100);
        priceDisplay = `
            <div class="price-section">
                <span class="original-price">${product.price} ${product.currency}</span>
                <span class="discounted-price">${finalPrice.toFixed(0)} ${product.currency}</span>
                <span class="discount-badge">Save ${product.discount_percentage}%</span>
            </div>
        `;
    } else {
        priceDisplay = `<div class="price-section"><span class="current-price">${product.price} ${product.currency}</span></div>`;
    }

    // Parse payment methods
    const paymentMethods = product.payment_methods ? JSON.parse(product.payment_methods) : [];
    
    // Parse contacts
    const contacts = product.contacts ? JSON.parse(product.contacts) : [];

    content.innerHTML = `
        <div class="enhanced-product-details">
            <div class="product-images-section">
                ${images.length > 0 ? `
                    <div class="main-image">
                        <img id="mainProductImage" src="${images[0]}" alt="${product.name}">
                        <div class="image-navigation">
                            <button class="nav-btn prev-btn" onclick="changeProductImage(-1)" ${images.length <= 1 ? 'style="display:none"' : ''}>◀</button>
                            <button class="nav-btn next-btn" onclick="changeProductImage(1)" ${images.length <= 1 ? 'style="display:none"' : ''}>▶</button>
                        </div>
                    </div>
                    ${images.length > 1 ? `
                        <div class="image-thumbnails">
                            ${images.map((img, index) => `
                                <img class="thumbnail ${index === 0 ? 'active' : ''}" 
                                     src="${img}" 
                                     onclick="selectProductImage(${index})"
                                     alt="Thumbnail ${index + 1}">
                            `).join('')}
                        </div>
                    ` : ''}
                ` : '<div class="no-image-large">No Images Available</div>'}
            </div>
            
            <div class="product-details-section">
                <h2>${product.name}</h2>
                <div class="product-meta">
                    <span class="product-type">${product.product_type || 'Product'}</span>
                    <span class="product-level">${product.product_level || ''}</span>
                    <span class="product-id">ID: ${product.product_id || product.id}</span>
                </div>
                
                <div class="product-description-full">
                    <p>${product.description || 'No description available.'}</p>
                </div>
                
                ${priceDisplay}
                
                <div class="product-stock-info">
                    <span class="stock-quantity">Available: ${product.stock_quantity || 'N/A'}</span>
                    <span class="delivery-time">Delivery: ${product.delivery_time || 'Contact for details'}</span>
                </div>
                
                ${paymentMethods.length > 0 ? `
                    <div class="payment-methods-section">
                        <h4>Accepted Payment Methods:</h4>
                        <div class="payment-icons">
                            ${paymentMethods.map(pmId => {
                                const pm = window.appState.payments.find(p => p.id === pmId);
                                return pm ? `
                                    <div class="payment-icon">
                                        <img src="${pm.icon_url}" alt="${pm.name}" title="${pm.name}">
                                    </div>
                                ` : '';
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${contacts.length > 0 ? `
                    <div class="contact-methods-section">
                        <h4>Contact Options:</h4>
                        <div class="contact-buttons">
                            ${contacts.map(contactId => {
                                const contact = window.appState.contacts.find(c => c.id === contactId);
                                return contact ? `
                                    <button class="contact-btn" onclick="window.open('${contact.link || contact.address}', '_blank')">
                                        <img src="${contact.icon_url}" alt="${contact.name}">
                                        <span>${contact.name}</span>
                                    </button>
                                ` : '';
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="product-actions">
                    <button class="btn-buy-now" onclick="purchaseEnhancedProduct(${product.id})">
                        Buy Now - ${finalPrice.toFixed(0)} ${product.currency}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Set up image state for navigation
    window.currentImageIndex = 0;
    window.productImages = images;

    modal.classList.add('active');
}

// Product image navigation functions
function changeProductImage(direction) {
    if (!window.productImages || window.productImages.length <= 1) return;
    
    window.currentImageIndex = (window.currentImageIndex + direction + window.productImages.length) % window.productImages.length;
    
    document.getElementById('mainProductImage').src = window.productImages[window.currentImageIndex];
    
    // Update thumbnail selection
    document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === window.currentImageIndex);
    });
}

function selectProductImage(index) {
    if (!window.productImages || index < 0 || index >= window.productImages.length) return;
    
    window.currentImageIndex = index;
    document.getElementById('mainProductImage').src = window.productImages[index];
    
    // Update thumbnail selection
    document.querySelectorAll('.thumbnail').forEach((thumb, thumbIndex) => {
        thumb.classList.toggle('active', thumbIndex === index);
    });
}

function closeProductDetails() {
    document.getElementById('productDetailsModal').classList.remove('active');
    window.currentImageIndex = 0;
    window.productImages = [];
}

// ========== ENHANCED PRODUCT PURCHASE ==========
async function purchaseEnhancedProduct(productId) {
    console.log('🛒 Purchasing Enhanced Product:', productId);
    
    const product = window.appState.enhancedProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    // Close product details modal
    closeProductDetails();

    // Set current enhanced product for purchase
    window.appState.selectedEnhancedProduct = product;

    // Show enhanced payment modal
    await showEnhancedPaymentModal(product);
}

async function showEnhancedPaymentModal(product) {
    console.log('💳 Showing Enhanced Payment Modal');
    
    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');

    showLoading();

    // Load payments if not loaded
    if (!window.appState.payments || window.appState.payments.length === 0) {
        await loadPayments();
    }

    hideLoading();

    // Get allowed payment methods for this product
    const allowedPaymentIds = product.payment_methods ? JSON.parse(product.payment_methods) : [];
    const allowedPayments = window.appState.payments.filter(pm => allowedPaymentIds.includes(pm.id));

    // Calculate final price
    let finalPrice = product.price;
    if (product.discount_percentage && product.discount_percentage > 0) {
        finalPrice = product.price * (1 - product.discount_percentage / 100);
    }

    let html = '<div class="enhanced-payment-selection">';
    
    // Order Summary
    html += `<div class="order-summary">
        <h3>${product.name}</h3>
        <p>${product.description || ''}</p>
        <div class="price-breakdown">
            ${product.discount_percentage ? `
                <div class="original-price-line">Original: ${product.price} ${product.currency}</div>
                <div class="discount-line">Discount (${product.discount_percentage}%): -${(product.price * product.discount_percentage / 100).toFixed(0)} ${product.currency}</div>
                <div class="final-price-line">Final Price: ${finalPrice.toFixed(0)} ${product.currency}</div>
            ` : `
                <div class="final-price-line">Price: ${finalPrice.toFixed(0)} ${product.currency}</div>
            `}
        </div>
    </div>`;

    html += '<h3 style="margin: 24px 0 16px 0; font-size: 20px; font-weight: 700; color: var(--text-primary);">Select Payment Method</h3>';
    
    // Payment Methods
    if (allowedPayments.length === 0) {
        html += '<div style="text-align: center; color: var(--warning-color); padding: 40px; background: rgba(245, 158, 11, 0.1); border-radius: var(--border-radius); margin: 20px 0;"><p>⚠️ No payment methods available for this product</p></div>';
    } else {
        html += '<div class="payment-methods">';
        allowedPayments.forEach(payment => {
            html += `
                <div class="payment-method" data-payment-id="${payment.id}">
                    <img src="${payment.icon_url}" alt="${payment.name}">
                    <span>${payment.name}</span>
                </div>
            `;
        });
        html += '</div>';
    }

    html += '<div id="paymentDetails" style="display:none;"></div>';
    html += `<button class="btn-primary" id="submitEnhancedOrderBtn" style="margin-top: 24px; width: 100%;" ${allowedPayments.length === 0 ? 'disabled' : ''}>Submit Order</button>`;
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    // Attach payment method click events
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(item => {
        const paymentId = parseInt(item.getAttribute('data-payment-id'));
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectEnhancedPayment(paymentId);
        });
    });

    // Attach submit button event
    const submitBtn = document.getElementById('submitEnhancedOrderBtn');
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            submitEnhancedOrder();
        });
    }
}

async function selectEnhancedPayment(paymentId) {
    console.log('💳 Selecting Enhanced Payment:', paymentId);
    
    window.appState.selectedPayment = parseInt(paymentId);

    // Update UI
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });

    const selectedEl = document.querySelector(`[data-payment-id="${paymentId}"]`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
    }

    // Load payment details
    try {
        const { data: payment, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error) throw error;

        const detailsDiv = document.getElementById('paymentDetails');
        if (detailsDiv && payment) {
            detailsDiv.style.display = 'block';
            detailsDiv.innerHTML = `
                <div class="payment-info">
                    <h4>${payment.name}</h4>
                    <p>${payment.instructions || 'Please complete payment and enter transaction details below.'}</p>
                    <p style="margin-bottom: 16px;"><strong>Payment Address:</strong> 
                        <span style="color: var(--accent-color); font-weight: 600;">${payment.address}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${payment.address}')">📋 Copy</button>
                    </p>
                    <div class="form-group" style="margin-top: 20px;">
                        <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px; display: block;">Transaction ID (Last 6 digits)</label>
                        <input type="text" id="transactionCode" maxlength="6" placeholder="Enter last 6 digits" required style="font-family: monospace; letter-spacing: 1px;">
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error loading payment details:', error);
        showToast('Error loading payment details', 'error');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Address copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy address', 'error');
    });
}

async function submitEnhancedOrder() {
    console.log('📤 Submitting Enhanced Order');

    if (!window.appState.selectedPayment) {
        showToast('Please select a payment method', 'warning');
        return;
    }

    const transactionCode = document.getElementById('transactionCode')?.value;
    if (!transactionCode || transactionCode.trim().length !== 6) {
        showToast('Please enter last 6 digits of transaction ID', 'warning');
        return;
    }

    const product = window.appState.selectedEnhancedProduct;
    if (!product) {
        showToast('Product information not found', 'error');
        return;
    }

    showLoading();

    try {
        // Calculate final price
        let finalPrice = product.price;
        if (product.discount_percentage && product.discount_percentage > 0) {
            finalPrice = product.price * (1 - product.discount_percentage / 100);
        }

        const orderData = {
            user_id: parseInt(window.appState.currentUser.id),
            enhanced_product_id: parseInt(product.id),
            button_id: parseInt(window.appState.currentButtonId),
            payment_method_id: parseInt(window.appState.selectedPayment),
            final_price: finalPrice,
            currency: product.currency,
            transaction_code: transactionCode.trim(),
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('enhanced_orders')
            .insert([orderData])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        closePaymentModal();
        
        showToast(`🎉 Order Placed Successfully! Order ID: #${data.id}`, 'success', 8000);

        // Reset state
        window.appState.selectedEnhancedProduct = null;
        window.appState.selectedPayment = null;
        
        // Reload history and switch to history page
        await loadOrderHistory();
        switchPage('history');

    } catch (error) {
        hideLoading();
        console.error('❌ Enhanced order submission failed:', error);
        showToast('Error submitting order: ' + error.message, 'error');
    }
}

// ========== LEGACY MENU SYSTEM (Fallback) ==========
async function openCategoryPage(categoryId, buttonId) {
    console.log('🎮 Opening Legacy Category Page:', categoryId, buttonId);
    
    showLoading();

    try {
        // Reset state
        window.appState.currentButtonId = buttonId;
        window.appState.selectedMenuItem = null;
        window.appState.currentMenu = null;
        window.appState.currentTableData = {};
        window.appState.allMenus = [];
        window.appState.currentTables = [];
        
        // Load data
        const [tablesResult, menusResult, videosResult] = await Promise.all([
            supabase.from('input_tables').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('menus').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId).order('created_at', { ascending: true })
        ]);

        if (menusResult.error) throw menusResult.error;
        if (tablesResult.error) throw tablesResult.error;
        if (videosResult.error) throw videosResult.error;

        const tables = tablesResult.data || [];
        const menus = menusResult.data || [];
        const videos = videosResult.data || [];

        // Store in global state
        window.appState.allMenus = menus;
        window.appState.currentTables = tables;

        hideLoading();

        if (menus.length === 0) {
            showToast('No products available for this category', 'warning');
            return;
        }

        showPurchaseModal(tables, menus, videos);

    } catch (error) {
        hideLoading();
        console.error('❌ Error loading category data:', error);
        showToast('Error loading products. Please try again.', 'error');
    }
}

function showPurchaseModal(tables, menus, videos) {
    const modal = document.getElementById('purchaseModal');
    const content = document.getElementById('purchaseContent');
    
    let html = '<div class="purchase-form">';

    // Input Tables
    if (tables && tables.length > 0) {
        html += '<div class="input-tables" style="margin-bottom: 24px;">';
        tables.forEach(table => {
            html += `
                <div class="form-group">
                    <label>${renderAnimatedContent(table.name)}</label>
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

    // Menu Items
    if (menus && menus.length > 0) {
        html += '<h3 style="margin: 20px 0 16px 0;">Select Product</h3>';
        html += '<div class="menu-items">';
        menus.forEach(menu => {
            html += `
                <div class="menu-item" data-menu-id="${menu.id}">
                    ${menu.icon_url ? `<img src="${menu.icon_url}" class="menu-item-icon" alt="Product">` : '<div class="menu-item-icon"></div>'}
                    <div class="menu-item-info">
                        <div class="menu-item-name">${renderAnimatedContent(menu.name)}</div>
                        <div class="menu-item-amount">${renderAnimatedContent(menu.amount)}</div>
                        <div class="menu-item-price">${menu.price} MMK</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    html += `<button class="btn-primary" id="buyNowBtn" style="margin-top: 24px; width: 100%;">Continue to Purchase</button>`;
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    // Attach events
    setTimeout(() => {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const menuId = parseInt(item.getAttribute('data-menu-id'));
            item.addEventListener('click', () => selectMenuItem(menuId));
        });

        const buyBtn = document.getElementById('buyNowBtn');
        if (buyBtn) {
            buyBtn.addEventListener('click', proceedToPurchase);
        }
    }, 150);
}

function selectMenuItem(menuId) {
    window.appState.selectedMenuItem = menuId;
    const menu = window.appState.allMenus.find(m => m.id === menuId);
    if (menu) {
        window.appState.currentMenu = menu;
    }

    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-menu-id="${menuId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').classList.remove('active');
}

async function proceedToPurchase() {
    if (!window.appState.selectedMenuItem) {
        showToast('Please select a product first', 'warning');
        return;
    }

    if (!window.appState.currentMenu) {
        const menu = window.appState.allMenus.find(m => m.id === window.appState.selectedMenuItem);
        if (menu) {
            window.appState.currentMenu = menu;
        } else {
            showToast('Product data not found. Please select the product again.', 'error');
            return;
        }
    }

    // Collect table data
    const tableData = {};
    let allFilled = true;

    window.appState.currentTables.forEach(table => {
        const inputEl = document.querySelector(`[data-table-id="${table.id}"]`);
        if (inputEl) {
            const value = inputEl.value.trim();
            if (!value) {
                allFilled = false;
            }
            tableData[table.name] = value;
        }
    });

    if (window.appState.currentTables.length > 0 && !allFilled) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }

    window.appState.currentTableData = tableData;
    closePurchaseModal();
    await showPaymentModal();
}

// ========== PAYMENT MODAL ==========
async function loadPayments() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true});

        if (error) throw error;

        window.appState.payments = data || [];
        return data || [];
    } catch (error) {
        console.error('❌ Error loading payments:', error);
        window.appState.payments = [];
        return [];
    }
}

async function showPaymentModal() {
    const menu = window.appState.currentMenu;
    
    if (!menu) {
        showToast('Error: Product data not found. Please try again.', 'error');
        return;
    }

    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');

    showLoading();

    if (!window.appState.payments || window.appState.payments.length === 0) {
        await loadPayments();
    }

    hideLoading();

    const payments = window.appState.payments;

    let html = '<div class="payment-selection">';
    
    // Order Summary
    html += `<div class="order-summary">
        <h3>${renderAnimatedContent(menu.name)}</h3>
        <p>${renderAnimatedContent(menu.amount)}</p>
        <p class="price">${menu.price} MMK</p>
    </div>`;

    html += '<h3 style="margin: 24px 0 16px 0;">Select Payment Method</h3>';
    
    // Payment Methods
    if (payments.length === 0) {
        html += '<div style="text-align: center; color: var(--warning-color); padding: 40px;"><p>⚠️ No payment methods available</p></div>';
    } else {
        html += '<div class="payment-methods">';
        payments.forEach(payment => {
            html += `
                <div class="payment-method" data-payment-id="${payment.id}">
                    <img src="${payment.icon_url}" alt="${payment.name}">
                    <span>${renderAnimatedContent(payment.name)}</span>
                </div>
            `;
        });
        html += '</div>';
    }

    html += '<div id="paymentDetails" style="display:none;"></div>';
    html += `<button class="btn-primary" id="submitOrderBtn" style="margin-top: 24px; width: 100%;" ${payments.length === 0 ? 'disabled' : ''}>Submit Order</button>`;
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    // Attach events
    setTimeout(() => {
        const paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(item => {
            const paymentId = parseInt(item.getAttribute('data-payment-id'));
            item.addEventListener('click', () => selectPayment(paymentId));
        });

        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.addEventListener('click', submitOrder);
        }
    }, 150);
}

async function selectPayment(paymentId) {
    window.appState.selectedPayment = parseInt(paymentId);

    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });

    const selectedEl = document.querySelector(`[data-payment-id="${paymentId}"]`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
    }

    try {
        const { data: payment, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error) throw error;

        const detailsDiv = document.getElementById('paymentDetails');
        if (detailsDiv && payment) {
            detailsDiv.style.display = 'block';
            detailsDiv.innerHTML = `
                <div class="payment-info">
                    <h4>${renderAnimatedContent(payment.name)}</h4>
                    <p>${renderAnimatedContent(payment.instructions || 'Please complete payment and enter transaction details below.')}</p>
                    <p style="margin-bottom: 16px;"><strong>Payment Address:</strong> <span style="color: var(--accent-color); font-weight: 600;">${renderAnimatedContent(payment.address)}</span></p>
                    <div class="form-group" style="margin-top: 20px;">
                        <label>Transaction ID (Last 6 digits)</label>
                        <input type="text" id="transactionCode" maxlength="6" placeholder="Enter last 6 digits" required>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error loading payment details:', error);
        showToast('Error loading payment details', 'error');
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

async function submitOrder() {
    if (!window.appState.selectedPayment) {
        showToast('Please select a payment method', 'warning');
        return;
    }

    const transactionCode = document.getElementById('transactionCode')?.value;
    if (!transactionCode || transactionCode.trim().length !== 6) {
        showToast('Please enter last 6 digits of transaction ID', 'warning');
        return;
    }

    if (!window.appState.selectedMenuItem || !window.appState.currentButtonId) {
        showToast('Error: Missing order information. Please try again.', 'error');
        return;
    }

    showLoading();

    try {
        const orderData = {
            user_id: parseInt(window.appState.currentUser.id),
            menu_id: parseInt(window.appState.selectedMenuItem),
            button_id: parseInt(window.appState.currentButtonId),
            payment_method_id: parseInt(window.appState.selectedPayment),
            table_data: window.appState.currentTableData,
            transaction_code: transactionCode.trim(),
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        closePaymentModal();
        
        showToast(`🎉 Order Placed Successfully! Order ID: #${data.id}`, 'success', 8000);

        // Reset state
        window.appState.selectedMenuItem = null;
        window.appState.selectedPayment = null;
        window.appState.currentTableData = {};
        window.appState.currentMenu = null;
        window.appState.currentButtonId = null;
        window.appState.currentTables = [];
        
        await loadOrderHistory();
        switchPage('history');

    } catch (error) {
        hideLoading();
        console.error('❌ Order submission failed:', error);
        showToast('Error submitting order: ' + error.message, 'error');
    }
}

// ========== ORDER HISTORY ==========
async function loadOrderHistory() {
    try {
        // Load both regular orders and enhanced orders
        const [regularOrders, enhancedOrders] = await Promise.all([
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
                    enhanced_products (name, price, currency),
                    payment_methods (name)
                `)
                .eq('user_id', window.appState.currentUser.id)
                .order('created_at', { ascending: false })
        ]);

        const allOrders = [
            ...(regularOrders.data || []).map(order => ({...order, type: 'regular'})),
            ...(enhancedOrders.data || []).map(order => ({...order, type: 'enhanced'}))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        displayOrderHistory(allOrders);
    } catch (error) {
        console.error('❌ Error loading orders:', error);
    }
}

function displayOrderHistory(orders) {
    const container = document.getElementById('historyContainer');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="no-orders">No orders yet. Your order history will appear here.</div>';
        return;
    }

    container.innerHTML = '';

    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = 'history-item';

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

        let productName, productPrice, productAmount;
        
        if (order.type === 'enhanced') {
            productName = order.enhanced_products?.name || 'Unknown Product';
            productPrice = `${order.final_price || order.enhanced_products?.price || 0} ${order.currency || 'MMK'}`;
            productAmount = '';
        } else {
            productName = order.menus?.name || 'Unknown Product';
            productPrice = `${order.menus?.price || 0} MMK`;
            productAmount = order.menus?.amount || '';
        }

        item.innerHTML = `
            <div class="history-status ${statusClass}">${statusIcon} ${order.status.toUpperCase()}</div>
            <h3>${renderAnimatedContent(productName)}</h3>
            ${productAmount ? `<p>${renderAnimatedContent(productAmount)}</p>` : ''}
            <div class="order-details">
                <p><strong>Price:</strong> <span class="price">${productPrice}</span></p>
                <p><strong>Order ID:</strong> #${order.id}</p>
                <p><strong>Payment:</strong> ${renderAnimatedContent(order.payment_methods?.name || 'N/A')}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            </div>
            ${order.admin_message ? `<div class="admin-message">${renderAnimatedContent(order.admin_message)}</div>` : ''}
        `;

        container.appendChild(item);
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

        window.appState.contacts = data || [];
        displayContacts(data || []);
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
    }
}

function displayContacts(contacts) {
    const container = document.getElementById('contactsContainer');
    
    if (contacts.length === 0) {
        container.innerHTML = '<div class="no-contacts">No contact information available.</div>';
        return;
    }

    container.innerHTML = '';

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';
        
        item.innerHTML = `
            <img src="${contact.icon_url}" alt="${contact.name}" class="contact-icon">
            <div class="contact-info">
                <h3>${renderAnimatedContent(contact.name)}</h3>
                <p>${renderAnimatedContent(contact.description || '')}</p>
            </div>
        `;

        item.addEventListener('click', () => {
            if (contact.link) {
                window.open(contact.link, '_blank');
            } else if (contact.address) {
                window.open(contact.address, '_blank');
            }
        });

        container.appendChild(item);
    });
}

// ========== PROFILE ==========
async function loadProfile() {
    const user = window.appState.currentUser;
    if (!user) return;

    document.getElementById('profileName').value = user.name;
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileAvatar').textContent = user.name.charAt(0).toUpperCase();
}

async function updateProfile() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!currentPassword || !newPassword) {
        showToast('Please fill in both password fields', 'error');
        return;
    }

    if (window.appState.currentUser.password !== currentPassword) {
        showToast('Current password is incorrect', 'error');
        return;
    }

    showLoading();

    try {
        const { error } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', window.appState.currentUser.id);

        if (error) throw error;

        window.appState.currentUser.password = newPassword;
        localStorage.setItem('currentUser', JSON.stringify(window.appState.currentUser));

        hideLoading();
        showToast('Password updated successfully!', 'success');
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';

    } catch (error) {
        hideLoading();
        showToast('Error updating password', 'error');
        console.error('❌ Profile update error:', error);
    }
}

// ========== NAVIGATION ==========
function switchPage(pageName) {
    // Clear any running intervals when leaving products page
    if (window.appState.productBannerInterval) {
        clearInterval(window.appState.productBannerInterval);
        window.appState.productBannerInterval = null;
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName + 'Page').classList.add('active');

    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Load page-specific data
    if (pageName === 'history') {
        loadOrderHistory();
    } else if (pageName === 'contacts') {
        loadContacts();
    } else if (pageName === 'mi') {
        loadProfile();
    }
}

function goBackToHome() {
    // Clear product page intervals
    if (window.appState.productBannerInterval) {
        clearInterval(window.appState.productBannerInterval);
        window.appState.productBannerInterval = null;
    }
    
    // Reset product page state
    window.appState.currentCategoryId = null;
    window.appState.currentButtonData = null;
    window.appState.enhancedProducts = [];
    window.appState.productBanners = [];
    window.appState.productDescriptions = [];
    window.appState.categoryAds = [];
    
    switchPage('home');
}

console.log('✅ Enhanced Gaming Store App loaded successfully');
