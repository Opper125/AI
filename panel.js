
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
        const container = document.getElementById('enhancedProductsContainer');
        if (container) {
            container.innerHTML = '<p class="error-message">Error loading products. Please refresh the page.</p>';
        }
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
                    <button onclick="viewEnhancedProductDetails(${product.id})" class="btn-info">View</button>
                    <button onclick="editEnhancedProduct(${product.id})" class="btn-secondary">Edit</button>
                    <button onclick="deleteEnhancedProduct(${product.id})" class="btn-danger">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// View Enhanced Product Details
async function viewEnhancedProductDetails(productId) {
    const product = enhancedProductsData.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }

    const modal = document.getElementById('productDetailsModal') || createProductDetailsModal();
    const content = modal.querySelector('.modal-content');

    const images = product.images ? JSON.parse(product.images) : [];
    const paymentMethods = product.payment_methods ? JSON.parse(product.payment_methods) : [];
    const contacts = product.contacts ? JSON.parse(product.contacts) : [];

    let finalPrice = product.price;
    if (product.discount_percentage && product.discount_percentage > 0) {
        finalPrice = product.price * (1 - product.discount_percentage / 100);
    }

    content.innerHTML = `
        <div class="enhanced-product-details">
            <h2>${product.name}</h2>
            
            <div class="product-images">
                ${images.length > 0 ? images.map(img => `<img src="${img}" alt="Product Image" style="max-width: 200px; margin: 5px;">`).join('') : '<p>No images</p>'}
            </div>
            
            <div class="product-info">
                <p><strong>Description:</strong> ${product.description || 'No description'}</p>
                <p><strong>Type:</strong> ${product.product_type || 'N/A'}</p>
                <p><strong>Level:</strong> ${product.product_level || 'N/A'}</p>
                <p><strong>Product ID:</strong> ${product.product_id || product.id}</p>
                <p><strong>Stock:</strong> ${product.stock_quantity || 'N/A'}</p>
                <p><strong>Delivery Time:</strong> ${product.delivery_time || 'N/A'}</p>
            </div>
            
            <div class="pricing-info">
                <p><strong>Original Price:</strong> ${product.price} ${product.currency}</p>
                ${product.discount_percentage ? `<p><strong>Discount:</strong> ${product.discount_percentage}%</p>` : ''}
                <p><strong>Final Price:</strong> ${finalPrice.toFixed(2)} ${product.currency}</p>
            </div>
            
            <div class="additional-info">
                <p><strong>Payment Methods:</strong> ${paymentMethods.length} selected</p>
                <p><strong>Contact Options:</strong> ${contacts.length} selected</p>
                <p><strong>Category:</strong> ${product.category_buttons?.categories?.name || 'N/A'}</p>
                <p><strong>Button:</strong> ${product.category_buttons?.name || 'N/A'}</p>
            </div>
            
            <button onclick="closeProductDetailsModal()" class="btn-secondary">Close</button>
        </div>
    `;

    modal.style.display = 'flex';
}

