// ============================================
// ADMIN DASHBOARD - JAVASCRIPT
// ============================================

// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin Password (Change this!)
const ADMIN_PASSWORD = 'admin123';

// Global State
let currentSection = 'dashboard';
let editingItem = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    hideLoading();
    checkAdminAuth();
    setupEventListeners();
});

function setupEventListeners() {
    // Login
    document.getElementById('loginBtn')?.addEventListener('click', handleAdminLogin);
    document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.dataset.section;
            navigateToSection(section);
        });
    });

    // Settings
    document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
    document.getElementById('bannerType')?.addEventListener('change', handleBannerTypeChange);

    // Banners
    document.getElementById('addBanner')?.addEventListener('click', addBanner);

    // Categories
    document.getElementById('addCategory')?.addEventListener('click', addCategory);
    document.getElementById('addButtonCategory')?.addEventListener('click', addButtonCategory);

    // Products
    setupProductTabs();
    document.getElementById('addMenuItemField')?.addEventListener('click', addMenuItemField);
    document.getElementById('saveMenuItems')?.addEventListener('click', saveMenuItems);
    document.getElementById('addTableField')?.addEventListener('click', addTableField);
    document.getElementById('saveProductTables')?.addEventListener('click', saveProductTables);
    document.getElementById('saveProduct')?.addEventListener('click', saveProduct);

    // Payments
    document.getElementById('addPayment')?.addEventListener('click', addPayment);

    // Contacts
    document.getElementById('addContact')?.addEventListener('click', addContact);

    // YouTube
    document.getElementById('addYoutubeVideo')?.addEventListener('click', addYoutubeVideo);

    // Orders
    setupOrderFilters();

    // File previews
    setupFilePreviews();

    // Category cascading selects
    setupCascadingSelects();
}

// ============================================
// AUTHENTICATION
// ============================================

function checkAdminAuth() {
    const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
    
    if (isAuthenticated) {
        showDashboard();
    } else {
        showLogin();
    }
}

