
// Supabase Configuration
const SUPABASE_URL = 'https://eynbcpkpwzikwtlrdlza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI3MzgsImV4cCI6MjA3NDYxODczOH0.D8MzC7QSinkiGECeDW9VAr_1XNUral5FnXGHyjD_eQ4';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmJjcGtwd3ppa3d0bHJkbHphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA0MjczOCwiZXhwIjoyMDc0NjE4NzM4fQ.RIeMmmXUz4f2R3-3fhyu5neWt6e7ihVWuqXYe4ovhMg';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentFilter = 'all';
let websiteSettings = null;
let allAnimations = []; // Store all animations
let currentEmojiTarget = null; // Current input field for emoji insertion

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

// ==================== ENHANCED ADMIN AUTHENTICATION ==================== 

// Check if admin is authenticated
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

// Enhanced admin login with database authentication
async function adminLogin(event) {
    event.preventDefault(); // Prevent form submission
    
    const passwordInput = document.getElementById('adminPassword');
    const password = passwordInput.value.trim();
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.querySelector('.btn-login');

    if (!password) {
        showError(errorEl, 'Please enter a password!');
        return;
    }

    // Add loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
        // Check password against database
        const { data, error } = await supabase
            .rpc('verify_admin_password', { input_password: password });

        if (error) {
            throw error;
        }

        if (data === true) {
            // Password is correct
            localStorage.setItem('isAdmin', 'true');
            showSuccess(errorEl, 'Login successful! Redirecting...');
            
            setTimeout(() => {
                showDashboard();
            }, 1000);
        } else {
            // Password is incorrect
            showError(errorEl, 'Incorrect password! Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(errorEl, 'Login failed. Please try again.');
    } finally {
        // Remove loading state
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        passwordInput.value = '';
    }
}

function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isAdmin');
        location.reload();
    }
}

// Change admin password function
async function changeAdminPassword() {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    showLoading();

    try {
        // First verify current password
        const { data: isValid, error: verifyError } = await supabase
            .rpc('verify_admin_password', { input_password: currentPassword });

        if (verifyError) throw verifyError;

        if (!isValid) {
            hideLoading();
            alert('Current password is incorrect');
            return;
        }

        // Update password
        const { data, error } = await supabase
            .rpc('update_admin_password', { new_password: newPassword });

        if (error) throw error;

        hideLoading();
        alert('Password changed successfully! You will be logged out.');
        localStorage.removeItem('isAdmin');
        location.reload();

    } catch (error) {
        hideLoading();
        console.error('Password change error:', error);
        alert('Error changing password: ' + error.message);
    }
}

// Switch Section
function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    loadSectionData(sectionName);
}

// Load All Data
async function loadAllData() {
    await Promise.all([
        loadWebsiteSettings(),
        loadCategories(),
        loadBanners(),
        loadAnimations() // Load animations globally
    ]);
}

