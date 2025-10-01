// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOGifed_1XNUral5FnXGHyjD_eQ4';

// Initialize Supabase
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
} catch (error) {
    console.error('❌ Supabase init failed:', error);
}

// Global App State
const AppState = {
    currentUser: null,
    websiteSettings: null,
    categories: [],
    payments: [],
    contacts: [],
    animations: [], // Store all loaded animations
    // Current purchase flow
    currentButtonId: null,
    currentMenus: [], // All menus for current button
    selectedMenu: null, // Selected menu object
    selectedPaymentId: null,
    tableData: {}
};

// Current sticker target for insertion
let currentStickerTarget = null;

// Make functions globally accessible
window.AppState = AppState;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing app...');
    await testDatabaseConnection();
    await loadWebsiteSettings();
    await loadAnimations(); // Load animations on startup
    checkAuth();
    hideLoading();
});

async function testDatabaseConnection() {
    const statusEl = document.getElementById('connectionStatus');
    const statusText = statusEl.querySelector('.status-text');
    const statusIcon = statusEl.querySelector('.status-icon');
    
    try {
        statusText.textContent = 'Testing database...';
        const { data, error } = await supabase
            .from('website_settings')
            .select('id')
            .limit(1);
        
        if (error) throw error;
        
        statusEl.classList.add('connected');
        statusIcon.textContent = '✅';
        statusText.textContent = 'Database connected!';
        
        setTimeout(() => {
            statusEl.classList.add('hide');
            setTimeout(() => statusEl.style.display = 'none', 500);
        }, 3000);
        
    } catch (error) {
        statusEl.classList.add('error');
        statusIcon.textContent = '❌';
        statusText.textContent = 'Database connection failed!';
        console.error('❌ DB Error:', error);
        setTimeout(() => statusEl.classList.add('hide'), 10000);
    }
}

function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 1000);
}

// ==================== ANIMATIONS/STICKER SYSTEM ====================

// Load All Animations from Database
async function loadAnimations() {
    try {
        console.log('🎨 Loading animations...');
        const { data, error } = await supabase
            .from('animations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        AppState.animations = data || [];
        console.log(`✅ Loaded ${AppState.animations.length} animations`);
        
    } catch (error) {
        console.error('❌ Error loading animations:', error);
        AppState.animations = [];
    }
}

// Enhanced Animation URL Detection Function
function detectAnimationUrls(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Improved regex patterns to detect various sticker link formats
    const patterns = [
        // Direct file URLs from animations table
        /(https?:\/\/[^\s]+\.(?:gif|webm|mp4|png|jpg|jpeg|json))/gi,
        // Supabase storage URLs  
        /(https?:\/\/[^\s]*supabase[^\s]*\.(?:gif|webm|mp4|png|jpg|jpeg|json))/gi,
        // Image hosting URLs
        /(https?:\/\/[^\s]*\.(?:com|net|org|io)\/[^\s]*\.(?:gif|webm|mp4|png|jpg|jpeg))/gi
    ];
    
    const urls = [];
    patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            urls.push(...matches);
        }
    });
    
    return [...new Set(urls)]; // Remove duplicates
}

// Enhanced Animation URL Replacement Function
function replaceAnimationUrls(text) {
    if (!text || typeof text !== 'string') return text;
    
    const animationUrls = detectAnimationUrls(text);
    let processedText = text;
    
    animationUrls.forEach(url => {
        const cleanUrl = url.trim();
        const fileExtension = cleanUrl.split('.').pop().toLowerCase();
        
        let replacement = '';
        
        if (['gif', 'png', 'jpg', 'jpeg'].includes(fileExtension)) {
            replacement = `<span class="animated-emoji"><img src="${cleanUrl}" alt="sticker" loading="lazy" onerror="this.style.display='none'"></span>`;
        } else if (['webm', 'mp4'].includes(fileExtension)) {
            replacement = `<span class="animated-emoji"><video autoplay loop muted playsinline preload="metadata" onerror="this.style.display='none'"><source src="${cleanUrl}" type="video/${fileExtension}"></video></span>`;
        } else if (fileExtension === 'json') {
            // For Lottie animations, fallback to image
            replacement = `<span class="animated-emoji"><img src="${cleanUrl}" alt="sticker" loading="lazy" onerror="this.style.display='none'"></span>`;
        }
        
        // Replace the URL with the HTML element
        if (replacement) {
            processedText = processedText.replace(new RegExp(escapeRegExp(url), 'g'), replacement);
        }
    });
    
    return processedText;
}