function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminAuth', 'true');
        showDashboard();
        showToast('Welcome Admin!', 'success');
    } else {
        showToast('Incorrect password', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('adminAuth');
    window.location.reload();
}

function showLogin() {
    document.getElementById('adminLogin').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadDashboardData();
}

// ============================================
// NAVIGATION
// ============================================

function navigateToSection(section) {
    currentSection = section;
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) {
            link.classList.add('active');
        }
    });
    
    // Update sections
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}Section`).classList.add('active');
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        settings: 'Website Settings',
        banners: 'Banner Management',
        categories: 'Categories Management',
        products: 'Products Management',
        payments: 'Payment Methods',
        contacts: 'Contacts Management',
        orders: 'Orders Management',
        youtube: 'YouTube Videos'
    };
    document.getElementById('sectionTitle').textContent = titles[section];
    
    // Load section data
    loadSectionData(section);
}

async function loadSectionData(section) {
    showLoading();
    
    switch(section) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'settings':
            await loadSettings();
            break;
        case 'banners':
            await loadBannersData();
            break;
        case 'categories':
            await loadCategoriesData();
            break;
        case 'products':
            await loadProductsData();
            break;
        case 'payments':
            await loadPaymentsData();
            break;
        case 'contacts':
            await loadContactsData();
            break;
        case 'orders':
            await loadOrdersData();
            break;
        case 'youtube':
            await loadYoutubeData();
            break;
    }
    
    hideLoading();
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboardData() {
    // Load stats
    const { data: users } = await supabase.from('users').select('id');
    const { data: orders } = await supabase.from('orders').select('id, status');
    const { data: products } = await supabase.from('products').select('id');
    const { data: menuItems } = await supabase.from('menu_items').select('id');
    
    document.getElementById('totalUsers').textContent = users?.length || 0;
    document.getElementById('totalOrders').textContent = orders?.length || 0;
    document.getElementById('pendingOrders').textContent = orders?.filter(o => o.status === 'pending').length || 0;
    document.getElementById('totalProducts').textContent = (products?.length || 0) + (menuItems?.length || 0);
    
    // Load recent orders
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false })
        .limit(5);
    
    displayRecentOrders(recentOrders);
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No recent orders</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <span class="order-status-badge ${order.status}">${order.status}</span>
            <div class="order-header">
                <div class="order-id">Order #${order.id.substring(0, 8)}</div>
                <div class="order-user">${order.users?.name} (${order.users?.email})</div>
            </div>
            <div class="order-details">
                <div class="order-detail-row">
                    <span class="order-detail-label">Product:</span>
                    <span class="order-detail-value">${order.product_name}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">Price:</span>
                    <span class="order-detail-value">${order.price} ${order.currency}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">Date:</span>
                    <span class="order-detail-value">${new Date(order.created_at).toLocaleString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// SETTINGS
// ============================================

async function loadSettings() {
    const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
    
    if (settings) {
        document.getElementById('websiteName').value = settings.website_name || '';
        
        if (settings.website_logo) {
            document.getElementById('logoPreview').innerHTML = `<img src="${settings.website_logo}" alt="Logo">`;
        }
        if (settings.background_image) {
            document.getElementById('backgroundPreview').innerHTML = `<img src="${settings.background_image}" alt="Background">`;
        }
    }
}

async function saveSettings() {
    showLoading();
    
    const websiteName = document.getElementById('websiteName').value;
    
    // Upload files
    const logoFile = document.getElementById('websiteLogo').files[0];
    const backgroundFile = document.getElementById('backgroundImage').files[0];
    const loadingFile = document.getElementById('loadingAnimation').files[0];
    const buttonFile = document.getElementById('buttonStyle').files[0];
    
    let logoUrl = null, backgroundUrl = null, loadingUrl = null, buttonUrl = null;
    
    if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'website-assets');
    }
    if (backgroundFile) {
        backgroundUrl = await uploadFile(backgroundFile, 'website-assets');
    }
    if (loadingFile) {
        loadingUrl = await uploadFile(loadingFile, 'website-assets');
    }
    if (buttonFile) {
        buttonUrl = await uploadFile(buttonFile, 'website-assets');
    }
    
    // Get existing settings
    const { data: existing } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
    
    const updateData = {
        website_name: websiteName
    };
    
    if (logoUrl) updateData.website_logo = logoUrl;
    if (backgroundUrl) updateData.background_image = backgroundUrl;
    if (loadingUrl) updateData.loading_animation = loadingUrl;
    if (buttonUrl) updateData.button_style = buttonUrl;
    
    let error;
    if (existing) {
        ({ error } = await supabase
            .from('settings')
            .update(updateData)
            .eq('id', existing.id));
    } else {
        ({ error } = await supabase
            .from('settings')
            .insert([updateData]));
    }
    
    hideLoading();
    
    if (error) {
        showToast('Error saving settings', 'error');
    } else {
        showToast('Settings saved successfully', 'success');
        await loadSettings();
    }
}

// ============================================
// FILE UPLOAD
// ============================================

async function uploadFile(file, bucket = 'website-assets') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
    
    if (error) {
        console.error('Upload error:', error);
        return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
    
    return publicUrl;
}

// ============================================
// BANNERS
// ============================================

async function loadBannersData() {
    await loadCategorySelects();
    await displayBanners();
}

async function displayBanners() {
    const { data: banners } = await supabase
        .from('banners')
        .select('*, button_categories(id)')
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('bannersList');
    
    if (!banners || banners.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No banners added yet</p>';
        return;
    }
    
    container.innerHTML = banners.map(banner => `
        <div class="list-item">
            <img src="${banner.image_url}" alt="Banner" class="list-item-image">
            <div class="list-item-info">
                <div class="list-item-title">Banner - ${banner.type}</div>
                <div class="list-item-meta">Order: ${banner.order_index}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deleteBanner('${banner.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

function handleBannerTypeChange() {
    const type = document.getElementById('bannerType').value;
    const categoryGroup = document.getElementById('bannerCategoryGroup');
    const buttonCategoryGroup = document.getElementById('bannerButtonCategoryGroup');
    
    if (type === 'category') {
        categoryGroup.classList.remove('hidden');
        buttonCategoryGroup.classList.remove('hidden');
    } else {
        categoryGroup.classList.add('hidden');
        buttonCategoryGroup.classList.add('hidden');
    }
}

async function addBanner() {
    const type = document.getElementById('bannerType').value;
    const imageFile = document.getElementById('bannerImage').files[0];
    
    if (!imageFile) {
        showToast('Please select an image', 'error');
        return;
    }
    
    showLoading();
    
    const imageUrl = await uploadFile(imageFile, 'website-assets');
    
    if (!imageUrl) {
        hideLoading();
        showToast('Error uploading image', 'error');
        return;
    }
    
    const insertData = {
        type: type,
        image_url: imageUrl,
        order_index: 0
    };
    
    if (type === 'category') {
        const buttonCategoryId = document.getElementById('bannerButtonCategoryId').value;
        if (buttonCategoryId) {
            insertData.button_category_id = buttonCategoryId;
        }
    }
    
    const { error } = await supabase
        .from('banners')
        .insert([insertData]);
    
    hideLoading();
    
    if (error) {
        showToast('Error adding banner', 'error');
    } else {
        showToast('Banner added successfully', 'success');
        document.getElementById('bannerImage').value = '';
        document.getElementById('bannerImagePreview').innerHTML = '';
        await displayBanners();
    }
}

async function deleteBanner(id) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    showLoading();
    const { error } = await supabase.from('banners').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting banner', 'error');
    } else {
        showToast('Banner deleted successfully', 'success');
        await displayBanners();
    }
}

