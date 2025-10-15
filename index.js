// ============================================
// GAMING STORE - COMPLETE USER INTERFACE
// ============================================

const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentUser = null;
let currentCategory = null;
let currentButtonCategory = null;
let currentProduct = null;
let selectedMenuItem = null;
let selectedPaymentMethod = null;
let websiteSettings = {};
let tableData = {};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    
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
    
    // Login on Enter key
    document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
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
    
    // Check if user exists
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    
    if (error || !user) {
        hideLoading();
        showToast('ဒီ email နဲ့ အကောင့်မရှိပါ', 'error');
        return;
    }
    
    // Check password (plain text comparison)
    if (user.password !== password) {
        hideLoading();
        showToast('စကားဝှက် မှားယွင်းနေပါတယ်', 'error');
        return;
    }
    
    currentUser = user;
    localStorage.setItem('userId', user.id);
    
    await initApp();
    hideLoading();
    showToast('Login အောင်မြင်ပါတယ်!', 'success');
}

async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!name || !username || !email || !password) {
        showToast('အချက်အလက်အားလုံး ဖြည့်စွက်ပါ', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showToast('စည်းကမ်းချက်ကို သဘောတူပါ', 'error');
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
        showToast('ဒီ Username က ရှိပြီးသားဖြစ်နေပါတယ်', 'error');
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
        showToast('ဒီ Email က ရှိပြီးသားဖြစ်နေပါတယ်', 'error');
        return;
    }
    
    // Generate unique profile image
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}${Date.now()}`;
    
    // Create user (password stored as plain text)
    const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
            name,
            username,
            email,
            password, // Plain text password
            profile_image: profileImage
        }])
        .select()
        .single();
    
    if (error) {
        hideLoading();
        showToast('အကောင့်ဖွင့်မှု မအောင်မြင်ပါ', 'error');
        console.error(error);
        return;
    }
    
    currentUser = newUser;
    localStorage.setItem('userId', newUser.id);
    
    await initApp();
    hideLoading();
    showToast('အကောင့်ဖွင့်မှု အောင်မြင်ပါတယ်!', 'success');
}

function logout() {
    if (confirm('Logout လုပ်မှာ သေခြာပါသလား?')) {
        localStorage.removeItem('userId');
        currentUser = null;
        window.location.reload();
    }
}

function showAuth() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
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
            document.querySelector('.app-container').style.backgroundSize = 'cover';
            document.querySelector('.app-container').style.backgroundPosition = 'center';
            document.querySelector('.app-container').style.backgroundAttachment = 'fixed';
        }
    }
}

async function loadProfile() {
    document.getElementById('profileImage').src = currentUser.profile_image;
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileUsername').value = currentUser.username;
    document.getElementById('profileEmail').value = currentUser.email;
}

// ============================================
// HOME PAGE
// ============================================

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
        
        // Auto-scroll every 5 seconds
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
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">No categories available</p>';
        return;
    }
    
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
            button.addEventListener('click', () => openCategory(btn.id, category.title));
            buttonsContainer.appendChild(button);
        });
    }
}

// ============================================
// CATEGORY DETAIL PAGE
// ============================================

async function openCategory(buttonCategoryId, categoryTitle) {
    currentButtonCategory = buttonCategoryId;
    tableData = {};
    
    showLoading();
    
    document.getElementById('categoryDetailTitle').textContent = categoryTitle;
    
    // Load category banners
    const { data: banners } = await supabase
        .from('banners')
        .select('*')
        .eq('button_category_id', buttonCategoryId)
        .order('order_index');
    
    const bannersContainer = document.getElementById('categoryBannersContainer');
    if (banners && banners.length > 0) {
        if (banners.length === 1) {
            bannersContainer.innerHTML = `
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
            
            banners.forEach(b => {
                slider.innerHTML += `
                    <div class="banner-item">
                        <img src="${b.image_url}" alt="Banner">
                    </div>
                `;
            });
            
            bannersContainer.innerHTML = '';
            bannersContainer.appendChild(slider);
            
            setInterval(() => {
                currentIndex = (currentIndex + 1) % banners.length;
                slider.style.transform = `translateX(-${currentIndex * 100}%)`;
            }, 5000);
        }
    } else {
        bannersContainer.innerHTML = '';
    }
    
    // Load product tables (input fields)
    const { data: tables } = await supabase
        .from('product_tables')
        .select('*')
        .eq('button_category_id', buttonCategoryId)
        .order('order_index');
    
    const tablesContainer = document.getElementById('productTablesContainer');
    if (tables && tables.length > 0) {
        tablesContainer.innerHTML = '<div class="tables-header"><h3>ဝယ်ယူရန် အချက်အလက်များ ဖြည့်စွက်ပါ</h3></div>' +
            tables.map(t => `
                <div class="table-input-group">
                    <label>${t.name}</label>
                    <input type="text" id="table-${t.id}" data-table-id="${t.id}" data-table-name="${t.name}" placeholder="${t.placeholder || ''}" onchange="updateTableData('${t.id}', '${t.name}', this.value)">
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
        menuContainer.innerHTML = '<div class="menu-header"><h3>ဝယ်ယူမည့် Package ရွေးချယ်ပါ</h3></div>' +
            menuItems.map(item => {
                const isSelected = selectedMenuItem && selectedMenuItem.id === item.id;
                return `
                    <div class="menu-item ${isSelected ? 'selected' : ''}" onclick="selectMenuItem('${item.id}')">
                        ${item.icon_url ? `<img src="${item.icon_url}" alt="${item.name}" class="menu-item-icon">` : ''}
                        <div class="menu-item-name">${item.name}</div>
                        ${item.amount ? `<div class="menu-item-amount">${item.amount}</div>` : ''}
                        <div class="menu-item-price">${item.price} ${item.currency || 'MMK'}</div>
                        ${isSelected ? '<div class="selected-badge">✓</div>' : ''}
                    </div>
                `;
            }).join('');
        
        // Add buy button for menu items
        menuContainer.innerHTML += `
            <div class="buy-button-container">
                <button class="btn-buy" onclick="proceedToCheckoutMenuItem()">ဝယ်ယူမည်</button>
            </div>
        `;
    } else {
        menuContainer.innerHTML = '';
    }
    
    // Load detailed products
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('button_category_id', buttonCategoryId)
        .order('order_index');
    
    const productsContainer = document.getElementById('productsContainer');
    if (products && products.length > 0) {
        productsContainer.innerHTML = '<div class="products-header"><h3>Premium Products</h3></div>' +
            products.map(p => {
                const discountedPrice = p.price - (p.price * (p.discount_percentage / 100));
                return `
                    <div class="product-card" onclick="openProduct('${p.id}')">
                        ${p.icon_url ? `<img src="${p.icon_url}" alt="${p.name}" class="product-image">` : ''}
                        <div class="product-info">
                            <div class="product-name">${p.name}</div>
                            ${p.description ? `<div class="product-description">${p.description}</div>` : ''}
                            <div class="product-meta">
                                ${p.product_type ? `<span class="product-type">${p.product_type}</span>` : ''}
                                ${p.level ? `<span class="product-level">${p.level}</span>` : ''}
                            </div>
                            <div class="product-pricing">
                                ${p.discount_percentage > 0 ? `<span class="product-original-price">${p.price} ${p.currency}</span>` : ''}
                                <span class="product-price">${discountedPrice.toFixed(0)} ${p.currency}</span>
                                ${p.discount_percentage > 0 ? `<span class="product-discount">-${p.discount_percentage}%</span>` : ''}
                            </div>
                            <div class="product-stock ${p.stock_quantity > 0 ? 'in-stock' : 'out-stock'}">
                                ${p.stock_quantity > 0 ? `ရရှိနိုင်သည်: ${p.stock_quantity}` : 'လက်ကုန်'}
                            </div>
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
        videosContainer.innerHTML = '<div class="videos-header"><h3>လမ်းညွှန်ချက် Videos</h3></div>' +
            videos.map(v => `
                <div class="youtube-video" onclick="window.open('${v.video_url}', '_blank')">
                    <img src="${v.banner_url}" alt="Video" class="youtube-banner">
                    ${v.description ? `<div class="youtube-description">${v.description}</div>` : ''}
                </div>
            `).join('');
    } else {
        videosContainer.innerHTML = '';
    }
    
    hideLoading();
    navigateToPage('categoryDetailPage');
}