// Helper function to escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enhanced Render Animated Text Function (supports both {anim:} format and direct URLs)
function renderAnimatedText(text) {
    if (!text || typeof text !== 'string') return text;
    
    let processedText = text;
    
    // First, handle the original {anim:ID:URL:TYPE} format
    processedText = processedText.replace(/\{anim:(\d+):([^:]+):([^}]+)\}/g, (match, id, url, type) => {
        if (['gif', 'png', 'jpg', 'jpeg'].includes(type)) {
            return `<span class="animated-emoji"><img src="${url}" alt="sticker" title="Animation ID: ${id}" loading="lazy" onerror="this.style.display='none'"></span>`;
        } else if (['video', 'webm', 'mp4'].includes(type)) {
            return `<span class="animated-emoji"><video autoplay loop muted playsinline preload="metadata" title="Animation ID: ${id}" onerror="this.style.display='none'"><source src="${url}" type="video/${type}"></video></span>`;
        } else if (type === 'json') {
            return `<span class="animated-emoji"><img src="${url}" alt="sticker" title="Animation ID: ${id}" loading="lazy" onerror="this.style.display='none'"></span>`;
        } else {
            return `<span class="animated-emoji"><img src="${url}" alt="sticker" title="Animation ID: ${id}" loading="lazy" onerror="this.style.display='none'"></span>`;
        }
    });
    
    // Then, handle direct animation URLs that admin might have pasted
    processedText = replaceAnimationUrls(processedText);
    
    return processedText;
}

