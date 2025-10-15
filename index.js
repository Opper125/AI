// ============================================
// GAMING STORE - USER INTERFACE JAVASCRIPT
// ============================================

// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentUser = null;
let currentCategory = null;
let currentProduct = null;
let websiteSettings = {};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    
    if (userId) {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (user) {
            currentUser = user;
            await initApp();
        } else {
            showAuth();
        }
    } else {
        showAuth();
    }
    
    hideLoading();
    setupEventListeners();
});

function setupEventListeners() {
    // Auth Events
    document.getElementById('showSignup')?.addEventListener('click', () => {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
    });
    
    document.getElementById('showLogin')?.addEventListener('click', () => {
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    });
    
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('signupBtn')?.addEventListener('click', handleSignup);
    
    // Navigation Events
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
        });
    });
}

// ============================================
// AUTHENTICATION
// ============================================

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    showLoading();
    
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    
    if (error || !user) {
        hideLoading();
        showToast('Account with this email does not exist', 'error');
        return;
    }
    
    if (user.password !== password) {
        hideLoading();
        showToast('Incorrect password', 'error');
        return;
    }
    
    currentUser = user;
    localStorage.setItem('userId', user.id);
    
    await initApp();
    hideLoading();
    showToast('Login successful!', 'success');
}

async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!name || !username || !email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showToast('Please agree to the Terms and Conditions', 'error');
        return;
    }
    
    showLoading();
    
    // Check if username exists
    const { data: existingUsername } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
    
    if (existingUsername) {
        hideLoading();
        showToast('Username already exists', 'error');
        return;
    }
    
    // Check if email exists
    const { data: existingEmail } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();
    
    if (existingEmail) {
        hideLoading();
        showToast('Email already registered', 'error');
        return;
    }
    
    // Generate unique profile image
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    
    // Create user
    const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
            name,
            username,
            email,
            password,
            profile_image: profileImage
        }])
        .select()
        .single();
    
    if (error) {
        hideLoading();
        showToast('Error creating account', 'error');
        return;
    }
    
    currentUser = newUser;
    localStorage.setItem('userId', newUser.id);
    
    await initApp();
    hideLoading();
    showToast('Account created successfully!', 'success');
}

function logout() {
    localStorage.removeItem('userId');
    currentUser = null;
    window.location.reload();
}

// ============================================
// APP INITIALIZATION
// ============================================

async function initApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    
    await loadSettings();
    await loadProfile();
    await loadHome();
    await loadHistory();
    await loadContacts();
}

async function loadSettings() {
    const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
    
    if (settings) {
        websiteSettings = settings;
        
        // Update logos and names
        const logos = document.querySelectorAll('#authLogo, #authLogoSignup, #appLogo');
        logos.forEach(logo => {
            if (settings.website_logo) {
                logo.src = settings.website_logo;
            }
        });
        
        const names = document.querySelectorAll('#authWebsiteName, #authWebsiteNameSignup, #appWebsiteName');
        names.forEach(name => {
            name.textContent = settings.website_name || 'GAMING STORE';
        });
        
        // Update background
        if (settings.background_image) {
            document.querySelector('.app-container').style.backgroundImage = `url(${settings.background_image})`;
        }
    }
}

async function loadProfile() {
    document.getElementById('profileImage').src = currentUser.profile_image;
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileUsername').value = currentUser.username;
    document.getElementById('profileEmail').value = currentUser.email;
}

async function loadHome() {
    await loadBanners();
    await loadCategories();
}

