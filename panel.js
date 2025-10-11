
// ==================== ENHANCED PRODUCTS SYSTEM ====================

// Enhanced Products Management
let enhancedProductsData = [];
let selectedPaymentMethods = [];
let selectedContacts = [];
let uploadedImages = [];
let totalImageSize = 0;
const MAX_SINGLE_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

// Load Enhanced Products Section
async function loadEnhancedProducts() {
    try {
        const { data, error } = await supabase
            .from('enhanced_products')
            .select(`
                *,
                category_buttons (
                    name,
                    categories (name)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        enhancedProductsData = data || [];
        displayEnhancedProducts(enhancedProductsData);
    } catch (error) {
        console.error('❌ Error loading enhanced products:', error);
    }
}

function displayEnhancedProducts(products) {
    const container = document.getElementById('enhancedProductsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p class="no-data">No enhanced products yet. Create your first enhanced product!</p>';
        return;
    }

    products.forEach(product => {
        const images = product.images ? JSON.parse(product.images) : [];
        const firstImage = images.length > 0 ? images[0] : null;
        
        const discountPrice = product.discount_percentage 
            ? (product.price * (1 - product.discount_percentage / 100)).toFixed(0)
            : product.price;

        const card = document.createElement('div');
        card.className = 'enhanced-product-card';
        card.innerHTML = `
            <div class="product-image-container">
                ${firstImage ? `<img src="${firstImage}" alt="${product.name}">` : '<div class="no-image">No Image</div>'}
                ${product.discount_percentage ? `<div class="discount-badge">-${product.discount_percentage}%</div>` : ''}
            </div>
            <div class="product-card-content">
                <h4>${renderAnimatedText(product.name)}</h4>
                <p class="product-type">${product.product_type || 'Product'} • Level: ${product.product_level || 'N/A'}</p>
                <p class="product-description">${product.description ? product.description.substring(0, 100) + '...' : 'No description'}</p>
                <div class="price-display">
                    ${product.discount_percentage ? `
                        <span class="original-price">${product.price} ${product.currency}</span>
                        <span class="final-price">${discountPrice} ${product.currency}</span>
                    ` : `
                        <span class="final-price">${product.price} ${product.currency}</span>
                    `}
                </div>
                <div class="product-meta">
                    <span>Stock: ${product.stock_quantity || 'N/A'}</span>
                    <span>ID: ${product.product_id || product.id}</span>
                </div>
                <div class="product-actions">
                    <button onclick="editEnhancedProduct(${product.id})" class="btn-secondary">Edit</button>
                    <button onclick="deleteEnhancedProduct(${product.id})" class="btn-danger">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Enhanced Product Creation Form
function createEnhancedProductForm() {
    const form = document.createElement('div');
    form.className = 'enhanced-product-form';
    form.innerHTML = `
        <h3>Create Enhanced Product</h3>
        
        <!-- Category & Button Selection -->
        <div class="form-row">
            <div class="form-group">
                <label>Category</label>
                <select id="enhancedProductCategory" onchange="loadButtonsForEnhancedProduct()">
                    <option value="">Select Category</option>
                </select>
            </div>
            <div class="form-group">
                <label>Category Button</label>
                <select id="enhancedProductButton">
                    <option value="">Select Button</option>
                </select>
            </div>
        </div>

        <!-- Basic Product Info -->
        <div class="form-group">
            <label>Product Name *</label>
            <div class="input-with-emoji">
                <input type="text" id="enhancedProductName" placeholder="Enter product name" required>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('enhancedProductName')">😀</button>
            </div>
        </div>

        <div class="form-group">
            <label>Product Description</label>
            <div class="textarea-with-emoji">
                <textarea id="enhancedProductDescription" placeholder="Describe your product" rows="3"></textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('enhancedProductDescription')">😀</button>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Stock Quantity</label>
                <input type="number" id="enhancedProductStock" placeholder="Available quantity" min="0">
            </div>
            <div class="form-group">
                <label>Product Type</label>
                <input type="text" id="enhancedProductType" placeholder="e.g. Digital Game, Physical Item">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Product Level</label>
                <input type="text" id="enhancedProductLevel" placeholder="e.g. Premium, Basic, VIP">
            </div>
            <div class="form-group">
                <label>Product ID</label>
                <input type="text" id="enhancedProductId" placeholder="Custom product identifier">
            </div>
        </div>

        <div class="form-group">
            <label>Delivery Time</label>
            <input type="text" id="enhancedProductDelivery" placeholder="e.g. Instant, 1-2 hours, 1-3 days">
        </div>

        <!-- Pricing Section -->
        <div class="pricing-section">
            <h4>💰 Pricing Configuration</h4>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Original Price *</label>
                    <input type="number" id="enhancedProductPrice" placeholder="Original price" required min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label>Currency *</label>
                    <input type="text" id="enhancedProductCurrency" placeholder="e.g. MMK, USD, ¥" required>
                </div>
            </div>

            <div class="form-group">
                <label>Discount Percentage (Optional)</label>
                <input type="number" id="enhancedProductDiscount" placeholder="e.g. 10 for 10% off" min="0" max="100">
                <small class="form-help">Leave empty for no discount</small>
            </div>

            <div class="price-preview" id="pricePreview">
                <p>Final Price: <span id="finalPriceDisplay">-</span></p>
            </div>
        </div>

        <!-- Image Upload Section -->
        <div class="image-upload-section">
            <h4>📸 Product Images</h4>
            <input type="file" id="enhancedProductImages" multiple accept="image/*,video/*" onchange="handleImageUpload()">
            <div class="upload-info">
                <p>• Multiple files supported (images and videos)</p>
                <p>• Maximum single file size: 10MB</p>
                <p>• Maximum total size: 50MB</p>
            </div>
            
            <div class="image-preview-container" id="imagePreviewContainer">
                <!-- Uploaded images will be displayed here -->
            </div>
            
            <div class="size-indicator" id="sizeIndicator">
                <span class="size-text">Total size: 0MB / 50MB</span>
                <div class="size-bar">
                    <div class="size-progress" id="sizeProgress"></div>
                </div>
            </div>
        </div>

        <!-- Payment Methods Selection -->
        <div class="payment-selection-section">
            <h4>💳 Accepted Payment Methods</h4>
            <div class="payment-checkboxes" id="paymentCheckboxes">
                <!-- Payment methods will be loaded here -->
            </div>
        </div>

        <!-- Contact Methods Selection -->
        <div class="contact-selection-section">
            <h4>📞 Contact Options</h4>
            <div class="contact-checkboxes" id="contactCheckboxes">
                <!-- Contact methods will be loaded here -->
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
            <button onclick="cancelEnhancedProductForm()" class="btn-secondary">Cancel</button>
            <button onclick="saveEnhancedProduct()" class="btn-primary">Create Product</button>
        </div>
    `;
    
    return form;
}

// Load categories for enhanced product
async function loadCategoriesForEnhancedProduct() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('enhancedProductCategory');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>';
            data.forEach(category => {
                select.innerHTML += `<option value="${category.id}">${category.title}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load buttons for enhanced product
async function loadButtonsForEnhancedProduct() {
    const categoryId = document.getElementById('enhancedProductCategory').value;
    const buttonSelect = document.getElementById('enhancedProductButton');
    
    if (!categoryId) {
        buttonSelect.innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        buttonSelect.innerHTML = '<option value="">Select Button</option>';
        data.forEach(button => {
            buttonSelect.innerHTML += `<option value="${button.id}">${button.name}</option>`;
        });
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

// Load payment and contact methods
async function loadPaymentAndContactMethods() {
    try {
        // Load payment methods
        const { data: payments, error: paymentError } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        if (paymentError) throw paymentError;

        const paymentContainer = document.getElementById('paymentCheckboxes');
        if (paymentContainer) {
            paymentContainer.innerHTML = '';
            payments.forEach(payment => {
                const checkbox = document.createElement('div');
                checkbox.className = 'checkbox-item';
                checkbox.innerHTML = `
                    <label>
                        <input type="checkbox" value="${payment.id}" onchange="updateSelectedPayments()">
                        <img src="${payment.icon_url}" alt="${payment.name}" class="method-icon">
                        <span>${payment.name}</span>
                    </label>
                `;
                paymentContainer.appendChild(checkbox);
            });
        }

        // Load contact methods
        const { data: contacts, error: contactError } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        if (contactError) throw contactError;

        const contactContainer = document.getElementById('contactCheckboxes');
        if (contactContainer) {
            contactContainer.innerHTML = '';
            contacts.forEach(contact => {
                const checkbox = document.createElement('div');
                checkbox.className = 'checkbox-item';
                checkbox.innerHTML = `
                    <label>
                        <input type="checkbox" value="${contact.id}" onchange="updateSelectedContacts()">
                        <img src="${contact.icon_url}" alt="${contact.name}" class="method-icon">
                        <span>${contact.name}</span>
                    </label>
                `;
                contactContainer.appendChild(checkbox);
            });
        }
    } catch (error) {
        console.error('Error loading payment/contact methods:', error);
    }
}

// Handle image upload
function handleImageUpload() {
    const files = document.getElementById('enhancedProductImages').files;
    uploadedImages = [];
    totalImageSize = 0;
    
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';

    // Check each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check single file size (10MB limit)
        if (file.size > MAX_SINGLE_IMAGE_SIZE) {
            alert(`File "${file.name}" is too large. Maximum size per file is 10MB.`);
            continue;
        }

        uploadedImages.push(file);
        totalImageSize += file.size;

        // Create preview
        const preview = document.createElement('div');
        preview.className = 'image-preview-item';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (file.type.startsWith('video/')) {
                preview.innerHTML = `
                    <video controls>
                        <source src="${e.target.result}" type="${file.type}">
                    </video>
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)}MB</span>
                    </div>
                    <button class="remove-image" onclick="removeUploadedImage(${i})">×</button>
                `;
            } else {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)}MB</span>
                    </div>
                    <button class="remove-image" onclick="removeUploadedImage(${i})">×</button>
                `;
            }
        };
        reader.readAsDataURL(file);
        
        container.appendChild(preview);
    }

    updateSizeIndicator();
    updatePricePreview();
}