// Show Sticker Modal
function showStickerModal(targetElement) {
    currentStickerTarget = targetElement;
    const modal = document.getElementById('stickerModal');
    const grid = document.getElementById('stickerGrid');
    
    // Clear search
    document.getElementById('stickerSearch').value = '';
    
    // Load sticker grid
    grid.innerHTML = '';
    
    if (AppState.animations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;grid-column:1/-1;">No stickers available yet! 🎨</p>';
    } else {
        AppState.animations.forEach(anim => {
            const item = document.createElement('div');
            item.className = 'sticker-item';
            item.onclick = () => insertSticker(anim);
            
            let preview = '';
            if (['gif', 'png', 'jpg', 'jpeg'].includes(anim.file_type)) {
                preview = `<img src="${anim.file_url}" alt="${anim.name}" loading="lazy" onerror="this.style.display='none'">`;
            } else if (['video', 'webm', 'mp4'].includes(anim.file_type)) {
                preview = `<video autoplay loop muted playsinline preload="metadata" onerror="this.style.display='none'"><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
            } else {
                preview = `<img src="${anim.file_url}" alt="${anim.name}" loading="lazy" onerror="this.style.display='none'">`;
            }
            
            item.innerHTML = `
                ${preview}
                <div class="sticker-item-name">${anim.name}</div>
            `;
            
            grid.appendChild(item);
        });
    }
    
    modal.classList.add('active');
}

// Insert Sticker into Target Input
function insertSticker(animation) {
    if (!currentStickerTarget) return;

    const cursorPos = currentStickerTarget.selectionStart || currentStickerTarget.value.length;
    const textBefore = currentStickerTarget.value.substring(0, cursorPos);
    const textAfter = currentStickerTarget.value.substring(cursorPos);
    
    // Insert sticker code: {anim:ID:URL:TYPE}
    const stickerCode = `{anim:${animation.id}:${animation.file_url}:${animation.file_type}}`;
    
    currentStickerTarget.value = textBefore + stickerCode + textAfter;
    
    // Set cursor position after sticker
    const newPos = cursorPos + stickerCode.length;
    currentStickerTarget.setSelectionRange(newPos, newPos);
    currentStickerTarget.focus();
    
    closeStickerModal();
    
    // Show preview if element has preview functionality
    if (currentStickerTarget.dataset.preview) {
        updateTextPreview(currentStickerTarget);
    }
}

// Close Sticker Modal
function closeStickerModal() {
    document.getElementById('stickerModal').classList.remove('active');
    currentStickerTarget = null;
}

// Filter Stickers by Search
function filterStickers() {
    const searchTerm = document.getElementById('stickerSearch').value.toLowerCase();
    const items = document.querySelectorAll('.sticker-item');
    
    items.forEach(item => {
        const name = item.querySelector('.sticker-item-name');
        if (name && name.textContent.toLowerCase().includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Update Text Preview (for elements that show live preview)
function updateTextPreview(inputElement) {
    const previewId = inputElement.dataset.preview;
    if (previewId) {
        const previewElement = document.getElementById(previewId);
        if (previewElement) {
            previewElement.innerHTML = renderAnimatedText(inputElement.value);
        }
    }
}

// Add Sticker Button to Text Inputs
function addStickerButtonToInput(inputElement, buttonText = '🎨') {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group-with-sticker';
    
    const stickerBtn = document.createElement('button');
    stickerBtn.type = 'button';
    stickerBtn.className = 'sticker-btn';
    stickerBtn.textContent = buttonText;
    stickerBtn.onclick = () => showStickerModal(inputElement);
    
    // Insert wrapper
    inputElement.parentNode.insertBefore(wrapper, inputElement);
    wrapper.appendChild(inputElement);
    wrapper.appendChild(stickerBtn);
}

// ==================== AUTHENTICATION ====================

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        AppState.currentUser = JSON.parse(user);
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
        showError(errorEl, 'Please agree to terms');
        return;
    }

    if (!validateEmail(email)) {
        showError(errorEl, 'Invalid email');
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
                name, username, email, password,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        AppState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'Signup failed');
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
            showError(errorEl, 'No account found');
            return;
        }

        if (data.password !== password) {
            hideLoading();
            showError(errorEl, 'Incorrect password');
            return;
        }

        hideLoading();
        AppState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'Login failed');
        console.error('❌ Login error:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// ==================== WEBSITE SETTINGS ====================

async function loadWebsiteSettings() {
    try {
        const { data } = await supabase
            .from('website_settings')
            .select('*')
            .single();

        if (data) {
            AppState.websiteSettings = data;
            applyWebsiteSettings(data);
        }
    } catch (error) {
        console.error('❌ Settings error:', error);
    }
}

function applyWebsiteSettings(settings) {
    // Logo
    document.querySelectorAll('#authLogo, #appLogo').forEach(logo => {
        if (settings.logo_url) {
            logo.src = settings.logo_url;
            logo.style.display = 'block';
        }
    });

    // Website Name with Animation Support
    document.querySelectorAll('#authWebsiteName, #appWebsiteName').forEach(el => {
        if (settings.website_name) {
            // Use the enhanced renderAnimatedText function
            el.innerHTML = renderAnimatedText(settings.website_name);
        }
    });

    // Background
    if (settings.background_url) {
        const bg = document.getElementById('dynamicBackground');
        if (bg) bg.style.backgroundImage = `url(${settings.background_url})`;
    }

    // Loading animation
    if (settings.loading_animation_url) {
        applyLoadingAnimation(settings.loading_animation_url);
    }
}

function applyLoadingAnimation(url) {
    const container = document.getElementById('loadingAnimation');
    if (!container) return;

    const ext = url.split('.').pop().toLowerCase();
    const spinner = container.querySelector('.spinner');
    if (spinner) spinner.remove();

    if (['gif', 'png', 'jpg', 'jpeg'].includes(ext)) {
        container.innerHTML = `<img src="${url}" style="max-width:200px;max-height:200px;" loading="lazy"><p style="margin-top:15px;color:white;">Loading...</p>`;
    } else if (['webm', 'mp4'].includes(ext)) {
        container.innerHTML = `<video autoplay loop muted playsinline style="max-width:200px;max-height:200px;" preload="metadata"><source src="${url}" type="video/${ext}"></video><p style="margin-top:15px;color:white;">Loading...</p>`;
    }
}

// ==================== LOAD APP DATA ====================

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

async function loadBanners() {
    try {
        const { data } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (data && data.length > 0) {
            displayBanners(data);
        }
    } catch (error) {
        console.error('❌ Banners error:', error);
    }
}

function displayBanners(banners) {
    const container = document.getElementById('bannerContainer');
    const wrapper = document.createElement('div');
    wrapper.className = 'banner-wrapper';

    banners.forEach(banner => {
        const item = document.createElement('div');
        item.className = 'banner-item';
        item.innerHTML = `<img src="${banner.image_url}" alt="Banner" loading="lazy">`;
        wrapper.appendChild(item);
    });

    container.appendChild(wrapper);

    if (banners.length > 1) {
        let idx = 0;
        setInterval(() => {
            idx = (idx + 1) % banners.length;
            wrapper.style.transform = `translateX(-${idx * 100}%)`;
        }, 5000);
    }
}

// ==================== CATEGORIES ====================

async function loadCategories() {
    try {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (data && data.length > 0) {
            for (const category of data) {
                const { data: buttons } = await supabase
                    .from('category_buttons')
                    .select('*')
                    .eq('category_id', category.id);
                
                category.category_buttons = buttons || [];
            }
            
            AppState.categories = data;
            displayCategories(data);
        }
    } catch (error) {
        console.error('❌ Categories error:', error);
    }
}

function displayCategories(categories) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    categories.forEach(category => {
        if (category.category_buttons && category.category_buttons.length > 0) {
            const section = document.createElement('div');
            section.className = 'category-section';
            
            // Render animated title with enhanced function
            const titleHtml = renderAnimatedText(category.title);
            
            section.innerHTML = `
                <h3 class="category-title">${titleHtml}</h3>
                <div class="category-buttons" id="category-${category.id}"></div>
            `;
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
        
        // Render animated name with enhanced function
        const nameHtml = renderAnimatedText(button.name);
        
        btnEl.innerHTML = `
            <img src="${button.icon_url}" alt="${button.name}" loading="lazy">
            <span>${nameHtml}</span>
        `;
        btnEl.addEventListener('click', () => openCategoryPage(button.id));
        container.appendChild(btnEl);
    });
}

// ==================== OPEN CATEGORY (PURCHASE FLOW START) ====================

async function openCategoryPage(buttonId) {
    console.log('🎮 Opening button:', buttonId);
    showLoading();

    try {
        AppState.currentButtonId = buttonId;
        
        const [tablesRes, menusRes, videosRes] = await Promise.all([
            supabase.from('input_tables').select('*').eq('button_id', buttonId),
            supabase.from('menus').select('*').eq('button_id', buttonId),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId)
        ]);

        AppState.currentMenus = menusRes.data || [];
        
        console.log('📊 Loaded:', {
            tables: tablesRes.data?.length || 0,
            menus: menusRes.data?.length || 0,
            videos: videosRes.data?.length || 0
        });

        hideLoading();
        showPurchaseModal(tablesRes.data || [], menusRes.data || [], videosRes.data || []);

    } catch (error) {
        hideLoading();
        console.error('❌ Error:', error);
        alert('Error loading products');
    }
}

// ==================== PURCHASE MODAL ====================

function showPurchaseModal(tables, menus, videos) {
    console.log('🛍️ Showing purchase modal with', menus.length, 'menus');
    
    const modal = document.getElementById('purchaseModal');
    const content = document.getElementById('purchaseContent');
    
    let html = '<div class="purchase-form">';

    // Input tables
    if (tables && tables.length > 0) {
        html += '<div class="input-tables">';
        tables.forEach(table => {
            // Render animated text for table name and instruction with enhanced function
            const nameHtml = renderAnimatedText(table.name);
            const instructionHtml = renderAnimatedText(table.instruction);
            
            html += `
                <div class="form-group">
                    <label>${nameHtml}</label>
                    <input type="text" class="table-input" data-table-id="${table.id}" placeholder="${table.instruction}" required>
                </div>
            `;
        });
        html += '</div>';
    }

    // Menu items (Products)
    if (menus && menus.length > 0) {
        html += '<h3 style="margin: 20px 0 15px 0;">Select Product</h3>';
        html += '<div class="menu-items" id="menuItemsContainer">';
        menus.forEach(menu => {
            // Render animated text for menu name and amount with enhanced function
            const nameHtml = renderAnimatedText(menu.name);
            const amountHtml = renderAnimatedText(menu.amount);
            
            html += `
                <div class="menu-item" data-menu-id="${menu.id}">
                    ${menu.icon_url ? `<img src="${menu.icon_url}" class="menu-item-icon" loading="lazy">` : '<div class="menu-item-icon"></div>'}
                    <div class="menu-item-info">
                        <div class="menu-item-name">${nameHtml}</div>
                        <div class="menu-item-amount">${amountHtml}</div>
                        <div class="menu-item-price">${menu.price} MMK</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<p style="text-align:center;padding:40px;color:#f59e0b;">No products available</p>';
    }

    // Videos
    if (videos && videos.length > 0) {
        html += '<div class="video-section"><h3>Tutorials</h3>';
        videos.forEach(video => {
            // Render animated description with enhanced function
            const descriptionHtml = renderAnimatedText(video.description);
            
            html += `
                <div class="video-item" onclick="window.open('${video.video_url}', '_blank')">
                    <img src="${video.banner_url}" alt="Video" loading="lazy">
                    <p>${descriptionHtml}</p>
                </div>
            `;
        });
        html += '</div>';
    }

    html += '<button class="btn-primary" id="buyNowButton" style="margin-top:20px;">Buy Now</button>';
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    // Attach event listeners
    attachPurchaseEventListeners();
}

function attachPurchaseEventListeners() {
    // Menu item selection using event delegation
    const menuContainer = document.getElementById('menuItemsContainer');
    if (menuContainer) {
        menuContainer.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const menuId = parseInt(menuItem.getAttribute('data-menu-id'));
                selectMenu(menuId);
            }
        });
    }

    // Buy button
    const buyBtn = document.getElementById('buyNowButton');
    if (buyBtn) {
        buyBtn.addEventListener('click', handleBuyNow);
    }
}

