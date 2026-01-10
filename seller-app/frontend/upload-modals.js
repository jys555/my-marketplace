/**
 * Upload Modals JavaScript - Product & Banner Upload
 * Seller App - Amazing Store integration
 */

// ============================================
// PRODUCT UPLOAD MODAL
// ============================================

let categories = [];

// Open Product Upload Modal
function openProductUploadModal() {
    const modal = document.getElementById('product-upload-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Load categories
        loadCategories();
    }
}

// Close Product Upload Modal
function closeProductUploadModal() {
    const modal = document.getElementById('product-upload-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        document.getElementById('product-upload-form').reset();
    }
}

// Load Categories for dropdown
async function loadCategories() {
    try {
        categories = await apiRequest('/categories?lang=uz');
        
        const select = document.getElementById('product-category');
        if (select && categories.length > 0) {
            // Clear existing options except first
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
    }
}

// Handle Product Upload Form Submit
document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-upload-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleProductUpload();
        });
    }
    
    // Close buttons
    document.getElementById('cancel-product-upload-btn')?.addEventListener('click', closeProductUploadModal);
    document.getElementById('close-product-upload-modal')?.addEventListener('click', closeProductUploadModal);
    
    // Close on overlay click
    document.getElementById('product-upload-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'product-upload-modal') {
            closeProductUploadModal();
        }
    });
});

// Handle Product Upload
async function handleProductUpload() {
    const submitBtn = document.querySelector('#product-upload-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Yuklanmoqda...';
        
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
            alert('SKU majburiy!');
            return;
        }
        
        if (!productData.name_uz) {
            alert('O\'zbekcha nom majburiy!');
            return;
        }
        
        if (!productData.image_url) {
            alert('Rasm URL majburiy!');
            return;
        }
        
        if (!productData.price || productData.price <= 0) {
            alert('Narx 0 dan katta bo\'lishi kerak!');
            return;
        }
        
        // Create product via Amazing Store API
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
                // Continue anyway, inventory can be added later
            }
        }
        
        // Success!
        alert('✅ Tovar muvaffaqiyatli qo\'shildi!');
        closeProductUploadModal();
        
        // Reload products list
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Error uploading product:', error);
        alert('❌ Xatolik: ' + (error.message || 'Tovarni yuklab bo\'lmadi'));
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============================================
// BANNER UPLOAD MODAL
// ============================================

// Open Banner Upload Modal
function openBannerUploadModal() {
    const modal = document.getElementById('banner-upload-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close Banner Upload Modal
function closeBannerUploadModal() {
    const modal = document.getElementById('banner-upload-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        document.getElementById('banner-upload-form').reset();
        
        // Hide conditional fields
        document.getElementById('banner-link-id-group').style.display = 'none';
        document.getElementById('banner-link-url-group').style.display = 'none';
    }
}

// Handle Banner Link Type Change
document.addEventListener('DOMContentLoaded', () => {
    const linkTypeSelect = document.getElementById('banner-link-type');
    if (linkTypeSelect) {
        linkTypeSelect.addEventListener('change', (e) => {
            const linkIdGroup = document.getElementById('banner-link-id-group');
            const linkUrlGroup = document.getElementById('banner-link-url-group');
            
            // Hide all first
            linkIdGroup.style.display = 'none';
            linkUrlGroup.style.display = 'none';
            
            // Show based on selection
            if (e.target.value === 'product' || e.target.value === 'category') {
                linkIdGroup.style.display = 'block';
            } else if (e.target.value === 'url') {
                linkUrlGroup.style.display = 'block';
            }
        });
    }
    
    // Banner form submit
    const bannerForm = document.getElementById('banner-upload-form');
    if (bannerForm) {
        bannerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleBannerUpload();
        });
    }
    
    // Close buttons
    document.getElementById('cancel-banner-upload-btn')?.addEventListener('click', closeBannerUploadModal);
    document.getElementById('close-banner-upload-modal')?.addEventListener('click', closeBannerUploadModal);
    
    // Close on overlay click
    document.getElementById('banner-upload-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'banner-upload-modal') {
            closeBannerUploadModal();
        }
    });
});

// Handle Banner Upload
async function handleBannerUpload() {
    const submitBtn = document.querySelector('#banner-upload-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Yuklanmoqda...';
        
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
            alert('Rasm URL majburiy!');
            return;
        }
        
        // Create banner via Amazing Store API
        const response = await apiRequest('/banners', {
            method: 'POST',
            body: JSON.stringify(bannerData)
        });
        
        console.log('Banner created:', response);
        
        // Success!
        alert('✅ Banner muvaffaqiyatli qo\'shildi!');
        closeBannerUploadModal();
        
    } catch (error) {
        console.error('Error uploading banner:', error);
        alert('❌ Xatolik: ' + (error.message || 'Bannerni yuklab bo\'lmadi'));
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Export functions for global access
window.openProductUploadModal = openProductUploadModal;
window.closeProductUploadModal = closeProductUploadModal;
window.openBannerUploadModal = openBannerUploadModal;
window.closeBannerUploadModal = closeBannerUploadModal;