async function loadBanners() {
    const { data: banners } = await supabase
        .from('banners')
        .select('*')
        .eq('type', 'home')
        .order('order_index');
    
    const container = document.getElementById('bannersContainer');
    
    if (!banners || banners.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    if (banners.length === 1) {
        container.innerHTML = `
            <div class="banner-slider">
                <div class="banner-item">
                    <img src="${banners[0].image_url}" alt="Banner">
                </div>
            </div>
        `;
    } else {
        let currentIndex = 0;
        const slider = document.createElement('div');
        slider.className = 'banner-slider';
        
        banners.forEach(banner => {
            slider.innerHTML += `
                <div class="banner-item">
                    <img src="${banner.image_url}" alt="Banner">
                </div>
            `;
        });
        
        container.innerHTML = '';
        container.appendChild(slider);
        
        setInterval(() => {
            currentIndex = (currentIndex + 1) % banners.length;
            slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        }, 5000);
    }
}

async function loadCategories() {
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('order_index');
    
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';
    
    if (!categories || categories.length === 0) return;
    
    for (const category of categories) {
        const { data: buttonCategories } = await supabase
            .from('button_categories')
            .select('*')
            .eq('category_id', category.id)
            .order('order_index');
        
        if (!buttonCategories || buttonCategories.length === 0) continue;
        
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `
            <h3 class="category-title">${category.title}</h3>
            <div class="button-categories" id="buttons-${category.id}"></div>
        `;
        
        container.appendChild(section);
        
        const buttonsContainer = document.getElementById(`buttons-${category.id}`);
        
        buttonCategories.forEach(btn => {
            const button = document.createElement('div');
            button.className = 'category-button';
            button.innerHTML = `<img src="${btn.icon_url}" alt="${category.title}">`;
            button.addEventListener('click', () => openCategory(btn.id));
            buttonsContainer.appendChild(button);
        });
    }
}

async function openCategory(buttonCategoryId) {
    currentCategory = buttonCategoryId;
    
    showLoading();
    
    // Load category banners
    const { data: banners } = await supabase
        .from('banners')
        .select('*')
        .eq('button_category_id', buttonCategoryId)
        .order('order_index');
    
    const bannersContainer = document.getElementById('categoryBannersContainer');
    if (banners && banners.length > 0) {
        bannersContainer.innerHTML = `
            <div class="banner-slider">
                ${banners.map(b => `
                    <div class="banner-item">
                        <img src="${b.image_url}" alt="Banner">
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        bannersContainer.innerHTML = '';
    }
    
    // Load product tables
    const { data: tables } = await supabase
        .from('product_tables')
        .select('*')
        .eq('button_category_id', buttonCategoryId)
        .order('order_index');
    
    const tablesContainer = document.getElementById('productTablesContainer');
    if (tables && tables.length > 0) {
        tablesContainer.innerHTML = tables.map(t => `
            <div class="table-input-group">
                <label>${t.name}</label>
                <input type="text" id="table-${t.id}" placeholder="${t.placeholder || ''}">
            </div>
        `).join('');
    } else {
        tablesContainer.innerHTML = '';
    }
    
    // Load menu items
    const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('button_category_id', buttonCategoryId)
        .order('order_index');
    
    const menuContainer = document.getElementById('menuItemsContainer');
    if (menuItems && menuItems.length > 0) {
        menuContainer.innerHTML = menuItems.map(item => `
            <div class="menu-item" onclick="selectMenuItem('${item.id}')">
                ${item.icon_url ? `<img src="${item.icon_url}" alt="${item.name}" class="menu-item-icon">` : ''}
                <div class="menu-item-name">${item.name}</div>
                ${item.amount ? `<div class="menu-item-amount">${item.amount}</div>` : ''}
                <div class="menu-item-price">${item.price} ${item.currency || 'MMK'}</div>
            </div>
        `).join('');
    } else {
        menuContainer.innerHTML = '';
    }
    
    // Load products
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('button_category_id', buttonCategoryId)
        .order('order_index');
    
    const productsContainer = document.getElementById('productsContainer');
    if (products && products.length > 0) {
        productsContainer.innerHTML = products.map(p => {
            const discountedPrice = p.price - (p.price * (p.discount_percentage / 100));
            return `
                <div class="product-card" onclick="openProduct('${p.id}')">
                    ${p.icon_url ? `<img src="${p.icon_url}" alt="${p.name}" class="product-image">` : ''}
                    <div class="product-info">
                        <div class="product-name">${p.name}</div>
                        <div class="product-description">${p.description || ''}</div>
                        <div class="product-meta">
                            ${p.product_type ? `<span class="product-type">${p.product_type}</span>` : ''}
                            ${p.level ? `<span class="product-level">${p.level}</span>` : ''}
                        </div>
                        <div class="product-pricing">
                            ${p.discount_percentage > 0 ? `<span class="product-original-price">${p.price} ${p.currency}</span>` : ''}
                            <span class="product-price">${discountedPrice.toFixed(2)} ${p.currency}</span>
                            ${p.discount_percentage > 0 ? `<span class="product-discount">-${p.discount_percentage}%</span>` : ''}
                        </div>
                        <div class="product-stock">Stock: ${p.stock_quantity}</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        productsContainer.innerHTML = '';
    }
    
    // Load YouTube videos
    const { data: videos } = await supabase
        .from('youtube_videos')
        .select('*')
        .eq('button_category_id', buttonCategoryId);
    
    const videosContainer = document.getElementById('youtubeVideosContainer');
    if (videos && videos.length > 0) {
        videosContainer.innerHTML = videos.map(v => `
            <div class="youtube-video" onclick="window.open('${v.video_url}', '_blank')">
                <img src="${v.banner_url}" alt="Video" class="youtube-banner">
                <div class="youtube-description">${v.description || ''}</div>
            </div>
        `).join('');
    } else {
        videosContainer.innerHTML = '';
    }
    
    hideLoading();
    navigateToPage('categoryDetailPage');
}

function selectMenuItem(itemId) {
    // Implement menu item selection and checkout
    console.log('Selected menu item:', itemId);
}

function openProduct(productId) {
    // Implement product detail view
    console.log('Open product:', productId);
}

async function loadHistory() {
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('ordersContainer');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">No orders yet</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
            <div class="order-id">Order #${order.id.substring(0, 8)}</div>
            <div class="order-product-name">${order.product_name}</div>
            <div class="order-price">${order.price} ${order.currency}</div>
            <div class="order-date">${new Date(order.created_at).toLocaleString()}</div>
            ${order.admin_note ? `<div class="order-note">${order.admin_note}</div>` : ''}
        </div>
    `).join('');
}

async function loadContacts() {
    const { data: contacts } = await supabase
        .from('contacts')
        .select('*');
    
    const container = document.getElementById('contactsContainer');
    
    if (!contacts || contacts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">No contacts available</p>';
        return;
    }
    
    container.innerHTML = contacts.map(contact => `
        <div class="contact-card" onclick="${contact.link ? `window.open('${contact.link}', '_blank')` : ''}">
            ${contact.icon_url ? `<img src="${contact.icon_url}" alt="${contact.name}" class="contact-icon">` : ''}
            <div class="contact-name">${contact.name}</div>
            <div class="contact-description">${contact.description || ''}</div>
            ${contact.link ? `<div class="contact-address">${contact.link}</div>` : ''}
        </div>
    `).join('');
}

// ============================================
// NAVIGATION
// ============================================

function navigateToPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
}

function goBack() {
    navigateToPage('homePage');
}

function goBackToCategory() {
    navigateToPage('categoryDetailPage');
}

function goBackToProduct() {
    navigateToPage('productDetailPage');
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

async function editField(field) {
    const input = document.getElementById(`profile${field.charAt(0).toUpperCase() + field.slice(1)}`);
    
    if (input.readOnly) {
        input.readOnly = false;
        input.focus();
    } else {
        const newValue = input.value.trim();
        
        if (!newValue) {
            showToast('Field cannot be empty', 'error');
            return;
        }
        
        showLoading();
        
        const { error } = await supabase
            .from('users')
            .update({ [field]: newValue })
            .eq('id', currentUser.id);
        
        if (error) {
            hideLoading();
            showToast('Error updating profile', 'error');
            return;
        }
        
        currentUser[field] = newValue;
        input.readOnly = true;
        hideLoading();
        showToast('Profile updated successfully', 'success');
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    
    if (!currentPassword || !newPassword) {
        showToast('Please fill in both password fields', 'error');
        return;
    }
    
    if (currentPassword !== currentUser.password) {
        showToast('Current password is incorrect', 'error');
        return;
    }
    
    showLoading();
    
    const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', currentUser.id);
    
    if (error) {
        hideLoading();
        showToast('Error updating password', 'error');
        return;
    }
    
    currentUser.password = newPassword;
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    hideLoading();
    showToast('Password updated successfully', 'success');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showLoading() {
    document.getElementById('loadingScreen').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingScreen').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
