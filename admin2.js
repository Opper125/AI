
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
        case 'animations':
            loadAnimations();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        // NEW ENHANCED SECTIONS
        case 'enhanced-products':
            loadEnhancedProducts();
            loadCategoriesForSelect();
            loadPaymentMethodsForSelect();
            loadContactsForSelect();
            break;
        case 'product-banners':
            loadProductPageBanners();
            loadCategoriesForSelect();
            break;
        case 'product-content':
            loadProductPageContent();
            loadCategoriesForSelect();
            break;
        case 'ads-system':
            loadAdsSystem();
            break;
        case 'enhanced-orders':
            loadEnhancedOrders();
            break;
        case 'ip-management':
            loadPendingRequests();
            loadAdminSessions();
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
        console.log('✨ Loading animations...');
        const { data, error } = await supabase
            .from('animations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allAnimations = data || [];
        console.log(`✅ Loaded ${allAnimations.length} animations`);
        
        displayAnimations(allAnimations);
    } catch (error) {
        console.error('❌ Error loading animations:', error);
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
            <button class="animation-delete" onclick="deleteAnimation(${anim.id})">🗑️</button>
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
        alert('✨ Animation uploaded successfully!');
        
        // Reset form
        document.getElementById('animationName').value = '';
        document.getElementById('animationFile').value = '';
        document.getElementById('animationFileInfo').innerHTML = '';
        
        // Reload animations
        await loadAnimations();

    } catch (error) {
        hideLoading();
        console.error('❌ Upload error:', error);
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
        alert('🗑️ Animation deleted!');
        await loadAnimations();

    } catch (error) {
        hideLoading();
        console.error('❌ Delete error:', error);
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
                            <button class="btn-secondary" onclick="editCategory(${category.id})">Edit</button>
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
        alert('Please enter category title');
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
        loadCategoriesForSelect(); // Refresh select options
    } catch (error) {
        hideLoading();
        alert('Error adding category');
        console.error(error);
    }
}

async function editCategory(id) {
    const newTitle = prompt('Enter new category title:');
    if (!newTitle) return;

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
        loadCategoriesForSelect();
    } catch (error) {
        hideLoading();
        alert('Error updating category');
        console.error(error);
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? This will also delete all its buttons and related data.')) return;

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
        loadCategoriesForSelect();
    } catch (error) {
        hideLoading();
        alert('Error deleting category');
        console.error(error);
    }
}

// Load categories for select dropdowns
async function loadCategoriesForSelect() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Update all category selects
        const selects = [
            'buttonCategorySelect', 'tableCategorySelect', 'menuCategorySelect', 
            'videoCategorySelect', 'enhancedProductCategorySelect', 'bannerCategorySelect', 
            'contentCategorySelect'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select Category</option>';
                if (data) {
                    data.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.title;
                        select.appendChild(option);
                    });
                }
            }
        });

    } catch (error) {
        console.error('Error loading categories for select:', error);
    }
}

// ==================== CATEGORY BUTTONS ====================

async function loadCategoryButtons() {
    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select(`
                *,
                categories (title)
            `)
            .order('created_at', { ascending: false });

        const container = document.getElementById('buttonsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(button => {
                const nameHtml = renderAnimatedText(button.name);
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${button.icon_url}" alt="Button Icon">
                        <h4>${nameHtml}</h4>
                        <p><strong>Category:</strong> ${button.categories?.title || 'Unknown'}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editCategoryButton(${button.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteCategoryButton(${button.id})">Delete</button>
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
    const iconUrl = await uploadFile(file, 'buttons');
    
    if (iconUrl) {
        try {
            const { error } = await supabase
                .from('category_buttons')
                .insert([{
                    category_id: parseInt(categoryId),
                    name: name,
                    icon_url: iconUrl
                }]);

            if (error) throw error;

            hideLoading();
            alert('Button added!');
            document.getElementById('buttonCategorySelect').value = '';
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

async function editCategoryButton(id) {
    alert('Edit functionality will be implemented in the next update');
}

async function deleteCategoryButton(id) {
    if (!confirm('Delete this button? This will also delete all related data.')) return;

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
        alert('Error deleting button');
        console.error(error);
    }
}

// Load buttons for specific category
async function loadButtonsForTables() {
    const categoryId = document.getElementById('tableCategorySelect').value;
    const buttonSelect = document.getElementById('tableButtonSelect');
    
    buttonSelect.innerHTML = '<option value="">Select Button</option>';
    
    if (!categoryId) return;

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            data.forEach(button => {
                const option = document.createElement('option');
                option.value = button.id;
                option.textContent = button.name;
                buttonSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function loadButtonsForMenus() {
    const categoryId = document.getElementById('menuCategorySelect').value;
    const buttonSelect = document.getElementById('menuButtonSelect');
    
    buttonSelect.innerHTML = '<option value="">Select Button</option>';
    
    if (!categoryId) return;

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            data.forEach(button => {
                const option = document.createElement('option');
                option.value = button.id;
                option.textContent = button.name;
                buttonSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading buttons for menus:', error);
    }
}

async function loadButtonsForVideos() {
    const categoryId = document.getElementById('videoCategorySelect').value;
    const buttonSelect = document.getElementById('videoButtonSelect');
    
    buttonSelect.innerHTML = '<option value="">Select Button</option>';
    
    if (!categoryId) return;

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            data.forEach(button => {
                const option = document.createElement('option');
                option.value = button.id;
                option.textContent = button.name;
                buttonSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading buttons for videos:', error);
    }
}

// Enhanced Product Functions - LOAD BUTTONS FOR CATEGORIES
async function loadButtonsForEnhancedProducts() {
    const categoryId = document.getElementById('enhancedProductCategorySelect').value;
    const buttonSelect = document.getElementById('enhancedProductButtonSelect');
    
    buttonSelect.innerHTML = '<option value="">Select Button</option>';
    
    if (!categoryId) return;

    try {
        const { data, error } = await supabase
            .from('category_buttons')  
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            data.forEach(button => {
                const option = document.createElement('option');
                option.value = button.id;
                option.textContent = button.name;
                buttonSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading buttons for enhanced products:', error);
    }
}

// Load buttons for banners
async function loadButtonsForBanners() {
    const categoryId = document.getElementById('bannerCategorySelect').value;
    const buttonSelect = document.getElementById('bannerButtonSelect');
    
    buttonSelect.innerHTML = '<option value="">Select Button</option>';
    
    if (!categoryId) return;

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            data.forEach(button => {
                const option = document.createElement('option');
                option.value = button.id;
                option.textContent = button.name;
                buttonSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading buttons for banners:', error);
    }
}

// Load buttons for content
async function loadButtonsForContent() {
    const categoryId = document.getElementById('contentCategorySelect').value;
    const buttonSelect = document.getElementById('contentButtonSelect');
    
    buttonSelect.innerHTML = '<option value="">Select Button</option>';
    
    if (!categoryId) {
        document.getElementById('contentProductSelect').innerHTML = '<option value="">General Page Content</option>';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            data.forEach(button => {
                const option = document.createElement('option');
                option.value = button.id;
                option.textContent = button.name;
                buttonSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading buttons for content:', error);
    }
}

// Load products for content
async function loadProductsForContent() {
    const buttonId = document.getElementById('contentButtonSelect').value;
    const productSelect = document.getElementById('contentProductSelect');
    
    productSelect.innerHTML = '<option value="">General Page Content</option>';
    
    if (!buttonId) return;

    try {
        const { data, error } = await supabase
            .from('enhanced_products')
            .select('*')
            .eq('button_id', buttonId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            data.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                productSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading products for content:', error);
    }
}
