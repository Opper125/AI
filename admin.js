// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA0MjczOCwiZXhwIjoyMDc0NjE4NzM4fQ.RIeMmmXUz4f2R3-3fhyu5neWt6e7ihVWuqXYe4ovhMg';

// Admin Password (Change this!)
const ADMIN_PASSWORD = 'admin123';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentFilter = 'all';
let websiteSettings = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    hideLoading();
});

// Loading
function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 800);
}

// Admin Authentication
function checkAdminAuth() {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    loadAllData();
}

function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');

    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('isAdmin', 'true');
        showDashboard();
    } else {
        showError(errorEl, 'Incorrect password!');
    }
}

function adminLogout() {
    localStorage.removeItem('isAdmin');
    location.reload();
}

// Switch Section
function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).classList.add('active');

    // Update nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Load section data
    loadSectionData(sectionName);
}

// Load All Data
async function loadAllData() {
    await Promise.all([
        loadWebsiteSettings(),
        loadCategories(),
        loadBanners()
    ]);
}

// Load Section Data
function loadSectionData(section) {
    switch(section) {
        case 'website-settings':
            loadWebsiteSettings();
            break;
        case 'banners':
            loadBanners();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'buttons':
            loadCategoryButtons();
            loadCategoriesForSelect();
            break;
        case 'tables':
            loadInputTables();
            loadCategoriesForSelect();
            break;
        case 'menus':
            loadMenus();
            loadCategoriesForSelect();
            break;
        case 'payments':
            loadPaymentMethods();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'videos':
            loadVideos();
            loadCategoriesForSelect();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// ==================== FILE UPLOAD HELPER ====================

async function uploadFile(file, folder) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('website-assets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('website-assets')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

// ==================== WEBSITE SETTINGS ====================

async function loadWebsiteSettings() {
    try {
        const { data, error } = await supabase
            .from('website_settings')
            .select('*')
            .single();

        if (data) {
            websiteSettings = data;
            document.getElementById('websiteName').value = data.website_name || '';
            
            if (data.logo_url) {
                document.getElementById('logoPreview').innerHTML = `<img src="${data.logo_url}">`;
            }
            if (data.background_url) {
                document.getElementById('bgPreview').innerHTML = `<img src="${data.background_url}">`;
            }
            if (data.loading_animation_url) {
                document.getElementById('loadingPreview').innerHTML = `<img src="${data.loading_animation_url}">`;
            }
            if (data.button_style_url) {
                document.getElementById('buttonPreview').innerHTML = `<img src="${data.button_style_url}">`;
            }
        } else {
            // Create default settings
            const { data: newData } = await supabase
                .from('website_settings')
                .insert([{ website_name: 'Gaming Store' }])
                .select()
                .single();
            websiteSettings = newData;
            loadWebsiteSettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updateWebsiteName() {
    const name = document.getElementById('websiteName').value;
    if (!name) {
        alert('Please enter a website name');
        return;
    }

    showLoading();

    try {
        const { error } = await supabase
            .from('website_settings')
            .update({ website_name: name })
            .eq('id', websiteSettings.id);

        if (error) throw error;

        hideLoading();
        alert('Website name updated successfully!');
        loadWebsiteSettings();
    } catch (error) {
        hideLoading();
        alert('Error updating website name');
        console.error(error);
    }
}

function previewLogo() {
    const file = document.getElementById('logoFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('logoPreview').innerHTML = `<img src="${e.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadLogo() {
    const file = document.getElementById('logoFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'logos');
    
    if (url) {
        await updateSettings({ logo_url: url });
        hideLoading();
        alert('Logo uploaded successfully!');
    } else {
        hideLoading();
        alert('Error uploading logo');
    }
}

function previewBackground() {
    const file = document.getElementById('bgFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('bgPreview').innerHTML = `<img src="${e.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadBackground() {
    const file = document.getElementById('bgFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'backgrounds');
    
    if (url) {
        await updateSettings({ background_url: url });
        hideLoading();
        alert('Background uploaded successfully!');
    } else {
        hideLoading();
        alert('Error uploading background');
    }
}

async function uploadLoadingAnimation() {
    const file = document.getElementById('loadingFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'animations');
    
    if (url) {
        await updateSettings({ loading_animation_url: url });
        hideLoading();
        alert('Loading animation uploaded successfully!');
    } else {
        hideLoading();
        alert('Error uploading animation');
    }
}

async function uploadButtonStyle() {
    const file = document.getElementById('buttonFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'buttons');
    
    if (url) {
        await updateSettings({ button_style_url: url });
        hideLoading();
        alert('Button style uploaded successfully!');
    } else {
        hideLoading();
        alert('Error uploading button style');
    }
}

async function updateSettings(updates) {
    try {
        const { error } = await supabase
            .from('website_settings')
            .update(updates)
            .eq('id', websiteSettings.id);

        if (error) throw error;
        loadWebsiteSettings();
    } catch (error) {
        console.error('Error updating settings:', error);
    }
}

// ==================== BANNERS ====================

async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        const container = document.getElementById('bannersContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(banner => {
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${banner.image_url}" alt="Banner">
                        <div class="item-actions">
                            <button class="btn-danger" onclick="deleteBanner(${banner.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No banners yet</p>';
        }
    } catch (error) {
        console.error('Error loading banners:', error);
    }
}

async function addBanner() {
    const file = document.getElementById('bannerFile').files[0];
    if (!file) {
        alert('Please select a banner image');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'banners');
    
    if (url) {
        try {
            const { error } = await supabase
                .from('banners')
                .insert([{ image_url: url }]);

            if (error) throw error;

            hideLoading();
            alert('Banner added successfully!');
            document.getElementById('bannerFile').value = '';
            loadBanners();
        } catch (error) {
            hideLoading();
            alert('Error adding banner');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading banner');
    }
}

async function deleteBanner(id) {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Banner deleted successfully!');
        loadBanners();
    } catch (error) {
        hideLoading();
        alert('Error deleting banner');
        console.error(error);
    }
}

// ==================== CATEGORIES ====================

async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('categoriesContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(category => {
                container.innerHTML += `
                    <div class="item-card">
                        <h4>${category.title}</h4>
                        <p>Created: ${new Date(category.created_at).toLocaleDateString()}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editCategory(${category.id}, '${category.title.replace(/'/g, "\\'")}')">Edit</button>
                            <button class="btn-danger" onclick="deleteCategory(${category.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No categories yet</p>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function addCategory() {
    const title = document.getElementById('categoryTitle').value.trim();
    if (!title) {
        alert('Please enter a category title');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('categories')
            .insert([{ title: title }]);

        if (error) throw error;

        hideLoading();
        alert('Category added successfully!');
        document.getElementById('categoryTitle').value = '';
        loadCategories();
        loadCategoriesForSelect();
    } catch (error) {
        hideLoading();
        alert('Error adding category');
        console.error(error);
    }
}

async function editCategory(id, currentTitle) {
    const newTitle = prompt('Enter new category title:', currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('categories')
            .update({ title: newTitle })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Category updated successfully!');
        loadCategories();
    } catch (error) {
        hideLoading();
        alert('Error updating category');
        console.error(error);
    }
}

async function deleteCategory(id) {
    if (!confirm('Are you sure? This will delete all related buttons, tables, and menus!')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Category deleted successfully!');
        loadCategories();
    } catch (error) {
        hideLoading();
        alert('Error deleting category');
        console.error(error);
    }
}

// ==================== CATEGORY BUTTONS ====================

async function loadCategoriesForSelect() {
    try {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        const selects = [
            'buttonCategorySelect',
            'tableCategorySelect',
            'menuCategorySelect',
            'videoCategorySelect'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select Category</option>';
                if (data) {
                    data.forEach(cat => {
                        select.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error loading categories for select:', error);
    }
}

async function loadCategoryButtons() {
    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select(`
                *,
                categories (title)
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('buttonsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(button => {
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${button.icon_url}" alt="${button.name}">
                        <h4>${button.name}</h4>
                        <p>Category: ${button.categories.title}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editButton(${button.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteButton(${button.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No buttons yet</p>';
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function addCategoryButton() {
    const categoryId = document.getElementById('buttonCategorySelect').value;
    const name = document.getElementById('buttonName').value.trim();
    const file = document.getElementById('buttonIconFile').files[0];

    if (!categoryId || !name || !file) {
        alert('Please fill all fields and select an icon');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'category-icons');
    
    if (url) {
        try {
            const { error } = await supabase
                .from('category_buttons')
                .insert([{
                    category_id: categoryId,
                    name: name,
                    icon_url: url
                }]);

            if (error) throw error;

            hideLoading();
            alert('Button added successfully!');
            document.getElementById('buttonName').value = '';
            document.getElementById('buttonIconFile').value = '';
            loadCategoryButtons();
        } catch (error) {
            hideLoading();
            alert('Error adding button');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading icon');
    }
}

async function editButton(id) {
    const { data: button } = await supabase
        .from('category_buttons')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editButtonName" value="${button.name}">
        </div>
        <button class="btn-primary" onclick="updateButton(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateButton(id) {
    const name = document.getElementById('editButtonName').value.trim();

    if (!name) {
        alert('Please enter a name');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('category_buttons')
            .update({ name: name })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Button updated successfully!');
        loadCategoryButtons();
    } catch (error) {
        hideLoading();
        alert('Error updating button');
        console.error(error);
    }
}

async function deleteButton(id) {
    if (!confirm('Are you sure? This will delete all related tables and menus!')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('category_buttons')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Button deleted successfully!');
        loadCategoryButtons();
    } catch (error) {
        hideLoading();
        alert('Error deleting button');
        console.error(error);
    }
}

// ==================== INPUT TABLES ====================

async function loadButtonsForTables() {
    const categoryId = document.getElementById('tableCategorySelect').value;
    if (!categoryId) {
        document.getElementById('tableButtonSelect').innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('tableButtonSelect');
        select.innerHTML = '<option value="">Select Button</option>';
        
        if (data) {
            data.forEach(btn => {
                select.innerHTML += `<option value="${btn.id}">${btn.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

function addTableInput() {
    const container = document.getElementById('tablesInputContainer');
    const newInput = document.createElement('div');
    newInput.className = 'table-input-group';
    newInput.innerHTML = `
        <button class="remove-input" onclick="this.parentElement.remove()">×</button>
        <input type="text" class="table-name" placeholder="Table Name">
        <input type="text" class="table-instruction" placeholder="Instruction">
    `;
    container.appendChild(newInput);
}

async function saveTables() {
    const buttonId = document.getElementById('tableButtonSelect').value;
    if (!buttonId) {
        alert('Please select a button');
        return;
    }

    const tables = [];
    document.querySelectorAll('.table-input-group').forEach(group => {
        const name = group.querySelector('.table-name').value.trim();
        const instruction = group.querySelector('.table-instruction').value.trim();
        if (name && instruction) {
            tables.push({
                button_id: buttonId,
                name: name,
                instruction: instruction
            });
        }
    });

    if (tables.length === 0) {
        alert('Please add at least one table');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('input_tables')
            .insert(tables);

        if (error) throw error;

        hideLoading();
        alert('Tables saved successfully!');
        document.getElementById('tablesInputContainer').innerHTML = `
            <div class="table-input-group">
                <input type="text" class="table-name" placeholder="Table Name">
                <input type="text" class="table-instruction" placeholder="Instruction">
            </div>
        `;
        loadInputTables();
    } catch (error) {
        hideLoading();
        alert('Error saving tables');
        console.error(error);
    }
}

async function loadInputTables() {
    try {
        const { data, error } = await supabase
            .from('input_tables')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('tablesContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(table => {
                container.innerHTML += `
                    <div class="item-card">
                        <h4>${table.name}</h4>
                        <p>Button: ${table.category_buttons.name}</p>
                        <p>Category: ${table.category_buttons.categories.title}</p>
                        <p>Instruction: ${table.instruction}</p>
                        <div class="item-actions">
                            <button class="btn-danger" onclick="deleteTable(${table.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No tables yet</p>';
        }
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

async function deleteTable(id) {
    if (!confirm('Are you sure?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('input_tables')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Table deleted successfully!');
        loadInputTables();
    } catch (error) {
        hideLoading();
        alert('Error deleting table');
        console.error(error);
    }
}

// ==================== MENUS ====================

async function loadButtonsForMenus() {
    const categoryId = document.getElementById('menuCategorySelect').value;
    if (!categoryId) {
        document.getElementById('menuButtonSelect').innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('menuButtonSelect');
        select.innerHTML = '<option value="">Select Button</option>';
        
        if (data) {
            data.forEach(btn => {
                select.innerHTML += `<option value="${btn.id}">${btn.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

function addMenuInput() {
    const container = document.getElementById('menusInputContainer');
    const newInput = document.createElement('div');
    newInput.className = 'menu-input-group';
    newInput.innerHTML = `
        <button class="remove-input" onclick="this.parentElement.remove()">×</button>
        <input type="text" class="menu-name" placeholder="Product Name">
        <input type="text" class="menu-amount" placeholder="Amount/Details">
        <input type="number" class="menu-price" placeholder="Price">
    `;
    container.appendChild(newInput);
}

async function saveMenus() {
    const buttonId = document.getElementById('menuButtonSelect').value;
    if (!buttonId) {
        alert('Please select a button');
        return;
    }

    const firstIcon = document.querySelector('.menu-icon').files[0];
    let iconUrl = null;

    if (firstIcon) {
        showLoading();
        iconUrl = await uploadFile(firstIcon, 'menu-icons');
        hideLoading();
    }

    const menus = [];
    document.querySelectorAll('.menu-input-group').forEach((group, index) => {
        const name = group.querySelector('.menu-name').value.trim();
        const amount = group.querySelector('.menu-amount').value.trim();
        const price = group.querySelector('.menu-price').value;
        
        if (name && amount && price) {
            menus.push({
                button_id: buttonId,
                name: name,
                amount: amount,
                price: parseInt(price),
                icon_url: index === 0 ? iconUrl : null
            });
        }
    });

    if (menus.length === 0) {
        alert('Please add at least one product');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('menus')
            .insert(menus);

        if (error) throw error;

        hideLoading();
        alert('Products saved successfully!');
        document.getElementById('menusInputContainer').innerHTML = `
            <div class="menu-input-group">
                <input type="text" class="menu-name" placeholder="Product Name">
                <input type="text" class="menu-amount" placeholder="Amount/Details">
                <input type="number" class="menu-price" placeholder="Price">
                <input type="file" class="menu-icon" accept="image/*">
            </div>
        `;
        loadMenus();
    } catch (error) {
        hideLoading();
        alert('Error saving products');
        console.error(error);
    }
}

async function loadMenus() {
    try {
        const { data, error } = await supabase
            .from('menus')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('menusContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(menu => {
                container.innerHTML += `
                    <div class="item-card">
                        ${menu.icon_url ? `<img src="${menu.icon_url}" alt="${menu.name}">` : ''}
                        <h4>${menu.name}</h4>
                        <p>${menu.amount}</p>
                        <p><strong>${menu.price} MMK</strong></p>
                        <p>Button: ${menu.category_buttons.name}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editMenu(${menu.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteMenu(${menu.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No products yet</p>';
        }
    } catch (error) {
        console.error('Error loading menus:', error);
    }
}

async function editMenu(id) {
    const { data: menu } = await supabase
        .from('menus')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editMenuName" value="${menu.name}">
        </div>
        <div class="form-group">
            <label>Amount</label>
            <input type="text" id="editMenuAmount" value="${menu.amount}">
        </div>
        <div class="form-group">
            <label>Price</label>
            <input type="number" id="editMenuPrice" value="${menu.price}">
        </div>
        <button class="btn-primary" onclick="updateMenu(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateMenu(id) {
    const name = document.getElementById('editMenuName').value.trim();
    const amount = document.getElementById('editMenuAmount').value.trim();
    const price = document.getElementById('editMenuPrice').value;

    if (!name || !amount || !price) {
        alert('Please fill all fields');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('menus')
            .update({
                name: name,
                amount: amount,
                price: parseInt(price)
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Menu updated successfully!');
        loadMenus();
    } catch (error) {
        hideLoading();
        alert('Error updating menu');
        console.error(error);
    }
}

async function deleteMenu(id) {
    if (!confirm('Are you sure?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Menu deleted successfully!');
        loadMenus();
    } catch (error) {
        hideLoading();
        alert('Error deleting menu');
        console.error(error);
    }
}

// ==================== PAYMENT METHODS ====================

async function loadPaymentMethods() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('paymentsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(payment => {
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${payment.icon_url}" alt="${payment.name}">
                        <h4>${payment.name}</h4>
                        <p>${payment.address}</p>
                        <p>${payment.instructions || ''}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editPayment(${payment.id})">Edit</button>
                            <button class="btn-danger" onclick="deletePayment(${payment.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No payment methods yet</p>';
        }
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

async function addPaymentMethod() {
    const name = document.getElementById('paymentName').value.trim();
    const address = document.getElementById('paymentAddress').value.trim();
    const instructions = document.getElementById('paymentInstructions').value.trim();
    const file = document.getElementById('paymentIconFile').files[0];

    if (!name || !address || !file) {
        alert('Please fill all required fields');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'payment-icons');
    
    if (url) {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .insert([{
                    name: name,
                    address: address,
                    instructions: instructions,
                    icon_url: url
                }]);

            if (error) throw error;

            hideLoading();
            alert('Payment method added successfully!');
            document.getElementById('paymentName').value = '';
            document.getElementById('paymentAddress').value = '';
            document.getElementById('paymentInstructions').value = '';
            document.getElementById('paymentIconFile').value = '';
            loadPaymentMethods();
        } catch (error) {
            hideLoading();
            alert('Error adding payment method');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading icon');
    }
}

async function editPayment(id) {
    const { data: payment } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editPaymentName" value="${payment.name}">
        </div>
        <div class="form-group">
            <label>Address</label>
            <input type="text" id="editPaymentAddress" value="${payment.address}">
        </div>
        <div class="form-group">
            <label>Instructions</label>
            <textarea id="editPaymentInstructions">${payment.instructions || ''}</textarea>
        </div>
        <button class="btn-primary" onclick="updatePayment(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updatePayment(id) {
    const name = document.getElementById('editPaymentName').value.trim();
    const address = document.getElementById('editPaymentAddress').value.trim();
    const instructions = document.getElementById('editPaymentInstructions').value.trim();

    if (!name || !address) {
        alert('Please fill all required fields');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('payment_methods')
            .update({
                name: name,
                address: address,
                instructions: instructions
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Payment method updated successfully!');
        loadPaymentMethods();
    } catch (error) {
        hideLoading();
        alert('Error updating payment method');
        console.error(error);
    }
}

async function deletePayment(id) {
    if (!confirm('Are you sure?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Payment method deleted successfully!');
        loadPaymentMethods();
    } catch (error) {
        hideLoading();
        alert('Error deleting payment method');
        console.error(error);
    }
}

// ==================== CONTACTS ====================

async function loadContacts() {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('contactsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(contact => {
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${contact.icon_url}" alt="${contact.name}">
                        <h4>${contact.name}</h4>
                        <p>${contact.description || ''}</p>
                        <p>${contact.link || contact.address || ''}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editContact(${contact.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteContact(${contact.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No contacts yet</p>';
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

async function addContact() {
    const name = document.getElementById('contactName').value.trim();
    const description = document.getElementById('contactDescription').value.trim();
    const link = document.getElementById('contactLink').value.trim();
    const address = document.getElementById('contactAddress').value.trim();
    const file = document.getElementById('contactIconFile').files[0];

    if (!name || !file) {
        alert('Please fill required fields');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'contact-icons');
    
    if (url) {
        try {
            const { error } = await supabase
                .from('contacts')
                .insert([{
                    name: name,
                    description: description,
                    link: link,
                    address: address,
                    icon_url: url
                }]);

            if (error) throw error;

            hideLoading();
            alert('Contact added successfully!');
            document.getElementById('contactName').value = '';
            document.getElementById('contactDescription').value = '';
            document.getElementById('contactLink').value = '';
            document.getElementById('contactAddress').value = '';
            document.getElementById('contactIconFile').value = '';
            loadContacts();
        } catch (error) {
            hideLoading();
            alert('Error adding contact');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading icon');
    }
}

async function editContact(id) {
    const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editContactName" value="${contact.name}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="editContactDescription">${contact.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label>Link</label>
            <input type="text" id="editContactLink" value="${contact.link || ''}">
        </div>
        <div class="form-group">
            <label>Address</label>
            <input type="text" id="editContactAddress" value="${contact.address || ''}">
        </div>
        <button class="btn-primary" onclick="updateContact(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateContact(id) {
    const name = document.getElementById('editContactName').value.trim();
    const description = document.getElementById('editContactDescription').value.trim();
    const link = document.getElementById('editContactLink').value.trim();
    const address = document.getElementById('editContactAddress').value.trim();

    if (!name) {
        alert('Please enter a name');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('contacts')
            .update({
                name: name,
                description: description,
                link: link,
                address: address
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Contact updated successfully!');
        loadContacts();
    } catch (error) {
        hideLoading();
        alert('Error updating contact');
        console.error(error);
    }
}

async function deleteContact(id) {
    if (!confirm('Are you sure?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Contact deleted successfully!');
        loadContacts();
    } catch (error) {
        hideLoading();
        alert('Error deleting contact');
        console.error(error);
    }
}

// ==================== YOUTUBE VIDEOS ====================

async function loadButtonsForVideos() {
    const categoryId = document.getElementById('videoCategorySelect').value;
    if (!categoryId) {
        document.getElementById('videoButtonSelect').innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('videoButtonSelect');
        select.innerHTML = '<option value="">Select Button</option>';
        
        if (data) {
            data.forEach(btn => {
                select.innerHTML += `<option value="${btn.id}">${btn.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function loadVideos() {
    try {
        const { data, error } = await supabase
            .from('youtube_videos')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('videosContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(video => {
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${video.banner_url}" alt="Video">
                        <h4>${video.description}</h4>
                        <p>Button: ${video.category_buttons.name}</p>
                        <p><a href="${video.video_url}" target="_blank">View Video</a></p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editVideo(${video.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteVideo(${video.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No videos yet</p>';
        }
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

async function addVideo() {
    const buttonId = document.getElementById('videoButtonSelect').value;
    const file = document.getElementById('videoBannerFile').files[0];
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const description = document.getElementById('videoDescription').value.trim();

    if (!buttonId || !file || !videoUrl || !description) {
        alert('Please fill all fields');
        return;
    }

    showLoading();
    const bannerUrl = await uploadFile(file, 'video-banners');
    
    if (bannerUrl) {
        try {
            const { error } = await supabase
                .from('youtube_videos')
                .insert([{
                    button_id: buttonId,
                    banner_url: bannerUrl,
                    video_url: videoUrl,
                    description: description
                }]);

            if (error) throw error;

            hideLoading();
            alert('Video added successfully!');
            document.getElementById('videoBannerFile').value = '';
            document.getElementById('videoUrl').value = '';
            document.getElementById('videoDescription').value = '';
            loadVideos();
        } catch (error) {
            hideLoading();
            alert('Error adding video');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading banner');
    }
}

async function editVideo(id) {
    const { data: video } = await supabase
        .from('youtube_videos')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Video URL</label>
            <input type="text" id="editVideoUrl" value="${video.video_url}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="editVideoDescription">${video.description}</textarea>
        </div>
        <button class="btn-primary" onclick="updateVideo(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateVideo(id) {
    const videoUrl = document.getElementById('editVideoUrl').value.trim();
    const description = document.getElementById('editVideoDescription').value.trim();

    if (!videoUrl || !description) {
        alert('Please fill all fields');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('youtube_videos')
            .update({
                video_url: videoUrl,
                description: description
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Video updated successfully!');
        loadVideos();
    } catch (error) {
        hideLoading();
        alert('Error updating video');
        console.error(error);
    }
}

async function deleteVideo(id) {
    if (!confirm('Are you sure?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('youtube_videos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Video deleted successfully!');
        loadVideos();
    } catch (error) {
        hideLoading();
        alert('Error deleting video');
        console.error(error);
    }
}

// ==================== ORDERS ====================

function filterOrders(status) {
    currentFilter = status;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadOrders();
}

async function loadOrders() {
    try {
        let query = supabase
            .from('orders')
            .select(`
                *,
                users (name, username, email),
                menus (name, amount, price),
                payment_methods (name)
            `)
            .order('created_at', { ascending: false });

        if (currentFilter !== 'all') {
            query = query.eq('status', currentFilter);
        }

        const { data, error } = await query;

        const container = document.getElementById('ordersContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(order => {
                let statusClass = 'pending';
                if (order.status === 'approved') statusClass = 'approved';
                if (order.status === 'rejected') statusClass = 'rejected';

                container.innerHTML += `
                    <div class="order-card">
                        <div class="order-header">
                            <div>
                                <h3>Order #${order.id}</h3>
                                <p>${new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <span class="order-status ${statusClass}">${order.status.toUpperCase()}</span>
                        </div>
                        <div class="order-info">
                            <div class="info-item">
                                <span class="info-label">Customer</span>
                                <span class="info-value">${order.users.name} (@${order.users.username})</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email</span>
                                <span class="info-value">${order.users.email}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Product</span>
                                <span class="info-value">${order.menus.name}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Amount</span>
                                <span class="info-value">${order.menus.amount}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Price</span>
                                <span class="info-value">${order.menus.price} MMK</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Payment</span>
                                <span class="info-value">${order.payment_methods.name}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Transaction Code</span>
                                <span class="info-value">${order.transaction_code}</span>
                            </div>
                        </div>
                        ${order.status === 'pending' ? `
                            <div class="order-actions">
                                <button class="btn-success" onclick="approveOrder(${order.id})">Approve</button>
                                <button class="btn-danger" onclick="rejectOrder(${order.id})">Reject</button>
                            </div>
                        ` : ''}
                        ${order.admin_message ? `<p style="margin-top: 15px; color: #fbbf24;"><strong>Message:</strong> ${order.admin_message}</p>` : ''}
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No orders found</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function approveOrder(id) {
    const message = prompt('Enter a message for the customer (optional):');
    
    showLoading();
    try {
        const { error } = await supabase
            .from('orders')
            .update({
                status: 'approved',
                admin_message: message || 'Your order has been approved!'
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Order approved successfully!');
        loadOrders();
    } catch (error) {
        hideLoading();
        alert('Error approving order');
        console.error(error);
    }
}

async function rejectOrder(id) {
    const message = prompt('Enter a reason for rejection:');
    if (!message) return;
    
    showLoading();
    try {
        const { error } = await supabase
            .from('orders')
            .update({
                status: 'rejected',
                admin_message: message
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Order rejected!');
        loadOrders();
    } catch (error) {
        hideLoading();
        alert('Error rejecting order');
        console.error(error);
    }
}

// ==================== USERS ====================

async function loadUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        const container = document.getElementById('usersContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            // Update stats
            document.getElementById('totalUsers').textContent = data.length;
            
            const today = new Date().toDateString();
            const todayUsers = data.filter(user => {
                return new Date(user.created_at).toDateString() === today;
            });
            document.getElementById('todayUsers').textContent = todayUsers.length;

            // Display users
            data.forEach(user => {
                container.innerHTML += `
                    <div class="user-card">
                        <div class="user-info">
                            <h4>${user.name}</h4>
                            <p>@${user.username} | ${user.email}</p>
                            <p style="font-size: 12px; color: #94a3b8;">Joined: ${new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <div class="user-badge">Active</div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No users yet</p>';
            document.getElementById('totalUsers').textContent = '0';
            document.getElementById('todayUsers').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ==================== MODALS ====================

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// ==================== UTILITY FUNCTIONS ====================

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