function updateTableData(tableId, tableName, value) {
    tableData[tableName] = value;
}

// ============================================
// MENU ITEM SELECTION
// ============================================

async function selectMenuItem(itemId) {
    const { data: item } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', itemId)
        .single();
    
    if (item) {
        selectedMenuItem = item;
        // Refresh menu items display
        await openCategory(currentButtonCategory, document.getElementById('categoryDetailTitle').textContent);
    }
}

async function proceedToCheckoutMenuItem() {
    if (!selectedMenuItem) {
        showToast('Package တခု ရွေးချယ်ပါ', 'error');
        return;
    }
    
    // Validate table data
    const { data: tables } = await supabase
        .from('product_tables')
        .select('*')
        .eq('button_category_id', currentButtonCategory);
    
    if (tables && tables.length > 0) {
        for (const table of tables) {
            if (!tableData[table.name] || tableData[table.name].trim() === '') {
                showToast(`${table.name} ဖြည့်စွက်ပါ`, 'error');
                return;
            }
        }
    }
    
    currentProduct = {
        type: 'menu_item',
        id: selectedMenuItem.id,
        name: selectedMenuItem.name,
        price: selectedMenuItem.price,
        currency: selectedMenuItem.currency,
        payment_methods: selectedMenuItem.payment_methods
    };
    
    await showCheckout();
}

