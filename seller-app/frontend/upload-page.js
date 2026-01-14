/**
 * Upload Page JavaScript
 * Handles product and banner upload forms
 */

let categories = [];
let lastEditedFieldInUpload = null; // Track last edited field in upload form

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
    // Check authentication first
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
        return;
    }
    hideAuthError();
    
    await loadCategories();
    setupConditionalFields();
    setupFieldTracking();
});

// Track last edited field in upload form
function setupFieldTracking() {
    const priceFields = [
        'product-price',
        'product-cost-price',
        'product-sale-price',
        'product-service-fee'
    ];
    
    priceFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', () => {
                lastEditedFieldInUpload = field;
            });
        }
    });
}

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
            name_ru: document.getElementById('product-name-ru').value.trim(),
            description_uz: document.getElementById('product-description-uz').value.trim(),
            description_ru: document.getElementById('product-description-ru').value.trim(),
            category_id: parseInt(document.getElementById('product-category').value),
            image_url: document.getElementById('product-image-url').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            sale_price: parseFloat(document.getElementById('product-sale-price').value),
            cost_price: parseFloat(document.getElementById('product-cost-price').value),
            service_fee: parseFloat(document.getElementById('product-service-fee').value),
            is_active: document.getElementById('product-is-active').checked
        };
        
        // Clear all previous errors
        const form = document.getElementById('product-form');
        if (form && window.validation) {
            window.validation.clearAllErrors(form);
        }
        
        // Validation - BARCHA MAJBURIY MAYDONLAR (with visual error display - oxirgi tekshirilgan field'ga error)
        let lastErrorField = null;
        
        if (!productData.sku) {
            lastErrorField = document.getElementById('product-sku');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'SKU majburiy!');
            }
            throw new Error('SKU majburiy!');
        }
        
        if (!productData.name_uz) {
            lastErrorField = document.getElementById('product-name-uz');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'O\'zbekcha nom majburiy!');
            }
            throw new Error('O\'zbekcha nom majburiy!');
        }
        
        if (!productData.name_ru) {
            lastErrorField = document.getElementById('product-name-ru');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'Ruscha nom majburiy!');
            }
            throw new Error('Ruscha nom majburiy!');
        }
        
        if (!productData.description_uz) {
            lastErrorField = document.getElementById('product-description-uz');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'O\'zbekcha tavsif majburiy!');
            }
            throw new Error('O\'zbekcha tavsif majburiy!');
        }
        
        if (!productData.description_ru) {
            lastErrorField = document.getElementById('product-description-ru');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'Ruscha tavsif majburiy!');
            }
            throw new Error('Ruscha tavsif majburiy!');
        }
        
        if (!productData.category_id) {
            lastErrorField = document.getElementById('product-category');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'Kategoriya tanlash majburiy!');
            }
            throw new Error('Kategoriya tanlash majburiy!');
        }
        
        if (!productData.image_url) {
            lastErrorField = document.getElementById('product-image-url');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'Rasm URL majburiy!');
            }
            throw new Error('Rasm URL majburiy!');
        }
        
        if (!productData.price || productData.price <= 0) {
            lastErrorField = document.getElementById('product-price');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'Narx majburiy va 0 dan katta bo\'lishi kerak!');
            }
            throw new Error('Narx majburiy va 0 dan katta bo\'lishi kerak!');
        }
        
        if (!productData.cost_price || productData.cost_price <= 0) {
            lastErrorField = document.getElementById('product-cost-price');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'Tan narxi majburiy va 0 dan katta bo\'lishi kerak!');
            }
            throw new Error('Tan narxi majburiy va 0 dan katta bo\'lishi kerak!');
        }
        
        if (!productData.sale_price || productData.sale_price <= 0) {
            lastErrorField = document.getElementById('product-sale-price');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'Haqiqiy sotish narxi majburiy va 0 dan katta bo\'lishi kerak!');
            }
            throw new Error('Haqiqiy sotish narxi majburiy va 0 dan katta bo\'lishi kerak!');
        }
        
        if (productData.service_fee === null || productData.service_fee === undefined || productData.service_fee < 0) {
            lastErrorField = document.getElementById('product-service-fee');
            if (lastErrorField && window.validation) {
                window.validation.showError(lastErrorField, 'Xizmatlar narxi majburiy (0 yoki undan yuqori)!');
            }
            throw new Error('Xizmatlar narxi majburiy (0 yoki undan yuqori)!');
        }
        
        // Validate sale_price <= price with visual error display (xatolikka sabab bo'lgan field'ga error)
        if (productData.sale_price >= productData.price) {
            // Xatolikka sabab bo'lgan field'ni aniqlash
            let errorField = null;
            let errorMessage = '';
            
            // Agar lastEditedFieldInUpload xatolikka sabab bo'lgan field bo'lsa, uni ishlat
            if (lastEditedFieldInUpload) {
                const fieldId = lastEditedFieldInUpload.id;
                if (fieldId === 'product-sale-price' || fieldId === 'product-price') {
                    errorField = lastEditedFieldInUpload;
                }
            }
            
            // Agar topilmagan bo'lsa, mantiqiy aniqlash
            if (!errorField) {
                // sale_price >= price bo'lsa, xatolikka sabab bo'lgan field'ni aniqlash
                // Agar price kichik bo'lsa (masalan, 66000 < 345000), u xatolikka sabab
                // Agar sale_price katta bo'lsa (masalan, 345000 > 66000), u xatolikka sabab
                if (productData.price < productData.sale_price) {
                    // price kichik bo'lsa, price field'iga error
                    errorField = document.getElementById('product-price');
                    errorMessage = 'Chizilgan narx sotish narxidan katta bo\'lishi kerak';
                } else {
                    // sale_price katta bo'lsa
                    errorField = document.getElementById('product-sale-price');
                    errorMessage = 'Sotish narxi chizilgan narxdan kichik bo\'lishi kerak';
                }
            } else {
                // lastEditedFieldInUpload to'g'ri field bo'lsa, unga mos xabar
                const fieldId = errorField.id;
                if (fieldId === 'product-sale-price') {
                    errorMessage = 'Sotish narxi chizilgan narxdan kichik bo\'lishi kerak';
                } else if (fieldId === 'product-price') {
                    errorMessage = 'Chizilgan narx sotish narxidan katta bo\'lishi kerak';
                }
            }
            
            if (errorField && errorMessage && window.validation) {
                window.validation.showError(errorField, errorMessage);
            }
            // Don't throw - error already shown on field
            return;
        }
        
        // Rentabillik hisoblash (sale_price - cost_price - service_fee) - xatolikka sabab bo'lgan field'ga error
        const profitability = productData.sale_price - productData.cost_price - productData.service_fee;
        if (profitability <= 0) {
            // Xatolikka sabab bo'lgan field'ni aniqlash
            let errorField = null;
            let errorMessage = '';
            
            // Agar lastEditedFieldInUpload xatolikka sabab bo'lgan field bo'lsa, uni ishlat
            if (lastEditedFieldInUpload) {
                const fieldId = lastEditedFieldInUpload.id;
                if (fieldId === 'product-sale-price' || fieldId === 'product-cost-price' || fieldId === 'product-service-fee') {
                    errorField = lastEditedFieldInUpload;
                }
            }
            
            // Agar topilmagan bo'lsa, mantiqiy aniqlash
            if (!errorField) {
                // Qaysi field xatolikka sabab bo'lganini aniqlash
                const totalCost = productData.cost_price + productData.service_fee;
                if (totalCost >= productData.sale_price) {
                    // Qaysi biri katta ekanligini aniqlash
                    if (productData.service_fee > productData.cost_price && productData.service_fee > productData.sale_price * 0.5) {
                        // service_fee juda katta
                        errorField = document.getElementById('product-service-fee');
                        errorMessage = `Foyda manfiy! Xizmatlar narxi juda yuqori (${productData.sale_price} - ${productData.cost_price} - ${productData.service_fee} = ${profitability})`;
                    } else if (productData.cost_price > productData.sale_price) {
                        // cost_price juda katta
                        errorField = document.getElementById('product-cost-price');
                        errorMessage = `Foyda manfiy! Tannarx sotish narxidan kichik bo'lishi kerak (${productData.sale_price} - ${productData.cost_price} - ${productData.service_fee} = ${profitability})`;
                    } else {
                        // sale_price juda kichik
                        errorField = document.getElementById('product-sale-price');
                        errorMessage = `Foyda manfiy! Sotish narxi tannarx va xizmatlar narxidan katta bo'lishi kerak (${productData.sale_price} - ${productData.cost_price} - ${productData.service_fee} = ${profitability})`;
                    }
                } else {
                    // sale_price juda kichik
                    errorField = document.getElementById('product-sale-price');
                    errorMessage = `Foyda manfiy! Sotish narxi tannarx va xizmatlar narxidan katta bo'lishi kerak (${productData.sale_price} - ${productData.cost_price} - ${productData.service_fee} = ${profitability})`;
                }
            } else {
                // lastEditedFieldInUpload to'g'ri field bo'lsa, unga mos xabar
                const fieldId = errorField.id;
                if (fieldId === 'product-sale-price') {
                    errorMessage = `Foyda manfiy! Sotish narxi tannarx va xizmatlar narxidan katta bo'lishi kerak (${productData.sale_price} - ${productData.cost_price} - ${productData.service_fee} = ${profitability})`;
                } else if (fieldId === 'product-cost-price') {
                    errorMessage = `Foyda manfiy! Tannarx sotish narxidan kichik bo'lishi kerak (${productData.sale_price} - ${productData.cost_price} - ${productData.service_fee} = ${profitability})`;
                } else if (fieldId === 'product-service-fee') {
                    errorMessage = `Foyda manfiy! Xizmatlar narxi juda yuqori (${productData.sale_price} - ${productData.cost_price} - ${productData.service_fee} = ${profitability})`;
                }
            }
            
            if (errorField && errorMessage && window.validation) {
                window.validation.showError(errorField, errorMessage);
            }
            // Don't throw - error already shown on field
            return;
        }
        
        // Create product
        const response = await apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        
        console.log('Product created:', response);
        
        // NO NEED to create separate price entry - all prices in products table now!
        console.log('✅ Product created with all prices in products table');
        
        // Success!
        showSuccess('✅ Tovar muvaffaqiyatli qo\'shildi!');
        document.getElementById('product-form').reset();
        document.getElementById('product-is-active').checked = true;
        
        // AUTO-REDIRECT O'CHIRILDI - Faqat back button orqali chiqish mumkin
        
    } catch (error) {
        console.error('Error uploading product:', error);
        // Error already shown on field via window.validation.showError
        // Only show general error if it's not a validation error
        if (!error.message || (!error.message.includes('majburiy') && !error.message.includes('kichik') && !error.message.includes('manfiy'))) {
            showError(error.message || 'Tovarni yuklab bo\'lmadi');
        }
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