// Remove uploaded image
function removeUploadedImage(index) {
    if (uploadedImages[index]) {
        totalImageSize -= uploadedImages[index].size;
        uploadedImages.splice(index, 1);
        
        // Rebuild preview
        const container = document.getElementById('imagePreviewContainer');
        container.innerHTML = '';
        
        uploadedImages.forEach((file, i) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview-item';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (file.type.startsWith('video/')) {
                    preview.innerHTML = `
                        <video controls>
                            <source src="${e.target.result}" type="${file.type}">
                        </video>
                        <div class="file-info">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)}MB</span>
                        </div>
                        <button class="remove-image" onclick="removeUploadedImage(${i})">×</button>
                    `;
                } else {
                    preview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <div class="file-info">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)}MB</span>
                        </div>
                        <button class="remove-image" onclick="removeUploadedImage(${i})">×</button>
                    `;
                }
            };
            reader.readAsDataURL(file);
            container.appendChild(preview);
        });
        
        updateSizeIndicator();
    }
}

// Clear all images
function clearAllImages() {
    uploadedImages = [];
    totalImageSize = 0;
    document.getElementById('imagePreviewContainer').innerHTML = '';
    document.getElementById('enhancedProductImages').value = '';
    updateSizeIndicator();
}

// Update size indicator
function updateSizeIndicator() {
    const indicator = document.getElementById('sizeIndicator');
    const progress = document.getElementById('sizeProgress');
    const sizeText = indicator.querySelector('.size-text');
    
    const totalMB = totalImageSize / (1024 * 1024);
    const percentage = (totalImageSize / MAX_TOTAL_SIZE) * 100;
    
    sizeText.textContent = `Total size: ${totalMB.toFixed(2)}MB / 50MB`;
    progress.style.width = `${Math.min(percentage, 100)}%`;
    
    if (totalImageSize > MAX_TOTAL_SIZE) {
        indicator.classList.add('size-exceeded');
        sizeText.textContent += ` (${(totalMB - 50).toFixed(2)}MB over limit)`;
    } else {
        indicator.classList.remove('size-exceeded');
        indicator.classList.add('size-good');
    }
}

// Update selected payments
function updateSelectedPayments() {
    const checkboxes = document.querySelectorAll('#paymentCheckboxes input[type="checkbox"]:checked');
    selectedPaymentMethods = Array.from(checkboxes).map(cb => parseInt(cb.value));
}

// Update selected contacts
function updateSelectedContacts() {
    const checkboxes = document.querySelectorAll('#contactCheckboxes input[type="checkbox"]:checked');
    selectedContacts = Array.from(checkboxes).map(cb => parseInt(cb.value));
}

// Update price preview
function updatePricePreview() {
    const price = parseFloat(document.getElementById('enhancedProductPrice')?.value || 0);
    const discount = parseFloat(document.getElementById('enhancedProductDiscount')?.value || 0);
    const currency = document.getElementById('enhancedProductCurrency')?.value || '';
    
    let finalPrice = price;
    if (discount > 0) {
        finalPrice = price * (1 - discount / 100);
    }
    
    const display = document.getElementById('finalPriceDisplay');
    if (display) {
        if (discount > 0) {
            display.innerHTML = `
                <span class="original-price">${price} ${currency}</span>
                <span class="final-price">${finalPrice.toFixed(2)} ${currency}</span>
                <span class="discount-info">(${discount}% off)</span>
            `;
        } else {
            display.innerHTML = `<span class="final-price">${price} ${currency}</span>`;
        }
    }
}

// Add event listeners for price preview
document.addEventListener('input', (e) => {
    if (e.target.id === 'enhancedProductPrice' || 
        e.target.id === 'enhancedProductDiscount' || 
        e.target.id === 'enhancedProductCurrency') {
        updatePricePreview();
    }
});

// Save enhanced product
async function saveEnhancedProduct() {
    // Validation
    const buttonId = document.getElementById('enhancedProductButton').value;
    const name = document.getElementById('enhancedProductName').value.trim();
    const price = parseFloat(document.getElementById('enhancedProductPrice').value);
    const currency = document.getElementById('enhancedProductCurrency').value.trim();

    if (!buttonId || !name || !price || !currency) {
        alert('Please fill in all required fields (Category Button, Name, Price, Currency)');
        return;
    }

    if (totalImageSize > MAX_TOTAL_SIZE) {
        alert(`Total image size (${(totalImageSize / (1024 * 1024)).toFixed(2)}MB) exceeds the 50MB limit. Please remove some images.`);
        return;
    }

    showLoading();

    try {
        // Upload images first
        const imageUrls = [];
        for (const file of uploadedImages) {
            const url = await uploadFile(file, 'enhanced-products');
            if (url) {
                imageUrls.push(url);
            }
        }

        // Prepare product data
        const productData = {
            button_id: parseInt(buttonId),
            name: name,
            description: document.getElementById('enhancedProductDescription').value.trim() || null,
            price: price,
            currency: currency,
            discount_percentage: parseFloat(document.getElementById('enhancedProductDiscount').value) || null,
            stock_quantity: parseInt(document.getElementById('enhancedProductStock').value) || null,
            product_type: document.getElementById('enhancedProductType').value.trim() || null,
            product_level: document.getElementById('enhancedProductLevel').value.trim() || null,
            product_id: document.getElementById('enhancedProductId').value.trim() || null,
            delivery_time: document.getElementById('enhancedProductDelivery').value.trim() || null,
            images: JSON.stringify(imageUrls),
            payment_methods: JSON.stringify(selectedPaymentMethods),
            contacts: JSON.stringify(selectedContacts),
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('enhanced_products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        alert('✅ Enhanced product created successfully!');
        
        // Reset form
        cancelEnhancedProductForm();
        
        // Reload products
        await loadEnhancedProducts();

    } catch (error) {
        hideLoading();
        console.error('❌ Error saving enhanced product:', error);
        alert('Error creating product: ' + error.message);
    }
}

// Cancel enhanced product form
function cancelEnhancedProductForm() {
    const form = document.querySelector('.enhanced-product-form');
    if (form) {
        form.remove();
    }
    
    // Reset global variables
    uploadedImages = [];
    totalImageSize = 0;
    selectedPaymentMethods = [];
    selectedContacts = [];
    
    // Show create button again
    const createBtn = document.getElementById('createEnhancedProductBtn');
    if (createBtn) {
        createBtn.style.display = 'block';
    }
}

// Delete enhanced product
async function deleteEnhancedProduct(productId) {
    if (!confirm('Are you sure you want to delete this enhanced product?')) return;

    showLoading();

    try {
        const { error } = await supabase
            .from('enhanced_products')
            .delete()
            .eq('id', productId);

        if (error) throw error;

        hideLoading();
        alert('✅ Enhanced product deleted successfully!');
        await loadEnhancedProducts();

    } catch (error) {
        hideLoading();
        console.error('❌ Error deleting enhanced product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

// Show enhanced product creation form
function showEnhancedProductForm() {
    const container = document.getElementById('enhancedProductsContainer');
    if (!container) return;

    // Hide create button
    const createBtn = document.getElementById('createEnhancedProductBtn');
    if (createBtn) {
        createBtn.style.display = 'none';
    }

    // Add form to container
    const form = createEnhancedProductForm();
    container.insertBefore(form, container.firstChild);

    // Load necessary data
    loadCategoriesForEnhancedProduct();
    loadPaymentAndContactMethods();
}

// ==================== PRODUCT BANNERS SYSTEM ====================

let productBannersData = [];

// Load Product Banners
async function loadProductBanners() {
    try {
        const { data, error } = await supabase
            .from('product_banners')
            .select(`
                *,
                categories (name),
                category_buttons (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        productBannersData = data || [];
        displayProductBanners(productBannersData);
    } catch (error) {
        console.error('❌ Error loading product banners:', error);
    }
}

