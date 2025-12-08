// Catalog Page JavaScript
let currentMarketplaceId = null;
let currentMarketplaceName = 'AMAZING_STORE';
let products = [];
let prices = [];
let inventory = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadMarketplaces();
    await loadProducts();
    setupEventListeners();
});

// Load Marketplaces
async function loadMarketplaces() {
    try {
        const data = await apiRequest('/marketplaces');
        const marketplaceList = document.getElementById('marketplace-list');
        if (!marketplaceList) return;

        marketplaceList.innerHTML = '';

        // "Barcha do'konlar" option
        const allItem = document.createElement('div');
        allItem.className = 'marketplace-item active';
        allItem.dataset.marketplaceId = 'all';
        allItem.dataset.marketplaceName = "Barcha do'konlar";
        allItem.innerHTML = `<div class="marketplace-name">Barcha do'konlar</div>`;
        allItem.addEventListener('click', () => selectMarketplace('all', "Barcha do'konlar"));
        marketplaceList.appendChild(allItem);

        // Marketplaces
        data.forEach(mp => {
            const item = document.createElement('div');
            item.className = 'marketplace-item';
            if (mp.name === currentMarketplaceName) {
                item.classList.add('active');
            }
            item.dataset.marketplaceId = mp.id;
            item.dataset.marketplaceName = mp.name;
            item.innerHTML = `
                <div class="marketplace-name">${mp.name}</div>
                ${mp.marketplace_code ? `<div class="marketplace-code">${mp.marketplace_code}</div>` : ''}
            `;
            item.addEventListener('click', () => selectMarketplace(mp.id, mp.name));
            marketplaceList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading marketplaces:', error);
    }
}

// Select Marketplace
function selectMarketplace(id, name) {
    currentMarketplaceId = id === 'all' ? null : id;
    currentMarketplaceName = name;
    
    document.getElementById('selected-marketplace').textContent = name;
    document.getElementById('marketplace-modal').classList.remove('active');
    
    document.querySelectorAll('.marketplace-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.marketplaceName === name) {
            item.classList.add('active');
        }
    });

    loadProducts();
}