// ============================================
// CATEGORIES
// ============================================

async function loadCategoriesData() {
    await displayCategories();
    await displayButtonCategories();
    await loadCategorySelects();
}

async function displayCategories() {
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('order_index');
    
    const container = document.getElementById('categoriesList');
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No categories added yet</p>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div class="list-item">
            <div class="list-item-info">
                <div class="list-item-title">${cat.title}</div>
                <div class="list-item-meta">Order: ${cat.order_index}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deleteCategory('${cat.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

async function addCategory() {
    const title = document.getElementById('categoryTitle').value.trim();
    
    if (!title) {
        showToast('Please enter category title', 'error');
        return;
    }
    
    showLoading();
    const { error } = await supabase
        .from('categories')
        .insert([{ title, order_index: 0 }]);
    hideLoading();
    
    if (error) {
        showToast('Error adding category', 'error');
    } else {
        showToast('Category added successfully', 'success');
        document.getElementById('categoryTitle').value = '';
        await loadCategoriesData();
    }
}

async function deleteCategory(id) {
    if (!confirm('Are you sure? This will delete all button categories under it!')) return;
    
    showLoading();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting category', 'error');
    } else {
        showToast('Category deleted successfully', 'success');
        await loadCategoriesData();
    }
}

async function displayButtonCategories() {
    const { data: buttonCategories } = await supabase
        .from('button_categories')
        .select('*, categories(title)')
        .order('order_index');
    
    const container = document.getElementById('buttonCategoriesList');
    
    if (!buttonCategories || buttonCategories.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No button categories added yet</p>';
        return;
    }
    
    container.innerHTML = buttonCategories.map(btn => `
        <div class="list-item">
            <img src="${btn.icon_url}" alt="Icon" class="list-item-image">
            <div class="list-item-info">
                <div class="list-item-title">${btn.categories?.title || 'N/A'}</div>
                <div class="list-item-meta">Order: ${btn.order_index}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deleteButtonCategory('${btn.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

async function addButtonCategory() {
    const categoryId = document.getElementById('buttonCategoryParent').value;
    const iconFile = document.getElementById('buttonCategoryIcon').files[0];
    
    if (!categoryId || !iconFile) {
        showToast('Please select category and icon', 'error');
        return;
    }
    
    showLoading();
    const iconUrl = await uploadFile(iconFile, 'website-assets');
    
    if (!iconUrl) {
        hideLoading();
        showToast('Error uploading icon', 'error');
        return;
    }
    
    const { error } = await supabase
        .from('button_categories')
        .insert([{
            category_id: categoryId,
            icon_url: iconUrl,
            order_index: 0
        }]);
    
    hideLoading();
    
    if (error) {
        showToast('Error adding button category', 'error');
    } else {
        showToast('Button category added successfully', 'success');
        document.getElementById('buttonCategoryIcon').value = '';
        document.getElementById('buttonIconPreview').innerHTML = '';
        await loadCategoriesData();
    }
}

async function deleteButtonCategory(id) {
    if (!confirm('Are you sure?')) return;
    
    showLoading();
    const { error } = await supabase.from('button_categories').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting button category', 'error');
    } else {
        showToast('Button category deleted successfully', 'success');
        await loadCategoriesData();
    }
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

// ============================================
// CATEGORY SELECTS (Cascading)
// ============================================

async function loadCategorySelects() {
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('title');
    
    if (!categories) return;
    
    const selects = [
        'buttonCategoryParent',
        'bannerCategoryId',
        'menuCategoryId',
        'productCategoryId',
        'tableCategoryId',
        'youtubeCategoryId'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">-- Select Category --</option>' +
                categories.map(cat => `<option value="${cat.id}">${cat.title}</option>`).join('');
        }
    });
}

function setupCascadingSelects() {
    // Banner category change
    document.getElementById('bannerCategoryId')?.addEventListener('change', async (e) => {
        await loadButtonCategorySelect(e.target.value, 'bannerButtonCategoryId');
    });
    
    // Menu category change
    document.getElementById('menuCategoryId')?.addEventListener('change', async (e) => {
        await loadButtonCategorySelect(e.target.value, 'menuButtonCategoryId');
        await loadPaymentSelects('menuPayments');
    });
    
    // Product category change
    document.getElementById('productCategoryId')?.addEventListener('change', async (e) => {
        await loadButtonCategorySelect(e.target.value, 'productButtonCategoryId');
        await loadPaymentSelects('productPayments');
        await loadContactSelects('productContacts');
    });
    
    // Table category change
    document.getElementById('tableCategoryId')?.addEventListener('change', async (e) => {
        await loadButtonCategorySelect(e.target.value, 'tableButtonCategoryId');
    });
    
    // YouTube category change
    document.getElementById('youtubeCategoryId')?.addEventListener('change', async (e) => {
        await loadButtonCategorySelect(e.target.value, 'youtubeButtonCategoryId');
    });
}

async function loadButtonCategorySelect(categoryId, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    if (!categoryId) {
        select.innerHTML = '<option value="">-- Select Button Category --</option>';
        return;
    }
    
    const { data: buttonCategories } = await supabase
        .from('button_categories')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index');
    
    select.innerHTML = '<option value="">-- Select Button Category --</option>' +
        (buttonCategories?.map((btn, idx) => 
            `<option value="${btn.id}">Button ${idx + 1}</option>`
        ).join('') || '');
}

async function loadPaymentSelects(selectId) {
    const { data: payments } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name');
    
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = payments?.map(payment => 
        `<option value="${payment.id}">${payment.name}</option>`
    ).join('') || '';
}

async function loadContactSelects(selectId) {
    const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .order('name');
    
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = contacts?.map(contact => 
        `<option value="${contact.id}">${contact.name}</option>`
    ).join('') || '';
}

// ============================================
// PRODUCTS - TABS
// ============================================

function setupProductTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            
            // Update buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tab}Tab`).classList.add('active');
        });
    });
}

