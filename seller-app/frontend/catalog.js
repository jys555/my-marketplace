// Catalog Page JavaScript
let currentMarketplaceId = null;
let currentMarketplaceName = 'AMAZING_STORE';
let products = [];
let inventory = [];
let selectedProducts = new Set();
// PERFORMANCE: Pagination state
let productsPagination = {
    hasMore: false,
    total: 0,
    currentOffset: 0,
    isLoading: false,
    limit: 50 // Default 50 ta (table formatida ko'proq ko'rsatish)
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Get marketplace from localStorage (set by dashboard)
    const savedMarketplace = localStorage.getItem('selectedMarketplace');
    if (savedMarketplace) {
        try {
            const marketplace = JSON.parse(savedMarketplace);
            // If marketplace id is string like 'amazing_store', get real ID from API
            if (marketplace.id && typeof marketplace.id === 'string' && marketplace.id !== 'all') {
                const marketplaces = await apiRequest('/marketplaces');
                const foundMarketplace = marketplaces.find(m => 
                    m.name === marketplace.name || 
                    m.marketplace_code === marketplace.id ||
                    m.id.toString() === marketplace.id
                );
                if (foundMarketplace) {
                    currentMarketplaceId = foundMarketplace.id;
                    currentMarketplaceName = foundMarketplace.name;
                } else {
                    // Default to Amazing Store
                    const amazingStore = marketplaces.find(m => m.name === 'AMAZING_STORE');
                    if (amazingStore) {
                        currentMarketplaceId = amazingStore.id;
                        currentMarketplaceName = 'AMAZING_STORE';
                    }
                }
            } else if (marketplace.id === 'all') {
                currentMarketplaceId = null;
                currentMarketplaceName = "Barcha do'konlar";
            } else {
                currentMarketplaceId = marketplace.id;
                currentMarketplaceName = marketplace.name || 'AMAZING_STORE';
            }
        } catch (e) {
            console.error('Error parsing marketplace:', e);
            // Default to Amazing Store
            try {
                const marketplaces = await apiRequest('/marketplaces');
                const amazingStore = marketplaces.find(m => m.name === 'AMAZING_STORE');
                if (amazingStore) {
                    currentMarketplaceId = amazingStore.id;
                    currentMarketplaceName = 'AMAZING_STORE';
                }
            } catch (err) {
                console.error('Error loading marketplaces:', err);
            }
        }
    } else {
        // Default to Amazing Store
        try {
            const marketplaces = await apiRequest('/marketplaces');
            const amazingStore = marketplaces.find(m => m.name === 'AMAZING_STORE');
            if (amazingStore) {
                currentMarketplaceId = amazingStore.id;
                currentMarketplaceName = 'AMAZING_STORE';
            }
        } catch (err) {
            console.error('Error loading marketplaces:', err);
        }
    }
    
    await loadProducts();
    setupEventListeners();
});