function selectMenu(menuId) {
    console.log('🔍 Selecting menu ID:', menuId);
    
    // Find menu from stored menus
    const menu = AppState.currentMenus.find(m => m.id === menuId);
    
    if (!menu) {
        console.error('❌ Menu not found!');
        return;
    }

    AppState.selectedMenu = menu;
    console.log('✅ Menu selected:', menu);

    // Update UI
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-menu-id="${menuId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
}

function handleBuyNow() {
    console.log('🛒 Buy Now clicked');
    console.log('Selected menu:', AppState.selectedMenu);
    
    if (!AppState.selectedMenu) {
        alert('Please select a product to purchase');
        return;
    }

    // Collect table data
    const tableInputs = document.querySelectorAll('.table-input');
    const tableData = {};
    let allFilled = true;

    tableInputs.forEach(input => {
        const value = input.value.trim();
        if (!value) {
            allFilled = false;
        }
        const tableId = input.getAttribute('data-table-id');
        tableData[tableId] = value;
    });

    if (tableInputs.length > 0 && !allFilled) {
        alert('Please fill in all required fields');
        return;
    }

    AppState.tableData = tableData;
    console.log('📝 Table data:', tableData);

    closePurchaseModal();
    showPaymentModal();
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').classList.remove('active');
}

// ==================== PAYMENT MODAL ====================