async function loadProductsData() {
    await loadCategorySelects();
    await displayMenuItems();
    await displayProducts();
    await displayProductTables();
}

// ============================================
// MENU ITEMS
// ============================================

function addMenuItemField() {
    const container = document.getElementById('menuItemsForm');
    const existingForms = container.querySelectorAll('.menu-item-form');
    
    const newForm = document.createElement('div');
    newForm.className = 'menu-item-form';
    newForm.innerHTML = `
        <button type="button" class="remove-field-btn" onclick="this.parentElement.remove()">×</button>
        
        <div class="form-group">
            <label>Name</label>
            <input type="text" class="menuName" placeholder="e.g., 120 UC">
        </div>
        
        <div class="form-group">
            <label>Amount (Optional)</label>
            <input type="text" class="menuAmount" placeholder="e.g., 120 Unknown Cash">
        </div>
        
        <div class="form-group">
            <label>Price</label>
            <input type="number" class="menuPrice" placeholder="e.g., 2000">
        </div>
        
        <div class="form-group">
            <label>Currency</label>
            <input type="text" class="menuCurrency" placeholder="e.g., MMK" value="MMK">
        </div>
        
        <div class="form-group">
            <label>Payment Methods</label>
            <select class="menuPayments" multiple></select>
        </div>
    `;
    
    container.appendChild(newForm);
    
    // Load payment options for new form
    loadPaymentSelects(newForm.querySelector('.menuPayments').id = `menuPayments${Date.now()}`);
}

async function saveMenuItems() {
    const categoryId = document.getElementById('menuCategoryId').value;
    const buttonCategoryId = document.getElementById('menuButtonCategoryId').value;
    
    if (!categoryId || !buttonCategoryId) {
        showToast('Please select category and button category', 'error');
        return;
    }
    
    const forms = document.querySelectorAll('.menu-item-form');
    const items = [];
    let iconUrl = null;
    
    for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        
        // Get icon from first form only
        if (i === 0) {
            const iconFile = form.querySelector('.menuIcon')?.files[0];
            if (iconFile) {
                iconUrl = await uploadFile(iconFile, 'product-images');
            }
        }
        
        const name = form.querySelector('.menuName').value.trim();
        const amount = form.querySelector('.menuAmount').value.trim();
        const price = form.querySelector('.menuPrice').value;
        const currency = form.querySelector('.menuCurrency').value.trim();
        const paymentSelect = form.querySelector('.menuPayments');
        const payments = Array.from(paymentSelect.selectedOptions).map(o => o.value);
        
        if (!name || !price) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        items.push({
            button_category_id: buttonCategoryId,
            name,
            amount: amount || null,
            price: parseFloat(price),
            currency,
            icon_url: iconUrl,
            payment_methods: JSON.stringify(payments),
            order_index: i
        });
    }
    
    if (items.length === 0) {
        showToast('No items to save', 'error');
        return;
    }
    
    showLoading();
    const { error } = await supabase
        .from('menu_items')
        .insert(items);
    
    hideLoading();
    
    if (error) {
        console.error(error);
        showToast('Error saving menu items', 'error');
    } else {
        showToast('Menu items saved successfully', 'success');
        
        // Reset form
        document.getElementById('menuItemsForm').innerHTML = `
            <div class="menu-item-form">
                <div class="form-group">
                    <label>Icon (First Item Only)</label>
                    <input type="file" class="menuIcon" accept="image/*">
                    <div class="menuIconPreview image-preview"></div>
                </div>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" class="menuName" placeholder="e.g., 60 UC">
                </div>
                <div class="form-group">
                    <label>Amount (Optional)</label>
                    <input type="text" class="menuAmount" placeholder="e.g., 60 Unknown Cash">
                </div>
                <div class="form-group">
                    <label>Price</label>
                    <input type="number" class="menuPrice" placeholder="e.g., 1000">
                </div>
                <div class="form-group">
                    <label>Currency</label>
                    <input type="text" class="menuCurrency" placeholder="e.g., MMK" value="MMK">
                </div>
                <div class="form-group">
                    <label>Payment Methods</label>
                    <select class="menuPayments" multiple></select>
                </div>
            </div>
        `;
        
        await displayMenuItems();
    }
}

