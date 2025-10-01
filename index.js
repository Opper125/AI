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

// Global State
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
    currentTables: []
};

// ========== ANIMATION STICKER SUPPORT ==========

/**
 * Converts URLs in text to inline animated images/videos
 * Detects GIF, PNG, WEBP, MP4, WEBM and displays them as emoji-sized animations
 */
function renderAnimatedContent(text) {
    if (!text) return '';
    
    // Pattern to detect URLs (images and videos)
    const urlPattern = /(https?:\/\/[^\s]+\.(?:gif|png|jpg|jpeg|webp|mp4|webm))/gi;
    
    return text.replace(urlPattern, (url) => {
        const extension = url.split('.').pop().toLowerCase().split('?')[0];
        
        // Video formats
        if (['mp4', 'webm'].includes(extension)) {
            return `<video class="inline-animation" autoplay loop muted playsinline>
                <source src="${url}" type="video/${extension}">
            </video>`;
        }
        
        // Image formats (including animated GIF)
        if (['gif', 'png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
            return `<img class="inline-animation" src="${url}" alt="sticker">`;
        }
        
        return url;
    });
}

/**
 * Apply animation rendering to an element's text content
 */
function applyAnimationRendering(element, text) {
    if (!element || !text) return;
    element.innerHTML = renderAnimatedContent(text);
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App initializing...');
    
    // Add CSS for inline animations
    addAnimationStyles();
    
    await testDatabaseConnection();
    await loadWebsiteSettings();
    checkAuth();
    hideLoading();
});