async function loadPayments() {
    try {
        const { data } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        AppState.payments = data || [];
        console.log('✅ Loaded', data?.length || 0, 'payment methods');
    } catch (error) {
        console.error('❌ Payments error:', error);
        AppState.payments = [];
    }
}

async function showPaymentModal() {
    console.log('💳 Showing payment modal');
    console.log('Current menu:', AppState.selectedMenu);
    
    if (!AppState.selectedMenu) {
        alert('Error: Product data not found. Please try again.');
        return;
    }

    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');

    showLoading();

    if (!AppState.payments || AppState.payments.length === 0) {
        await loadPayments();
    }

    hideLoading();

    const menu = AppState.selectedMenu;

    let html = '<div class="payment-selection">';
    
    // Render animated menu info with enhanced function
    const menuNameHtml = renderAnimatedText(menu.name);
    const menuAmountHtml = renderAnimatedText(menu.amount);
    
    html += `
        <div class="order-summary">
            <h3>${menuNameHtml}</h3>
            <p>${menuAmountHtml}</p>
            <p class="price">${menu.price} MMK</p>
        </div>
    `;

    html += '<h3 style="margin: 20px 0 15px 0;">Select Payment Method</h3>';
    
    if (AppState.payments.length === 0) {
        html += '<p style="text-align:center;padding:20px;background:rgba(245,158,11,0.1);border-radius:12px;color:#f59e0b;">⚠️ No payment methods available</p>';
    } else {
        html += '<div class="payment-methods" id="paymentMethodsContainer">';
        AppState.payments.forEach(payment => {
            // Render animated payment name with enhanced function
            const paymentNameHtml = renderAnimatedText(payment.name);
            
            html += `
                <div class="payment-method" data-payment-id="${payment.id}">
                    <img src="${payment.icon_url}" alt="${payment.name}" loading="lazy">
                    <span>${paymentNameHtml}</span>
                </div>
            `;
        });
        html += '</div>';
    }

    html += '<div id="paymentDetailsDiv" style="display:none;"></div>';
    html += '<button class="btn-primary" id="submitOrderButton" style="margin-top:20px;">Submit Order</button>';
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    attachPaymentEventListeners();
}