// Load Products
async function loadProducts() {
    const container = document.getElementById('products-list-container');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');

    if (!container) return;

    try {
        loadingState.style.display = 'flex';
        container.style.display = 'none';
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
            return;
        }

        // Render products
        container.innerHTML = '';
        if (filteredProducts.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        filteredProducts.forEach(product => {
            const productCard = createProductCard(product);
            container.appendChild(productCard);
        });

        loadingState.style.display = 'none';
        container.style.display = 'block';
        emptyState.style.display = 'none';
    } catch (error) {
        console.error('Error loading products:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const priceData = prices.find(p => p.product_id === product.id);
    const invData = inventory.find(i => i.product_id === product.id);
    
    const quantity = invData?.quantity || 0;
    const costPrice = priceData?.cost_price || null;
    const sellingPrice = priceData?.selling_price || null;
    const strikethroughPrice = priceData?.strikethrough_price || null;
    const commissionRate = priceData?.commission_rate || null;
    const profitability = priceData?.profitability || null;
    
    // Calculate discount percentage
    let discountPercent = null;
    if (strikethroughPrice && sellingPrice) {
        discountPercent = Math.round(((strikethroughPrice - sellingPrice) / strikethroughPrice) * 100);
    }
    
    // Calculate commission amount
    let commissionAmount = null;
    if (sellingPrice && commissionRate) {
        commissionAmount = (sellingPrice * commissionRate) / 100;
    }
    
    // Determine product status based on quantity
    const isActive = quantity > 0;
    
    card.innerHTML = `
        <div class="product-card-image">
            ${product.image_url ? `<img src="${product.image_url}" alt="${product.name_uz}" class="product-image-large">` : 
              `<div class="product-image-placeholder">Rasm yo'q</div>`}
        </div>
        <div class="product-card-content">
            <div class="product-card-name">${product.name_uz || product.name_ru || 'Nomsiz'}</div>
            
            <div class="product-card-details">
                <div class="product-detail-row">
                    <span class="detail-label">Qoldiq:</span>
                    <input type="number" 
                           class="product-quantity-input" 
                           data-product-id="${product.id}"
                           value="${quantity}" 
                           min="0">
                    <span class="product-status ${isActive ? 'active' : 'inactive'}">
                        ${isActive ? 'Active' : 'Noactive'}
                    </span>
                </div>
                
                <div class="product-detail-row">
                    <span class="detail-label">Tannarx:</span>
                    <span class="detail-value">${costPrice ? formatPrice(costPrice) : '-'}</span>
                </div>
                
                <div class="product-detail-row price-row">
                    <span class="detail-label">Sotish narxi:</span>
                    <div class="price-container">
                        <span class="selling-price" data-product-id="${product.id}">
                            ${sellingPrice ? formatPrice(sellingPrice) : '-'}
                        </span>
                        ${strikethroughPrice ? `
                            <div class="strikethrough-price-container">
                                <span class="strikethrough-price">${formatPrice(strikethroughPrice)}</span>
                                ${discountPercent ? `<span class="discount-percent">-${discountPercent}%</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="product-detail-row">
                    <span class="detail-label">Xizmatlar narxi:</span>
                    <div class="service-price-container">
                        ${commissionRate ? `<span class="commission-rate">${commissionRate}%</span>` : ''}
                        ${commissionAmount ? `<span class="commission-amount">${formatPrice(commissionAmount)}</span>` : '-'}
                    </div>
                </div>
                
                <div class="product-detail-row">
                    <span class="detail-label">Rentabillik:</span>
                    <span class="profitability ${profitability >= 0 ? 'positive' : 'negative'}">
                        ${profitability !== null && profitability !== undefined ? formatPrice(profitability) : '-'}
                    </span>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    const quantityInput = card.querySelector('.product-quantity-input');
    if (quantityInput) {
        let quantityTimeout;
        quantityInput.addEventListener('change', () => {
            clearTimeout(quantityTimeout);
            const newQuantity = parseInt(quantityInput.value) || 0;
            quantityTimeout = setTimeout(() => {
                updateProductQuantity(product.id, newQuantity);
            }, 500);
        });
    }

    // Add click listener for selling price
    const sellingPriceEl = card.querySelector('.selling-price');
    if (sellingPriceEl) {
        sellingPriceEl.style.cursor = 'pointer';
        sellingPriceEl.addEventListener('click', () => {
            openEditPriceModal(product.id);
        });
    }

    return card;
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

        // Update product status in Amazing Store based on quantity
        // If quantity > 0, product should be active, else inactive
        // This will be handled by backend when we update inventory
        
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

    document.getElementById('edit-product-id').value = productId;
    document.getElementById('edit-marketplace-id').value = currentMarketplaceId || '';
    document.getElementById('edit-cost-price').value = priceData?.cost_price || '';
    document.getElementById('edit-selling-price').value = priceData?.selling_price || '';
    document.getElementById('edit-strikethrough-price').value = priceData?.strikethrough_price || '';
    document.getElementById('edit-commission-rate').value = priceData?.commission_rate || '';

    modal.classList.add('active');
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('edit-price-modal').classList.remove('active');
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(parseFloat(price || 0)) + ' so\'m';
}

// Setup Event Listeners
function setupEventListeners() {
    // Marketplace selector
    const marketplaceBtn = document.getElementById('marketplace-selector-btn');
    const marketplaceModal = document.getElementById('marketplace-modal');
    const modalClose = document.getElementById('modal-close');

    if (marketplaceBtn) {
        marketplaceBtn.addEventListener('click', () => {
            marketplaceModal.classList.add('active');
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            marketplaceModal.classList.remove('active');
        });
    }

    marketplaceModal.addEventListener('click', (e) => {
        if (e.target === marketplaceModal) {
            marketplaceModal.classList.remove('active');
        }
    });

    // Edit price form
    const editForm = document.getElementById('edit-price-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await savePrice();
        });
    }

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const closeEditModalBtn = document.getElementById('close-edit-modal');

    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);

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
}

// Save Price
async function savePrice() {
    const productId = document.getElementById('edit-product-id').value;
    const marketplaceId = document.getElementById('edit-marketplace-id').value || null;

    const priceData = {
        product_id: parseInt(productId),
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

// Export for global access
window.selectMarketplace = selectMarketplace;
window.updateProductQuantity = updateProductQuantity;
window.openEditPriceModal = openEditPriceModal;