// Load Section Data
function loadSectionData(section) {
    switch(section) {
        case 'website-settings':
            loadWebsiteSettings();
            break;
        case 'admin-settings':
            // Admin settings section - no data loading needed
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
        case 'animations':
            loadAnimations();
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

// ==================== ANIMATIONS/EMOJI SYSTEM ====================

// Load All Animations
async function loadAnimations() {
    try {
        console.log(' Loading animations...');
        const { data, error } = await supabase
            .from('animations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allAnimations = data || [];
        console.log(` Loaded ${allAnimations.length} animations`);
        
        displayAnimations(allAnimations);
    } catch (error) {
        console.error(' Error loading animations:', error);
        allAnimations = [];
    }
}

// Display Animations
function displayAnimations(animations) {
    const container = document.getElementById('animationsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (animations.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations yet. Upload your first animation!</p>';
        return;
    }

    animations.forEach(anim => {
        const item = document.createElement('div');
        item.className = 'animation-item';
        
        let preview = '';
        if (anim.file_type === 'gif' || anim.file_type === 'png' || anim.file_type === 'jpg' || anim.file_type === 'jpeg') {
            preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
        } else if (anim.file_type === 'video' || anim.file_type === 'webm' || anim.file_type === 'mp4') {
            preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
        } else if (anim.file_type === 'json') {
            preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
        }

        item.innerHTML = `
            <div class="animation-preview">${preview}</div>
            <div class="animation-name">${anim.name}</div>
            <div class="animation-type">${anim.file_type.toUpperCase()}</div>
            <button class="animation-delete" onclick="deleteAnimation(${anim.id})"></button>
        `;

        container.appendChild(item);
    });
}

// Upload Animation
async function uploadAnimation() {
    const name = document.getElementById('animationName').value.trim();
    const file = document.getElementById('animationFile').files[0];

    if (!name || !file) {
        alert('Please enter name and select file');
        return;
    }

    showLoading();

    try {
        // Upload file
        const fileUrl = await uploadFile(file, 'animations');
        
        if (!fileUrl) {
            throw new Error('File upload failed');
        }

        // Get file type
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        // Insert into database
        const { data, error } = await supabase
            .from('animations')
            .insert([{
                name: name,
                file_url: fileUrl,
                file_type: fileExt,
                file_size: file.size,
                width: null,
                height: null
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        alert(' Animation uploaded successfully!');
        
        // Reset form
        document.getElementById('animationName').value = '';
        document.getElementById('animationFile').value = '';
        document.getElementById('animationFileInfo').innerHTML = '';
        
        // Reload animations
        await loadAnimations();

    } catch (error) {
        hideLoading();
        console.error(' Upload error:', error);
        alert('Error uploading animation: ' + error.message);
    }
}

// Delete Animation
async function deleteAnimation(id) {
    if (!confirm('Delete this animation?')) return;

    showLoading();

    try {
        const { error } = await supabase
            .from('animations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert(' Animation deleted!');
        await loadAnimations();

    } catch (error) {
        hideLoading();
        console.error(' Delete error:', error);
        alert('Error deleting animation');
    }
}

// Show file info when selected
document.addEventListener('DOMContentLoaded', () => {
    const animFileInput = document.getElementById('animationFile');
    if (animFileInput) {
        animFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const infoDiv = document.getElementById('animationFileInfo');
            
            if (file) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                infoDiv.innerHTML = `
                    <strong>File:</strong> ${file.name}<br>
                    <strong>Type:</strong> ${file.type}<br>
                    <strong>Size:</strong> ${sizeMB} MB
                `;
            } else {
                infoDiv.innerHTML = '';
            }
        });
    }
});

// ==================== EMOJI PICKER ====================

// Open Emoji Picker for specific input
function openEmojiPicker(inputId) {
    currentEmojiTarget = document.getElementById(inputId);
    if (!currentEmojiTarget) return;

    const modal = document.getElementById('emojiPickerModal');
    const grid = document.getElementById('emojiGrid');
    
    // Load emoji grid
    grid.innerHTML = '';
    
    if (allAnimations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations available. Upload some first!</p>';
    } else {
        allAnimations.forEach(anim => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.onclick = () => insertEmoji(anim);
            
            let preview = '';
            if (anim.file_type === 'gif' || anim.file_type === 'png' || anim.file_type === 'jpg' || anim.file_type === 'jpeg') {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            } else if (anim.file_type === 'video' || anim.file_type === 'webm' || anim.file_type === 'mp4') {
                preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
            } else {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            }
            
            item.innerHTML = `
                ${preview}
                <div class="emoji-item-name">${anim.name}</div>
            `;
            
            grid.appendChild(item);
        });
    }
    
    modal.classList.add('active');
}

// Open Emoji Picker for class-based inputs
function openEmojiPickerForClass(button, className) {
    const inputGroup = button.closest('.table-input-group, .menu-input-group');
    if (inputGroup) {
        currentEmojiTarget = inputGroup.querySelector('.' + className);
    } else {
        currentEmojiTarget = button.previousElementSibling;
    }
    
    if (!currentEmojiTarget) return;

    const modal = document.getElementById('emojiPickerModal');
    const grid = document.getElementById('emojiGrid');
    
    grid.innerHTML = '';
    
    if (allAnimations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations available</p>';
    } else {
        allAnimations.forEach(anim => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.onclick = () => insertEmoji(anim);
            
            let preview = '';
            if (anim.file_type === 'gif' || anim.file_type === 'png' || anim.file_type === 'jpg' || anim.file_type === 'jpeg') {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            } else if (anim.file_type === 'video' || anim.file_type === 'webm' || anim.file_type === 'mp4') {
                preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
            } else {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            }
            
            item.innerHTML = `
                ${preview}
                <div class="emoji-item-name">${anim.name}</div>
            `;
            
            grid.appendChild(item);
        });
    }
    
    modal.classList.add('active');
}

// Insert Emoji into target input
function insertEmoji(animation) {
    if (!currentEmojiTarget) return;

    const cursorPos = currentEmojiTarget.selectionStart || currentEmojiTarget.value.length;
    const textBefore = currentEmojiTarget.value.substring(0, cursorPos);
    const textAfter = currentEmojiTarget.value.substring(cursorPos);
    
    // Insert emoji marker: {anim:ID:URL:TYPE}
    const emojiCode = `{anim:${animation.id}:${animation.file_url}:${animation.file_type}}`;
    
    currentEmojiTarget.value = textBefore + emojiCode + textAfter;
    
    // Set cursor position after emoji
    const newPos = cursorPos + emojiCode.length;
    currentEmojiTarget.setSelectionRange(newPos, newPos);
    currentEmojiTarget.focus();
    
    closeEmojiPicker();
}

// Close Emoji Picker
function closeEmojiPicker() {
    document.getElementById('emojiPickerModal').classList.remove('active');
    currentEmojiTarget = null;
}

// Filter Emojis
function filterEmojis() {
    const searchTerm = document.getElementById('emojiSearch').value.toLowerCase();
    const items = document.querySelectorAll('.emoji-item');
    
    items.forEach(item => {
        const name = item.querySelector('.emoji-item-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Render Animated Emojis in HTML
function renderAnimatedText(text) {
    if (!text) return text;
    
    // Replace {anim:ID:URL:TYPE} with actual HTML
    return text.replace(/\{anim:(\d+):([^:]+):([^}]+)\}/g, (match, id, url, type) => {
        if (type === 'gif' || type === 'png' || type === 'jpg' || type === 'jpeg') {
            return `<span class="animated-emoji"><img src="${url}" alt="emoji"></span>`;
        } else if (type === 'video' || type === 'webm' || type === 'mp4') {
            return `<span class="animated-emoji"><video autoplay loop muted><source src="${url}" type="video/${type}"></video></span>`;
        } else {
            return `<span class="animated-emoji"><img src="${url}" alt="emoji"></span>`;
        }
    });
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
            await supabase.from('website_settings').insert([{
                website_name: 'Gaming Store'
            }]);
            loadWebsiteSettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updateWebsiteName() {
    const name = document.getElementById('websiteName').value;
    showLoading();

    try {
        const { error } = await supabase
            .from('website_settings')
            .update({ website_name: name })
            .eq('id', websiteSettings.id);

        if (error) throw error;

        hideLoading();
        alert('Website name updated!');
        loadWebsiteSettings();
    } catch (error) {
        hideLoading();
        alert('Error updating');
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
        alert('Logo uploaded!');
    } else {
        hideLoading();
        alert('Error uploading');
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
        alert('Background uploaded!');
    } else {
        hideLoading();
        alert('Error uploading');
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
        alert('Loading animation uploaded!');
    } else {
        hideLoading();
        alert('Error uploading');
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
        alert('Button style uploaded!');
    } else {
        hideLoading();
        alert('Error uploading');
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
            alert('Banner added!');
            document.getElementById('bannerFile').value = '';
            loadBanners();
        } catch (error) {
            hideLoading();
            alert('Error adding banner');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading');
    }
}

async function deleteBanner(id) {
    if (!confirm('Delete this banner?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Banner deleted!');
        loadBanners();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
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
                const titleHtml = renderAnimatedText(category.title);
                container.innerHTML += `
                    <div class="item-card">
                        <h4>${titleHtml}</h4>
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
        alert('Category added!');
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
        alert('Category updated!');
        loadCategories();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? All related data will be deleted!')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Category deleted!');
        loadCategories();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
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
                        const titleText = cat.title.replace(/\{anim:[^}]+\}/g, ''); // Remove emoji codes for select
                        select.innerHTML += `<option value="${cat.id}">${titleText}</option>`;
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error loading categories:', error);
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
                const nameHtml = renderAnimatedText(button.name);
                const categoryHtml = renderAnimatedText(button.categories.title);
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${button.icon_url}" alt="${button.name}">
                        <h4>${nameHtml}</h4>
                        <p>Category: ${categoryHtml}</p>
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
            alert('Button added!');
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
            <div class="input-with-emoji">
                <input type="text" id="editButtonName" value="${button.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editButtonName')">😀</button>
            </div>
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
        alert('Button updated!');
        loadCategoryButtons();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deleteButton(id) {
    if (!confirm('Delete this button? All related data will be deleted!')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('category_buttons')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Button deleted!');
        loadCategoryButtons();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
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
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
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
        <button class="remove-input" onclick="this.parentElement.remove()"></button>
        <div class="input-with-emoji">
            <input type="text" class="table-name" placeholder="Table Name">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-name')">😀</button>
        </div>
        <div class="input-with-emoji">
            <input type="text" class="table-instruction" placeholder="Instruction">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-instruction')">😀</button>
        </div>
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
        alert('Tables saved!');
        document.getElementById('tablesInputContainer').innerHTML = `
            <div class="table-input-group">
                <div class="input-with-emoji">
                    <input type="text" class="table-name" placeholder="Table Name">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-name')">😀</button>
                </div>
                <div class="input-with-emoji">
                    <input type="text" class="table-instruction" placeholder="Instruction">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-instruction')">😀</button>
                </div>
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
                const nameHtml = renderAnimatedText(table.name);
                const instructionHtml = renderAnimatedText(table.instruction);
                const buttonNameHtml = renderAnimatedText(table.category_buttons.name);
                const categoryHtml = renderAnimatedText(table.category_buttons.categories.title);
                
                container.innerHTML += `
                    <div class="item-card">
                        <h4>${nameHtml}</h4>
                        <p>Button: ${buttonNameHtml}</p>
                        <p>Category: ${categoryHtml}</p>
                        <p>Instruction: ${instructionHtml}</p>
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
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('input_tables')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Table deleted!');
        loadInputTables();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== MENUS/PRODUCTS ====================

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
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
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
        <button class="remove-input" onclick="this.parentElement.remove()"></button>
        <div class="input-with-emoji">
            <input type="text" class="menu-name" placeholder="Product Name">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-name')">😀</button>
        </div>
        <div class="input-with-emoji">
            <input type="text" class="menu-amount" placeholder="Amount/Details">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-amount')">😀</button>
        </div>
        <input type="number" class="menu-price" placeholder="Price">
        <input type="file" class="menu-icon" accept="image/*">
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
        alert('Products saved!');
        document.getElementById('menusInputContainer').innerHTML = `
            <div class="menu-input-group">
                <div class="input-with-emoji">
                    <input type="text" class="menu-name" placeholder="Product Name">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-name')">😀</button>
                </div>
                <div class="input-with-emoji">
                    <input type="text" class="menu-amount" placeholder="Amount/Details">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-amount')">😀</button>
                </div>
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
                const nameHtml = renderAnimatedText(menu.name);
                const amountHtml = renderAnimatedText(menu.amount);
                const buttonNameHtml = renderAnimatedText(menu.category_buttons.name);
                
                container.innerHTML += `
                    <div class="item-card">
                        ${menu.icon_url ? `<img src="${menu.icon_url}" alt="${menu.name}">` : ''}
                        <h4>${nameHtml}</h4>
                        <p>${amountHtml}</p>
                        <p><strong>${menu.price} MMK</strong></p>
                        <p>Button: ${buttonNameHtml}</p>
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
            <div class="input-with-emoji">
                <input type="text" id="editMenuName" value="${menu.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editMenuName')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Amount</label>
            <div class="input-with-emoji">
                <input type="text" id="editMenuAmount" value="${menu.amount}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editMenuAmount')">😀</button>
            </div>
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
        alert('Menu updated!');
        loadMenus();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deleteMenu(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Menu deleted!');
        loadMenus();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
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
                const nameHtml = renderAnimatedText(payment.name);
                const instructionsHtml = renderAnimatedText(payment.instructions || '');
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${payment.icon_url}" alt="${payment.name}">
                        <h4>${nameHtml}</h4>
                        <p>${payment.address}</p>
                        <p>${instructionsHtml}</p>
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
            alert('Payment method added!');
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
            <div class="input-with-emoji">
                <input type="text" id="editPaymentName" value="${payment.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editPaymentName')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Address</label>
            <input type="text" id="editPaymentAddress" value="${payment.address}">
        </div>
        <div class="form-group">
            <label>Instructions</label>
            <div class="textarea-with-emoji">
                <textarea id="editPaymentInstructions" rows="3">${payment.instructions || ''}</textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editPaymentInstructions')">😀</button>
            </div>
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
        alert('Please fill required fields');
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
        alert('Payment method updated!');
        loadPaymentMethods();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deletePayment(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Payment method deleted!');
        loadPaymentMethods();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
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
                const nameHtml = renderAnimatedText(contact.name);
                const descriptionHtml = renderAnimatedText(contact.description || '');
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${contact.icon_url}" alt="${contact.name}">
                        <h4>${nameHtml}</h4>
                        <p>${descriptionHtml}</p>
                        ${contact.link ? `<p>Link: ${contact.link}</p>` : ''}
                        ${contact.address ? `<p>Address: ${contact.address}</p>` : ''}
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

    if (!name || !description || !file) {
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
            alert('Contact added!');
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
            <div class="input-with-emoji">
                <input type="text" id="editContactName" value="${contact.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editContactName')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <div class="textarea-with-emoji">
                <textarea id="editContactDescription" rows="3">${contact.description || ''}</textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editContactDescription')">😀</button>
            </div>
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

    if (!name || !description) {
        alert('Please fill required fields');
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
        alert('Contact updated!');
        loadContacts();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deleteContact(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Contact deleted!');
        loadContacts();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
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
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function addVideo() {
    const categoryId = document.getElementById('videoCategorySelect').value;
    const buttonId = document.getElementById('videoButtonSelect').value;
    const url = document.getElementById('videoUrl').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const file = document.getElementById('videoBannerFile').files[0];

    if (!categoryId || !buttonId || !url || !description || !file) {
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
                    category_id: categoryId,
                    button_id: buttonId,
                    banner_url: bannerUrl,
                    video_url: url,
                    description: description
                }]);

            if (error) throw error;

            hideLoading();
            alert('Video added!');
            document.getElementById('videoUrl').value = '';
            document.getElementById('videoDescription').value = '';
            document.getElementById('videoBannerFile').value = '';
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

async function loadVideos() {
    try {
        const { data, error } = await supabase
            .from('youtube_videos')
            .select(`
                *,
                categories (title),
                category_buttons (name)
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('videosContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(video => {
                const descriptionHtml = renderAnimatedText(video.description);
                const categoryHtml = renderAnimatedText(video.categories.title);
                const buttonNameHtml = renderAnimatedText(video.category_buttons.name);
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${video.banner_url}" alt="Video Banner">
                        <h4>${descriptionHtml}</h4>
                        <p>Category: ${categoryHtml}</p>
                        <p>Button: ${buttonNameHtml}</p>
                        <p><a href="${video.video_url}" target="_blank">Watch Video</a></p>
                        <div class="item-actions">
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

async function deleteVideo(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('youtube_videos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Video deleted!');
        loadVideos();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== ORDERS ====================

async function loadOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users (name, username),
                menus (name, price),
                category_buttons (name),
                payment_methods (name)
            `)
            .order('created_at', { ascending: false });

        const container = document.getElementById('ordersContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(order => {
                container.innerHTML += `
                    <div class="order-card">
                        <div class="order-header">
                            <h4>Order #${order.id}</h4>
                            <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
                        </div>
                        <div class="order-info">
                            <div class="info-item">
                                <span class="info-label">Customer</span>
                                <span class="info-value">${order.users.name} (@${order.users.username})</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Product</span>
                                <span class="info-value">${order.menus.name}</span>
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
                                <span class="info-label">Date</span>
                                <span class="info-value">${new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        ${order.user_data ? `<p><strong>User Data:</strong> ${order.user_data}</p>` : ''}
                        ${order.admin_message ? `<p><strong>Admin Message:</strong> ${order.admin_message}</p>` : ''}
                        <div class="order-actions">
                            <button class="btn-success" onclick="approveOrder(${order.id})">Approve</button>
                            <button class="btn-danger" onclick="rejectOrder(${order.id})">Reject</button>
                            <button class="btn-secondary" onclick="addAdminMessage(${order.id})">Add Message</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No orders yet</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function approveOrder(id) {
    if (!confirm('Approve this order?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'approved' })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Order approved!');
        loadOrders();
    } catch (error) {
        hideLoading();
        alert('Error approving order');
        console.error(error);
    }
}

async function rejectOrder(id) {
    if (!confirm('Reject this order?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'rejected' })
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

async function addAdminMessage(id) {
    const message = prompt('Enter admin message:');
    if (!message) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('orders')
            .update({ admin_message: message })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Message added!');
        loadOrders();
    } catch (error) {
        hideLoading();
        alert('Error adding message');
        console.error(error);
    }
}

function filterOrders(status) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const orders = document.querySelectorAll('.order-card');
    orders.forEach(order => {
        const orderStatus = order.querySelector('.order-status').textContent.toLowerCase();
        if (status === 'all' || orderStatus === status) {
            order.style.display = 'block';
        } else {
            order.style.display = 'none';
        }
    });
}

// ==================== USERS ====================

async function loadUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        const container = document.getElementById('usersContainer');
        const totalUsersEl = document.getElementById('totalUsers');
        const todayUsersEl = document.getElementById('todayUsers');

        container.innerHTML = '';

        if (data && data.length > 0) {
            totalUsersEl.textContent = data.length;
            
            const today = new Date().toDateString();
            const todayUsers = data.filter(user => 
                new Date(user.created_at).toDateString() === today
            ).length;
            todayUsersEl.textContent = todayUsers;

            data.forEach(user => {
                container.innerHTML += `
                    <div class="user-card">
                        <div class="user-info">
                            <h4>${user.name}</h4>
                            <p>@${user.username} • ${user.email}</p>
                            <p>Joined: ${new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <div class="user-badge">Active</div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No users yet</p>';
            totalUsersEl.textContent = '0';
            todayUsersEl.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ==================== MODAL FUNCTIONS ====================

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// ==================== UTILITY FUNCTIONS ====================

function showError(element, message) {
    element.textContent = message;
    element.className = 'error-message show';
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function showSuccess(element, message) {
    element.textContent = message;
    element.className = 'success-message show';
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}