// ============================================
// DETAILED PRODUCT VIEW
// ============================================

async function openProduct(productId) {
    showLoading();
    
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (!product) {
        hideLoading();
        showToast('Product not found', 'error');
        return;
    }
    
    currentProduct = {
        type: 'product',
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        discount_percentage: product.discount_percentage,
        payment_methods: product.payment_methods,
        contacts: product.contacts
    };
    
    const discountedPrice = product.price - (product.price * (product.discount_percentage / 100));
    
    document.getElementById('productDetailTitle').textContent = product.name;
    
    const container = document.getElementById('productDetailContainer');
    container.innerHTML = `
        <div class="product-detail">
            ${product.icon_url ? `<img src="${product.icon_url}" alt="${product.name}" class="product-detail-image">` : ''}
            
            ${product.video_url ? `
                <div class="product-video">
                    <button class="btn-watch-video" onclick="window.open('${product.video_url}', '_blank')">
                        📺 Video ကြည့်ရန်
                    </button>
                </div>
            ` : ''}
            
            <div class="product-detail-info">
                <h2>${product.name}</h2>
                
                ${product.description ? `<p class="product-detail-description">${product.description}</p>` : ''}
                
                <div class="product-detail-meta">
                    ${product.product_type ? `<div><strong>အမျိုးအစား:</strong> ${product.product_type}</div>` : ''}
                    ${product.level ? `<div><strong>အဆင့်:</strong> ${product.level}</div>` : ''}
                    <div><strong>လက်ကျန်:</strong> ${product.stock_quantity}</div>
                </div>
                
                <div class="product-detail-pricing">
                    ${product.discount_percentage > 0 ? `
                        <div class="original-price">${product.price} ${product.currency}</div>
                        <div class="discounted-price">${discountedPrice.toFixed(0)} ${product.currency}</div>
                        <div class="discount-badge">-${product.discount_percentage}% OFF</div>
                    ` : `
                        <div class="current-price">${product.price} ${product.currency}</div>
                    `}
                </div>
                
                ${product.stock_quantity > 0 ? `
                    <button class="btn-buy-now" onclick="proceedToCheckoutProduct()">ယခု ဝယ်ယူမည်</button>
                ` : `
                    <button class="btn-out-of-stock" disabled>လက်ကုန်</button>
                `}
            </div>
        </div>
    `;
    
    hideLoading();
    navigateToPage('productDetailPage');
}

async function proceedToCheckoutProduct() {
    // Validate table data
    const { data: tables } = await supabase
        .from('product_tables')
        .select('*')
        .eq('button_category_id', currentButtonCategory);
    
    if (tables && tables.length > 0) {
        for (const table of tables) {
            if (!tableData[table.name] || tableData[table.name].trim() === '') {
                showToast(`${table.name} ဖြည့်စွက်ပါ`, 'error');
                return;
            }
        }
    }
    
    await showCheckout();
}

