// Catalog Page JavaScript
let currentMarketplaceId = null;
let currentMarketplaceName = 'AMAZING_STORE';
let products = [];
let prices = [];
let inventory = [];
let selectedProducts = new Set();

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

        // Load products
        products = await apiRequest('/products');

        // Load prices
        const pricesParams = currentMarketplaceId ? `?marketplace_id=${currentMarketplaceId}` : '';
        prices = await apiRequest(`/prices${pricesParams}`);

        // Load inventory
        inventory = await apiRequest('/inventory');

        // Filter by search
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const filteredProducts = products.filter(p => {
            const name = (p.name_uz || p.name_ru || '').toLowerCase();
            return name.includes(searchTerm);
        });

        if (filteredProducts.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            table.style.display = 'none';
            return;
        }

        // Render products as table rows
        tableBody.innerHTML = '';
        filteredProducts.forEach(product => {
            const row = createProductRow(product);
            tableBody.appendChild(row);
        });

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
    row.dataset.productId = product.id;
    
    const priceData = prices.find(p => p.product_id === product.id);
    const invData = inventory.find(i => i.product_id === product.id);
    
    const quantity = invData?.quantity || 0;
    const costPrice = priceData?.cost_price || null;
    const sellingPrice = priceData?.selling_price || null;
    const strikethroughPrice = priceData?.strikethrough_price || null;
    const commissionRate = priceData?.commission_rate || null;
    const commissionAmount = commissionRate && sellingPrice ? (sellingPrice * commissionRate) / 100 : null;
    
    // Calculate discount percentage
    let discountPercent = null;
    if (strikethroughPrice && sellingPrice) {
        discountPercent = Math.round(((strikethroughPrice - sellingPrice) / strikethroughPrice) * 100);
    }
    
    // Get last inventory update date
    const lastUpdate = invData?.last_updated_at ? new Date(invData.last_updated_at) : 
                       invData?.updated_at ? new Date(invData.updated_at) : null;
    const lastUpdateStr = lastUpdate ? formatDate(lastUpdate) : '';
    
    // Product SKU (use sku field if available, otherwise use ID)
    const sku = product.sku || product.display_sku || `ID-${product.id}`;
    
    // Calculate profitability
    const profitability = priceData?.profitability || null;
    
    row.innerHTML = `
        <td class="checkbox-col">
            <input type="checkbox" class="product-checkbox" data-product-id="${product.id}" aria-label="Select product">
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
                ${lastUpdateStr ? `<div class="warehouse-date">${lastUpdateStr}</div>` : ''}
            </div>
        </td>
        <td class="cost-col">
            <div class="cost-price">
                ${costPrice ? formatPrice(costPrice) : '-'}
            </div>
        </td>
        <td class="price-col">
            <div class="price-info">
                <div class="current-price" data-product-id="${product.id}">
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
            <div class="profitability-info ${profitability !== null && profitability !== undefined ? (profitability >= 0 ? 'positive' : 'negative') : ''}">
                ${profitability !== null && profitability !== undefined ? formatPrice(profitability) : '-'}
            </div>
        </td>
        <td class="actions-col">
            <button class="actions-btn" data-product-id="${product.id}" aria-label="More actions">
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
            if (e.target.checked) {
                selectedProducts.add(product.id);
            } else {
                selectedProducts.delete(product.id);
            }
            updateSelectAllCheckbox();
        });
    }

    // Add click listener for selling price
    const priceEl = row.querySelector('.current-price');
    if (priceEl && sellingPrice) {
        priceEl.style.cursor = 'pointer';
        priceEl.addEventListener('click', () => {
            openEditPriceModal(product.id);
        });
    }

    // Actions button
    const actionsBtn = row.querySelector('.actions-btn');
    if (actionsBtn) {
        actionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // TODO: Show actions menu
            console.log('Actions for product:', product.id);
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

// Update Product Quantity
async function updateProductQuantity(productId, quantity) {
    const qty = parseInt(quantity) || 0;
    
    try {
        // Update inventory
        await apiRequest(`/inventory/${productId}/adjust`, {
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

// Open Edit Price Modal
function openEditPriceModal(productId) {
    const product = products.find(p => p.id === productId);
    const priceData = prices.find(p => p.product_id === productId);
    const modal = document.getElementById('edit-price-modal');
    
    if (!modal || !product) return;
    
    document.getElementById('edit-product-id').value = productId;
    document.getElementById('edit-marketplace-id').value = currentMarketplaceId || '';
    document.getElementById('edit-cost-price').value = priceData?.cost_price || '';
    document.getElementById('edit-selling-price').value = priceData?.selling_price || '';
    document.getElementById('edit-strikethrough-price').value = priceData?.strikethrough_price || '';
    document.getElementById('edit-commission-rate').value = priceData?.commission_rate || '';
    
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
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
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
                const productId = parseInt(checkbox.dataset.productId);
                if (e.target.checked) {
                    selectedProducts.add(productId);
                } else {
                    selectedProducts.delete(productId);
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

// Save Price
async function savePrice() {
    const productId = parseInt(document.getElementById('edit-product-id').value);
    const marketplaceId = document.getElementById('edit-marketplace-id').value || null;

    const priceData = {
        product_id: productId,
        marketplace_id: marketplaceId ? parseInt(marketplaceId) : null,
        cost_price: parseFloat(document.getElementById('edit-cost-price').value) || null,
        selling_price: parseFloat(document.getElementById('edit-selling-price').value) || null,
        commission_rate: parseFloat(document.getElementById('edit-commission-rate').value) || null,
        strikethrough_price: parseFloat(document.getElementById('edit-strikethrough-price').value) || null
    };

    try {
        // Save price
        await apiRequest('/prices', {
            method: 'POST',
            body: JSON.stringify(priceData)
        });

        // Update product in Amazing Store if marketplace is Amazing Store
        if (!marketplaceId || currentMarketplaceName === 'AMAZING_STORE') {
            await apiRequest(`/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    price: priceData.strikethrough_price || priceData.selling_price,
                    sale_price: priceData.selling_price
                })
            });
        }

        closeEditModal();
        await loadProducts();
    } catch (error) {
        console.error('Error saving price:', error);
        alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
}

// Export functions for global access
window.updateProductQuantity = updateProductQuantity;
window.openEditPriceModal = openEditPriceModal;
window.closeEditModal = closeEditModal;