function attachPaymentEventListeners() {
    const paymentContainer = document.getElementById('paymentMethodsContainer');
    if (paymentContainer) {
        paymentContainer.addEventListener('click', (e) => {
            const paymentMethod = e.target.closest('.payment-method');
            if (paymentMethod) {
                const paymentId = parseInt(paymentMethod.getAttribute('data-payment-id'));
                selectPayment(paymentId);
            }
        });
    }

    const submitBtn = document.getElementById('submitOrderButton');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }
}

async function selectPayment(paymentId) {
    console.log('💳 Selecting payment:', paymentId);
    AppState.selectedPaymentId = paymentId;

    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });

    const selectedEl = document.querySelector(`[data-payment-id="${paymentId}"]`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
    }

    try {
        const { data: payment } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', paymentId)
            .single();

        const detailsDiv = document.getElementById('paymentDetailsDiv');
        if (detailsDiv && payment) {
            // Render animated payment info with enhanced function
            const paymentNameHtml = renderAnimatedText(payment.name);
            const instructionsHtml = renderAnimatedText(payment.instructions || 'Please complete payment and enter details.');
            
            detailsDiv.style.display = 'block';
            detailsDiv.innerHTML = `
                <div class="payment-info">
                    <h4>${paymentNameHtml}</h4>
                    <p>${instructionsHtml}</p>
                    <p><strong>Address:</strong> ${payment.address}</p>
                    <div class="form-group" style="margin-top:15px;">
                        <label>Last 6 digits of transaction ID</label>
                        <input type="text" id="transactionCodeInput" maxlength="6" placeholder="Enter last 6 digits">
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Payment details error:', error);
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    AppState.selectedPaymentId = null;
}

// ==================== SUBMIT ORDER ====================

async function submitOrder() {
    console.log('📦 === SUBMITTING ORDER ===');
    console.log('User ID:', AppState.currentUser?.id);
    console.log('Menu:', AppState.selectedMenu);
    console.log('Button ID:', AppState.currentButtonId);
    console.log('Payment ID:', AppState.selectedPaymentId);
    console.log('Table data:', AppState.tableData);

    if (!AppState.selectedPaymentId) {
        alert('Please select a payment method');
        return;
    }

    const transactionCode = document.getElementById('transactionCodeInput')?.value;
    if (!transactionCode || transactionCode.length !== 6) {
        alert('Please enter last 6 digits of transaction');
        return;
    }

    if (!AppState.selectedMenu || !AppState.currentButtonId) {
        alert('Error: Missing order information');
        return;
    }

    showLoading();

    try {
        const orderData = {
            user_id: parseInt(AppState.currentUser.id),
            menu_id: parseInt(AppState.selectedMenu.id),
            button_id: parseInt(AppState.currentButtonId),
            payment_method_id: parseInt(AppState.selectedPaymentId),
            table_data: AppState.tableData,
            transaction_code: transactionCode.trim(),
            status: 'pending',
            created_at: new Date().toISOString()
        };

        console.log('📤 Order data:', orderData);

        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        closePaymentModal();
        
        alert(`✅ Order Placed Successfully!\n\nOrder ID: #${data.id}\nProduct: ${AppState.selectedMenu.name}\nPrice: ${AppState.selectedMenu.price} MMK\n\nPlease wait up to 30 minutes for processing.`);

        // Reset state
        AppState.selectedMenu = null;
        AppState.selectedPaymentId = null;
        AppState.currentButtonId = null;
        AppState.tableData = {};
        AppState.currentMenus = [];
        
        await loadOrderHistory();

    } catch (error) {
        hideLoading();
        console.error('❌ Order error:', error);
        alert('Error placing order: ' + error.message);
    }
}