// Add CSS styles for inline animations
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .inline-animation {
            display: inline-block;
            width: 24px;
            height: 24px;
            object-fit: contain;
            vertical-align: middle;
            margin: 0 2px;
            border-radius: 4px;
        }
        
        .menu-item-name .inline-animation,
        .menu-item-amount .inline-animation {
            width: 20px;
            height: 20px;
        }
        
        .history-item .inline-animation,
        .contact-info .inline-animation {
            width: 18px;
            height: 18px;
        }
        
        .payment-info .inline-animation {
            width: 22px;
            height: 22px;
        }
    `;
    document.head.appendChild(style);
}

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
    const errorEl = document.getElementById('signupError');

    if (!name || !username || !email || !password) {
        showError(errorEl, 'Please fill in all fields');
        return;
    }

    if (!terms) {
        showError(errorEl, 'Please agree to the terms and conditions');
        return;
    }

    if (!validateEmail(email)) {
        showError(errorEl, 'Please enter a valid email address');
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
            showError(errorEl, 'Username already exists');
            return;
        }

        const { data: emailCheck } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (emailCheck) {
            hideLoading();
            showError(errorEl, 'Email already exists');
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
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred during signup');
        console.error('❌ Signup error:', error);
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
        showError(errorEl, 'Please fill in all fields');
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
            showError(errorEl, 'No account found with this email');
            return;
        }

        if (data.password !== password) {
            hideLoading();
            showError(errorEl, 'Incorrect password');
            return;
        }

        hideLoading();
        window.appState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred during login');
        console.error('❌ Login error:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.appState.currentUser = null;
    location.reload();
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
            <img src="${animationUrl}" alt="Loading" style="max-width: 200px; max-height: 200px;">
            <p style="margin-top: 15px; color: white;">Loading...</p>
        `;
    } else if (['webm', 'mp4'].includes(fileExt)) {
        loadingContainer.innerHTML = `
            <video autoplay loop muted style="max-width: 200px; max-height: 200px;">
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

// ========== BANNERS ==========

async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            displayBanners(data);
        }
    } catch (error) {
        console.error('❌ Error loading banners:', error);
    }
}

function displayBanners(banners) {
    const container = document.getElementById('bannerContainer');
    const wrapper = document.createElement('div');
    wrapper.className = 'banner-wrapper';

    banners.forEach(banner => {
        const item = document.createElement('div');
        item.className = 'banner-item';
        item.innerHTML = `<img src="${banner.image_url}" alt="Banner">`;
        wrapper.appendChild(item);
    });

    container.appendChild(wrapper);

    if (banners.length > 1) {
        let currentIndex = 0;
        setInterval(() => {
            currentIndex = (currentIndex + 1) % banners.length;
            wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        }, 5000);
    }
}

// ========== CATEGORIES ==========

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
                    .eq('category_id', category.id);
                
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
            
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'category-buttons';
            buttonsDiv.id = `category-${category.id}`;
            section.appendChild(buttonsDiv);

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
        
        btnEl.addEventListener('click', () => openCategoryPage(categoryId, button.id));
        container.appendChild(btnEl);
    });
}

// ========== PURCHASE MODAL ==========

async function openCategoryPage(categoryId, buttonId) {
    showLoading();

    try {
        console.log(`🎮 Opening button ID: ${buttonId}`);
        
        window.appState.currentButtonId = buttonId;
        
        const [tablesResult, menusResult, videosResult] = await Promise.all([
            supabase.from('input_tables').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('menus').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId).order('created_at', { ascending: true })
        ]);

        window.appState.allMenus = menusResult.data || [];
        window.appState.currentTables = tablesResult.data || [];

        console.log('📊 Loaded:', {
            tables: tablesResult.data?.length || 0,
            menus: menusResult.data?.length || 0,
            videos: videosResult.data?.length || 0
        });

        hideLoading();
        showPurchaseModal(
            tablesResult.data || [], 
            menusResult.data || [], 
            videosResult.data || []
        );

    } catch (error) {
        hideLoading();
        console.error('❌ Error:', error);
        alert('Error loading products');
    }
}

function showPurchaseModal(tables, menus, videos) {
    const modal = document.getElementById('purchaseModal');
    const content = document.getElementById('purchaseContent');
    
    let html = '<div class="purchase-form">';

    // Input Tables
    if (tables && tables.length > 0) {
        html += '<div class="input-tables">';
        tables.forEach(table => {
            html += `
                <div class="form-group">
                    <label data-table-label="${table.id}"></label>
                    <input type="text" 
                           id="table-${table.id}" 
                           data-table-instruction="${table.id}"
                           placeholder=""
                           required>
                </div>
            `;
        });
        html += '</div>';
    }

    // Menu Items
    if (menus && menus.length > 0) {
        html += '<h3 style="margin: 20px 0 15px 0;">Select Product</h3>';
        html += '<div class="menu-items">';
        menus.forEach(menu => {
            html += `
                <div class="menu-item" data-menu-id="${menu.id}">
                    ${menu.icon_url ? `<img src="${menu.icon_url}" class="menu-item-icon">` : '<div class="menu-item-icon"></div>'}
                    <div class="menu-item-info">
                        <div class="menu-item-name" data-menu-name="${menu.id}"></div>
                        <div class="menu-item-amount" data-menu-amount="${menu.id}"></div>
                        <div class="menu-item-price">${menu.price} MMK</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Video Tutorials
    if (videos && videos.length > 0) {
        html += '<div class="video-section"><h3>Tutorials</h3>';
        videos.forEach(video => {
            html += `
                <div class="video-item" onclick="window.open('${video.video_url}', '_blank')">
                    <img src="${video.banner_url}" alt="Video">
                    <p data-video-desc="${video.id}"></p>
                </div>
            `;
        });
        html += '</div>';
    }

    html += `<button class="btn-primary" id="buyNowBtn" style="margin-top: 20px;">Buy Now</button>`;
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    // Apply animation rendering after DOM ready
    setTimeout(() => {
        // Render table labels and placeholders
        tables.forEach(table => {
            const labelEl = document.querySelector(`[data-table-label="${table.id}"]`);
            const inputEl = document.querySelector(`[data-table-instruction="${table.id}"]`);
            if (labelEl) applyAnimationRendering(labelEl, table.name);
            if (inputEl) inputEl.placeholder = table.instruction || '';
        });

        // Render menu names and amounts
        menus.forEach(menu => {
            const nameEl = document.querySelector(`[data-menu-name="${menu.id}"]`);
            const amountEl = document.querySelector(`[data-menu-amount="${menu.id}"]`);
            if (nameEl) applyAnimationRendering(nameEl, menu.name);
            if (amountEl) applyAnimationRendering(amountEl, menu.amount);
        });

        // Render video descriptions
        videos.forEach(video => {
            const descEl = document.querySelector(`[data-video-desc="${video.id}"]`);
            if (descEl) applyAnimationRendering(descEl, video.description);
        });

        // Add event listeners
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const menuId = parseInt(this.getAttribute('data-menu-id'));
                selectMenuItem(menuId);
            });
        });

        const buyBtn = document.getElementById('buyNowBtn');
        if (buyBtn) {
            buyBtn.addEventListener('click', proceedToPurchase);
        }
    }, 100);
}