// Create Product Details Modal
function createProductDetailsModal() {
    const modal = document.createElement('div');
    modal.id = 'productDetailsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <!-- Content will be inserted here -->
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Close Product Details Modal
function closeProductDetailsModal() {
    const modal = document.getElementById('productDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Edit Enhanced Product
async function editEnhancedProduct(productId) {
    const product = enhancedProductsData.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }

    // Hide create button
    const createBtn = document.getElementById('createEnhancedProductBtn');
    if (createBtn) {
        createBtn.style.display = 'none';
    }

    // Create edit form
    const container = document.getElementById('enhancedProductsContainer');
    const form = createEnhancedProductForm();
    
    // Populate form with existing data
    setTimeout(() => {
        document.getElementById('enhancedProductName').value = product.name || '';
        document.getElementById('enhancedProductDescription').value = product.description || '';
        document.getElementById('enhancedProductPrice').value = product.price || '';
        document.getElementById('enhancedProductCurrency').value = product.currency || '';
        document.getElementById('enhancedProductDiscount').value = product.discount_percentage || '';
        document.getElementById('enhancedProductStock').value = product.stock_quantity || '';
        document.getElementById('enhancedProductType').value = product.product_type || '';
        document.getElementById('enhancedProductLevel').value = product.product_level || '';
        document.getElementById('enhancedProductId').value = product.product_id || '';
        document.getElementById('enhancedProductDelivery').value = product.delivery_time || '';

        // Load category and button
        if (product.category_buttons) {
            loadCategoriesForEnhancedProduct().then(() => {
                document.getElementById('enhancedProductCategory').value = product.category_buttons.categories?.id || '';
                loadButtonsForEnhancedProduct().then(() => {
                    document.getElementById('enhancedProductButton').value = product.button_id || '';
                });
            });
        }

        // Set payment methods and contacts
        if (product.payment_methods) {
            selectedPaymentMethods = JSON.parse(product.payment_methods);
        }
        if (product.contacts) {
            selectedContacts = JSON.parse(product.contacts);
        }

        loadPaymentAndContactMethods();
        updatePricePreview();

        // Change button text and action
        const submitBtn = document.querySelector('.form-actions .btn-primary');
        if (submitBtn) {
            submitBtn.textContent = 'Update Product';
            submitBtn.onclick = () => updateEnhancedProduct(productId);
        }
    }, 100);

    container.insertBefore(form, container.firstChild);
}

// Update Enhanced Product
async function updateEnhancedProduct(productId) {
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
        // Upload new images if any
        const imageUrls = [];
        for (const file of uploadedImages) {
            const url = await uploadFile(file, 'enhanced-products');
            if (url) {
                imageUrls.push(url);
            }
        }

        // Get existing product
        const existingProduct = enhancedProductsData.find(p => p.id === productId);
        
        // Merge existing images with new ones if no new images uploaded
        const finalImages = imageUrls.length > 0 ? imageUrls : 
            (existingProduct.images ? JSON.parse(existingProduct.images) : []);

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
            images: JSON.stringify(finalImages),
            payment_methods: JSON.stringify(selectedPaymentMethods),
            contacts: JSON.stringify(selectedContacts),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('enhanced_products')
            .update(productData)
            .eq('id', productId)
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        alert('✅ Enhanced product updated successfully!');
        
        // Reset form
        cancelEnhancedProductForm();
        
        // Reload products
        await loadEnhancedProducts();

    } catch (error) {
        hideLoading();
        console.error('❌ Error updating enhanced product:', error);
        alert('Error updating product: ' + error.message);
    }
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
                const isChecked = selectedPaymentMethods.includes(payment.id) ? 'checked' : '';
                checkbox.innerHTML = `
                    <label>
                        <input type="checkbox" value="${payment.id}" ${isChecked} onchange="updateSelectedPayments()">
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
                const isChecked = selectedContacts.includes(contact.id) ? 'checked' : '';
                checkbox.innerHTML = `
                    <label>
                        <input type="checkbox" value="${contact.id}" ${isChecked} onchange="updateSelectedContacts()">
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

// ==================== UTILITY FUNCTIONS ====================

// Render animated text (similar to other files)
function renderAnimatedText(text) {
    if (!text) return text;
    
    // Replace animation codes with HTML
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

// File upload function (if not available from main admin.js)
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

// Loading functions (if not available from main admin.js)
function showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

function hideLoading() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }, 500);
}

// ==================== INTEGRATION WITH MAIN ADMIN SYSTEM ====================

// Extend the main switchSection function to handle enhanced products
if (typeof window.switchSection === 'function') {
    const originalSwitchSection = window.switchSection;
    window.switchSection = function(sectionName) {
        // Call original function
        originalSwitchSection(sectionName);
        
        // Handle enhanced products section
        if (sectionName === 'enhanced-products') {
            loadEnhancedProducts();
        }
    };
} else {
    // If switchSection doesn't exist, create it
    window.switchSection = function(sectionName) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const navBtn = document.querySelector(`[data-section="${sectionName}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        // Handle enhanced products section
        if (sectionName === 'enhanced-products') {
            loadEnhancedProducts();
        }
    };
}

// Auto-load enhanced products when page loads if section is active
document.addEventListener('DOMContentLoaded', function() {
    const enhancedProductsSection = document.getElementById('enhanced-products');
    if (enhancedProductsSection && enhancedProductsSection.classList.contains('active')) {
        loadEnhancedProducts();
    }
});
