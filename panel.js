
// ==================== ENHANCED PRODUCTS SYSTEM ====================

// Global state for enhanced products
let selectedMediaFiles = [];
let totalFileSize = 0;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

// Load Enhanced Products
async function loadEnhancedProducts() {
    try {
        const { data, error } = await supabase
            .from('enhanced_products')
            .select(`
                *,
                categories (title),
                category_buttons (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('enhancedProductsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(product => {
                const nameHtml = renderAnimatedText(product.name);
                const descriptionHtml = renderAnimatedText(product.description || '');
                
                container.innerHTML += `
                    <div class="item-card enhanced-product-card">
                        <div class="product-header">
                            <h4>${nameHtml}</h4>
                            <span class="product-price">${product.current_price} ${product.currency_type}</span>
                        </div>
                        <div class="product-info">
                            <p><strong>Category:</strong> ${product.categories?.title || 'Unknown'}</p>
                            <p><strong>Button:</strong> ${product.category_buttons?.name || 'Unknown'}</p>
                            <p><strong>Stock:</strong> ${product.stock_quantity}</p>
                            ${product.sale_percentage > 0 ? `<p><strong>Sale:</strong> ${product.sale_percentage}% off</p>` : ''}
                            <p class="product-description">${descriptionHtml}</p>
                        </div>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="viewEnhancedProduct(${product.id})">View Details</button>
                            <button class="btn-secondary" onclick="editEnhancedProduct(${product.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteEnhancedProduct(${product.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No enhanced products yet</p>';
        }
    } catch (error) {
        console.error('Error loading enhanced products:', error);
    }
}