function selectMenuItem(menuId) {
    console.log('🔍 Selecting menu:', menuId);
    
    if (!menuId || isNaN(menuId)) {
        console.error('❌ Invalid menu ID');
        return;
    }

    window.appState.selectedMenuItem = parseInt(menuId);
    
    const menu = window.appState.allMenus.find(m => m.id === window.appState.selectedMenuItem);
    if (menu) {
        window.appState.currentMenu = menu;
        console.log('✅ Menu stored:', menu);
    } else {
        console.error('❌ Menu not found');
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
    window.appState.selectedMenuItem = null;
    window.appState.currentMenu = null;
}

async function proceedToPurchase() {
    console.log('🛒 === PURCHASE START ===');
    
    if (!window.appState.selectedMenuItem || !window.appState.currentMenu) {
        alert('Please select a product to purchase');
        return;
    }

    // Collect table data
    const tableData = {};
    let allFilled = true;

    window.appState.currentTables.forEach(table => {
        const inputEl = document.getElementById(`table-${table.id}`);
        if (inputEl) {
            const value = inputEl.value.trim();
            if (!value) {
                allFilled = false;
            }
            tableData[table.id] = value;
        }
    });

    if (window.appState.currentTables.length > 0 && !allFilled) {
        alert('Please fill in all required fields');
        return;
    }

    window.appState.currentTableData = tableData;
    console.log('📝 Table data collected:', tableData);

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
        console.log(`✅ Loaded ${data?.length || 0} payment methods`);
    } catch (error) {
        console.error('❌ Error loading payments:', error);
        window.appState.payments = [];
    }
}

