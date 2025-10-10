
// ==================== CONTINUATION OF ADMIN.JS ====================
// This file contains the remaining admin functions

// ==================== INPUT TABLES ====================

async function loadInputTables() {
    try {
        const { data, error } = await supabase
            .from('input_tables')
            .select(`
                *,
                categories (title),
                category_buttons (name)
            `)
            .order('created_at', { ascending: false });

        const container = document.getElementById('tablesContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            // Group by button_id
            const groupedTables = {};
            data.forEach(table => {
                if (!groupedTables[table.button_id]) {
                    groupedTables[table.button_id] = [];
                }
                groupedTables[table.button_id].push(table);
            });

            Object.keys(groupedTables).forEach(buttonId => {
                const tables = groupedTables[buttonId];
                const firstTable = tables[0];
                
                const nameHtml = tables.map(t => renderAnimatedText(t.name)).join(', ');
                
                container.innerHTML += `
                    <div class="item-card">
                        <h4>Input Tables Group</h4>
                        <p><strong>Category:</strong> ${firstTable.categories?.title || 'Unknown'}</p>
                        <p><strong>Button:</strong> ${firstTable.category_buttons?.name || 'Unknown'}</p>
                        <p><strong>Tables:</strong> ${nameHtml}</p>
                        <p><strong>Count:</strong> ${tables.length} table(s)</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="viewTables(${buttonId})">View Details</button>
                            <button class="btn-danger" onclick="deleteTables(${buttonId})">Delete All</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No input tables yet</p>';
        }
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

function addTableInput() {
    const container = document.getElementById('tablesInputContainer');
    const inputGroup = document.createElement('div');
    inputGroup.className = 'table-input-group';
    inputGroup.innerHTML = `
        <div class="input-with-emoji">
            <input type="text" class="table-name" placeholder="Table Name">
            <button type="button" class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-name')">😀</button>
        </div>
        <div class="input-with-emoji">
            <input type="text" class="table-instruction" placeholder="Instruction">
            <button type="button" class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-instruction')">😀</button>
        </div>
        <button type="button" onclick="removeTableInput(this)" class="btn-danger" style="margin-top: 8px;">Remove</button>
    `;
    container.appendChild(inputGroup);
}

function removeTableInput(button) {
    button.parentElement.remove();
}

async function saveTables() {
    const categoryId = document.getElementById('tableCategorySelect').value;
    const buttonId = document.getElementById('tableButtonSelect').value;
    const tableGroups = document.querySelectorAll('.table-input-group');

    if (!categoryId || !buttonId) {
        alert('Please select category and button');
        return;
    }

    if (tableGroups.length === 0) {
        alert('Please add at least one table');
        return;
    }

    const tables = [];
    let hasEmptyFields = false;

    tableGroups.forEach(group => {
        const name = group.querySelector('.table-name').value.trim();
        const instruction = group.querySelector('.table-instruction').value.trim();
        
        if (!name || !instruction) {
            hasEmptyFields = true;
            return;
        }
        
        tables.push({
            category_id: parseInt(categoryId),
            button_id: parseInt(buttonId),
            name: name,
            instruction: instruction
        });
    });

    if (hasEmptyFields) {
        alert('Please fill in all table names and instructions');
        return;
    }

    showLoading();

    try {
        // Delete existing tables for this button
        await supabase
            .from('input_tables')
            .delete()
            .eq('button_id', buttonId);

        // Insert new tables
        const { error } = await supabase
            .from('input_tables')
            .insert(tables);

        if (error) throw error;

        hideLoading();
        alert('Tables saved!');
        
        // Reset form
        document.getElementById('tableCategorySelect').value = '';
        document.getElementById('tableButtonSelect').value = '';
        document.getElementById('tablesInputContainer').innerHTML = `
            <div class="table-input-group">
                <div class="input-with-emoji">
                    <input type="text" class="table-name" placeholder="Table Name">
                    <button type="button" class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-name')">😀</button>
                </div>
                <div class="input-with-emoji">
                    <input type="text" class="table-instruction" placeholder="Instruction">
                    <button type="button" class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-instruction')">😀</button>
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

async function viewTables(buttonId) {
    alert('View functionality will be implemented in the next update');
}

async function deleteTables(buttonId) {
    if (!confirm('Delete all tables for this button?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('input_tables')
            .delete()
            .eq('button_id', buttonId);

        if (error) throw error;

        hideLoading();
        alert('Tables deleted!');
        loadInputTables();
    } catch (error) {
        hideLoading();
        alert('Error deleting tables');
        console.error(error);
    }
}

// ==================== MENUS (Original Products) ====================

async function loadMenus() {
    try {
        const { data, error } = await supabase
            .from('menus')
            .select(`
                *,
                categories (title),
                category_buttons (name)
            `)
            .order('created_at', { ascending: false });

        const container = document.getElementById('menusContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(menu => {
                const nameHtml = renderAnimatedText(menu.name);
                const amountHtml = renderAnimatedText(menu.amount);
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${menu.icon_url}" alt="Product Icon">
                        <div>
                            <h4>${nameHtml}</h4>
                            <p><strong>Amount:</strong> ${amountHtml}</p>
                            <p><strong>Price:</strong> ${menu.price} MMK</p>
                            <p><strong>Category:</strong> ${menu.categories?.title || 'Unknown'}</p>
                            <p><strong>Button:</strong> ${menu.category_buttons?.name || 'Unknown'}</p>
                        </div>
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

function addMenuInput() {
    const container = document.getElementById('menusInputContainer');
    const inputGroup = document.createElement('div');
    inputGroup.className = 'menu-input-group';
    inputGroup.innerHTML = `
        <div class="input-with-emoji">
            <input type="text" class="menu-name" placeholder="Product Name">
            <button type="button" class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-name')">😀</button>
        </div>
        <div class="input-with-emoji">
            <input type="text" class="menu-amount" placeholder="Amount/Details">
            <button type="button" class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-amount')">😀</button>
        </div>
        <input type="number" class="menu-price" placeholder="Price">
        <input type="file" class="menu-icon" accept="image/*">
        <button type="button" onclick="removeMenuInput(this)" class="btn-danger" style="margin-top: 8px;">Remove</button>
    `;
    container.appendChild(inputGroup);
}

function removeMenuInput(button) {
    button.parentElement.remove();
}

async function saveMenus() {
    const categoryId = document.getElementById('menuCategorySelect').value;
    const buttonId = document.getElementById('menuButtonSelect').value;
    const menuGroups = document.querySelectorAll('.menu-input-group');

    if (!categoryId || !buttonId) {
        alert('Please select category and button');
        return;
    }

    if (menuGroups.length === 0) {
        alert('Please add at least one product');
        return;
    }

    showLoading();

    try {
        const menus = [];
        
        for (const group of menuGroups) {
            const name = group.querySelector('.menu-name').value.trim();
            const amount = group.querySelector('.menu-amount').value.trim();
            const price = group.querySelector('.menu-price').value;
            const iconFile = group.querySelector('.menu-icon').files[0];
            
            if (!name || !amount || !price || !iconFile) {
                hideLoading();
                alert('Please fill in all fields and select icons for all products');
                return;
            }
            
            // Upload icon
            const iconUrl = await uploadFile(iconFile, 'menus');
            if (!iconUrl) {
                hideLoading();
                alert('Error uploading product icon');
                return;
            }
            
            menus.push({
                category_id: parseInt(categoryId),
                button_id: parseInt(buttonId),
                name: name,
                amount: amount,
                price: parseInt(price),
                icon_url: iconUrl
            });
        }

        // Insert menus
        const { error } = await supabase
            .from('menus')
            .insert(menus);

        if (error) throw error;

        hideLoading();
        alert('Products saved!');
        
        // Reset form
        document.getElementById('menuCategorySelect').value = '';
        document.getElementById('menuButtonSelect').value = '';
        document.getElementById('menusInputContainer').innerHTML = `
            <div class="menu-input-group">
                <div class="input-with-emoji">
                    <input type="text" class="menu-name" placeholder="Product Name">
                    <button type="button" class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-name')">😀</button>
                </div>
                <div class="input-with-emoji">
                    <input type="text" class="menu-amount" placeholder="Amount/Details">
                    <button type="button" class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'menu-amount')">😀</button>
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

async function editMenu(id) {
    alert('Edit functionality will be implemented in the next update');
}

async function deleteMenu(id) {
    if (!confirm('Delete this product?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Product deleted!');
        loadMenus();
    } catch (error) {
        hideLoading();
        alert('Error deleting product');
        console.error(error);
    }
}

// ==================== PAYMENT METHODS ====================

async function loadPaymentMethods() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: false });

        const container = document.getElementById('paymentsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(payment => {
                const nameHtml = renderAnimatedText(payment.name);
                const instructionsHtml = renderAnimatedText(payment.instructions);
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${payment.icon_url}" alt="Payment Icon">
                        <div>
                            <h4>${nameHtml}</h4>
                            <p><strong>Address:</strong> ${payment.address}</p>
                            <p><strong>Instructions:</strong></p>
                            <div class="instructions-text">${instructionsHtml}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editPaymentMethod(${payment.id})">Edit</button>
                            <button class="btn-danger" onclick="deletePaymentMethod(${payment.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No payment methods yet</p>';
        }
    } catch (error) {
        console.error('Error loading payment methods:', error);
    }
}

async function addPaymentMethod() {
    const name = document.getElementById('paymentName').value.trim();
    const address = document.getElementById('paymentAddress').value.trim();
    const instructions = document.getElementById('paymentInstructions').value.trim();
    const file = document.getElementById('paymentIconFile').files[0];

    if (!name || !address || !file) {
        alert('Please fill in name, address and select an icon');
        return;
    }

    showLoading();
    const iconUrl = await uploadFile(file, 'payments');
    
    if (iconUrl) {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .insert([{
                    name: name,
                    address: address,
                    instructions: instructions,
                    icon_url: iconUrl
                }]);

            if (error) throw error;

            hideLoading();
            alert('Payment method added!');
            
            // Reset form
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

// Load Payment Methods for Enhanced Products Select
async function loadPaymentMethodsForSelect() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('enhancedProductPaymentMethods');
        if (!container) return;
        
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(payment => {
                const checkbox = document.createElement('div');
                checkbox.className = 'checkbox-item';
                checkbox.innerHTML = `
                    <input type="checkbox" id="payment_${payment.id}" value="${payment.id}">
                    <label for="payment_${payment.id}">
                        <img src="${payment.icon_url}" alt="${payment.name}" width="20" height="20">
                        ${payment.name}
                    </label>
                `;
                container.appendChild(checkbox);
            });
        } else {
            container.innerHTML = '<p>No payment methods available</p>';
        }
    } catch (error) {
        console.error('Error loading payment methods for select:', error);
    }
}

async function editPaymentMethod(id) {
    alert('Edit functionality will be implemented in the next update');
}

async function deletePaymentMethod(id) {
    if (!confirm('Delete this payment method?')) return;

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
            .order('created_at', { ascending: false });

        const container = document.getElementById('contactsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(contact => {
                const nameHtml = renderAnimatedText(contact.name);
                const descriptionHtml = renderAnimatedText(contact.description);
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${contact.icon_url}" alt="Contact Icon">
                        <div>
                            <h4>${nameHtml}</h4>
                            <p><strong>Description:</strong></p>
                            <div class="description-text">${descriptionHtml}</div>
                            <p><strong>Link:</strong> ${contact.link || 'None'}</p>
                            <p><strong>Address:</strong> ${contact.address || 'None'}</p>
                        </div>
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
        alert('Please fill in name, description and select an icon');
        return;
    }

    showLoading();
    const iconUrl = await uploadFile(file, 'contacts');
    
    if (iconUrl) {
        try {
            const { error } = await supabase
                .from('contacts')
                .insert([{
                    name: name,
                    description: description,
                    link: link,
                    address: address,
                    icon_url: iconUrl
                }]);

            if (error) throw error;

            hideLoading();
            alert('Contact added!');
            
            // Reset form
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

// Load Contacts for Enhanced Products Select
async function loadContactsForSelect() {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('enhancedProductContacts');
        if (!container) return;
        
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(contact => {
                const checkbox = document.createElement('div');
                checkbox.className = 'checkbox-item';
                checkbox.innerHTML = `
                    <input type="checkbox" id="contact_${contact.id}" value="${contact.id}">
                    <label for="contact_${contact.id}">
                        <img src="${contact.icon_url}" alt="${contact.name}" width="20" height="20">
                        ${contact.name}
                    </label>
                `;
                container.appendChild(checkbox);
            });
        } else {
            container.innerHTML = '<p>No contacts available</p>';
        }
    } catch (error) {
        console.error('Error loading contacts for select:', error);
    }
}

async function editContact(id) {
    alert('Edit functionality will be implemented in the next update');
}

async function deleteContact(id) {
    if (!confirm('Delete this contact?')) return;

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
        alert('Error deleting contact');
        console.error(error);
    }
}

// ==================== YOUTUBE VIDEOS ====================

async function loadVideos() {
    try {
        const { data, error } = await supabase
            .from('youtube_videos')
            .select(`
                *,
                categories (title),
                category_buttons (name)
            `)
            .order('created_at', { ascending: false });

        const container = document.getElementById('videosContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(video => {
                const descriptionHtml = renderAnimatedText(video.description);
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${video.banner_url}" alt="Video Banner">
                        <div>
                            <h4>YouTube Video</h4>
                            <p><strong>Description:</strong></p>
                            <div class="description-text">${descriptionHtml}</div>
                            <p><strong>URL:</strong> <a href="${video.video_url}" target="_blank">${video.video_url}</a></p>
                            <p><strong>Category:</strong> ${video.categories?.title || 'Unknown'}</p>
                            <p><strong>Button:</strong> ${video.category_buttons?.name || 'Unknown'}</p>
                        </div>
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
    const categoryId = document.getElementById('videoCategorySelect').value;
    const buttonId = document.getElementById('videoButtonSelect').value;
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const bannerFile = document.getElementById('videoBannerFile').files[0];

    if (!categoryId || !buttonId || !videoUrl || !description || !bannerFile) {
        alert('Please fill all fields');
        return;
    }

    // Validate YouTube URL
    if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
        alert('Please enter a valid YouTube URL');
        return;
    }

    showLoading();
    const bannerUrl = await uploadFile(bannerFile, 'videos');
    
    if (bannerUrl) {
        try {
            const { error } = await supabase
                .from('youtube_videos')
                .insert([{
                    category_id: parseInt(categoryId),
                    button_id: parseInt(buttonId),
                    video_url: videoUrl,
                    description: description,
                    banner_url: bannerUrl
                }]);

            if (error) throw error;

            hideLoading();
            alert('Video added!');
            
            // Reset form
            document.getElementById('videoCategorySelect').value = '';
            document.getElementById('videoButtonSelect').value = '';
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

async function editVideo(id) {
    alert('Edit functionality will be implemented in the next update');
}

async function deleteVideo(id) {
    if (!confirm('Delete this video?')) return;

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
        alert('Error deleting video');
        console.error(error);
    }
}

// ==================== ORDERS (Original) ====================

async function loadOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users (name, email),
                menus (name, price),
                payment_methods (name, icon_url)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayOrders(data || []);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    
    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px 20px;"><h3 style="margin-bottom:12px;">No Orders Yet</h3><p>Customer orders will appear here.</p></div>';
        return;
    }

    container.innerHTML = '';

    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = 'order-card';

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

        item.innerHTML = `
            <div class="order-header">
                <h3>Order #${order.id}</h3>
                <div class="order-status ${statusClass}">${statusIcon} ${order.status.toUpperCase()}</div>
            </div>
            <div class="order-info">
                <div class="info-item">
                    <div class="info-label">Customer</div>
                    <div class="info-value">${order.users?.name || 'Unknown'} (${order.users?.email || 'N/A'})</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Product</div>
                    <div class="info-value">${order.menus?.name || 'Unknown Product'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Price</div>
                    <div class="info-value">${order.menus?.price || 0} MMK</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Payment Method</div>
                    <div class="info-value">
                        <img src="${order.payment_methods?.icon_url}" width="20" height="20" alt="">
                        ${order.payment_methods?.name || 'Unknown'}
                    </div>
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
                <button onclick="viewOrderDetails(${order.id})" class="btn-secondary">View Details</button>
                ${order.status === 'pending' ? `
                    <button onclick="approveOrder(${order.id})" class="btn-success">Approve</button>
                    <button onclick="rejectOrder(${order.id})" class="btn-danger">Reject</button>
                ` : ''}
            </div>
        `;

        container.appendChild(item);
    });
}

function filterOrders(status) {
    document.querySelectorAll('.orders-filter .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const orders = document.querySelectorAll('.order-card');
    orders.forEach(order => {
        const orderStatus = order.querySelector('.order-status').textContent.toLowerCase();
        if (status === 'all' || orderStatus.includes(status)) {
            order.style.display = 'block';
        } else {
            order.style.display = 'none';
        }
    });
}

async function viewOrderDetails(orderId) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users (name, email, username),
                menus (name, amount, price, icon_url),
                payment_methods (name, icon_url, address, instructions)
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;

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

        modalBody.innerHTML = `
            <div class="order-details">
                <div class="order-summary">
                    <h3>Order #${data.id}</h3>
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
                        <p><strong>Name:</strong> ${renderAnimatedText(data.menus?.name || 'N/A')}</p>
                        <p><strong>Amount:</strong> ${renderAnimatedText(data.menus?.amount || 'N/A')}</p>
                        <p><strong>Price:</strong> ${data.menus?.price} MMK</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Payment Information</h4>
                        <p><strong>Method:</strong> 
                            <img src="${data.payment_methods?.icon_url}" width="20" height="20" alt="">
                            ${data.payment_methods?.name}
                        </p>
                        <p><strong>Address:</strong> ${data.payment_methods?.address}</p>
                        <p><strong>Instructions:</strong> ${renderAnimatedText(data.payment_methods?.instructions || '')}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Order Information</h4>
                        <p><strong>Transaction Code:</strong> ${data.transaction_code}</p>
                        <p><strong>Order Date:</strong> ${new Date(data.created_at).toLocaleString()}</p>
                        ${data.admin_message ? `<p><strong>Admin Message:</strong> ${data.admin_message}</p>` : ''}
                    </div>
                    
                    ${tableDataHtml}
                </div>
                
                ${data.status === 'pending' ? `
                <div class="order-actions-modal">
                    <button onclick="closeOrderModal(); approveOrder(${data.id})" class="btn-success">Approve Order</button>
                    <button onclick="closeOrderModal(); rejectOrder(${data.id})" class="btn-danger">Reject Order</button>
                </div>
                ` : ''}
            </div>
        `;

        document.getElementById('orderModal').classList.add('active');

    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Error loading order details');
    }
}

async function approveOrder(orderId) {
    const message = prompt('Enter a message for the customer (optional):');
    
    showLoading();

    try {
        const { error } = await supabase
            .from('orders')
            .update({ 
                status: 'approved',
                admin_message: message || null
            })
            .eq('id', orderId);

        if (error) throw error;

        hideLoading();
        alert('Order approved successfully!');
        await loadOrders();

    } catch (error) {
        hideLoading();
        console.error('Error approving order:', error);
        alert('Error approving order');
    }
}

async function rejectOrder(orderId) {
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
            .eq('id', orderId);

        if (error) throw error;

        hideLoading();
        alert('Order rejected successfully!');
        await loadOrders();

    } catch (error) {
        hideLoading();
        console.error('Error rejecting order:', error);
        alert('Error rejecting order');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// ==================== USERS ====================

async function loadUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('usersContainer');
        const totalUsersEl = document.getElementById('totalUsers');
        const todayUsersEl = document.getElementById('todayUsers');
        
        // Update stats
        totalUsersEl.textContent = data?.length || 0;
        
        const today = new Date().toDateString();
        const todayUsers = data?.filter(user => new Date(user.created_at).toDateString() === today).length || 0;
        todayUsersEl.textContent = todayUsers;

        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(user => {
                const nameHtml = renderAnimatedText(user.name);
                
                container.innerHTML += `
                    <div class="user-card">
                        <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <h4>${nameHtml}</h4>
                            <p><strong>Username:</strong> ${user.username}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Joined:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <div class="user-actions">
                            <button class="btn-secondary" onclick="viewUserOrders(${user.id})">View Orders</button>
                            <button class="btn-danger" onclick="deleteUser(${user.id})">Delete User</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No users yet</p>';
        }

    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function viewUserOrders(userId) {
    alert('View user orders functionality will be implemented in the next update');
}

async function deleteUser(userId) {
    if (!confirm('Delete this user? This will also delete all their orders.')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        hideLoading();
        alert('User deleted!');
        loadUsers();
    } catch (error) {
        hideLoading();
        alert('Error deleting user');
        console.error(error);
    }
}

// ==================== Enhanced Functions will be loaded from panel.js ==================== 

console.log('✅ Admin2.js loaded successfully!');