// Handle Enhanced Product Media Upload
function handleEnhancedProductMedia() {
    const fileInput = document.getElementById('enhancedProductMedia');
    const files = Array.from(fileInput.files);
    
    // Validate each file
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
            invalidFiles.push(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB - exceeds 10MB limit)`);
        } else {
            validFiles.push(file);
        }
    });
    
    if (invalidFiles.length > 0) {
        alert('The following files exceed the 10MB size limit and will be ignored:\n' + invalidFiles.join('\n'));
    }
    
    // Add valid files to selected files
    validFiles.forEach(file => {
        selectedMediaFiles.push(file);
    });
    
    // Check total size
    totalFileSize = selectedMediaFiles.reduce((total, file) => total + file.size, 0);
    
    if (totalFileSize > MAX_TOTAL_SIZE) {
        alert('Total file size exceeds 50MB limit. Please remove some files.');
        // Remove files that exceed the limit
        while (totalFileSize > MAX_TOTAL_SIZE && selectedMediaFiles.length > 0) {
            const removedFile = selectedMediaFiles.pop();
            totalFileSize -= removedFile.size;
        }
    }
    
    updateFileSizeDisplay();
    displayMediaPreviews();
    
    // Clear the input
    fileInput.value = '';
}

// Update file size display
function updateFileSizeDisplay() {
    const display = document.getElementById('totalFileSizeDisplay');
    const progressFill = document.getElementById('sizeProgressFill');
    const clearBtn = document.getElementById('clearAllMediaBtn');
    
    const totalMB = (totalFileSize / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_TOTAL_SIZE / (1024 * 1024)).toFixed(0);
    const percentage = (totalFileSize / MAX_TOTAL_SIZE) * 100;
    
    display.textContent = `Total Size: ${totalMB} MB / ${maxMB} MB`;
    progressFill.style.width = `${Math.min(percentage, 100)}%`;
    
    if (percentage > 80) {
        progressFill.style.backgroundColor = '#ef4444'; // Red
    } else if (percentage > 60) {
        progressFill.style.backgroundColor = '#f59e0b'; // Yellow
    } else {
        progressFill.style.backgroundColor = '#10b981'; // Green
    }
    
    clearBtn.style.display = selectedMediaFiles.length > 0 ? 'block' : 'none';
}

// Display media previews
function displayMediaPreviews() {
    const container = document.getElementById('mediaPreviewContainer');
    container.innerHTML = '';
    
    selectedMediaFiles.forEach((file, index) => {
        const preview = document.createElement('div');
        preview.className = 'media-preview-item';
        
        const isVideo = file.type.startsWith('video/');
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        
        if (isVideo) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.loop = true;
            video.autoplay = true;
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
            };
            
            preview.innerHTML = `
                <div class="media-preview-content">
                    ${video.outerHTML}
                    <div class="media-preview-info">
                        <p class="media-name">${file.name}</p>
                        <p class="media-size">${sizeMB} MB</p>
                        <p class="media-type">Video</p>
                    </div>
                    <button class="media-remove-btn" onclick="removeMediaFile(${index})">🗑️</button>
                </div>
            `;
        } else {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(img.src);
            };
            
            preview.innerHTML = `
                <div class="media-preview-content">
                    ${img.outerHTML}
                    <div class="media-preview-info">
                        <p class="media-name">${file.name}</p>
                        <p class="media-size">${sizeMB} MB</p>
                        <p class="media-type">Image</p>
                    </div>
                    <button class="media-remove-btn" onclick="removeMediaFile(${index})">🗑️</button>
                </div>
            `;
        }
        
        container.appendChild(preview);
    });
}

// Remove media file
function removeMediaFile(index) {
    if (index >= 0 && index < selectedMediaFiles.length) {
        totalFileSize -= selectedMediaFiles[index].size;
        selectedMediaFiles.splice(index, 1);
        updateFileSizeDisplay();
        displayMediaPreviews();
    }
}

// Clear all media files
function clearAllMedia() {
    if (confirm('Remove all selected media files?')) {
        selectedMediaFiles = [];
        totalFileSize = 0;
        updateFileSizeDisplay();
        displayMediaPreviews();
    }
}

// Create Enhanced Product
async function createEnhancedProduct() {
    // Collect form data
    const categoryId = document.getElementById('enhancedProductCategorySelect').value;
    const buttonId = document.getElementById('enhancedProductButtonSelect').value;
    const name = document.getElementById('enhancedProductName').value.trim();
    const description = document.getElementById('enhancedProductDescription').value.trim();
    const stockQuantity = parseInt(document.getElementById('enhancedProductStock').value) || 0;
    const originalPrice = parseInt(document.getElementById('enhancedProductOriginalPrice').value);
    const salePercentage = parseInt(document.getElementById('enhancedProductSalePercentage').value) || 0;
    const currencyType = document.getElementById('enhancedProductCurrency').value.trim();
    const productType = document.getElementById('enhancedProductType').value.trim();
    const productLevel = document.getElementById('enhancedProductLevel').value.trim();
    const customId = document.getElementById('enhancedProductCustomId').value.trim();
    const deliveryTime = document.getElementById('enhancedProductDeliveryTime').value.trim();
    
    // Validate required fields
    if (!categoryId || !buttonId || !name || !originalPrice) {
        alert('Please fill in all required fields (Category, Button, Name, Original Price)');
        return;
    }
    
    if (selectedMediaFiles.length === 0) {
        alert('Please upload at least one image or video');
        return;
    }
    
    // Collect selected payment methods
    const selectedPayments = Array.from(document.querySelectorAll('#enhancedProductPaymentMethods input:checked'))
        .map(checkbox => parseInt(checkbox.value));
    
    if (selectedPayments.length === 0) {
        alert('Please select at least one payment method');
        return;
    }
    
    // Collect selected contacts
    const selectedContacts = Array.from(document.querySelectorAll('#enhancedProductContacts input:checked'))
        .map(checkbox => parseInt(checkbox.value));
    
    if (selectedContacts.length === 0) {
        alert('Please select at least one contact method');
        return;
    }
    
    showLoading();
    
    try {
        // Upload media files first
        const mediaUploads = await Promise.all(
            selectedMediaFiles.map(async (file, index) => {
                const folder = file.type.startsWith('video/') ? 'enhanced-products/videos' : 'enhanced-products/images';
                const url = await uploadFile(file, folder);
                if (!url) throw new Error(`Failed to upload ${file.name}`);
                
                return {
                    media_url: url,
                    media_type: file.type.startsWith('video/') ? 'video' : 'image',
                    file_size: file.size,
                    upload_order: index
                };
            })
        );
        
        // Create the product
        const { data: product, error: productError } = await supabase
            .from('enhanced_products')
            .insert([{
                category_id: parseInt(categoryId),
                button_id: parseInt(buttonId),
                name: name,
                description: description,
                stock_quantity: stockQuantity,
                original_price: originalPrice,
                sale_percentage: salePercentage,
                currency_type: currencyType,
                product_type: productType,
                product_level: productLevel,
                custom_id: customId,
                delivery_time: deliveryTime
                // current_price will be calculated automatically by trigger
            }])
            .select()
            .single();
        
        if (productError) throw productError;
        
        // Insert media files
        const mediaInserts = mediaUploads.map(media => ({
            ...media,
            product_id: product.id
        }));
        
        const { error: mediaError } = await supabase
            .from('enhanced_product_media')
            .insert(mediaInserts);
        
        if (mediaError) throw mediaError;
        
        // Insert payment method relationships
        const paymentInserts = selectedPayments.map(paymentId => ({
            product_id: product.id,
            payment_method_id: paymentId
        }));
        
        const { error: paymentError } = await supabase
            .from('enhanced_product_payments')
            .insert(paymentInserts);
        
        if (paymentError) throw paymentError;
        
        // Insert contact relationships
        const contactInserts = selectedContacts.map(contactId => ({
            product_id: product.id,
            contact_id: contactId
        }));
        
        const { error: contactError } = await supabase
            .from('enhanced_product_contacts')
            .insert(contactInserts);
        
        if (contactError) throw contactError;
        
        hideLoading();
        alert('✨ Enhanced Product created successfully!');
        
        // Reset form
        resetEnhancedProductForm();
        
        // Reload products
        await loadEnhancedProducts();
        
    } catch (error) {
        hideLoading();
        console.error('Error creating enhanced product:', error);
        alert('Error creating product: ' + error.message);
    }
}

// Reset Enhanced Product Form
function resetEnhancedProductForm() {
    document.getElementById('enhancedProductCategorySelect').value = '';
    document.getElementById('enhancedProductButtonSelect').value = '';
    document.getElementById('enhancedProductName').value = '';
    document.getElementById('enhancedProductDescription').value = '';
    document.getElementById('enhancedProductStock').value = '';
    document.getElementById('enhancedProductOriginalPrice').value = '';
    document.getElementById('enhancedProductSalePercentage').value = '';
    document.getElementById('enhancedProductCurrency').value = 'MMK';
    document.getElementById('enhancedProductType').value = '';
    document.getElementById('enhancedProductLevel').value = '';
    document.getElementById('enhancedProductCustomId').value = '';
    document.getElementById('enhancedProductDeliveryTime').value = '';
    
    // Clear checkboxes
    document.querySelectorAll('#enhancedProductPaymentMethods input').forEach(cb => cb.checked = false);
    document.querySelectorAll('#enhancedProductContacts input').forEach(cb => cb.checked = false);
    
    // Clear media
    selectedMediaFiles = [];
    totalFileSize = 0;
    updateFileSizeDisplay();
    displayMediaPreviews();
}

// View Enhanced Product Details
async function viewEnhancedProduct(productId) {
    try {
        const { data, error } = await supabase
            .rpc('get_enhanced_products_with_details', { p_button_id: null })
            .then(result => {
                if (result.error) throw result.error;
                const products = result.data || [];
                return { data: products.find(p => p.id === productId), error: null };
            });
        
        if (error) throw error;
        
        if (!data) {
            alert('Product not found');
            return;
        }
        
        const modalBody = document.getElementById('enhancedProductModalBody');
        
        // Prepare media gallery
        let mediaGallery = '';
        if (data.media && data.media.length > 0) {
            mediaGallery = `
                <div class="product-media-gallery">
                    <h4>Product Media</h4>
                    <div class="media-grid">
                        ${data.media.map(media => {
                            if (media.type === 'video') {
                                return `<video controls><source src="${media.url}" type="video/mp4"></video>`;
                            } else {
                                return `<img src="${media.url}" alt="Product Image">`;
                            }
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // Prepare payment methods
        let paymentMethods = '';
        if (data.payment_methods && data.payment_methods.length > 0) {
            paymentMethods = `
                <div class="product-payments">
                    <h4>Payment Methods</h4>
                    <div class="payment-list">
                        ${data.payment_methods.map(payment => `
                            <div class="payment-item">
                                <img src="${payment.icon_url}" alt="${payment.name}" width="24" height="24">
                                <span>${payment.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Prepare contacts
        let contacts = '';
        if (data.contacts && data.contacts.length > 0) {
            contacts = `
                <div class="product-contacts">
                    <h4>Contact Methods</h4>
                    <div class="contact-list">
                        ${data.contacts.map(contact => `
                            <div class="contact-item">
                                <img src="${contact.icon_url}" alt="${contact.name}" width="24" height="24">
                                <span>${contact.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        modalBody.innerHTML = `
            <div class="enhanced-product-details">
                <div class="product-basic-info">
                    <h3>${renderAnimatedText(data.name)}</h3>
                    <p class="product-description">${renderAnimatedText(data.description || '')}</p>
                </div>
                
                <div class="product-pricing">
                    <div class="price-info">
                        <span class="current-price">${data.current_price} ${data.currency_type}</span>
                        ${data.sale_percentage > 0 ? `
                            <span class="original-price">${data.original_price} ${data.currency_type}</span>
                            <span class="sale-badge">${data.sale_percentage}% OFF</span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="product-details-grid">
                    <div class="detail-item">
                        <label>Stock Quantity:</label>
                        <span>${data.stock_quantity}</span>
                    </div>
                    <div class="detail-item">
                        <label>Product Type:</label>
                        <span>${data.product_type || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Product Level:</label>
                        <span>${data.product_level || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Custom ID:</label>
                        <span>${data.custom_id || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Delivery Time:</label>
                        <span>${data.delivery_time || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Created:</label>
                        <span>${new Date(data.created_at).toLocaleString()}</span>
                    </div>
                </div>
                
                ${mediaGallery}
                ${paymentMethods}
                ${contacts}
            </div>
        `;
        
        document.getElementById('enhancedProductModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading enhanced product details:', error);
        alert('Error loading product details');
    }
}

// Edit Enhanced Product
async function editEnhancedProduct(productId) {
    alert('Edit functionality will be implemented in the next update');
}

// Delete Enhanced Product
async function deleteEnhancedProduct(productId) {
    if (!confirm('Delete this enhanced product? This will also delete all associated media and relationships.')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('enhanced_products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        hideLoading();
        alert('Enhanced product deleted!');
        await loadEnhancedProducts();
        
    } catch (error) {
        hideLoading();
        console.error('Error deleting enhanced product:', error);
        alert('Error deleting product');
    }
}

// Close Enhanced Product Modal
function closeEnhancedProductModal() {
    document.getElementById('enhancedProductModal').classList.remove('active');
}

// ==================== PRODUCT PAGE BANNERS SYSTEM ====================

// Load Product Page Banners
async function loadProductPageBanners() {
    try {
        const { data, error } = await supabase
            .from('product_page_banners')
            .select(`
                *,
                categories (title),
                category_buttons (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('productBannersContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(banner => {
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${banner.banner_url}" alt="Product Banner">
                        <div class="banner-info">
                            <p><strong>Category:</strong> ${banner.categories?.title || 'Unknown'}</p>
                            <p><strong>Button:</strong> ${banner.category_buttons?.name || 'Unknown'}</p>
                            <p><strong>Order:</strong> ${banner.display_order}</p>
                            <p><strong>Created:</strong> ${new Date(banner.created_at).toLocaleDateString()}</p>
                        </div>
                        <div class="item-actions">
                            <button class="btn-danger" onclick="deleteProductPageBanner(${banner.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No product page banners yet</p>';
        }
    } catch (error) {
        console.error('Error loading product page banners:', error);
    }
}

// Preview product banner
document.addEventListener('DOMContentLoaded', () => {
    const bannerInput = document.getElementById('productBannerFile');
    if (bannerInput) {
        bannerInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('productBannerPreview');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Banner Preview">`;
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = '';
            }
        });
    }
});

// Add Product Page Banner
async function addProductPageBanner() {
    const categoryId = document.getElementById('bannerCategorySelect').value;
    const buttonId = document.getElementById('bannerButtonSelect').value;
    const file = document.getElementById('productBannerFile').files[0];
    
    if (!categoryId || !buttonId || !file) {
        alert('Please select category, button, and banner image');
        return;
    }
    
    showLoading();
    
    try {
        // Upload banner
        const bannerUrl = await uploadFile(file, 'product-banners');
        
        if (!bannerUrl) {
            throw new Error('Failed to upload banner');
        }
        
        // Insert banner record
        const { error } = await supabase
            .from('product_page_banners')
            .insert([{
                category_id: parseInt(categoryId),
                button_id: parseInt(buttonId),
                banner_url: bannerUrl,
                display_order: 0
            }]);
        
        if (error) throw error;
        
        hideLoading();
        alert('🖼️ Product page banner added successfully!');
        
        // Reset form
        document.getElementById('bannerCategorySelect').value = '';
        document.getElementById('bannerButtonSelect').value = '';
        document.getElementById('productBannerFile').value = '';
        document.getElementById('productBannerPreview').innerHTML = '';
        
        await loadProductPageBanners();
        
    } catch (error) {
        hideLoading();
        console.error('Error adding product page banner:', error);
        alert('Error adding banner: ' + error.message);
    }
}

// Delete Product Page Banner
async function deleteProductPageBanner(bannerId) {
    if (!confirm('Delete this product page banner?')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('product_page_banners')
            .delete()
            .eq('id', bannerId);
        
        if (error) throw error;
        
        hideLoading();
        alert('Product page banner deleted!');
        await loadProductPageBanners();
        
    } catch (error) {
        hideLoading();
        console.error('Error deleting product page banner:', error);
        alert('Error deleting banner');
    }
}

// ==================== PRODUCT PAGE CONTENT SYSTEM ====================

// Load Product Page Content
async function loadProductPageContent() {
    try {
        const { data, error } = await supabase
            .from('product_page_content')
            .select(`
                *,
                categories (title),
                category_buttons (name),
                enhanced_products (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('productContentContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(content => {
                const contentHtml = renderAnimatedText(content.content_text);
                
                container.innerHTML += `
                    <div class="item-card content-card">
                        <div class="content-header">
                            <h4>Product Page Content</h4>
                            <span class="content-order">Order: ${content.content_order}</span>
                        </div>
                        <div class="content-info">
                            <p><strong>Category:</strong> ${content.categories?.title || 'Unknown'}</p>
                            <p><strong>Button:</strong> ${content.category_buttons?.name || 'Unknown'}</p>
                            ${content.enhanced_products?.name ? `<p><strong>Product:</strong> ${content.enhanced_products.name}</p>` : '<p><strong>Type:</strong> General Page Content</p>'}
                            <div class="content-preview">${contentHtml}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editProductPageContent(${content.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteProductPageContent(${content.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No product page content yet</p>';
        }
    } catch (error) {
        console.error('Error loading product page content:', error);
    }
}

// Add Product Page Content
async function addProductPageContent() {
    const categoryId = document.getElementById('contentCategorySelect').value;
    const buttonId = document.getElementById('contentButtonSelect').value;
    const productId = document.getElementById('contentProductSelect').value || null;
    const contentText = document.getElementById('productPageContent').value.trim();
    
    if (!categoryId || !buttonId || !contentText) {
        alert('Please fill in all required fields');
        return;
    }
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('product_page_content')
            .insert([{
                category_id: parseInt(categoryId),
                button_id: parseInt(buttonId),
                product_id: productId ? parseInt(productId) : null,
                content_text: contentText,
                content_order: 0
            }]);
        
        if (error) throw error;
        
        hideLoading();
        alert('📄 Product page content added successfully!');
        
        // Reset form
        document.getElementById('contentCategorySelect').value = '';
        document.getElementById('contentButtonSelect').value = '';
        document.getElementById('contentProductSelect').innerHTML = '<option value="">General Page Content</option>';
        document.getElementById('productPageContent').value = '';
        
        await loadProductPageContent();
        
    } catch (error) {
        hideLoading();
        console.error('Error adding product page content:', error);
        alert('Error adding content: ' + error.message);
    }
}

// Edit Product Page Content
async function editProductPageContent(contentId) {
    alert('Edit functionality will be implemented in the next update');
}

// Delete Product Page Content
async function deleteProductPageContent(contentId) {
    if (!confirm('Delete this product page content?')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('product_page_content')
            .delete()
            .eq('id', contentId);
        
        if (error) throw error;
        
        hideLoading();
        alert('Product page content deleted!');
        await loadProductPageContent();
        
    } catch (error) {
        hideLoading();
        console.error('Error deleting product page content:', error);
        alert('Error deleting content');
    }
}

// ==================== ADS SYSTEM ====================

// Load Ads System
async function loadAdsSystem() {
    try {
        const { data, error } = await supabase
            .from('ads_banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('adsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(ad => {
                const statusBadge = ad.is_active ? 
                    '<span class="status-badge active">Active</span>' : 
                    '<span class="status-badge inactive">Inactive</span>';
                
                container.innerHTML += `
                    <div class="item-card ads-card">
                        <div class="ads-header">
                            <h4>Ad Banner - ${ad.banner_size}</h4>
                            ${statusBadge}
                        </div>
                        <div class="ads-info">
                            <p><strong>Banner Size:</strong> ${ad.banner_size}</p>
                            <p><strong>Created:</strong> ${new Date(ad.created_at).toLocaleDateString()}</p>
                            <div class="script-preview">
                                <strong>Script Code:</strong>
                                <pre><code>${ad.script_code.substring(0, 200)}${ad.script_code.length > 200 ? '...' : ''}</code></pre>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="toggleAdStatus(${ad.id}, ${!ad.is_active})">${ad.is_active ? 'Deactivate' : 'Activate'}</button>
                            <button class="btn-secondary" onclick="editAd(${ad.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteAd(${ad.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No ads yet</p>';
        }
    } catch (error) {
        console.error('Error loading ads:', error);
    }
}

// Add Ad Banner
async function addAdBanner() {
    const bannerSize = document.getElementById('adBannerSize').value.trim();
    const scriptCode = document.getElementById('adScriptCode').value.trim();
    const isActive = document.getElementById('adStatus').value === 'true';
    
    if (!bannerSize || !scriptCode) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Basic validation for banner size format
    if (!/^\d+x\d+$/.test(bannerSize)) {
        alert('Banner size must be in format: widthxheight (e.g., 160x300)');
        return;
    }
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('ads_banners')
            .insert([{
                banner_size: bannerSize,
                script_code: scriptCode,
                is_active: isActive
            }]);
        
        if (error) throw error;
        
        hideLoading();
        alert('📺 Ad banner added successfully!');
        
        // Reset form
        document.getElementById('adBannerSize').value = '';
        document.getElementById('adScriptCode').value = '';
        document.getElementById('adStatus').value = 'true';
        
        await loadAdsSystem();
        
    } catch (error) {
        hideLoading();
        console.error('Error adding ad banner:', error);
        alert('Error adding ad: ' + error.message);
    }
}

// Toggle Ad Status
async function toggleAdStatus(adId, newStatus) {
    showLoading();
    
    try {
        const { error } = await supabase
            .from('ads_banners')
            .update({ is_active: newStatus })
            .eq('id', adId);
        
        if (error) throw error;
        
        hideLoading();
        alert(`Ad ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        await loadAdsSystem();
        
    } catch (error) {
        hideLoading();
        console.error('Error toggling ad status:', error);
        alert('Error updating ad status');
    }
}

// Edit Ad
async function editAd(adId) {
    alert('Edit functionality will be implemented in the next update');
}

// Delete Ad
async function deleteAd(adId) {
    if (!confirm('Delete this ad banner?')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('ads_banners')
            .delete()
            .eq('id', adId);
        
        if (error) throw error;
        
        hideLoading();
        alert('Ad banner deleted!');
        await loadAdsSystem();
        
    } catch (error) {
        hideLoading();
        console.error('Error deleting ad:', error);
        alert('Error deleting ad');
    }
}

// ==================== ENHANCED ORDERS SYSTEM ====================

// Load Enhanced Orders
async function loadEnhancedOrders() {
    try {
        const { data, error } = await supabase
            .from('enhanced_orders')
            .select(`
                *,
                users (name, email),
                enhanced_products (name, current_price, currency_type)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayEnhancedOrders(data || []);
    } catch (error) {
        console.error('Error loading enhanced orders:', error);
    }
}

// Display Enhanced Orders
function displayEnhancedOrders(orders) {
    const container = document.getElementById('enhancedOrdersContainer');
    
    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px 20px;"><h3 style="margin-bottom:12px;">No Enhanced Orders Yet</h3><p>Enhanced product orders will appear here.</p></div>';
        return;
    }

    container.innerHTML = '';

    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = 'order-card enhanced-order-card';

        let statusClass = 'pending';
        let statusIcon = '⏳';
        if (order.status === 'approved') {
            statusClass = 'approved';
            statusIcon = '✅';
        }
        if (order.status === 'rejected') {
            statusClass = 'rejected';
            statusIcon = '❌';
        }

        // Parse payment methods and contacts
        const paymentMethods = order.selected_payment_methods || [];
        const contacts = order.selected_contacts || [];

        item.innerHTML = `
            <div class="order-header">
                <h3>Enhanced Order #${order.id}</h3>
                <div class="order-status ${statusClass}">${statusIcon} ${order.status.toUpperCase()}</div>
            </div>
            <div class="order-info">
                <div class="info-item">
                    <div class="info-label">Customer</div>
                    <div class="info-value">${order.users?.name || 'Unknown'} (${order.users?.email || 'N/A'})</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Product</div>
                    <div class="info-value">${order.enhanced_products?.name || 'Unknown Product'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Price</div>
                    <div class="info-value">${order.enhanced_products?.current_price || 0} ${order.enhanced_products?.currency_type || 'MMK'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Transaction Code</div>
                    <div class="info-value">${order.transaction_code}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Order Date</div>
                    <div class="info-value">${new Date(order.created_at).toLocaleString()}</div>
                </div>
                ${order.admin_message ? `
                <div class="info-item">
                    <div class="info-label">Admin Message</div>
                    <div class="info-value admin-message">${order.admin_message}</div>
                </div>
                ` : ''}
            </div>
            <div class="order-actions">
                <button onclick="viewEnhancedOrderDetails(${order.id})" class="btn-secondary">View Details</button>
                ${order.status === 'pending' ? `
                    <button onclick="approveEnhancedOrder(${order.id})" class="btn-success">Approve</button>
                    <button onclick="rejectEnhancedOrder(${order.id})" class="btn-danger">Reject</button>
                ` : ''}
            </div>
        `;

        container.appendChild(item);
    });
}

// Filter Enhanced Orders
function filterEnhancedOrders(status) {
    document.querySelectorAll('.orders-filter .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const orders = document.querySelectorAll('.enhanced-order-card');
    orders.forEach(order => {
        const orderStatus = order.querySelector('.order-status').textContent.toLowerCase();
        if (status === 'all' || orderStatus.includes(status)) {
            order.style.display = 'block';
        } else {
            order.style.display = 'none';
        }
    });
}

// View Enhanced Order Details
async function viewEnhancedOrderDetails(orderId) {
    try {
        const { data, error } = await supabase
            .from('enhanced_orders')
            .select(`
                *,
                users (name, email, username),
                enhanced_products (*)
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;

        // Get payment methods and contacts details
        const paymentIds = data.selected_payment_methods || [];
        const contactIds = data.selected_contacts || [];
        
        let paymentMethods = [];
        let contacts = [];
        
        if (paymentIds.length > 0) {
            const { data: payments } = await supabase
                .from('payment_methods')
                .select('*')
                .in('id', paymentIds);
            paymentMethods = payments || [];
        }
        
        if (contactIds.length > 0) {
            const { data: contactsData } = await supabase
                .from('contacts')
                .select('*')
                .in('id', contactIds);
            contacts = contactsData || [];
        }

        const modalBody = document.getElementById('orderModalBody');
        
        let tableDataHtml = '';
        if (data.table_data && Object.keys(data.table_data).length > 0) {
            tableDataHtml = `
                <div class="order-table-data">
                    <h4>Form Data</h4>
                    ${Object.entries(data.table_data).map(([key, value]) => `
                        <div class="table-data-item">
                            <strong>${key}:</strong> ${value}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        let paymentMethodsHtml = '';
        if (paymentMethods.length > 0) {
            paymentMethodsHtml = `
                <div class="order-payment-methods">
                    <h4>Selected Payment Methods</h4>
                    ${paymentMethods.map(payment => `
                        <div class="payment-method-item">
                            <img src="${payment.icon_url}" width="24" height="24" alt="${payment.name}">
                            <span>${payment.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        let contactsHtml = '';
        if (contacts.length > 0) {
            contactsHtml = `
                <div class="order-contacts">
                    <h4>Selected Contact Methods</h4>
                    ${contacts.map(contact => `
                        <div class="contact-method-item">
                            <img src="${contact.icon_url}" width="24" height="24" alt="${contact.name}">
                            <span>${contact.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        modalBody.innerHTML = `
            <div class="enhanced-order-details">
                <div class="order-summary">
                    <h3>Enhanced Order #${data.id}</h3>
                    <div class="order-status-display ${data.status}">${data.status.toUpperCase()}</div>
                </div>
                
                <div class="detail-sections">
                    <div class="detail-section">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${data.users?.name}</p>
                        <p><strong>Username:</strong> ${data.users?.username}</p>
                        <p><strong>Email:</strong> ${data.users?.email}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Product Information</h4>
                        <p><strong>Name:</strong> ${renderAnimatedText(data.enhanced_products?.name || 'N/A')}</p>
                        <p><strong>Price:</strong> ${data.enhanced_products?.current_price} ${data.enhanced_products?.currency_type}</p>
                        <p><strong>Description:</strong> ${renderAnimatedText(data.enhanced_products?.description || 'N/A')}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Order Information</h4>
                        <p><strong>Transaction Code:</strong> ${data.transaction_code}</p>
                        <p><strong>Order Date:</strong> ${new Date(data.created_at).toLocaleString()}</p>
                        ${data.admin_message ? `<p><strong>Admin Message:</strong> ${data.admin_message}</p>` : ''}
                    </div>
                    
                    ${tableDataHtml}
                    ${paymentMethodsHtml}
                    ${contactsHtml}
                </div>
                
                ${data.status === 'pending' ? `
                <div class="order-actions-modal">
                    <button onclick="closeOrderModal(); approveEnhancedOrder(${data.id})" class="btn-success">Approve Order</button>
                    <button onclick="closeOrderModal(); rejectEnhancedOrder(${data.id})" class="btn-danger">Reject Order</button>
                </div>
                ` : ''}
            </div>
        `;

        document.getElementById('orderModal').classList.add('active');

    } catch (error) {
        console.error('Error loading enhanced order details:', error);
        alert('Error loading order details');
    }
}

// Approve Enhanced Order
async function approveEnhancedOrder(orderId) {
    const message = prompt('Enter a message for the customer (optional):');
    
    showLoading();

    try {
        const { error } = await supabase
            .from('enhanced_orders')
            .update({ 
                status: 'approved',
                admin_message: message || null
            })
            .eq('id', orderId);

        if (error) throw error;

        hideLoading();
        alert('Enhanced order approved successfully!');
        await loadEnhancedOrders();

    } catch (error) {
        hideLoading();
        console.error('Error approving enhanced order:', error);
        alert('Error approving order');
    }
}

// Reject Enhanced Order
async function rejectEnhancedOrder(orderId) {
    const message = prompt('Enter a reason for rejection:');
    if (!message) return;
    
    showLoading();

    try {
        const { error } = await supabase
            .from('enhanced_orders')
            .update({ 
                status: 'rejected',
                admin_message: message
            })
            .eq('id', orderId);

        if (error) throw error;

        hideLoading();
        alert('Enhanced order rejected successfully!');
        await loadEnhancedOrders();

    } catch (error) {
        hideLoading();
        console.error('Error rejecting enhanced order:', error);
        alert('Error rejecting order');
    }
}

console.log('✅ Panel.js loaded successfully!');