async function showPaymentModal() {
    console.log('💳 === PAYMENT MODAL ===');
    
    const menu = window.appState.currentMenu;
    if (!menu) {
        alert('Error: Product data not found');
        return;
    }

    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');

    showLoading();

    if (!window.appState.payments || window.appState.payments.length === 0) {
        await loadPayments();
    }

    hideLoading();

    let html = '<div class="payment-selection">';
    
    // Order Summary
    html += `<div class="order-summary">
        <h3 data-order-summary-name></h3>
        <p data-order-summary-amount></p>
        <p class="price">${menu.price} MMK</p>
    </div>`;

    html += '<h3 style="margin: 20px 0 15px 0;">Select Payment Method</h3>';
    
    // Payment Methods
    if (window.appState.payments.length === 0) {
        html += '<p style="text-align: center; color: #f59e0b; padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">⚠️ No payment methods available</p>';
    } else {
        html += '<div class="payment-methods">';
        window.appState.payments.forEach(payment => {
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
    html += `<button class="btn-primary" id="submitOrderBtn" style="margin-top: 20px;">Submit Order</button>`;
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    // Apply animation rendering
    setTimeout(() => {
        // Render order summary
        const summaryNameEl = document.querySelector('[data-order-summary-name]');
        const summaryAmountEl = document.querySelector('[data-order-summary-amount]');
        if (summaryNameEl) applyAnimationRendering(summaryNameEl, menu.name);
        if (summaryAmountEl) applyAnimationRendering(summaryAmountEl, menu.amount);

        // Render payment method names
        window.appState.payments.forEach(payment => {
            const nameEl = document.querySelector(`[data-payment-name="${payment.id}"]`);
            if (nameEl) applyAnimationRendering(nameEl, payment.name);
        });

        // Add event listeners
        document.querySelectorAll('.payment-method').forEach(item => {
            item.addEventListener('click', function() {
                const paymentId = parseInt(this.getAttribute('data-payment-id'));
                selectPayment(paymentId);
            });
        });

        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', submitOrder);
        }
    }, 100);
}

async function selectPayment(paymentId) {
    window.appState.selectedPayment = parseInt(paymentId);
    console.log('💳 Payment selected:', window.appState.selectedPayment);

    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });

    const selectedEl = document.querySelector(`[data-payment-id="${paymentId}"]`);
    if (selectedEl) selectedEl.classList.add('selected');

    try {
        const { data: payment } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', paymentId)
            .single();

        const detailsDiv = document.getElementById('paymentDetails');
        if (detailsDiv && payment) {
            detailsDiv.style.display = 'block';
            detailsDiv.innerHTML = `
                <div class="payment-info">
                    <h4 data-payment-detail-name></h4>
                    <p data-payment-detail-instruction></p>
                    <p><strong>Address:</strong> <span data-payment-detail-address></span></p>
                    <div class="form-group" style="margin-top: 15px;">
                        <label>Last 6 digits of transaction ID</label>
                        <input type="text" id="transactionCode" maxlength="6" placeholder="Enter last 6 digits">
                    </div>
                </div>
            `;

            // Render payment details with animation support
            setTimeout(() => {
                const nameEl = document.querySelector('[data-payment-detail-name]');
                const instructionEl = document.querySelector('[data-payment-detail-instruction]');
                const addressEl = document.querySelector('[data-payment-detail-address]');
                
                if (nameEl) applyAnimationRendering(nameEl, payment.name);
                if (instructionEl) applyAnimationRendering(instructionEl, payment.instructions || 'Please complete payment and enter transaction details.');
                if (addressEl) applyAnimationRendering(addressEl, payment.address);
            }, 50);
        }
    } catch (error) {
        console.error('❌ Error loading payment details:', error);
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    window.appState.selectedPayment = null;
}

async function submitOrder() {
    console.log('📦 === SUBMIT ORDER ===');

    if (!window.appState.selectedPayment) {
        alert('Please select a payment method');
        return;
    }

    const transactionCode = document.getElementById('transactionCode')?.value;
    if (!transactionCode || transactionCode.length !== 6) {
        alert('Please enter last 6 digits of transaction');
        return;
    }

    if (!window.appState.selectedMenuItem || !window.appState.currentButtonId) {
        alert('Error: Missing order information');
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

        console.log('📤 Submitting order:', orderData);

        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        closePaymentModal();
        
        alert(`✅ Order Placed Successfully!\n\nOrder ID: #${data.id}\nProduct: ${window.appState.currentMenu.name}\nPrice: ${window.appState.currentMenu.price} MMK\n\nPlease wait up to 30 minutes.`);

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
        console.error('❌ Order submission error:', error);
        alert('Error: ' + error.message);
    }
}

// ========== ORDER HISTORY ==========

async function loadOrderHistory() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                menus (name, price, amount),
                payment_methods (name)
            `)
            .eq('user_id', window.appState.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayOrderHistory(data || []);
    } catch (error) {
        console.error('❌ Error loading orders:', error);
    }
}

function displayOrderHistory(orders) {
    const container = document.getElementById('historyContainer');
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No orders yet</p>';
        return;
    }

    container.innerHTML = '';

    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = 'history-item';

        let statusClass = 'pending';
        if (order.status === 'approved') statusClass = 'approved';
        if (order.status === 'rejected') statusClass = 'rejected';

        item.innerHTML = `
            <div class="history-status ${statusClass}">${order.status.toUpperCase()}</div>
            <h3 data-order-name="${order.id}"></h3>
            <p data-order-amount="${order.id}"></p>
            <p><strong>Price:</strong> ${order.menus?.price || 0} MMK</p>
            <p><strong>Payment:</strong> <span data-order-payment="${order.id}"></span></p>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            ${order.admin_message ? `<p style="margin-top:10px;padding:10px;background:rgba(251,191,36,0.1);border-radius:8px;border:1px solid #fbbf24;" data-order-message="${order.id}"></p>` : ''}
        `;

        container.appendChild(item);

        // Apply animation rendering
        setTimeout(() => {
            const nameEl = document.querySelector(`[data-order-name="${order.id}"]`);
            const amountEl = document.querySelector(`[data-order-amount="${order.id}"]`);
            const paymentEl = document.querySelector(`[data-order-payment="${order.id}"]`);
            const messageEl = document.querySelector(`[data-order-message="${order.id}"]`);

            if (nameEl) applyAnimationRendering(nameEl, order.menus?.name || 'Unknown');
            if (amountEl) applyAnimationRendering(amountEl, order.menus?.amount || '');
            if (paymentEl) applyAnimationRendering(paymentEl, order.payment_methods?.name || 'N/A');
            if (messageEl) applyAnimationRendering(messageEl, `<strong>Message:</strong> ${order.admin_message}`);
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
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No contacts</p>';
        return;
    }

    container.innerHTML = '';

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';

        if (contact.link) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => window.open(contact.link, '_blank'));
        }

        item.innerHTML = `
            <img src="${contact.icon_url}" class="contact-icon" alt="${contact.name}">
            <div class="contact-info">
                <h3 data-contact-name="${contact.id}"></h3>
                <p data-contact-desc="${contact.id}"></p>
                ${!contact.link && contact.address ? `<p data-contact-address="${contact.id}"></p>` : ''}
            </div>
        `;

        container.appendChild(item);

        // Apply animation rendering
        setTimeout(() => {
            const nameEl = document.querySelector(`[data-contact-name="${contact.id}"]`);
            const descEl = document.querySelector(`[data-contact-desc="${contact.id}"]`);
            const addressEl = document.querySelector(`[data-contact-address="${contact.id}"]`);

            if (nameEl) applyAnimationRendering(nameEl, contact.name);
            if (descEl) applyAnimationRendering(descEl, contact.description || '');
            if (addressEl) applyAnimationRendering(addressEl, contact.address || '');
        }, 50);
    });
}

// ========== PROFILE ==========

function loadProfile() {
    const user = window.appState.currentUser;
    document.getElementById('profileName').value = user.name;
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileEmail').value = user.email;

    const avatar = document.getElementById('profileAvatar');
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    avatar.textContent = initials;

    const hue = (user.id * 137) % 360;
    avatar.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue + 60}, 70%, 60%))`;
}

async function updateProfile() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const errorEl = document.getElementById('profileError');
    const successEl = document.getElementById('profileSuccess');

    if (!newPassword) {
        showError(errorEl, 'Please enter a new password');
        return;
    }

    if (currentPassword !== window.appState.currentUser.password) {
        showError(errorEl, 'Current password is incorrect');
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

        hideLoading();
        window.appState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        
        showSuccess(successEl, 'Password updated successfully!');

    } catch (error) {
        hideLoading();
        showError(errorEl, 'Error updating password');
        console.error('❌ Update error:', error);
    }
}

// ========== NAVIGATION ==========

function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.getElementById(pageName + 'Page').classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) activeNav.classList.add('active');
}

// ========== UTILITY FUNCTIONS ==========

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

console.log('✅ App ready with animation support!');