// Load Products
async function loadProducts() {
    const tableBody = document.getElementById('products-table-body');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('products-table');

    if (!tableBody) return;

    try {
        loadingState.style.display = 'flex';
        table.style.display = 'none';
        emptyState.style.display = 'none';
        
        // PERFORMANCE: Reset offset if it's a new search/initial load
        // (Agar search o'zgarganda, offset 0 dan boshlaydi - bu setupEventListeners'da qilinadi)

        // PERFORMANCE: Load products with pagination
        // API response'da ID yashirilgan (_id), SKU asosiy identifier
        const searchParam = document.getElementById('search-input')?.value ? `&search=${encodeURIComponent(document.getElementById('search-input').value)}` : '';
        
        // Marketplace filter
        const yandexChecked = document.getElementById('filter-yandex')?.checked;
        const uzumChecked = document.getElementById('filter-uzum')?.checked;
        let marketplaceParam = '';
        if (yandexChecked && !uzumChecked) {
            marketplaceParam = '&marketplace_type=yandex';
        } else if (uzumChecked && !yandexChecked) {
            marketplaceParam = '&marketplace_type=uzum';
        }
        // Agar ikkalasi ham tanlangan bo'lsa yoki hech biri tanlanmagan bo'lsa, filter qo'llanmaydi
        
        console.log('📦 Loading products from API:', `/products?limit=${productsPagination.limit}&offset=${productsPagination.currentOffset}${searchParam}${marketplaceParam}`);
        const productsResponse = await apiRequest(`/products?limit=${productsPagination.limit}&offset=${productsPagination.currentOffset}${searchParam}${marketplaceParam}`);
        console.log('📦 Products API response:', productsResponse);
        
        // PERFORMANCE: Pagination response format: { products: [...], pagination: {...} }
        let newProducts;
        if (productsResponse && productsResponse.products) {
            // Yangi format (pagination bilan)
            newProducts = productsResponse.products;
            if (productsResponse.pagination) {
                productsPagination = {
                    hasMore: productsResponse.pagination.hasMore || false,
                    total: productsResponse.pagination.total || 0,
                    currentOffset: productsResponse.pagination.offset + productsResponse.pagination.currentCount,
                    isLoading: false,
                    limit: productsResponse.pagination.limit
                };
            }
        } else {
            // Eski format (backward compatibility) - faqat array
            newProducts = Array.isArray(productsResponse) ? productsResponse : [];
            productsPagination = {
                hasMore: false,
                total: newProducts.length,
                currentOffset: newProducts.length,
                isLoading: false,
                limit: 50
            };
        }
        
        // PERFORMANCE: Append qilish yoki to'liq almashtirish
        if (productsPagination.currentOffset > productsPagination.limit && products.length > 0) {
            // Append (keyingi sahifa)
            products = [...products, ...newProducts];
        } else {
            // Yangi yuklash
            products = newProducts;
        }
        
        // Backend compatibility: agar _id bo'lsa, id'ga o'zgartirish (ichki ishlatish)
        products = products.map(p => {
            if (p._id && !p.id) {
                p.id = p._id; // Backend foreign keys uchun
            }
            return p;
        });

        // NO NEED to load prices - all prices in products now!
        // Load inventory
        try {
            inventory = await apiRequest('/inventory');
            if (!Array.isArray(inventory)) {
                console.warn('⚠️ Inventory is not an array, using empty array:', inventory);
                inventory = [];
            }
        } catch (error) {
            console.error('❌ Error loading inventory:', error);
            inventory = [];
        }

        // PERFORMANCE: Backend'da allaqachon search qilingan, shuning uchun filter kerak emas
        const filteredProducts = Array.isArray(products) ? products : [];

        if (filteredProducts.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            table.style.display = 'none';
            return;
        }

        // PERFORMANCE: Render products as table rows (yangi yuklash - to'liq almashtirish)
        tableBody.innerHTML = '';
        filteredProducts.forEach(product => {
            const row = createProductRow(product);
            tableBody.appendChild(row);
        });

        // PERFORMANCE: Infinite scroll sozlash (DOM tayyor bo'lgandan keyin)
        setTimeout(() => setupInfiniteScroll(), 100);

        loadingState.style.display = 'none';
        table.style.display = 'table';
        emptyState.style.display = 'none';
    } catch (error) {
        console.error('Error loading products:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        table.style.display = 'none';
    }
}

// Create Product Table Row
function createProductRow(product) {
    const row = document.createElement('tr');
    row.className = 'product-row';
    // SKU'ni asosiy identifier sifatida ishlatish (ID yashiriladi)
    row.dataset.productSku = product.sku;
    row.dataset.productId = product._id || product.id; // _id asosiy, id fallback
    
    // All price data is IN product object now!
    const productId = product._id || product.id;
    const invData = inventory.find(i => i.product_id === productId);
    
    // Marketplace filter tanlanganda, marketplace ma'lumotlarini ishlatish
    const yandexChecked = document.getElementById('filter-yandex')?.checked;
    const uzumChecked = document.getElementById('filter-uzum')?.checked;
    const isMarketplaceFilterActive = yandexChecked || uzumChecked;
    const selectedMarketplaceType = yandexChecked ? 'yandex' : (uzumChecked ? 'uzum' : null);
    
    // Agar marketplace filter tanlangan bo'lsa va product'da marketplace ma'lumotlari bo'lsa, ularni ishlatish
    let quantity = invData?.quantity || 0;
    let costPrice = product.cost_price;
    let sellingPrice = product.sale_price;
    let strikethroughPrice = product.price;
    let serviceFee = product.service_fee;
    
    if (isMarketplaceFilterActive && product.marketplace && product.marketplace.type === selectedMarketplaceType) {
        // Marketplace ma'lumotlarini ishlatish
        // Stock: marketplace stock (agar mavjud bo'lsa)
        if (product.marketplace.stock !== null && product.marketplace.stock !== undefined) {
            quantity = product.marketplace.stock;
        }
        
        // Narx: marketplace narxi (agar mavjud bo'lsa)
        if (product.marketplace.price !== null && product.marketplace.price !== undefined) {
            sellingPrice = product.marketplace.price;
            // Marketplace'da odatda faqat bitta narx bo'ladi, shuning uchun strikethrough narxni ham shu narxga tenglashtirish mumkin
            strikethroughPrice = product.marketplace.price;
        }
        
        // Komissiya: marketplace komissiya foizi
        if (product.marketplace.commission_rate !== null && product.marketplace.commission_rate !== undefined) {
            // Komissiya foizini so'mga aylantirish
            const commissionRate = product.marketplace.commission_rate;
            if (sellingPrice && commissionRate) {
                serviceFee = (sellingPrice * commissionRate) / 100;
            }
        }
        
        console.log('🛒 Using marketplace data:', {
            sku: product.sku,
            marketplaceType: selectedMarketplaceType,
            marketplacePrice: product.marketplace.price,
            marketplaceStock: product.marketplace.stock,
            marketplaceCommissionRate: product.marketplace.commission_rate,
            calculatedServiceFee: serviceFee
        });
    } else {
        // Amazing Store ma'lumotlarini ishlatish (default)
        console.log('🏪 Using Amazing Store data:', {
            sku: product.sku,
            costPrice,
            sellingPrice,
            serviceFee
        });
    }
    
    // VALIDATION: Log if price data is missing
    if (!costPrice || !sellingPrice || serviceFee === undefined || serviceFee === null) {
        console.error('❌ INCOMPLETE PRICE DATA:', { 
            sku: product.sku, 
            costPrice, 
            sellingPrice, 
            serviceFee,
            fullProduct: product 
        });
    }
    
    console.log('✅ Product row:', { 
        sku: product.sku, 
        costPrice, 
        sellingPrice, 
        serviceFee,
        quantity 
    });
    
    // Calculate discount percentage
    let discountPercent = null;
    if (strikethroughPrice && sellingPrice) {
        discountPercent = Math.round(((strikethroughPrice - sellingPrice) / strikethroughPrice) * 100);
    }
    
    // Get last inventory update date
    const lastUpdate = invData?.last_updated_at ? new Date(invData.last_updated_at) : 
                       invData?.updated_at ? new Date(invData.updated_at) : null;
    const lastUpdateStr = lastUpdate ? formatDate(lastUpdate) : '';
    
    // Product SKU (majburiy, har doim mavjud)
    const sku = product.sku;
    
    // Calculate profitability (miqdor va foiz) from product data
    // ONLY if ALL required data is present!
    let profitability = null;
    let profitabilityPercentage = null;
    
    if (sellingPrice && costPrice && serviceFee !== null && serviceFee !== undefined) {
        profitability = sellingPrice - costPrice - serviceFee;
        profitabilityPercentage = (profitability / sellingPrice) * 100;
        console.log('💰 Profitability calculated:', { 
            sku: product.sku,
            sellingPrice, 
            costPrice, 
            serviceFee, 
            profitability, 
            profitabilityPercentage: profitabilityPercentage.toFixed(1) + '%'
        });
    } else {
        console.warn('⚠️ Cannot calculate profitability - missing data:', {
            sku: product.sku,
            sellingPrice,
            costPrice,
            serviceFee
        });
    }
    
    // Calculate commission (service fee is already a fixed amount, not a percentage)
    // For display purposes, we'll show the service fee details
    const commissionAmount = serviceFee;
    const commissionRate = sellingPrice > 0 ? ((serviceFee / sellingPrice) * 100).toFixed(1) : null;
    
    // Rentabillik rangini aniqlash - FAQAT agar hisoblangan bo'lsa!
    let profitabilityClass = '';
    let profitabilityDisplay = '-';
    
    if (profitabilityPercentage !== null && profitabilityPercentage !== undefined && !isNaN(profitabilityPercentage)) {
        profitabilityDisplay = profitabilityPercentage.toFixed(1) + '%';
        
        if (profitabilityPercentage < 30) {
            profitabilityClass = 'profit-low'; // Qizil
        } else if (profitabilityPercentage >= 30 && profitabilityPercentage <= 40) {
            profitabilityClass = 'profit-medium'; // Zarg'aldoq
        } else if (profitabilityPercentage > 40) {
            profitabilityClass = 'profit-high'; // Yashil
        }
    } else {
        profitabilityClass = 'profit-missing'; // Bo'sh
    }
    
    row.innerHTML = `
        <td class="checkbox-col">
            <input type="checkbox" class="product-checkbox" data-product-sku="${product.sku}" data-product-id="${product.id}" aria-label="Select product">
        </td>
        <td class="product-col">
            <div class="product-info">
                <div class="product-image-small">
                    ${product.image_url ? 
                        `<img src="${product.image_url}" alt="${product.name_uz || product.name_ru}" class="product-img">` : 
                        `<div class="product-img-placeholder">Rasm yo'q</div>`
                    }
                </div>
                <div class="product-details">
                    <div class="product-name">${product.name_uz || product.name_ru || 'Nomsiz'}</div>
                    <div class="product-sku">${sku}</div>
                </div>
            </div>
        </td>
        <td class="warehouse-col">
            <div class="warehouse-info">
                <div class="warehouse-quantity">${quantity}</div>
                ${isMarketplaceFilterActive && product.marketplace && product.marketplace.type === selectedMarketplaceType && product.marketplace.last_synced_at ? 
                    `<div class="warehouse-date" style="font-size: 11px; color: #667eea;">Sync: ${formatDate(new Date(product.marketplace.last_synced_at))}</div>` : 
                    (lastUpdateStr ? `<div class="warehouse-date">${lastUpdateStr}</div>` : '')
                }
                ${isMarketplaceFilterActive && product.marketplace && product.marketplace.type === selectedMarketplaceType ? 
                    `<div style="margin-top: 4px; font-size: 11px; color: #667eea; font-weight: 500;">${selectedMarketplaceType === 'yandex' ? 'Yandex' : 'Uzum'}</div>` : 
                    ''
                }
            </div>
        </td>
        <td class="cost-col">
            <div class="cost-price">
                ${costPrice ? formatPrice(costPrice) : '-'}
            </div>
        </td>
        <td class="price-col">
            <div class="price-info">
                <div class="current-price" data-product-sku="${product.sku}" data-product-id="${product.id}">
                    ${sellingPrice ? formatPrice(sellingPrice) : '-'}
                </div>
                ${strikethroughPrice ? `
                    <div class="strikethrough-info">
                        <span class="strikethrough-price">${formatPrice(strikethroughPrice)}</span>
                        ${discountPercent ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                    </div>
                ` : ''}
            </div>
        </td>
        <td class="service-col">
            <div class="service-price-info">
                ${commissionRate && commissionAmount ? `
                    <div class="service-rate">${commissionRate}%</div>
                    <div class="service-amount">${formatPrice(commissionAmount)}</div>
                ` : '-'}
            </div>
        </td>
        <td class="profitability-col">
            <div class="profitability-info ${profitabilityClass}">
                ${profitabilityDisplay}
            </div>
        </td>
        <td class="actions-col">
            <button class="actions-btn" data-product-sku="${product.sku}" data-product-id="${product.id}" aria-label="More actions">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                </svg>
            </button>
        </td>
    `;

    // Add event listeners
    const checkbox = row.querySelector('.product-checkbox');
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            // SKU orqali saqlash (ID yashirilgan)
            if (e.target.checked) {
                selectedProducts.add(product.sku);
            } else {
                selectedProducts.delete(product.sku);
            }
            updateSelectAllCheckbox();
        });
    }

    // Add click listener for selling price
    const priceEl = row.querySelector('.current-price');
    if (priceEl && sellingPrice) {
        priceEl.style.cursor = 'pointer';
        priceEl.addEventListener('click', () => {
            openEditPriceModal(product.sku);
        });
    }

    // Actions button
    const actionsBtn = row.querySelector('.actions-btn');
    if (actionsBtn) {
        actionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // TODO: Show actions menu
            console.log('Actions for product SKU:', product.sku);
        });
    }

    return row;
}

// Format Price
function formatPrice(price) {
    if (!price && price !== 0) return '-';
    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price).replace('UZS', 'so\'m');
}

// Format Date
function formatDate(date) {
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 
                    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
}

// Update Product Quantity (SKU orqali)
async function updateProductQuantity(productSku, quantity) {
    const qty = parseInt(quantity) || 0;
    
    try {
        // SKU orqali product ID'ni topish
        const product = products.find(p => p.sku === productSku);
        if (!product) {
            throw new Error('Product not found');
        }
        
        // Update inventory (ID orqali - backend ichki ishlatish)
        await apiRequest(`/inventory/${product.id}/adjust`, {
            method: 'PUT',
            body: JSON.stringify({ 
                quantity: qty,
                notes: 'Qoldiq yangilandi'
            })
        });
        
        // Reload products to reflect changes
        await loadProducts();
    } catch (error) {
        console.error('Error updating product quantity:', error);
        alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
        // Reload to reset input
        await loadProducts();
    }
}

// Track last edited field in edit price modal
let lastEditedFieldInModal = null;

// Open Edit Price Modal (SKU orqali)
function openEditPriceModal(productSku) {
    const product = products.find(p => p.sku === productSku);
    if (!product) return;
    
    // All price data is now in product object directly!
    const modal = document.getElementById('edit-price-modal');
    
    if (!modal) return;
    
    // Reset last edited field
    lastEditedFieldInModal = null;
    
    // ID'ni yashirilgan holda saqlash (backend uchun)
    document.getElementById('edit-product-id').value = product._id || product.id;
    document.getElementById('edit-marketplace-id').value = currentMarketplaceId || '';
    document.getElementById('edit-cost-price').value = product.cost_price || '';
    document.getElementById('edit-selling-price').value = product.sale_price || '';
    document.getElementById('edit-strikethrough-price').value = product.price || '';
    document.getElementById('edit-service-fee').value = product.service_fee || '';
    
    // Track last edited field
    const fields = ['edit-cost-price', 'edit-selling-price', 'edit-strikethrough-price', 'edit-service-fee'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Remove existing listeners by cloning (but preserve value)
            const value = field.value;
            const newField = field.cloneNode(true);
            newField.value = value; // Preserve value
            field.parentNode.replaceChild(newField, field);
            
            // Add new listener
            newField.addEventListener('input', () => {
                lastEditedFieldInModal = newField;
            });
        }
    });
    
    modal.classList.add('active');
}

// Close Edit Price Modal
function closeEditModal() {
    const modal = document.getElementById('edit-price-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Update Select All Checkbox
function updateSelectAllCheckbox() {
    const selectAll = document.getElementById('select-all-checkbox');
    if (!selectAll) return;
    
    const checkboxes = document.querySelectorAll('.product-checkbox');
    const checkedCount = selectedProducts.size;
    
    if (checkedCount === 0) {
        selectAll.indeterminate = false;
        selectAll.checked = false;
    } else if (checkedCount === checkboxes.length) {
        selectAll.indeterminate = false;
        selectAll.checked = true;
    } else {
        selectAll.indeterminate = true;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Marketplace filter event listeners
    const yandexCheckbox = document.getElementById('filter-yandex');
    const uzumCheckbox = document.getElementById('filter-uzum');
    
    if (yandexCheckbox) {
        yandexCheckbox.addEventListener('change', () => {
            // Agar bitta tanlansa, ikkinchisini o'chirish
            if (yandexCheckbox.checked && uzumCheckbox?.checked) {
                uzumCheckbox.checked = false;
            }
            // Reset pagination va reload products
            productsPagination.currentOffset = 0;
            loadProducts();
        });
    }
    
    if (uzumCheckbox) {
        uzumCheckbox.addEventListener('change', () => {
            // Agar bitta tanlansa, ikkinchisini o'chirish
            if (uzumCheckbox.checked && yandexCheckbox?.checked) {
                yandexCheckbox.checked = false;
            }
            // Reset pagination va reload products
            productsPagination.currentOffset = 0;
            loadProducts();
        });
    }
    // PERFORMANCE: Search input - pagination'ni reset qilish
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // PERFORMANCE: Search o'zgarganda pagination'ni reset qilish
                productsPagination.currentOffset = 0;
                products = []; // Reset products array
                loadProducts();
            }, 300);
        });
    }

    // Select all checkbox
    const selectAll = document.getElementById('select-all-checkbox');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.product-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                const productSku = checkbox.dataset.productSku;
                if (e.target.checked) {
                    selectedProducts.add(productSku);
                } else {
                    selectedProducts.delete(productSku);
                }
            });
        });
    }

    // Edit price modal
    const editForm = document.getElementById('edit-price-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const closeEditModalBtn = document.getElementById('close-edit-modal');

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await savePrice();
        });
    }

    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);

    // Close modal on overlay click
    const modal = document.getElementById('edit-price-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditModal();
            }
        });
    }

}

// PERFORMANCE: Infinite Scroll - Load More Products
async function loadMoreProducts() {
    if (productsPagination.isLoading || !productsPagination.hasMore) {
        return;
    }

    productsPagination.isLoading = true;
    showProductsLoading();

    try {
        const searchParam = document.getElementById('search-input')?.value ? `&search=${encodeURIComponent(document.getElementById('search-input').value)}` : '';
        const productsResponse = await apiRequest(`/products?limit=${productsPagination.limit}&offset=${productsPagination.currentOffset}${searchParam}`);
        
        let newProducts;
        if (productsResponse && productsResponse.products) {
            newProducts = productsResponse.products;
            if (productsResponse.pagination) {
                productsPagination = {
                    hasMore: productsResponse.pagination.hasMore || false,
                    total: productsResponse.pagination.total || 0,
                    currentOffset: productsResponse.pagination.offset + productsResponse.pagination.currentCount,
                    isLoading: false,
                    limit: productsResponse.pagination.limit
                };
            }
        } else {
            newProducts = Array.isArray(productsResponse) ? productsResponse : [];
            productsPagination.hasMore = false;
        }

        // Backend compatibility
        newProducts = newProducts.map(p => {
            if (p._id && !p.id) {
                p.id = p._id;
            }
            return p;
        });

        // Append to existing products
        products = [...products, ...newProducts];

        // PERFORMANCE: Render new products (append to table)
        const tableBody = document.getElementById('products-table-body');
        if (tableBody) {
            newProducts.forEach(product => {
                const row = createProductRow(product);
                tableBody.appendChild(row);
            });
        }

        // Re-attach event listeners for new rows
        attachProductRowListeners();
        
        // Setup infinite scroll again for next batch
        setTimeout(() => setupInfiniteScroll(), 100);
    } catch (error) {
        console.error('Error loading more products:', error);
        hideProductsLoading();
    } finally {
        productsPagination.isLoading = false;
    }
}

// PERFORMANCE: Infinite Scroll Setup
let infiniteScrollObserver = null;

function setupInfiniteScroll() {
    // Eski observer'ni tozalash
    if (infiniteScrollObserver) {
        infiniteScrollObserver.disconnect();
    }
    
    // PERFORMANCE: Intersection Observer sozlash
    infiniteScrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Agar loading indicator ko'rinadigan bo'lsa va yuklanmagan bo'lsa
            if (entry.isIntersecting) {
                if (productsPagination.hasMore && !productsPagination.isLoading) {
                    loadMoreProducts();
                }
            }
        });
    }, {
        root: null, // viewport
        rootMargin: '200px', // 200px oldindan yuklash
        threshold: 0.1
    });
    
    // Observer'ni qo'shish (loading indicator ko'rinadi)
    const loadingIndicator = document.getElementById('products-loading');
    if (loadingIndicator && productsPagination.hasMore) {
        loadingIndicator.style.display = 'flex';
        infiniteScrollObserver.observe(loadingIndicator);
    } else if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// PERFORMANCE: Show/Hide Loading Indicator
function showProductsLoading() {
    const loadingIndicator = document.getElementById('products-loading');
    if (loadingIndicator && productsPagination.hasMore) {
        loadingIndicator.style.display = 'flex';
    }
}

function hideProductsLoading() {
    const loadingIndicator = document.getElementById('products-loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Attach event listeners to product rows (for newly added rows)
function attachProductRowListeners() {
    // This function will be called after adding new rows
    // Event listeners are already attached in createProductRow function
    // But we might need to re-attach checkbox listeners
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(checkbox => {
        if (!checkbox.dataset.listenerAttached) {
            checkbox.addEventListener('change', (e) => {
                const productSku = checkbox.dataset.productSku;
                if (e.target.checked) {
                    selectedProducts.add(productSku);
                } else {
                    selectedProducts.delete(productSku);
                }
                updateSelectAllCheckbox();
            });
            checkbox.dataset.listenerAttached = 'true';
        }
    });
}

// Save Price
async function savePrice() {
    const form = document.getElementById('edit-price-form');
    if (!form) return;

    // Frontend validation
    const schema = {
        'edit-cost-price': {
            validator: (value, fieldName) => window.validation.validatePositive(value, fieldName),
            fieldName: 'Cost price'
        },
        'edit-selling-price': {
            validator: (value, fieldName) => window.validation.validatePositive(window.validation.validateRequired(value, fieldName), fieldName),
            fieldName: 'Selling price'
        },
        'edit-strikethrough-price': {
            validator: (value, fieldName) => window.validation.validatePositive(value, fieldName),
            fieldName: 'Strikethrough price'
        },
        'edit-service-fee': {
            validator: (value, fieldName) => window.validation.validatePositive(value, fieldName),
            fieldName: 'Service fee'
        }
    };

    const validation = window.validation.validateForm(form, schema);
    if (!validation.valid) {
        // Errors already displayed by validateForm
        return;
    }

    // Get validated data
    const costPrice = validation.data['edit-cost-price'] || null;
    const sellingPrice = validation.data['edit-selling-price'] || null;
    const strikethroughPrice = validation.data['edit-strikethrough-price'] || null;
    const serviceFee = validation.data['edit-service-fee'] || null;

    // Cross-field validation: sale_price must be <= price (strikethrough_price)
    // Agar strikethrough_price bo'lmasa, selling_price o'zi price bo'ladi
    const actualPrice = strikethroughPrice || sellingPrice;
    
    if (actualPrice && sellingPrice && sellingPrice > actualPrice) {
        // Xatolikka sabab bo'lgan field'ni aniqlash
        let errorField = null;
        let errorMessage = '';
        
        // Agar lastEditedFieldInModal xatolikka sabab bo'lgan field bo'lsa, uni ishlat
        if (lastEditedFieldInModal) {
            const fieldId = lastEditedFieldInModal.id;
            if (fieldId === 'edit-selling-price' || fieldId === 'edit-strikethrough-price') {
                errorField = lastEditedFieldInModal;
            }
        }
        
        // Agar topilmagan bo'lsa, mantiqiy aniqlash
        if (!errorField) {
            // sellingPrice > strikethroughPrice bo'lsa, xatolikka sabab bo'lgan field'ni aniqlash
            // Agar strikethroughPrice kichik bo'lsa (masalan, 66000), u xatolikka sabab bo'lgan
            // Agar sellingPrice katta bo'lsa (masalan, 345000), u xatolikka sabab bo'lgan
            // Oddiy qoida: qaysi biri noto'g'ri bo'lsa, shu field'ga error
            // Lekin biz faqat bitta field'ga error ko'rsatamiz
            // Agar strikethroughPrice kichik bo'lsa (66000 < 345000), strikethrough_price field'iga error
            // Agar sellingPrice katta bo'lsa (345000 > 66000), selling_price field'iga error
            // Mantiqiy: qaysi biri noto'g'ri bo'lsa, shu field'ga error
            
            // Agar strikethroughPrice kichik bo'lsa (masalan, 66000 < 345000), u xatolikka sabab
            if (strikethroughPrice && strikethroughPrice < sellingPrice) {
                errorField = document.getElementById('edit-strikethrough-price');
                errorMessage = 'Chizilgan narx sotish narxidan katta bo\'lishi kerak';
            } else {
                // sellingPrice katta bo'lsa
                errorField = document.getElementById('edit-selling-price');
                errorMessage = 'Sotish narxi chizilgan narxdan kichik bo\'lishi kerak';
            }
        } else {
            // lastEditedFieldInModal to'g'ri field bo'lsa, unga mos xabar
            const fieldId = errorField.id;
            if (fieldId === 'edit-selling-price') {
                errorMessage = 'Sotish narxi chizilgan narxdan kichik bo\'lishi kerak';
            } else if (fieldId === 'edit-strikethrough-price') {
                errorMessage = 'Chizilgan narx sotish narxidan katta bo\'lishi kerak';
            }
        }
        
        if (errorField && errorMessage) {
            window.validation.showError(errorField, errorMessage);
        }
        return;
    }

    // Rentabillik tekshirish: sale_price - cost_price - service_fee > 0
    if (sellingPrice && costPrice !== null && serviceFee !== null) {
        const profitability = sellingPrice - costPrice - serviceFee;
        if (profitability <= 0) {
            // Xatolikka sabab bo'lgan field'ni aniqlash
            let errorField = null;
            let errorMessage = '';
            
        // Agar lastEditedFieldInModal xatolikka sabab bo'lgan field bo'lsa, uni ishlat
            if (lastEditedFieldInModal) {
                const fieldId = lastEditedFieldInModal.id;
                if (fieldId === 'edit-selling-price' || fieldId === 'edit-cost-price' || fieldId === 'edit-service-fee') {
                    errorField = lastEditedFieldInModal;
                }
            }
            
            // Agar topilmagan bo'lsa, mantiqiy aniqlash
            if (!errorField) {
                // Qaysi field xatolikka sabab bo'lganini aniqlash
                // Agar costPrice katta bo'lsa → cost_price field'iga error
                // Agar serviceFee katta bo'lsa → service_fee field'iga error
                // Agar sellingPrice kichik bo'lsa → selling_price field'iga error
                
                // Oddiy qoida: qaysi biri noto'g'ri bo'lsa, shu field'ga error
                // Lekin biz faqat bitta field'ga error ko'rsatamiz
                // Mantiqiy: qaysi biri xatolikka sabab bo'lganini aniqlash
                
                // Agar costPrice + serviceFee > sellingPrice bo'lsa
                const totalCost = costPrice + serviceFee;
                if (totalCost >= sellingPrice) {
                    // Qaysi biri katta ekanligini aniqlash
                    if (serviceFee > costPrice && serviceFee > sellingPrice * 0.5) {
                        // serviceFee juda katta
                        errorField = document.getElementById('edit-service-fee');
                        errorMessage = `Foyda manfiy! Xizmatlar narxi juda yuqori (${sellingPrice} - ${costPrice} - ${serviceFee} = ${profitability})`;
                    } else if (costPrice > sellingPrice) {
                        // costPrice juda katta
                        errorField = document.getElementById('edit-cost-price');
                        errorMessage = `Foyda manfiy! Tannarx sotish narxidan kichik bo'lishi kerak (${sellingPrice} - ${costPrice} - ${serviceFee} = ${profitability})`;
                    } else {
                        // sellingPrice juda kichik
                        errorField = document.getElementById('edit-selling-price');
                        errorMessage = `Foyda manfiy! Sotish narxi tannarx va xizmatlar narxidan katta bo'lishi kerak (${sellingPrice} - ${costPrice} - ${serviceFee} = ${profitability})`;
                    }
                } else {
                    // sellingPrice juda kichik
                    errorField = document.getElementById('edit-selling-price');
                    errorMessage = `Foyda manfiy! Sotish narxi tannarx va xizmatlar narxidan katta bo'lishi kerak (${sellingPrice} - ${costPrice} - ${serviceFee} = ${profitability})`;
                }
            } else {
                // lastEditedFieldInModal to'g'ri field bo'lsa, unga mos xabar
                const fieldId = errorField.id;
                if (fieldId === 'edit-selling-price') {
                    errorMessage = `Foyda manfiy! Sotish narxi tannarx va xizmatlar narxidan katta bo'lishi kerak (${sellingPrice} - ${costPrice} - ${serviceFee} = ${profitability})`;
                } else if (fieldId === 'edit-cost-price') {
                    errorMessage = `Foyda manfiy! Tannarx sotish narxidan kichik bo'lishi kerak (${sellingPrice} - ${costPrice} - ${serviceFee} = ${profitability})`;
                } else if (fieldId === 'edit-service-fee') {
                    errorMessage = `Foyda manfiy! Xizmatlar narxi juda yuqori (${sellingPrice} - ${costPrice} - ${serviceFee} = ${profitability})`;
                }
            }
            
            if (errorField && errorMessage) {
                window.validation.showError(errorField, errorMessage);
            }
            return;
        }
    }

    const productId = parseInt(document.getElementById('edit-product-id').value);
    const marketplaceId = document.getElementById('edit-marketplace-id').value || null;

    const priceData = {
        product_id: productId,
        marketplace_id: marketplaceId ? parseInt(marketplaceId) : null,
        cost_price: costPrice,
        selling_price: sellingPrice,
        service_fee: serviceFee,
        strikethrough_price: strikethroughPrice
    };

    try {
        // Update product directly (product_prices table was removed, all prices in products table)
        await apiRequest(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({
                price: priceData.strikethrough_price || priceData.selling_price,
                sale_price: priceData.selling_price,
                cost_price: priceData.cost_price,
                service_fee: priceData.service_fee
            })
        });

        // Update local product data (optimistic update - no full reload needed)
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            products[productIndex].cost_price = priceData.cost_price;
            products[productIndex].price = priceData.strikethrough_price || priceData.selling_price;
            products[productIndex].sale_price = priceData.selling_price;
            products[productIndex].service_fee = priceData.service_fee || 0;
            
            // Re-render just this product row
            const tableBody = document.getElementById('products-table-body');
            if (tableBody) {
                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    if (parseInt(row.dataset.productId) === productId) {
                        const newRow = createProductRow(products[productIndex]);
                        row.replaceWith(newRow);
                    }
                });
            }
        }

        closeEditModal();
        // Don't reload all products - just updated the specific one above
    } catch (error) {
        console.error('Error saving price:', error);
        alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
}

// Export functions for global access
window.updateProductQuantity = updateProductQuantity;
window.openEditPriceModal = openEditPriceModal;
window.closeEditModal = closeEditModal;
