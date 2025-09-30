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
let currentUser = null;
let websiteSettings = null;
let categories = [];
let payments = [];
let contacts = [];
let selectedMenuItem = null;
let currentTableData = {};
let currentMenu = null;
let selectedPayment = null;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App initializing...');
    await testDatabaseConnection();
    await loadWebsiteSettings();
    checkAuth();
    hideLoading();
});

// Test Database Connection
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
        
        if (error) {
            throw error;
        }
        
        // Success
        statusEl.classList.add('connected');
        statusIcon.textContent = '✅';
        statusText.textContent = 'Database connected successfully!';
        console.log('✅ Database connection successful');
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusEl.classList.add('hide');
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 500);
        }, 3000);
        
    } catch (error) {
        // Error
        statusEl.classList.add('error');
        statusIcon.textContent = '❌';
        statusText.textContent = 'Database connection failed!';
        console.error('❌ Database connection failed:', error);
        
        // Hide after 10 seconds
        setTimeout(() => {
            statusEl.classList.add('hide');
        }, 10000);
    }
}

// Loading Functions
function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 1000);
}

// Auth Functions
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
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

// Handle Signup
async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const terms = document.getElementById('termsCheckbox').checked;
    const errorEl = document.getElementById('signupError');

    // Validation
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
        console.log('📝 Checking username...');
        // Check if username exists
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

        console.log('📧 Checking email...');
        // Check if email exists
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

        console.log('👤 Creating user...');
        // Create user
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    name: name,
                    username: username,
                    email: email,
                    password: password,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        console.log('✅ User created successfully');
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred during signup');
        console.error('❌ Signup error:', error);
    }
}

// Handle Login
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
        console.log('🔍 Checking user...');
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
        currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        console.log('✅ Login successful');
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred during login');
        console.error('❌ Login error:', error);
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
}

// Load Website Settings
async function loadWebsiteSettings() {
    try {
        console.log('⚙️ Loading website settings...');
        const { data, error } = await supabase
            .from('website_settings')
            .select('*')
            .single();

        if (data) {
            websiteSettings = data;
            applyWebsiteSettings();
            console.log('✅ Website settings loaded');
        }
    } catch (error) {
        console.error('❌ Error loading settings:', error);
    }
}