// ==================== ORDER HISTORY ====================

async function loadOrderHistory() {
    try {
        const { data } = await supabase
            .from('orders')
            .select(`
                *,
                menus (name, price, amount),
                payment_methods (name)
            `)
            .eq('user_id', AppState.currentUser.id)
            .order('created_at', { ascending: false });

        displayOrderHistory(data || []);
    } catch (error) {
        console.error('❌ Orders error:', error);
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

        // Render animated menu info with enhanced function
        const menuNameHtml = renderAnimatedText(order.menus?.name || 'Unknown');
        const menuAmountHtml = renderAnimatedText(order.menus?.amount || '');
        const paymentNameHtml = renderAnimatedText(order.payment_methods?.name || 'N/A');
        const adminMessageHtml = order.admin_message ? renderAnimatedText(order.admin_message) : '';

        item.innerHTML = `
            <div class="history-status ${statusClass}">${order.status.toUpperCase()}</div>
            <h3>${menuNameHtml}</h3>
            <p>${menuAmountHtml}</p>
            <p><strong>Price:</strong> ${order.menus?.price || 0} MMK</p>
            <p><strong>Payment:</strong> <span>${paymentNameHtml}</span></p>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            ${order.admin_message ? `<p style="margin-top:10px;padding:10px;background:rgba(251,191,36,0.1);border-radius:8px;border:1px solid #fbbf24;"><strong>Message:</strong> <span>${adminMessageHtml}</span></p>` : ''}
        `;

        container.appendChild(item);
    });
}

// ==================== CONTACTS ====================

async function loadContacts() {
    try {
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        displayContacts(data || []);
    } catch (error) {
        console.error('❌ Contacts error:', error);
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

        // Render animated contact info with enhanced function
        const nameHtml = renderAnimatedText(contact.name);
        const descriptionHtml = renderAnimatedText(contact.description || '');
        const addressHtml = renderAnimatedText(contact.address || '');

        item.innerHTML = `
            <img src="${contact.icon_url}" class="contact-icon" alt="${contact.name}" loading="lazy">
            <div class="contact-info">
                <h3>${nameHtml}</h3>
                <p>${descriptionHtml}</p>
                ${!contact.link && contact.address ? `<p>${addressHtml}</p>` : ''}
            </div>
        `;

        container.appendChild(item);
    });
}

// ==================== PROFILE ====================

function loadProfile() {
    const user = AppState.currentUser;
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

    if (currentPassword !== AppState.currentUser.password) {
        showError(errorEl, 'Current password is incorrect');
        return;
    }

    showLoading();

    try {
        const { data, error } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', AppState.currentUser.id)
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        AppState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        
        showSuccess(successEl, 'Password updated!');

    } catch (error) {
        hideLoading();
        showError(errorEl, 'Update failed');
        console.error('❌ Update error:', error);
    }
}

// ==================== UTILITIES ====================

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

console.log('✅ Enhanced App initialized successfully with improved animation URL detection! 🎨🔗');