async function displayMenuItems() {
    const { data: items } = await supabase
        .from('menu_items')
        .select('*, button_categories(id, categories(title))')
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('menuItemsList');
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No menu items added yet</p>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="list-item">
            ${item.icon_url ? `<img src="${item.icon_url}" alt="${item.name}" class="list-item-image">` : '<div class="list-item-image"></div>'}
            <div class="list-item-info">
                <div class="list-item-title">${item.name}</div>
                <div class="list-item-meta">${item.price} ${item.currency} ${item.amount ? `| ${item.amount}` : ''}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deleteMenuItem('${item.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

async function deleteMenuItem(id) {
    if (!confirm('Are you sure?')) return;
    
    showLoading();
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting menu item', 'error');
    } else {
        showToast('Menu item deleted', 'success');
        await displayMenuItems();
    }
}

// ============================================
// DETAILED PRODUCTS
// ============================================

async function saveProduct() {
    const categoryId = document.getElementById('productCategoryId').value;
    const buttonCategoryId = document.getElementById('productButtonCategoryId').value;
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const productType = document.getElementById('productType').value.trim();
    const level = document.getElementById('productLevel').value.trim();
    const price = document.getElementById('productPrice').value;
    const currency = document.getElementById('productCurrency').value.trim();
    const discount = document.getElementById('productDiscount').value || 0;
    const stock = document.getElementById('productStock').value || 1;
    const videoUrl = document.getElementById('productVideoUrl').value.trim();
    
    if (!categoryId || !buttonCategoryId || !name || !price) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    showLoading();
    
    // Upload image
    const imageFile = document.getElementById('productImage').files[0];
    let imageUrl = null;
    if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'product-images');
    }
    
    // Get payment methods
    const paymentSelect = document.getElementById('productPayments');
    const payments = Array.from(paymentSelect.selectedOptions).map(o => o.value);
    
    // Get contacts
    const contactSelect = document.getElementById('productContacts');
    const contacts = Array.from(contactSelect.selectedOptions).map(o => o.value);
    
    const { error } = await supabase
        .from('products')
        .insert([{
            button_category_id: buttonCategoryId,
            name,
            description,
            product_type: productType,
            level,
            price: parseFloat(price),
            currency,
            discount_percentage: parseInt(discount),
            stock_quantity: parseInt(stock),
            icon_url: imageUrl,
            video_url: videoUrl || null,
            payment_methods: JSON.stringify(payments),
            contacts: JSON.stringify(contacts),
            order_index: 0
        }]);
    
    hideLoading();
    
    if (error) {
        console.error(error);
        showToast('Error saving product', 'error');
    } else {
        showToast('Product saved successfully', 'success');
        
        // Reset form
        document.getElementById('productName').value = '';
        document.getElementById('productDescription').value = '';
        document.getElementById('productType').value = '';
        document.getElementById('productLevel').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDiscount').value = '';
        document.getElementById('productStock').value = '1';
        document.getElementById('productVideoUrl').value = '';
        document.getElementById('productImage').value = '';
        document.getElementById('productImagePreview').innerHTML = '';
        
        await displayProducts();
    }
}