// Apply Website Settings
function applyWebsiteSettings() {
    if (!websiteSettings) return;

    // Set logo and name
    const logos = document.querySelectorAll('#authLogo, #appLogo');
    logos.forEach(logo => {
        if (websiteSettings.logo_url) {
            logo.src = websiteSettings.logo_url;
            logo.style.display = 'block';
        }
    });

    const names = document.querySelectorAll('#authWebsiteName, #appWebsiteName');
    names.forEach(name => {
        if (websiteSettings.website_name) {
            name.textContent = websiteSettings.website_name;
        }
    });

    // Set background
    if (websiteSettings.background_url) {
        document.body.style.backgroundImage = `url(${websiteSettings.background_url})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    }
}

// Load App Data
async function loadAppData() {
    console.log('📦 Loading app data...');
    await Promise.all([
        loadBanners(),
        loadCategories(),
        loadPayments(),
        loadContacts(),
        loadProfile(),
        loadOrderHistory()
    ]);
    console.log('✅ App data loaded');
}

// Load Banners
async function loadBanners() {
    try {
        console.log('🖼️ Loading banners...');
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (data && data.length > 0) {
            displayBanners(data);
            console.log(`✅ Loaded ${data.length} banners`);
        }
    } catch (error) {
        console.error('❌ Error loading banners:', error);
    }
}

// Display Banners
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

    // Auto scroll if multiple banners
    if (banners.length > 1) {
        let currentIndex = 0;
        setInterval(() => {
            currentIndex = (currentIndex + 1) % banners.length;
            wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        }, 5000);
    }
}

// Load Categories
async function loadCategories() {
    try {
        console.log('📂 Loading categories...');
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            // Load buttons for each category
            for (const category of data) {
                const { data: buttons } = await supabase
                    .from('category_buttons')
                    .select('*')
                    .eq('category_id', category.id);
                
                category.category_buttons = buttons || [];
            }
            
            categories = data;
            displayCategories(data);
            console.log(`✅ Loaded ${data.length} categories`);
        }
    } catch (error) {
        console.error('❌ Error loading categories:', error);
    }
}

// Display Categories
function displayCategories(categories) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    categories.forEach(category => {
        if (category.category_buttons && category.category_buttons.length > 0) {
            const section = document.createElement('div');
            section.className = 'category-section';

            section.innerHTML = `
                <h3 class="category-title">${category.title}</h3>
                <div class="category-buttons" id="category-${category.id}"></div>
            `;

            container.appendChild(section);
            displayCategoryButtons(category.id, category.category_buttons);
        }
    });
}

// Display Category Buttons
function displayCategoryButtons(categoryId, buttons) {
    const container = document.getElementById(`category-${categoryId}`);
    if (!container) return;

    buttons.forEach(button => {
        const btnEl = document.createElement('div');
        btnEl.className = 'category-button';
        btnEl.innerHTML = `
            <img src="${button.icon_url}" alt="${button.name}">
            <span>${button.name}</span>
        `;
        btnEl.onclick = () => openCategoryPage(categoryId, button.id);
        container.appendChild(btnEl);
    });
}

// Open Category Page
async function openCategoryPage(categoryId, buttonId) {
    showLoading();

    try {
        console.log(`🎮 Opening category page: ${buttonId}`);
        // Load tables, menus, and videos for this button
        const [tablesResult, menusResult, videosResult] = await Promise.all([
            supabase.from('input_tables').select('*').eq('button_id', buttonId),
            supabase.from('menus').select('*').eq('button_id', buttonId),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId)
        ]);

        hideLoading();
        showPurchaseModal(tablesResult.data || [], menusResult.data || [], videosResult.data || [], buttonId);

    } catch (error) {
        hideLoading();
        console.error('❌ Error loading category page:', error);
        alert('Error loading products. Please try again.');
    }
}

// Show Purchase Modal
function showPurchaseModal(tables, menus, videos, buttonId) {
    const modal = document.getElementById('purchaseModal');
    const content = document.getElementById('purchaseContent');
    
    let html = '<div class="purchase-form">';

    // Display tables (input fields)
    if (tables && tables.length > 0) {
        html += '<div class="input-tables">';
        tables.forEach(table => {
            html += `
                <div class="form-group">
                    <label>${table.name}</label>
                    <input type="text" id="table-${table.id}" placeholder="${table.instruction}" required>
                </div>
            `;
        });
        html += '</div>';
    }

    // Display menus (products)
    if (menus && menus.length > 0) {
        html += '<div class="menu-items" id="menuItems">';
        menus.forEach(menu => {
            html += `
                <div class="menu-item" data-menu-id="${menu.id}" onclick="selectMenuItem(${menu.id})">
                    ${menu.icon_url ? `<img src="${menu.icon_url}" class="menu-item-icon">` : '<div class="menu-item-icon"></div>'}
                    <div class="menu-item-info">
                        <div class="menu-item-name">${menu.name}</div>
                        <div class="menu-item-amount">${menu.amount}</div>
                        <div class="menu-item-price">${menu.price} MMK</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Display YouTube videos
    if (videos && videos.length > 0) {
        html += '<div class="video-section"><h3>Tutorials</h3>';
        videos.forEach(video => {
            html += `
                <div class="video-item" onclick="window.open('${video.video_url}', '_blank')">
                    <img src="${video.banner_url}" alt="Video">
                    <p>${video.description}</p>
                </div>
            `;
        });
        html += '</div>';
    }

    html += `<button class="btn-primary" onclick="proceedToPurchase(${buttonId})">Buy Now</button>`;
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');
}

// Select Menu Item
function selectMenuItem(menuId) {
    selectedMenuItem = menuId;
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`[data-menu-id="${menuId}"]`).classList.add('selected');
}

