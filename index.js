// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentUser = null;
let websiteSettings = null;
let categories = [];
let payments = [];
let contacts = [];

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await loadWebsiteSettings();
    checkAuth();
    hideLoading();
});

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
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred during signup');
        console.error('Signup error:', error);
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
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred during login');
        console.error('Login error:', error);
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
        const { data, error } = await supabase
            .from('website_settings')
            .select('*')
            .single();

        if (data) {
            websiteSettings = data;
            applyWebsiteSettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
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
    await Promise.all([
        loadBanners(),
        loadCategories(),
        loadPayments(),
        loadContacts(),
        loadProfile(),
        loadOrderHistory()
    ]);
}

// Load Banners
async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (data && data.length > 0) {
            displayBanners(data);
        }
    } catch (error) {
        console.error('Error loading banners:', error);
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
        const { data, error } = await supabase
            .from('categories')
            .select(`
                *,
                category_buttons (*)
            `)
            .order('created_at', { ascending: true });

        if (data) {
            categories = data;
            displayCategories(data);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Display Categories
function displayCategories(categories) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    categories.forEach(category => {
        const section = document.createElement('div');
        section.className = 'category-section';

        section.innerHTML = `
            <h3 class="category-title">${category.title}</h3>
            <div class="category-buttons" id="category-${category.id}"></div>
        `;

        container.appendChild(section);

        // Load buttons for this category
        if (category.category_buttons) {
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

// Open Category Page (will open purchase modal)
async function openCategoryPage(categoryId, buttonId) {
    showLoading();

    try {
        // Load tables and menus for this button
        const [tablesData, menusData, videosData] = await Promise.all([
            supabase.from('input_tables').select('*').eq('button_id', buttonId),
            supabase.from('menus').select('*').eq('button_id', buttonId),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId)
        ]);

        hideLoading();
        showPurchaseModal(tablesData.data, menusData.data, videosData.data, buttonId);

    } catch (error) {
        hideLoading();
        console.error('Error loading category page:', error);
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
                <div class="menu-item" onclick="selectMenuItem(${menu.id})">
                    ${menu.icon_url ? `<img src="${menu.icon_url}" class="menu-item-icon">` : ''}
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
let selectedMenuItem = null;
function selectMenuItem(menuId) {
    selectedMenuItem = menuId;
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.target.closest('.menu-item').classList.add('selected');
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
        tableData[input.id] = input.value.trim();
    });

    if (!allFilled) {
        alert('Please fill in all required fields');
        return;
    }

    // Show payment modal
    closePurchaseModal();
    await showPaymentModal(selectedMenuItem, tableData, buttonId);
}

// Load Payments
async function loadPayments() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*');

        if (data) {
            payments = data;
        }
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

// Show Payment Modal
async function showPaymentModal(menuId, tableData, buttonId) {
    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');

    // Get menu details
    const { data: menu } = await supabase
        .from('menus')
        .select('*')
        .eq('id', menuId)
        .single();

    let html = '<div class="payment-selection">';
    html += `<div class="order-summary">
        <h3>${menu.name}</h3>
        <p>${menu.amount}</p>
        <p class="price">${menu.price} MMK</p>
    </div>`;

    html += '<h3>Select Payment Method</h3>';
    html += '<div class="payment-methods">';

    payments.forEach(payment => {
        html += `
            <div class="payment-method" onclick="selectPayment(${payment.id})">
                <img src="${payment.icon_url}" alt="${payment.name}">
                <span>${payment.name}</span>
            </div>
        `;
    });

    html += '</div>';
    html += '<div id="paymentDetails" style="display:none;"></div>';
    html += `<button class="btn-primary" onclick="submitOrder(${menuId}, ${buttonId})">Submit Order</button>`;
    html += '</div>';

    content.innerHTML = html;
    modal.classList.add('active');

    // Store table data temporarily
    window.currentTableData = tableData;
    window.currentMenu = menu;
}

// Select Payment
let selectedPayment = null;
async function selectPayment(paymentId) {
    selectedPayment = paymentId;

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
            <p>${payment.instructions}</p>
            <p><strong>Address:</strong> ${payment.address}</p>
            <div class="form-group">
                <label>Last 6 digits of transaction</label>
                <input type="text" id="transactionCode" maxlength="6" placeholder="Enter last 6 digits">
            </div>
        </div>
    `;
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
        const { data, error } = await supabase
            .from('orders')
            .insert([
                {
                    user_id: currentUser.id,
                    menu_id: menuId,
                    button_id: buttonId,
                    table_data: window.currentTableData,
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
        loadOrderHistory();

    } catch (error) {
        hideLoading();
        alert('An error occurred while placing your order');
        console.error('Order error:', error);
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
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                menus (name, price, amount),
                payment_methods (name)
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (data) {
            displayOrderHistory(data);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Display Order History
function displayOrderHistory(orders) {
    const container = document.getElementById('historyContainer');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders yet</p>';
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
            <h3>${order.menus.name}</h3>
            <p>${order.menus.amount}</p>
            <p><strong>Price:</strong> ${order.menus.price} MMK</p>
            <p><strong>Payment:</strong> ${order.payment_methods.name}</p>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            ${order.admin_message ? `<p><strong>Message:</strong> ${order.admin_message}</p>` : ''}
        `;

        container.appendChild(item);
    });
}

// Load Contacts
async function loadContacts() {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        if (data) {
            contacts = data;
            displayContacts(data);
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

// Display Contacts
function displayContacts(contacts) {
    const container = document.getElementById('contactsContainer');
    
    if (contacts.length === 0) {
        container.innerHTML = '<p>No contacts available</p>';
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
                <p>${contact.description}</p>
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
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    avatar.textContent = initials;

    // Random gradient for each user
    const hue = currentUser.id % 360;
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

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred while updating password');
        console.error('Update error:', error);
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
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
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
