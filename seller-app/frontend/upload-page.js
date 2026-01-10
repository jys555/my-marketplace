/**
 * Upload Page JavaScript
 * Handles product and banner upload forms
 */

let categories = [];

// ============================================
// TAB SWITCHING
// ============================================

document.querySelectorAll('.upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update tabs
        document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update content
        document.querySelectorAll('.upload-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-upload`).classList.add('active');
        
        // Clear messages
        hideMessages();
    });
});

// ============================================
// PRODUCT UPLOAD
// ============================================

// Load categories on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    setupConditionalFields();
});

async function loadCategories() {
    try {
        categories = await apiRequest('/categories?lang=uz');
        
        const select = document.getElementById('product-category');
        if (select && categories.length > 0) {
            select.innerHTML = '<option value="">Kategoriyani tanlang...</option>';
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Kategoriyalarni yuklab bo\'lmadi');
    }
}

// Product form submit
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleProductUpload();
});

async function handleProductUpload() {
    const submitBtn = document.querySelector('#product-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Yuklanmoqda...';
        hideMessages();
        
        // Get form data
        const productData = {
            sku: document.getElementById('product-sku').value.trim(),
            barcode: document.getElementById('product-barcode').value.trim() || null,
            name_uz: document.getElementById('product-name-uz').value.trim(),
            name_ru: document.getElementById('product-name-ru').value.trim() || null,
            description_uz: document.getElementById('product-description-uz').value.trim() || null,
            description_ru: document.getElementById('product-description-ru').value.trim() || null,
            category_id: document.getElementById('product-category').value ? parseInt(document.getElementById('product-category').value) : null,
            image_url: document.getElementById('product-image-url').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            sale_price: document.getElementById('product-sale-price').value ? parseFloat(document.getElementById('product-sale-price').value) : null,
            cost_price: document.getElementById('product-cost-price').value ? parseFloat(document.getElementById('product-cost-price').value) : null,
            is_active: document.getElementById('product-is-active').checked
        };
        
        // Validation
        if (!productData.sku) {
            throw new Error('SKU majburiy!');
        }
        
        if (!productData.name_uz) {
            throw new Error('O\'zbekcha nom majburiy!');
        }
        
        if (!productData.image_url) {
            throw new Error('Rasm URL majburiy!');
        }
        
        if (!productData.price || productData.price <= 0) {
            throw new Error('Narx 0 dan katta bo\'lishi kerak!');
        }
        
        // Create product
        const response = await apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        
        console.log('Product created:', response);
        
        // If stock is provided, create inventory entry
        const initialStock = parseInt(document.getElementById('product-stock').value) || 0;
        if (initialStock > 0 && response.id) {
            try {
                await apiRequest('/inventory', {
                    method: 'POST',
                    body: JSON.stringify({
                        product_id: response.id,
                        quantity: initialStock
                    })
                });
                console.log('Inventory created:', initialStock);
            } catch (invError) {
                console.error('Error creating inventory:', invError);
                // Continue anyway
            }
        }
        
        // Success!
        showSuccess('✅ Tovar muvaffaqiyatli qo\'shildi!');
        document.getElementById('product-form').reset();
        document.getElementById('product-is-active').checked = true;
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = '/catalog.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error uploading product:', error);
        showError(error.message || 'Tovarni yuklab bo\'lmadi');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============================================
// BANNER UPLOAD
// ============================================

// Setup conditional fields for banner link type
function setupConditionalFields() {
    const linkTypeSelect = document.getElementById('banner-link-type');
    const linkIdField = document.getElementById('banner-link-id-field');
    const linkUrlField = document.getElementById('banner-link-url-field');
    
    linkTypeSelect.addEventListener('change', (e) => {
        // Hide all
        linkIdField.classList.remove('show');
        linkUrlField.classList.remove('show');
        
        // Show based on selection
        if (e.target.value === 'product' || e.target.value === 'category') {
            linkIdField.classList.add('show');
        } else if (e.target.value === 'url') {
            linkUrlField.classList.add('show');
        }
    });
}

// Banner form submit
document.getElementById('banner-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleBannerUpload();
});

async function handleBannerUpload() {
    const submitBtn = document.querySelector('#banner-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Yuklanmoqda...';
        hideMessages();
        
        // Get form data
        const linkType = document.getElementById('banner-link-type').value || null;
        const bannerData = {
            title_uz: document.getElementById('banner-title-uz').value.trim() || null,
            title_ru: document.getElementById('banner-title-ru').value.trim() || null,
            image_url: document.getElementById('banner-image-url').value.trim(),
            link_type: linkType,
            link_id: null,
            link_url: null,
            sort_order: parseInt(document.getElementById('banner-sort-order').value) || 0,
            is_active: document.getElementById('banner-is-active').checked
        };
        
        // Set link_id or link_url based on link_type
        if (linkType === 'product' || linkType === 'category') {
            const linkId = document.getElementById('banner-link-id').value;
            bannerData.link_id = linkId ? parseInt(linkId) : null;
        } else if (linkType === 'url') {
            bannerData.link_url = document.getElementById('banner-link-url').value.trim() || null;
        }
        
        // Validation
        if (!bannerData.image_url) {
            throw new Error('Rasm URL majburiy!');
        }
        
        // Create banner
        const response = await apiRequest('/banners', {
            method: 'POST',
            body: JSON.stringify(bannerData)
        });
        
        console.log('Banner created:', response);
        
        // Success!
        showSuccess('✅ Banner muvaffaqiyatli qo\'shildi!');
        document.getElementById('banner-form').reset();
        document.getElementById('banner-is-active').checked = true;
        document.getElementById('banner-sort-order').value = '0';
        
        // Hide conditional fields
        document.getElementById('banner-link-id-field').classList.remove('show');
        document.getElementById('banner-link-url-field').classList.remove('show');
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = '/catalog.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error uploading banner:', error);
        showError(error.message || 'Bannerni yuklab bo\'lmadi');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    successEl.textContent = message;
    successEl.classList.add('show');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = '❌ ' + message;
    errorEl.classList.add('show');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideMessages() {
    document.getElementById('success-message').classList.remove('show');
    document.getElementById('error-message').classList.remove('show');
}