// Close Purchase Modal
function closePurchaseModal() {
    document.getElementById('purchaseModal').classList.remove('active');
    selectedMenuItem = null;
}

// Proceed to Purchase
async function proceedToPurchase(buttonId) {
    if (!selectedMenuItem) {
        alert('Please select an item to purchase');
        return;
    }

    // Collect table data
    const tables = document.querySelectorAll('.input-tables input');
    const tableData = {};
    let allFilled = true;

    tables.forEach(input => {
        if (!input.value.trim()) {
            allFilled = false;
        }
        const tableId = input.id.replace('table-', '');
        tableData[tableId] = input.value.trim();
    });

    if (!allFilled) {
        alert('Please fill in all required fields');
        return;
    }

    // Save to global
    currentTableData = tableData;

    // Show payment modal
    closePurchaseModal();
    await showPaymentModal(selectedMenuItem, tableData, buttonId);
}

// Load Payments
async function loadPayments() {
    try {
        console.log('💳 Loading payment methods...');
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*');

        if (data) {
            payments = data;
            console.log(`✅ Loaded ${data.length} payment methods`);
        }
    } catch (error) {
        console.error('❌ Error loading payments:', error);
    }
}

// Show Payment Modal
async function showPaymentModal(menuId, tableData, buttonId) {
    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');

    try {
        // Get menu details
        const { data: menu, error } = await supabase
            .from('menus')
            .select('*')
            .eq('id', menuId)
            .single();

        if (error) throw error;

        currentMenu = menu;

        let html = '<div class="payment-selection">';
        html += `<div class="order-summary">
            <h3>${menu.name}</h3>
            <p>${menu.amount}</p>
            <p class="price">${menu.price} MMK</p>
        </div>`;

        html += '<h3>Select Payment Method</h3>';
        
        if (payments.length === 0) {
            html += '<p>No payment methods available</p>';
        } else {
            html += '<div class="payment-methods">';
            payments.forEach(payment => {
                html += `
                    <div class="payment-method" data-payment-id="${payment.id}" onclick="selectPayment(${payment.id})">
                        <img src="${payment.icon_url}" alt="${payment.name}">
                        <span>${payment.name}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        html += '<div id="paymentDetails" style="display:none;"></div>';
        html += `<button class="btn-primary" onclick="submitOrder(${menuId}, ${buttonId})">Submit Order</button>`;
        html += '</div>';

        content.innerHTML = html;
        modal.classList.add('active');

    } catch (error) {
        console.error('❌ Error showing payment modal:', error);
        alert('Error loading payment methods');
    }
}

// Select Payment
async function selectPayment(paymentId) {
    selectedPayment = paymentId;

    // Remove selected class from all
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });

    // Add selected class
    document.querySelector(`[data-payment-id="${paymentId}"]`).classList.add('selected');

    try {
        const { data: payment } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', paymentId)
            .single();

        const detailsDiv = document.getElementById('paymentDetails');
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = `
            <div class="payment-info">
                <h4>${payment.name}</h4>
                <p>${payment.instructions || ''}</p>
                <p><strong>Address:</strong> ${payment.address}</p>
                <div class="form-group">
                    <label>Last 6 digits of transaction</label>
                    <input type="text" id="transactionCode" maxlength="6" placeholder="Enter last 6 digits">
                </div>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error loading payment details:', error);
    }
}

// Submit Order
async function submitOrder(menuId, buttonId) {
    if (!selectedPayment) {
        alert('Please select a payment method');
        return;
    }

    const transactionCode = document.getElementById('transactionCode')?.value;
    if (!transactionCode || transactionCode.length !== 6) {
        alert('Please enter the last 6 digits of your transaction');
        return;
    }

    showLoading();

    try {
        console.log('📦 Submitting order...');
        const { data, error } = await supabase
            .from('orders')
            .insert([
                {
                    user_id: currentUser.id,
                    menu_id: menuId,
                    button_id: buttonId,
                    table_data: currentTableData,
                    payment_method_id: selectedPayment,
                    transaction_code: transactionCode,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        closePaymentModal();
        alert('Thank you! Your order has been placed. Please wait 30 minutes.');
        console.log('✅ Order submitted successfully');
        
        // Reset
        selectedMenuItem = null;
        selectedPayment = null;
        currentTableData = {};
        
        // Reload order history
        loadOrderHistory();

    } catch (error) {
        hideLoading();
        alert('An error occurred while placing your order');
        console.error('❌ Order error:', error);
    }
}

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    selectedPayment = null;
}

// Load Order History
async function loadOrderHistory() {
    try {
        console.log('📜 Loading order history...');
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                menus (name, price, amount),
                payment_methods (name)
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
            displayOrderHistory(data);
            console.log(`✅ Loaded ${data.length} orders`);
        }
    } catch (error) {
        console.error('❌ Error loading orders:', error);
    }
}

// Display Order History
function displayOrderHistory(orders) {
    const container = document.getElementById('historyContainer');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;">No orders yet</p>';
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
            <h3>${order.menus?.name || 'Unknown Product'}</h3>
            <p>${order.menus?.amount || ''}</p>
            <p><strong>Price:</strong> ${order.menus?.price || 0} MMK</p>
            <p><strong>Payment:</strong> ${order.payment_methods?.name || 'N/A'}</p>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            ${order.admin_message ? `<p style="margin-top:10px;padding:10px;background:rgba(251,191,36,0.1);border-radius:8px;"><strong>Message:</strong> ${order.admin_message}</p>` : ''}
        `;

        container.appendChild(item);
    });
}

// Load Contacts
async function loadContacts() {
    try {
        console.log('📞 Loading contacts...');
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        if (data) {
            contacts = data;
            displayContacts(data);
            console.log(`✅ Loaded ${data.length} contacts`);
        }
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
    }
}

// Display Contacts
function displayContacts(contacts) {
    const container = document.getElementById('contactsContainer');
    
    if (!contacts || contacts.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;">No contacts available</p>';
        return;
    }

    container.innerHTML = '';

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';

        if (contact.link) {
            item.onclick = () => window.open(contact.link, '_blank');
        }

        item.innerHTML = `
            <img src="${contact.icon_url}" class="contact-icon" alt="${contact.name}">
            <div class="contact-info">
                <h3>${contact.name}</h3>
                <p>${contact.description || ''}</p>
                ${!contact.link && contact.address ? `<p>${contact.address}</p>` : ''}
            </div>
        `;

        container.appendChild(item);
    });
}

// Load Profile
function loadProfile() {
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileUsername').value = currentUser.username;
    document.getElementById('profileEmail').value = currentUser.email;

    // Generate AI avatar
    const avatar = document.getElementById('profileAvatar');
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    avatar.textContent = initials;

    // Random gradient for each user
    const hue = (currentUser.id * 137) % 360;
    avatar.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue + 60}, 70%, 60%))`;
}

// Update Profile
async function updateProfile() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const errorEl = document.getElementById('profileError');
    const successEl = document.getElementById('profileSuccess');

    if (!newPassword) {
        showError(errorEl, 'Please enter a new password');
        return;
    }

    if (currentPassword !== currentUser.password) {
        showError(errorEl, 'Current password is incorrect');
        return;
    }

    showLoading();

    try {
        console.log('🔄 Updating profile...');
        const { data, error } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        
        showSuccess(successEl, 'Password updated successfully!');
        console.log('✅ Profile updated');

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred while updating password');
        console.error('❌ Update error:', error);
    }
}

// Switch Page
function switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName + 'Page').classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

// Utility Functions
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

// Log initialization complete
console.log('✅ Index.js loaded successfully');
