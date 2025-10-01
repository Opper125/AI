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
    currentTables: []
};

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

        .order-summary .inline-animation {
            width: 22px;
            height: 22px;
        }
    `;
    document.head.appendChild(style);
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App initializing...');
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
    container.innerHTML = '';
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

// ========== PURCHASE MODAL (FIXED) ==========

async function openCategoryPage(categoryId, buttonId) {
    console.log('\n🎮 ========== OPENING CATEGORY PAGE ==========');
    console.log('Category ID:', categoryId);
    console.log('Button ID:', buttonId);
    
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

        console.log('✅ Loaded data:');
        console.log('  - Tables:', tables.length);
        console.log('  - Menus:', menus.length);
        console.log('  - Videos:', videos.length);
        console.log('  - Menus data:', menus);

        hideLoading();

        if (menus.length === 0) {
            alert('No products available for this category');
            return;
        }

        showPurchaseModal(tables, menus, videos);

    } catch (error) {
        hideLoading();
        console.error('❌ Error loading category data:', error);
        alert('Error loading products. Please try again.');
    }
}

function showPurchaseModal(tables, menus, videos) {
    console.log('\n📦 ========== SHOWING PURCHASE MODAL ==========');
    console.log('Tables:', tables.length);
    console.log('Menus:', menus.length);
    console.log('Videos:', videos.length);
    
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
        html += '<h3 style="margin: 20px 0 15px 0;">Select Product</h3>';
        html += '<div class="menu-items">';
        menus.forEach(menu => {
            html += `
                <div class="menu-item" data-menu-id="${menu.id}">
                    ${menu.icon_url ? `<img src="${menu.icon_url}" class="menu-item-icon" alt="Product">` : '<div class="menu-item-icon" style="background: rgba(255,255,255,0.1);"></div>'}
                    <div class="menu-item-info">
                        <div class="menu-item-name" data-menu-name="${menu.id}"></div>
                        <div class="menu-item-amount" data-menu-amount="${menu.id}"></div>
                        <div class="menu-item-price">${menu.price} MMK</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<p style="text-align:center;padding:20px;color:#94a3b8;">No products available</p>';
    }

    // Video Tutorials
    if (videos && videos.length > 0) {
        html += '<div class="video-section"><h3>Tutorials</h3>';
        videos.forEach(video => {
            html += `
                <div class="video-item" style="cursor:pointer;">
                    <img src="${video.banner_url}" alt="Video" onclick="window.open('${video.video_url}', '_blank')">
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

    // Apply animations and attach events
    setTimeout(() => {
        console.log('🎨 Applying animations and attaching events...');
        
        // Render table labels
        tables.forEach(table => {
            const labelEl = document.querySelector(`[data-table-label="${table.id}"]`);
            if (labelEl) applyAnimationRendering(labelEl, table.name);
        });

        // Render menu items
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

        // Attach menu item click events
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

function selectMenuItem(menuId) {
    console.log('\n🔍 ========== SELECTING MENU ITEM ==========');
    console.log('Menu ID:', menuId, '(type:', typeof menuId, ')');
    console.log('Available menus:', window.appState.allMenus.length);
    
    if (!menuId || isNaN(menuId)) {
        console.error('❌ Invalid menu ID');
        alert('Invalid product selection');
        return;
    }

    const parsedMenuId = parseInt(menuId);
    window.appState.selectedMenuItem = parsedMenuId;
    
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
        alert('Product data not found. Please try again.');
        return;
    }

    // Update UI
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-menu-id="${parsedMenuId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        console.log('✅ UI updated - item marked as selected');
    } else {
        console.warn('⚠️ Could not find menu item element to mark as selected');
    }
}

function closePurchaseModal() {
    console.log('🚪 Closing purchase modal');
    document.getElementById('purchaseModal').classList.remove('active');
}

async function proceedToPurchase() {
    console.log('\n🛒 ========== PROCEEDING TO PURCHASE ==========');
    console.log('Selected menu ID:', window.appState.selectedMenuItem);
    console.log('Current menu:', window.appState.currentMenu);
    console.log('Button ID:', window.appState.currentButtonId);
    
    // Validation
    if (!window.appState.selectedMenuItem) {
        console.error('❌ No menu selected');
        alert('Please select a product first');
        return;
    }

    if (!window.appState.currentMenu) {
        console.error('❌ Menu data not found');
        console.log('Attempting to recover menu data...');
        
        // Try to recover
        const menu = window.appState.allMenus.find(m => m.id === window.appState.selectedMenuItem);
        if (menu) {
            window.appState.currentMenu = menu;
            console.log('✅ Menu data recovered:', menu);
        } else {
            console.error('❌ Could not recover menu data');
            alert('Product data not found. Please select the product again.');
            return;
        }
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
        alert('Please fill in all required fields');
        return;
    }

    window.appState.currentTableData = tableData;
    console.log('✅ Table data collected:', tableData);

    closePurchaseModal();
    
    console.log('➡️ Moving to payment modal...');
    await showPaymentModal();
}

// ========== PAYMENT MODAL (FIXED) ==========

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

async function showPaymentModal() {
    console.log('\n💳 ========== SHOWING PAYMENT MODAL ==========');
    
    const menu = window.appState.currentMenu;
    
    if (!menu) {
        console.error('❌ Menu data not found in payment modal');
        console.log('State:', {
            selectedMenuItem: window.appState.selectedMenuItem,
            currentMenu: window.appState.currentMenu,
            allMenus: window.appState.allMenus.length
        });
        alert('Error: Product data not found. Please try again.');
        return;
    }

    console.log('✅ Menu data available:');
    console.log('  - Name:', menu.name);
    console.log('  - Price:', menu.price);
    console.log('  - Amount:', menu.amount);

    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');

    showLoading();

    // Load payments if not loaded
    if (!window.appState.payments || window.appState.payments.length === 0) {
        console.log('📥 Loading payment methods...');
        await loadPayments();
    }

    hideLoading();

    const payments = window.appState.payments;
    console.log('💳 Available payment methods:', payments.length);

    let html = '<div class="payment-selection">';
    
    // Order Summary
    html += `<div class="order-summary">
        <h3 data-order-summary-name></h3>
        <p data-order-summary-amount></p>
        <p class="price">${menu.price} MMK</p>
    </div>`;

    html += '<h3 style="margin: 20px 0 15px 0;">Select Payment Method</h3>';
    
    // Payment Methods
    if (payments.length === 0) {
        html += '<p style="text-align: center; color: #f59e0b; padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">⚠️ No payment methods available</p>';
    } else {
        html += '<div class="payment-methods">';
        payments.forEach(payment => {
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

    // Apply animations and attach events
    setTimeout(() => {
        console.log('🎨 Rendering payment modal content...');
        
        // Render order summary
        const summaryNameEl = document.querySelector('[data-order-summary-name]');
        const summaryAmountEl = document.querySelector('[data-order-summary-amount]');
        if (summaryNameEl) applyAnimationRendering(summaryNameEl, menu.name);
        if (summaryAmountEl) applyAnimationRendering(summaryAmountEl, menu.amount);

        // Render payment names
        payments.forEach(payment => {
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
        if (submitBtn) {
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
                    <h4 data-payment-detail-name></h4>
                    <p data-payment-detail-instruction></p>
                    <p><strong>Address:</strong> <span data-payment-detail-address></span></p>
                    <div class="form-group" style="margin-top: 15px;">
                        <label>Last 6 digits of transaction ID</label>
                        <input type="text" id="transactionCode" maxlength="6" placeholder="Enter last 6 digits" required>
                    </div>
                </div>
            `;

            // Render with animations
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
        alert('Error loading payment details');
    }
}

function closePaymentModal() {
    console.log('🚪 Closing payment modal');
    document.getElementById('paymentModal').classList.remove('active');
}

async function submitOrder() {
    console.log('\n📤 ========== SUBMITTING ORDER ==========');
    console.log('State check:');
    console.log('  - User ID:', window.appState.currentUser?.id);
    console.log('  - Menu ID:', window.appState.selectedMenuItem);
    console.log('  - Button ID:', window.appState.currentButtonId);
    console.log('  - Payment ID:', window.appState.selectedPayment);
    console.log('  - Table data:', window.appState.currentTableData);

    // Validation
    if (!window.appState.selectedPayment) {
        console.error('❌ No payment method selected');
        alert('Please select a payment method');
        return;
    }

    const transactionCode = document.getElementById('transactionCode')?.value;
    if (!transactionCode || transactionCode.trim().length !== 6) {
        console.error('❌ Invalid transaction code');
        alert('Please enter last 6 digits of transaction ID');
        return;
    }

    if (!window.appState.selectedMenuItem || !window.appState.currentButtonId) {
        console.error('❌ Missing order information');
        alert('Error: Missing order information. Please try again.');
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

        console.log('📦 Order data prepared:', orderData);

        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Order submitted successfully:', data);

        hideLoading();
        closePaymentModal();
        
        const menu = window.appState.currentMenu;
        alert(`✅ Order Placed Successfully!\n\nOrder ID: #${data.id}\nProduct: ${menu.name}\nPrice: ${menu.price} MMK\n\nYour order will be processed within 30 minutes.\nPlease check your order history.`);

        // Reset state
        window.appState.selectedMenuItem = null;
        window.appState.selectedPayment = null;
        window.appState.currentTableData = {};
        window.appState.currentMenu = null;
        window.appState.currentButtonId = null;
        window.appState.currentTables = [];
        
        // Reload history and switch to history page
        await loadOrderHistory();
        switchPage('history');

    } catch (error) {
        hideLoading();
        console.error('❌ Order submission failed:', error);
        alert('Error submitting order: ' + error.message);
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

console.log('✅ Gaming Store App initialized with full debugging support!');