function displayProductBanners(banners) {
    const container = document.getElementById('productBannersContainer');
    if (!container) return;

    container.innerHTML = '';

    if (banners.length === 0) {
        container.innerHTML = '<p class="no-data">No product banners yet. Create banners for specific category pages!</p>';
        return;
    }

    banners.forEach(banner => {
        const card = document.createElement('div');
        card.className = 'product-banner-card';
        card.innerHTML = `
            <div class="banner-image">
                <img src="${banner.banner_url}" alt="Product Banner">
            </div>
            <div class="banner-info">
                <h4>Category: ${banner.categories?.name || 'Unknown'}</h4>
                <p>Button: ${banner.category_buttons?.name || 'Unknown'}</p>
                <p class="banner-date">Created: ${new Date(banner.created_at).toLocaleDateString()}</p>
                <div class="banner-actions">
                    <button onclick="deleteProductBanner(${banner.id})" class="btn-danger">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Add Product Banner
async function addProductBanner() {
    const categoryId = document.getElementById('productBannerCategory').value;
    const buttonId = document.getElementById('productBannerButton').value;
    const file = document.getElementById('productBannerFile').files[0];

    if (!categoryId || !buttonId || !file) {
        alert('Please select category, button, and banner image');
        return;
    }

    showLoading();

    try {
        // Upload image
        const imageUrl = await uploadFile(file, 'product-banners');
        if (!imageUrl) {
            throw new Error('Failed to upload image');
        }

        // Save to database
        const { data, error } = await supabase
            .from('product_banners')
            .insert([{
                category_id: parseInt(categoryId),
                button_id: parseInt(buttonId),
                banner_url: imageUrl,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        alert('✅ Product banner added successfully!');
        
        // Reset form
        document.getElementById('productBannerCategory').value = '';
        document.getElementById('productBannerButton').value = '';
        document.getElementById('productBannerFile').value = '';
        
        // Reload banners
        await loadProductBanners();

    } catch (error) {
        hideLoading();
        console.error('❌ Error adding product banner:', error);
        alert('Error adding banner: ' + error.message);
    }
}

// Delete Product Banner
async function deleteProductBanner(bannerId) {
    if (!confirm('Are you sure you want to delete this product banner?')) return;

    showLoading();

    try {
        const { error } = await supabase
            .from('product_banners')
            .delete()
            .eq('id', bannerId);

        if (error) throw error;

        hideLoading();
        alert('✅ Product banner deleted successfully!');
        await loadProductBanners();

    } catch (error) {
        hideLoading();
        console.error('❌ Error deleting product banner:', error);
        alert('Error deleting banner: ' + error.message);
    }
}

// Load buttons for product banners
async function loadButtonsForProductBanners() {
    const categoryId = document.getElementById('productBannerCategory').value;
    const buttonSelect = document.getElementById('productBannerButton');
    
    if (!categoryId) {
        buttonSelect.innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        buttonSelect.innerHTML = '<option value="">Select Button</option>';
        data.forEach(button => {
            buttonSelect.innerHTML += `<option value="${button.id}">${button.name}</option>`;
        });
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

// ==================== PRODUCT DESCRIPTIONS SYSTEM ====================

let productDescriptionsData = [];

// Load Product Descriptions
async function loadProductDescriptions() {
    try {
        const { data, error } = await supabase
            .from('product_descriptions')
            .select(`
                *,
                categories (name),
                category_buttons (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        productDescriptionsData = data || [];
        displayProductDescriptions(productDescriptionsData);
    } catch (error) {
        console.error('❌ Error loading product descriptions:', error);
    }
}

function displayProductDescriptions(descriptions) {
    const container = document.getElementById('productDescriptionsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (descriptions.length === 0) {
        container.innerHTML = '<p class="no-data">No product descriptions yet. Add rich content for your category pages!</p>';
        return;
    }

    descriptions.forEach(desc => {
        const card = document.createElement('div');
        card.className = 'product-description-card';
        card.innerHTML = `
            <div class="description-preview">
                <div class="description-content">${renderAnimatedText(desc.content.substring(0, 200))}${desc.content.length > 200 ? '...' : ''}</div>
            </div>
            <div class="description-info">
                <h4>Category: ${desc.categories?.name || 'Unknown'}</h4>
                <p>Button: ${desc.category_buttons?.name || 'Unknown'}</p>
                <p class="description-date">Created: ${new Date(desc.created_at).toLocaleDateString()}</p>
                <div class="description-actions">
                    <button onclick="editProductDescription(${desc.id})" class="btn-secondary">Edit</button>
                    <button onclick="deleteProductDescription(${desc.id})" class="btn-danger">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Add Product Description
async function addProductDescription() {
    const categoryId = document.getElementById('productDescriptionCategory').value;
    const buttonId = document.getElementById('productDescriptionButton').value;
    const content = document.getElementById('productDescriptionContent').value.trim();

    if (!categoryId || !buttonId || !content) {
        alert('Please fill in all fields');
        return;
    }

    showLoading();

    try {
        const { data, error } = await supabase
            .from('product_descriptions')
            .insert([{
                category_id: parseInt(categoryId),
                button_id: parseInt(buttonId),
                content: content,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        alert('✅ Product description added successfully!');
        
        // Reset form
        document.getElementById('productDescriptionCategory').value = '';
        document.getElementById('productDescriptionButton').value = '';
        document.getElementById('productDescriptionContent').value = '';
        
        // Reload descriptions
        await loadProductDescriptions();

    } catch (error) {
        hideLoading();
        console.error('❌ Error adding product description:', error);
        alert('Error adding description: ' + error.message);
    }
}

// Delete Product Description
async function deleteProductDescription(descId) {
    if (!confirm('Are you sure you want to delete this product description?')) return;

    showLoading();

    try {
        const { error } = await supabase
            .from('product_descriptions')
            .delete()
            .eq('id', descId);

        if (error) throw error;

        hideLoading();
        alert('✅ Product description deleted successfully!');
        await loadProductDescriptions();

    } catch (error) {
        hideLoading();
        console.error('❌ Error deleting product description:', error);
        alert('Error deleting description: ' + error.message);
    }
}

// Load buttons for product descriptions
async function loadButtonsForProductDescriptions() {
    const categoryId = document.getElementById('productDescriptionCategory').value;
    const buttonSelect = document.getElementById('productDescriptionButton');
    
    if (!categoryId) {
        buttonSelect.innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        buttonSelect.innerHTML = '<option value="">Select Button</option>';
        data.forEach(button => {
            buttonSelect.innerHTML += `<option value="${button.id}">${button.name}</option>`;
        });
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

// ==================== CATEGORY ADS SYSTEM ====================

let categoryAdsData = [];

// Load Category Ads
async function loadCategoryAds() {
    try {
        const { data, error } = await supabase
            .from('category_ads')
            .select(`
                *,
                categories (name),
                category_buttons (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        categoryAdsData = data || [];
        displayCategoryAds(categoryAdsData);
    } catch (error) {
        console.error('❌ Error loading category ads:', error);
    }
}

function displayCategoryAds(ads) {
    const container = document.getElementById('categoryAdsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (ads.length === 0) {
        container.innerHTML = '<p class="no-data">No category ads yet. Add script-based advertisements for your product pages!</p>';
        return;
    }

    ads.forEach(ad => {
        const card = document.createElement('div');
        card.className = 'category-ad-card';
        card.innerHTML = `
            <div class="ad-info">
                <h4>${ad.ad_size || 'Custom Size'}</h4>
                <p>Category: ${ad.categories?.name || 'Unknown'}</p>
                <p>Button: ${ad.category_buttons?.name || 'Unknown'}</p>
                <div class="script-preview">
                    <code>${ad.script_code.substring(0, 100)}${ad.script_code.length > 100 ? '...' : ''}</code>
                </div>
                <p class="ad-date">Created: ${new Date(ad.created_at).toLocaleDateString()}</p>
                <div class="ad-actions">
                    <button onclick="editCategoryAd(${ad.id})" class="btn-secondary">Edit</button>
                    <button onclick="deleteCategoryAd(${ad.id})" class="btn-danger">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Add Category Ad
async function addCategoryAd() {
    const categoryId = document.getElementById('categoryAdCategory').value;
    const buttonId = document.getElementById('categoryAdButton').value;
    const adSize = document.getElementById('categoryAdSize').value.trim();
    const scriptCode = document.getElementById('categoryAdScript').value.trim();

    if (!categoryId || !buttonId || !adSize || !scriptCode) {
        alert('Please fill in all fields');
        return;
    }

    // Basic script validation
    if (!scriptCode.includes('<script')) {
        alert('Please enter a valid script code that includes <script> tags');
        return;
    }

    showLoading();

    try {
        const { data, error } = await supabase
            .from('category_ads')
            .insert([{
                category_id: parseInt(categoryId),
                button_id: parseInt(buttonId),
                ad_size: adSize,
                script_code: scriptCode,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        alert('✅ Category ad added successfully!');
        
        // Reset form
        document.getElementById('categoryAdCategory').value = '';
        document.getElementById('categoryAdButton').value = '';
        document.getElementById('categoryAdSize').value = '';
        document.getElementById('categoryAdScript').value = '';
        
        // Reload ads
        await loadCategoryAds();

    } catch (error) {
        hideLoading();
        console.error('❌ Error adding category ad:', error);
        alert('Error adding ad: ' + error.message);
    }
}

// Delete Category Ad
async function deleteCategoryAd(adId) {
    if (!confirm('Are you sure you want to delete this category ad?')) return;

    showLoading();

    try {
        const { error } = await supabase
            .from('category_ads')
            .delete()
            .eq('id', adId);

        if (error) throw error;

        hideLoading();
        alert('✅ Category ad deleted successfully!');
        await loadCategoryAds();

    } catch (error) {
        hideLoading();
        console.error('❌ Error deleting category ad:', error);
        alert('Error deleting ad: ' + error.message);
    }
}

// Load buttons for category ads
async function loadButtonsForCategoryAds() {
    const categoryId = document.getElementById('categoryAdCategory').value;
    const buttonSelect = document.getElementById('categoryAdButton');
    
    if (!categoryId) {
        buttonSelect.innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        buttonSelect.innerHTML = '<option value="">Select Button</option>';
        data.forEach(button => {
            buttonSelect.innerHTML += `<option value="${button.id}">${button.name}</option>`;
        });
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

// ==================== ENHANCED ORDERS MANAGEMENT ====================

// Load Enhanced Orders
async function loadEnhancedOrders() {
    try {
        const { data, error } = await supabase
            .from('enhanced_orders')
            .select(`
                *,
                users (name, email),
                enhanced_products (name, currency),
                payment_methods (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayEnhancedOrders(data || []);
    } catch (error) {
        console.error('❌ Error loading enhanced orders:', error);
    }
}

function displayEnhancedOrders(orders) {
    const container = document.getElementById('enhancedOrdersContainer');
    if (!container) return;

    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = '<p class="no-data">No enhanced orders yet.</p>';
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = `enhanced-order-card ${order.status}`;
        
        let statusIcon = '⏳';
        if (order.status === 'approved') statusIcon = '✅';
        if (order.status === 'rejected') statusIcon = '❌';

        card.innerHTML = `
            <div class="order-header">
                <div class="order-status ${order.status}">${statusIcon} ${order.status.toUpperCase()}</div>
                <div class="order-id">#${order.id}</div>
            </div>
            <div class="order-details">
                <h4>${order.enhanced_products?.name || 'Unknown Product'}</h4>
                <p><strong>Customer:</strong> ${order.users?.name} (${order.users?.email})</p>
                <p><strong>Price:</strong> ${order.final_price} ${order.currency}</p>
                <p><strong>Payment:</strong> ${order.payment_methods?.name}</p>
                <p><strong>Transaction:</strong> ${order.transaction_code}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                ${order.admin_message ? `<div class="admin-message"><strong>Admin Message:</strong> ${order.admin_message}</div>` : ''}
            </div>
            <div class="order-actions">
                ${order.status === 'pending' ? `
                    <button onclick="updateEnhancedOrderStatus(${order.id}, 'approved')" class="btn-success">Approve</button>
                    <button onclick="updateEnhancedOrderStatus(${order.id}, 'rejected')" class="btn-danger">Reject</button>
                ` : ''}
                <button onclick="addEnhancedOrderMessage(${order.id})" class="btn-secondary">Add Message</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Update Enhanced Order Status
async function updateEnhancedOrderStatus(orderId, status) {
    const message = prompt(`Enter a message for this ${status} order (optional):`);
    
    showLoading();

    try {
        const updateData = {
            status: status,
            updated_at: new Date().toISOString()
        };

        if (message && message.trim()) {
            updateData.admin_message = message.trim();
        }

        const { error } = await supabase
            .from('enhanced_orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) throw error;

        hideLoading();
        alert(`✅ Order ${status} successfully!`);
        await loadEnhancedOrders();

    } catch (error) {
        hideLoading();
        console.error('❌ Error updating order status:', error);
        alert('Error updating order status: ' + error.message);
    }
}

// Add Enhanced Order Message
async function addEnhancedOrderMessage(orderId) {
    const message = prompt('Enter message for this order:');
    if (!message || !message.trim()) return;

    showLoading();

    try {
        const { error } = await supabase
            .from('enhanced_orders')
            .update({
                admin_message: message.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) throw error;

        hideLoading();
        alert('✅ Message added successfully!');
        await loadEnhancedOrders();

    } catch (error) {
        hideLoading();
        console.error('❌ Error adding message:', error);
        alert('Error adding message: ' + error.message);
    }
}

// ==================== PANEL INTEGRATION ====================

// Extend the main switchSection function to handle new sections
const originalSwitchSection = window.switchSection;
window.switchSection = function(sectionName) {
    // Call original function
    if (originalSwitchSection) {
        originalSwitchSection(sectionName);
    }

    // Handle new sections
    switch(sectionName) {
        case 'enhanced-products':
            loadEnhancedProducts();
            break;
        case 'product-banners':
            loadProductBanners();
            loadCategoriesForProductBanners();
            break;
        case 'product-descriptions':
            loadProductDescriptions();
            loadCategoriesForProductDescriptions();
            break;
        case 'category-ads':
            loadCategoryAds();
            loadCategoriesForCategoryAds();
            break;
    }
};

// Load categories for various sections
async function loadCategoriesForProductBanners() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('productBannerCategory');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>';
            data.forEach(category => {
                select.innerHTML += `<option value="${category.id}">${category.title}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadCategoriesForProductDescriptions() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('productDescriptionCategory');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>';
            data.forEach(category => {
                select.innerHTML += `<option value="${category.id}">${category.title}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadCategoriesForCategoryAds() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('categoryAdCategory');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>';
            data.forEach(category => {
                select.innerHTML += `<option value="${category.id}">${category.title}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Add HTML sections when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add Enhanced Products Section
    const enhancedProductsSection = document.createElement('section');
    enhancedProductsSection.id = 'enhanced-products';
    enhancedProductsSection.className = 'content-section';
    enhancedProductsSection.innerHTML = `
        <div class="section-header">
            <h2>⭐ Enhanced Products Management</h2>
            <p>Create advanced products with multiple images, payment options, and rich features</p>
        </div>
        
        <div class="action-card">
            <button id="createEnhancedProductBtn" onclick="showEnhancedProductForm()" class="btn-primary">
                ➕ Create Enhanced Product
            </button>
        </div>

        <div class="enhanced-products-grid" id="enhancedProductsContainer">
            <!-- Enhanced products will be loaded here -->
        </div>
    `;

    // Add Product Banners Section
    const productBannersSection = document.createElement('section');
    productBannersSection.id = 'product-banners';
    productBannersSection.className = 'content-section';
    productBannersSection.innerHTML = `
        <div class="section-header">
            <h2>🎨 Product Banners Management</h2>
            <p>Add specific banners for category product pages</p>
        </div>
        
        <div class="action-card">
            <h3>Add Product Banner</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <select id="productBannerCategory" onchange="loadButtonsForProductBanners()">
                        <option value="">Select Category</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Category Button</label>
                    <select id="productBannerButton">
                        <option value="">Select Button</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Banner Image</label>
                <input type="file" id="productBannerFile" accept="image/*">
            </div>
            <button onclick="addProductBanner()" class="btn-primary">Add Banner</button>
        </div>

        <div class="product-banners-grid" id="productBannersContainer">
            <!-- Product banners will be loaded here -->
        </div>
    `;

    // Add Product Descriptions Section
    const productDescriptionsSection = document.createElement('section');
    productDescriptionsSection.id = 'product-descriptions';
    productDescriptionsSection.className = 'content-section';
    productDescriptionsSection.innerHTML = `
        <div class="section-header">
            <h2>📄 Product Descriptions Management</h2>
            <p>Add rich text content for category product pages</p>
        </div>
        
        <div class="action-card">
            <h3>Add Product Description</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <select id="productDescriptionCategory" onchange="loadButtonsForProductDescriptions()">
                        <option value="">Select Category</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Category Button</label>
                    <select id="productDescriptionButton">
                        <option value="">Select Button</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Content</label>
                <div class="textarea-with-emoji">
                    <textarea id="productDescriptionContent" placeholder="Enter rich text content for this category page" rows="5"></textarea>
                    <button class="emoji-picker-btn" onclick="openEmojiPicker('productDescriptionContent')">😀</button>
                </div>
            </div>
            <button onclick="addProductDescription()" class="btn-primary">Add Description</button>
        </div>

        <div class="product-descriptions-grid" id="productDescriptionsContainer">
            <!-- Product descriptions will be loaded here -->
        </div>
    `;

    // Add Category Ads Section
    const categoryAdsSection = document.createElement('section');
    categoryAdsSection.id = 'category-ads';
    categoryAdsSection.className = 'content-section';
    categoryAdsSection.innerHTML = `
        <div class="section-header">
            <h2>📺 Category Ads Management</h2>
            <p>Add script-based advertisements for category product pages</p>
        </div>
        
        <div class="action-card">
            <h3>Add Category Ad</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <select id="categoryAdCategory" onchange="loadButtonsForCategoryAds()">
                        <option value="">Select Category</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Category Button</label>
                    <select id="categoryAdButton">
                        <option value="">Select Button</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Ad Size</label>
                <input type="text" id="categoryAdSize" placeholder="e.g. 160x300, 728x90, 300x250">
            </div>
            <div class="form-group">
                <label>Script Code</label>
                <textarea id="categoryAdScript" placeholder="Paste your ad script code here (must include <script> tags)" rows="8"></textarea>
                <small class="form-help">Paste the complete script code from your ad provider (Google AdSense, etc.)</small>
            </div>
            <button onclick="addCategoryAd()" class="btn-primary">Add Ad</button>
        </div>

        <div class="category-ads-grid" id="categoryAdsContainer">
            <!-- Category ads will be loaded here -->
        </div>
    `;

    // Insert sections into main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.appendChild(enhancedProductsSection);
        mainContent.appendChild(productBannersSection);
        mainContent.appendChild(productDescriptionsSection); 
        mainContent.appendChild(categoryAdsSection);
    }
});

// Enhanced orders integration with existing orders system
const originalLoadOrders = window.loadOrders;
window.loadOrders = async function() {
    // Load regular orders
    if (originalLoadOrders) {
        await originalLoadOrders();
    }
    
    // Load enhanced orders
    await loadEnhancedOrders();
    
    // Combine display (you might want to modify this based on your UI)
};

console.log('✅ Enhanced Products Panel loaded successfully');