// ============================================
// CHECKOUT PROCESS
// ============================================

async function showCheckout() {
    showLoading();
    
    const price = currentProduct.type === 'product' 
        ? currentProduct.price - (currentProduct.price * (currentProduct.discount_percentage / 100))
        : currentProduct.price;
    
    // Get payment methods for this product
    let paymentMethodIds = [];
    try {
        paymentMethodIds = JSON.parse(currentProduct.payment_methods || '[]');
    } catch (e) {
        paymentMethodIds = [];
    }
    
    let paymentMethods = [];
    if (paymentMethodIds.length > 0) {
        const { data } = await supabase
            .from('payment_methods')
            .select('*')
            .in('id', paymentMethodIds);
        paymentMethods = data || [];
    }
    
    const container = document.getElementById('checkoutContainer');
    
    container.innerHTML = `
        <div class="checkout">
            <div class="checkout-summary">
                <h3>အော်ဒါ အချက်အလက်များ</h3>
                <div class="summary-item">
                    <span>ပစ္စည်း:</span>
                    <span>${currentProduct.name}</span>
                </div>
                <div class="summary-item">
                    <span>စျေးနှုန်း:</span>
                    <span>${price.toFixed(0)} ${currentProduct.currency}</span>
                </div>
                ${Object.keys(tableData).length > 0 ? `
                    <div class="summary-section">
                        <h4>ဖြည့်စွက်ထားသော အချက်အလက်များ</h4>
                        ${Object.entries(tableData).map(([key, value]) => `
                            <div class="summary-item">
                                <span>${key}:</span>
                                <span>${value}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="payment-section">
                <h3>ငွေပေးချေမှု နည်းလမ်း ရွေးချယ်ပါ</h3>
                ${paymentMethods.length > 0 ? `
                    <div class="payment-methods-list">
                        ${paymentMethods.map(pm => `
                            <div class="payment-method-item" onclick="selectPaymentMethod('${pm.id}')">
                                <input type="radio" name="payment" id="payment-${pm.id}">
                                ${pm.icon_url ? `<img src="${pm.icon_url}" alt="${pm.name}">` : ''}
                                <div class="payment-info">
                                    <strong>${pm.name}</strong>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div id="paymentDetails" class="payment-details hidden">
                        <!-- Payment details will be shown here -->
                    </div>
                    
                    <div class="transaction-input hidden" id="transactionInput">
                        <h4>လုပ်ငန်းစဥ် အမှတ် (နောက်ဆုံး ဂဏန်း 6 လုံး)</h4>
                        <input type="text" id="transactionCode" placeholder="xxxxxx" maxlength="6" pattern="[0-9]{6}">
                        <small>ငွေလွဲပြီးနောက် လုပ်ငန်းစဥ်အမှတ်၏ နောက်ဆုံး ဂဏန်း 6 လုံးကို ရိုက်ထည့်ပါ</small>
                    </div>
                    
                    <button class="btn-submit-order hidden" id="submitOrderBtn" onclick="submitOrder()">
                        မှာယူမှု အတည်ပြုမည်
                    </button>
                ` : `
                    <p class="no-payment-methods">ငွေပေးချေမှု နည်းလမ်းများ မရှိသေးပါ</p>
                `}
            </div>
        </div>
    `;
    
    hideLoading();
    navigateToPage('checkoutPage');
}

async function selectPaymentMethod(paymentId) {
    const { data: payment } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', paymentId)
        .single();
    
    if (!payment) return;
    
    selectedPaymentMethod = payment;
    
    // Update radio selection
    document.querySelectorAll('.payment-method-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    document.getElementById(`payment-${paymentId}`).checked = true;
    
    // Show payment details
    const detailsDiv = document.getElementById('paymentDetails');
    detailsDiv.classList.remove('hidden');
    detailsDiv.innerHTML = `
        <h4>ငွေလွဲရမည့် အချက်အလက်များ</h4>
        ${payment.icon_url ? `<img src="${payment.icon_url}" alt="${payment.name}" class="payment-detail-icon">` : ''}
        <div class="payment-detail-item">
            <strong>Payment Method:</strong>
            <span>${payment.name}</span>
        </div>
        <div class="payment-detail-item">
            <strong>လိပ်စာ/နံပါတ်:</strong>
            <span class="payment-address">${payment.address}</span>
        </div>
        ${payment.instructions ? `
            <div class="payment-instructions">
                <strong>လမ်းညွှန်ချက်:</strong>
                <p>${payment.instructions}</p>
            </div>
        ` : ''}
        <div class="payment-amount">
            <strong>ပေးချေရမည့် ပမာဏ:</strong>
            <span class="amount">${currentProduct.type === 'product' 
                ? (currentProduct.price - (currentProduct.price * (currentProduct.discount_percentage / 100))).toFixed(0)
                : currentProduct.price} ${currentProduct.currency}</span>
        </div>
    `;
    
    // Show transaction input
    document.getElementById('transactionInput').classList.remove('hidden');
    document.getElementById('submitOrderBtn').classList.remove('hidden');
}

async function submitOrder() {
    if (!selectedPaymentMethod) {
        showToast('ငွေပေးချေမှု နည်းလမ်း ရွေးချယ်ပါ', 'error');
        return;
    }
    
    const transactionCode = document.getElementById('transactionCode').value.trim();
    
    if (!transactionCode || transactionCode.length !== 6) {
        showToast('လုပ်ငန်းစဥ်အမှတ် ဂဏန်း 6 လုံး ရိုက်ထည့်ပါ', 'error');
        return;
    }
    
    showLoading();
    
    const price = currentProduct.type === 'product' 
        ? currentProduct.price - (currentProduct.price * (currentProduct.discount_percentage / 100))
        : currentProduct.price;
    
    const orderData = {
        user_id: currentUser.id,
        product_type: currentProduct.type,
        product_name: currentProduct.name,
        price: price,
        currency: currentProduct.currency,
        table_data: JSON.stringify(tableData),
        payment_method_id: selectedPaymentMethod.id,
        payment_address: selectedPaymentMethod.address,
        transaction_code: transactionCode,
        status: 'pending'
    };
    
    if (currentProduct.type === 'product') {
        orderData.product_id = currentProduct.id;
    } else {
        orderData.menu_item_id = currentProduct.id;
    }
    
    const { error } = await supabase
        .from('orders')
        .insert([orderData]);
    
    hideLoading();
    
    if (error) {
        console.error(error);
        showToast('မှာယူမှု မအောင်မြင်ပါ', 'error');
        return;
    }
    
    // Reset state
    selectedMenuItem = null;
    selectedPaymentMethod = null;
    currentProduct = null;
    tableData = {};
    
    // Show success message
    showToast('Thinks You Order Please Wait 30 မိနစ်', 'success');
    
    // Navigate to history
    await loadHistory();
    navigateToPage('historyPage');
}

// ============================================
// HISTORY PAGE
// ============================================

async function loadHistory() {
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('ordersContainer');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:40px;">မှာယူမှု မှတ်တမ်း မရှိသေးပါ</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const tableData = order.table_data ? JSON.parse(order.table_data) : {};
        
        return `
            <div class="order-card">
                <span class="order-status ${order.status}">
                    ${order.status === 'pending' ? '⏳ စိစစ်နေဆဲ' : 
                      order.status === 'approved' ? '✓ အတည်ပြုပြီး' : 
                      '✗ ငြင်းဆိုခံရသည်'}
                </span>
                <div class="order-id">Order #${order.id.substring(0, 8).toUpperCase()}</div>
                <div class="order-product-name">${order.product_name}</div>
                <div class="order-price">${order.price} ${order.currency}</div>
                
                ${Object.keys(tableData).length > 0 ? `
                    <div class="order-table-data">
                        ${Object.entries(tableData).map(([key, value]) => `
                            <div><strong>${key}:</strong> ${value}</div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="order-payment">
                    <strong>Payment:</strong> ${order.payment_address}
                </div>
                <div class="order-transaction">
                    <strong>Transaction:</strong> ${order.transaction_code}
                </div>
                <div class="order-date">${new Date(order.created_at).toLocaleString('my-MM')}</div>
                
                ${order.admin_note ? `
                    <div class="order-note">
                        <strong>Admin မှတ်ချက်:</strong>
                        <p>${order.admin_note}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// CONTACTS PAGE
// ============================================

async function loadContacts() {
    const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at');
    
    const container = document.getElementById('contactsContainer');
    
    if (!contacts || contacts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:40px;">ဆက်သွယ်ရန် အချက်အလက် မရှိသေးပါ</p>';
        return;
    }
    
    container.innerHTML = contacts.map(contact => `
        <div class="contact-card" ${contact.link ? `onclick="window.open('${contact.link}', '_blank')"` : ''}>
            ${contact.icon_url ? `<img src="${contact.icon_url}" alt="${contact.name}" class="contact-icon">` : ''}
            <div class="contact-name">${contact.name}</div>
            ${contact.description ? `<div class="contact-description">${contact.description}</div>` : ''}
            ${contact.link ? `
                <div class="contact-link">
                    <span>ဆက်သွယ်ရန် နှိပ်ပါ →</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

async function editField(field) {
    const input = document.getElementById(`profile${field.charAt(0).toUpperCase() + field.slice(1)}`);
    
    if (input.readOnly) {
        input.readOnly = false;
        input.focus();
        input.select();
    } else {
        const newValue = input.value.trim();
        
        if (!newValue) {
            showToast('အချက်အလက် မဖြစ်နိုင်ပါ', 'error');
            input.value = currentUser[field];
            return;
        }
        
        // Check for duplicates if username or email
        if (field === 'username') {
            const { data } = await supabase
                .from('users')
                .select('username')
                .eq('username', newValue)
                .neq('id', currentUser.id)
                .single();
            
            if (data) {
                showToast('ဒီ Username က အသုံးပြုပြီးသားဖြစ်နေပါတယ်', 'error');
                input.value = currentUser[field];
                return;
            }
        }
        
        if (field === 'email') {
            const { data } = await supabase
                .from('users')
                .select('email')
                .eq('email', newValue)
                .neq('id', currentUser.id)
                .single();
            
            if (data) {
                showToast('ဒီ Email က အသုံးပြုပြီးသားဖြစ်နေပါတယ်', 'error');
                input.value = currentUser[field];
                return;
            }
        }
        
        showLoading();
        
        const { error } = await supabase
            .from('users')
            .update({ [field]: newValue })
            .eq('id', currentUser.id);
        
        hideLoading();
        
        if (error) {
            showToast('ပြောင်းလဲမှု မအောင်မြင်ပါ', 'error');
            input.value = currentUser[field];
            return;
        }
        
        currentUser[field] = newValue;
        input.readOnly = true;
        showToast('ပြောင်းလဲမှု အောင်မြင်ပါတယ်', 'success');
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    
    if (!currentPassword || !newPassword) {
        showToast('စကားဝှက်များ ဖြည့်စွက်ပါ', 'error');
        return;
    }
    
    if (currentPassword !== currentUser.password) {
        showToast('လက်ရှိ စကားဝှက် မှားယွင်းနေပါတယ်', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('စကားဝှက်အသစ် အနည်းဆုံး 6 လုံး ရှိရမည်', 'error');
        return;
    }
    
    showLoading();
    
    const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', currentUser.id);
    
    hideLoading();
    
    if (error) {
        showToast('စကားဝှက် ပြောင်းလဲမှု မအောင်မြင်ပါ', 'error');
        return;
    }
    
    currentUser.password = newPassword;
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    showToast('စကားဝှက် ပြောင်းလဲမှု အောင်မြင်ပါတယ်', 'success');
}

// ============================================
// NAVIGATION
// ============================================

function navigateToPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page with animation
    const targetPage = document.getElementById(pageId);
    targetPage.classList.add('active');
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    navigateToPage('homePage');
}

function goBackToCategory() {
    if (currentButtonCategory) {
        openCategory(currentButtonCategory, document.getElementById('categoryDetailTitle').textContent);
    } else {
        navigateToPage('homePage');
    }
}

function goBackToProduct() {
    navigateToPage('productDetailPage');
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
// AUTO REFRESH ORDERS (Every 30 seconds)
// ============================================

setInterval(async () => {
    if (currentUser && document.getElementById('historyPage').classList.contains('active')) {
        await loadHistory();
    }
}, 30000);

// ============================================
// PREVENT BACK BUTTON AFTER LOGOUT
// ============================================

window.addEventListener('popstate', function(event) {
    if (!currentUser) {
        window.location.href = '/';
    }
});