async function displayProducts() {
    const { data: products } = await supabase
        .from('products')
        .select('*, button_categories(id, categories(title))')
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No products added yet</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="list-item">
            ${product.icon_url ? `<img src="${product.icon_url}" alt="${product.name}" class="list-item-image">` : '<div class="list-item-image"></div>'}
            <div class="list-item-info">
                <div class="list-item-title">${product.name}</div>
                <div class="list-item-meta">${product.price} ${product.currency} | ${product.product_type} | ${product.level}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deleteProduct('${product.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

async function deleteProduct(id) {
    if (!confirm('Are you sure?')) return;
    
    showLoading();
    const { error } = await supabase.from('products').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting product', 'error');
    } else {
        showToast('Product deleted', 'success');
        await displayProducts();
    }
}

// ============================================
// PRODUCT TABLES
// ============================================

function addTableField() {
    const container = document.getElementById('productTablesForm');
    
    const newForm = document.createElement('div');
    newForm.className = 'table-field-form';
    newForm.innerHTML = `
        <button type="button" class="remove-field-btn" onclick="this.parentElement.remove()">×</button>
        
        <div class="form-group">
            <label>Field Name</label>
            <input type="text" class="tableName" placeholder="e.g., Game User ID">
        </div>
        
        <div class="form-group">
            <label>Placeholder/Instructions</label>
            <input type="text" class="tablePlaceholder" placeholder="e.g., Enter your game ID">
        </div>
    `;
    
    container.appendChild(newForm);
}

async function saveProductTables() {
    const categoryId = document.getElementById('tableCategoryId').value;
    const buttonCategoryId = document.getElementById('tableButtonCategoryId').value;
    
    if (!categoryId || !buttonCategoryId) {
        showToast('Please select category and button category', 'error');
        return;
    }
    
    const forms = document.querySelectorAll('.table-field-form');
    const fields = [];
    
    forms.forEach((form, index) => {
        const name = form.querySelector('.tableName').value.trim();
        const placeholder = form.querySelector('.tablePlaceholder').value.trim();
        
        if (!name) {
            showToast('Please fill all field names', 'error');
            return;
        }
        
        fields.push({
            button_category_id: buttonCategoryId,
            name,
            placeholder: placeholder || '',
            order_index: index
        });
    });
    
    if (fields.length === 0) {
        showToast('No fields to save', 'error');
        return;
    }
    
    showLoading();
    const { error } = await supabase
        .from('product_tables')
        .insert(fields);
    
    hideLoading();
    
    if (error) {
        console.error(error);
        showToast('Error saving table fields', 'error');
    } else {
        showToast('Table fields saved successfully', 'success');
        
        // Reset form
        document.getElementById('productTablesForm').innerHTML = `
            <div class="table-field-form">
                <div class="form-group">
                    <label>Field Name</label>
                    <input type="text" class="tableName" placeholder="e.g., Game User ID">
                </div>
                <div class="form-group">
                    <label>Placeholder/Instructions</label>
                    <input type="text" class="tablePlaceholder" placeholder="e.g., Enter your game ID">
                </div>
            </div>
        `;
        
        await displayProductTables();
    }
}

async function displayProductTables() {
    const { data: tables } = await supabase
        .from('product_tables')
        .select('*, button_categories(id, categories(title))')
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('productTablesList');
    
    if (!tables || tables.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No table fields added yet</p>';
        return;
    }
    
    container.innerHTML = tables.map(table => `
        <div class="list-item">
            <div class="list-item-info">
                <div class="list-item-title">${table.name}</div>
                <div class="list-item-meta">${table.placeholder}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deleteProductTable('${table.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

async function deleteProductTable(id) {
    if (!confirm('Are you sure?')) return;
    
    showLoading();
    const { error } = await supabase.from('product_tables').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting table field', 'error');
    } else {
        showToast('Table field deleted', 'success');
        await displayProductTables();
    }
}

// ============================================
// PAYMENT METHODS
// ============================================

async function loadPaymentsData() {
    await displayPayments();
}

async function addPayment() {
    const name = document.getElementById('paymentName').value.trim();
    const address = document.getElementById('paymentAddress').value.trim();
    const instructions = document.getElementById('paymentInstructions').value.trim();
    const iconFile = document.getElementById('paymentIcon').files[0];
    
    if (!name || !address) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    showLoading();
    
    let iconUrl = null;
    if (iconFile) {
        iconUrl = await uploadFile(iconFile, 'website-assets');
    }
    
    const { error } = await supabase
        .from('payment_methods')
        .insert([{
            name,
            address,
            instructions: instructions || null,
            icon_url: iconUrl
        }]);
    
    hideLoading();
    
    if (error) {
        showToast('Error adding payment method', 'error');
    } else {
        showToast('Payment method added successfully', 'success');
        
        document.getElementById('paymentName').value = '';
        document.getElementById('paymentAddress').value = '';
        document.getElementById('paymentInstructions').value = '';
        document.getElementById('paymentIcon').value = '';
        document.getElementById('paymentIconPreview').innerHTML = '';
        
        await displayPayments();
    }
}

async function displayPayments() {
    const { data: payments } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('paymentsList');
    
    if (!payments || payments.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No payment methods added yet</p>';
        return;
    }
    
    container.innerHTML = payments.map(payment => `
        <div class="list-item">
            ${payment.icon_url ? `<img src="${payment.icon_url}" alt="${payment.name}" class="list-item-image">` : '<div class="list-item-image"></div>'}
            <div class="list-item-info">
                <div class="list-item-title">${payment.name}</div>
                <div class="list-item-meta">${payment.address}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deletePayment('${payment.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

async function deletePayment(id) {
    if (!confirm('Are you sure?')) return;
    
    showLoading();
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting payment method', 'error');
    } else {
        showToast('Payment method deleted', 'success');
        await displayPayments();
    }
}

// ============================================
// CONTACTS
// ============================================

async function loadContactsData() {
    await displayContacts();
}

async function addContact() {
    const name = document.getElementById('contactName').value.trim();
    const description = document.getElementById('contactDescription').value.trim();
    const link = document.getElementById('contactLink').value.trim();
    const iconFile = document.getElementById('contactIcon').files[0];
    
    if (!name) {
        showToast('Please enter contact name', 'error');
        return;
    }
    
    showLoading();
    
    let iconUrl = null;
    if (iconFile) {
        iconUrl = await uploadFile(iconFile, 'website-assets');
    }
    
    const { error } = await supabase
        .from('contacts')
        .insert([{
            name,
            description: description || null,
            link: link || null,
            icon_url: iconUrl
        }]);
    
    hideLoading();
    
    if (error) {
        showToast('Error adding contact', 'error');
    } else {
        showToast('Contact added successfully', 'success');
        
        document.getElementById('contactName').value = '';
        document.getElementById('contactDescription').value = '';
        document.getElementById('contactLink').value = '';
        document.getElementById('contactIcon').value = '';
        document.getElementById('contactIconPreview').innerHTML = '';
        
        await displayContacts();
    }
}

async function displayContacts() {
    const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('contactsList');
    
    if (!contacts || contacts.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No contacts added yet</p>';
        return;
    }
    
    container.innerHTML = contacts.map(contact => `
        <div class="list-item">
            ${contact.icon_url ? `<img src="${contact.icon_url}" alt="${contact.name}" class="list-item-image">` : '<div class="list-item-image"></div>'}
            <div class="list-item-info">
                <div class="list-item-title">${contact.name}</div>
                <div class="list-item-meta">${contact.link || contact.description || ''}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deleteContact('${contact.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

async function deleteContact(id) {
    if (!confirm('Are you sure?')) return;
    
    showLoading();
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting contact', 'error');
    } else {
        showToast('Contact deleted', 'success');
        await displayContacts();
    }
}

// ============================================
// ORDERS
// ============================================

let currentOrderFilter = 'all';

function setupOrderFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentOrderFilter = e.target.dataset.status;
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            loadOrdersData();
        });
    });
}

async function loadOrdersData() {
    let query = supabase
        .from('orders')
        .select('*, users(name, email, username)')
        .order('created_at', { ascending: false });
    
    if (currentOrderFilter !== 'all') {
        query = query.eq('status', currentOrderFilter);
    }
    
    const { data: orders } = await query;
    
    displayOrders(orders);
}

function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No orders found</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const tableData = order.table_data ? JSON.parse(order.table_data) : {};
        
        return `
            <div class="order-item">
                <span class="order-status-badge ${order.status}">${order.status}</span>
                
                <div class="order-header">
                    <div class="order-id">Order #${order.id.substring(0, 8)}</div>
                    <div class="order-user">${order.users?.name || 'Unknown'} (@${order.users?.username || 'N/A'})</div>
                    <div class="order-user">${order.users?.email || 'N/A'}</div>
                </div>
                
                <div class="order-details">
                    <div class="order-detail-row">
                        <span class="order-detail-label">Product:</span>
                        <span class="order-detail-value">${order.product_name}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Price:</span>
                        <span class="order-detail-value">${order.price} ${order.currency}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Payment Address:</span>
                        <span class="order-detail-value">${order.payment_address || 'N/A'}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Transaction Code:</span>
                        <span class="order-detail-value">${order.transaction_code || 'N/A'}</span>
                    </div>
                    ${Object.keys(tableData).length > 0 ? `
                        <div class="order-detail-row">
                            <span class="order-detail-label">Form Data:</span>
                            <span class="order-detail-value">${JSON.stringify(tableData)}</span>
                        </div>
                    ` : ''}
                    <div class="order-detail-row">
                        <span class="order-detail-label">Date:</span>
                        <span class="order-detail-value">${new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    ${order.admin_note ? `
                        <div class="order-detail-row">
                            <span class="order-detail-label">Admin Note:</span>
                            <span class="order-detail-value">${order.admin_note}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${order.status === 'pending' ? `
                    <div class="order-actions">
                        <textarea class="order-note-input" id="note-${order.id}" placeholder="Add note (optional)"></textarea>
                        <button class="btn-approve" onclick="updateOrderStatus('${order.id}', 'approved')">APPROVE</button>
                        <button class="btn-reject" onclick="updateOrderStatus('${order.id}', 'rejected')">REJECT</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function updateOrderStatus(orderId, status) {
    const noteInput = document.getElementById(`note-${orderId}`);
    const adminNote = noteInput?.value.trim() || null;
    
    const confirmMsg = status === 'approved' 
        ? 'Are you sure you want to approve this order?' 
        : 'Are you sure you want to reject this order?';
    
    if (!confirm(confirmMsg)) return;
    
    showLoading();
    
    const { error } = await supabase
        .from('orders')
        .update({
            status,
            admin_note: adminNote,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    
    hideLoading();
    
    if (error) {
        showToast('Error updating order', 'error');
    } else {
        showToast(`Order ${status} successfully`, 'success');
        await loadOrdersData();
    }
}

// ============================================
// YOUTUBE VIDEOS
// ============================================

async function loadYoutubeData() {
    await loadCategorySelects();
    await displayYoutubeVideos();
}

async function addYoutubeVideo() {
    const categoryId = document.getElementById('youtubeCategoryId').value;
    const buttonCategoryId = document.getElementById('youtubeButtonCategoryId').value;
    const videoUrl = document.getElementById('youtubeVideoUrl').value.trim();
    const description = document.getElementById('youtubeDescription').value.trim();
    const bannerFile = document.getElementById('youtubeBanner').files[0];
    
    if (!categoryId || !buttonCategoryId || !videoUrl || !bannerFile) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    showLoading();
    
    const bannerUrl = await uploadFile(bannerFile, 'website-assets');
    
    if (!bannerUrl) {
        hideLoading();
        showToast('Error uploading banner', 'error');
        return;
    }
    
    const { error } = await supabase
        .from('youtube_videos')
        .insert([{
            button_category_id: buttonCategoryId,
            banner_url: bannerUrl,
            video_url: videoUrl,
            description: description || null
        }]);
    
    hideLoading();
    
    if (error) {
        showToast('Error adding video', 'error');
    } else {
        showToast('Video added successfully', 'success');
        
        document.getElementById('youtubeVideoUrl').value = '';
        document.getElementById('youtubeDescription').value = '';
        document.getElementById('youtubeBanner').value = '';
        document.getElementById('youtubeBannerPreview').innerHTML = '';
        
        await displayYoutubeVideos();
    }
}

async function displayYoutubeVideos() {
    const { data: videos } = await supabase
        .from('youtube_videos')
        .select('*, button_categories(id, categories(title))')
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('youtubeVideosList');
    
    if (!videos || videos.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No videos added yet</p>';
        return;
    }
    
    container.innerHTML = videos.map(video => `
        <div class="list-item">
            <img src="${video.banner_url}" alt="Video" class="list-item-image">
            <div class="list-item-info">
                <div class="list-item-title">${video.button_categories?.categories?.title || 'N/A'}</div>
                <div class="list-item-meta">${video.video_url.substring(0, 50)}...</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" onclick="deleteYoutubeVideo('${video.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

async function deleteYoutubeVideo(id) {
    if (!confirm('Are you sure?')) return;
    
    showLoading();
    const { error } = await supabase.from('youtube_videos').delete().eq('id', id);
    hideLoading();
    
    if (error) {
        showToast('Error deleting video', 'error');
    } else {
        showToast('Video deleted', 'success');
        await displayYoutubeVideos();
    }
}

// ============================================
// FILE PREVIEWS
// ============================================

function setupFilePreviews() {
    const fileInputs = {
        'websiteLogo': 'logoPreview',
        'backgroundImage': 'backgroundPreview',
        'bannerImage': 'bannerImagePreview',
        'buttonCategoryIcon': 'buttonIconPreview',
        'productImage': 'productImagePreview',
        'paymentIcon': 'paymentIconPreview',
        'contactIcon': 'contactIconPreview',
        'youtubeBanner': 'youtubeBannerPreview'
    };
    
    Object.entries(fileInputs).forEach(([inputId, previewId]) => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        
        if (input && preview) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });
    
    // Setup menu icon preview (first form)
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('menuIcon')) {
            const file = e.target.files[0];
            const preview = e.target.parentElement.querySelector('.menuIconPreview');
            
            if (file && preview) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            }
        }
    });
}
