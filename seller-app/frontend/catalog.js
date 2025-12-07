// Catalog Page JavaScript
let currentMarketplaceId = null;
let currentMarketplaceName = 'AMAZING_STORE';
let products = [];
let prices = [];

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
        allItem.innerHTML = `
            <div class="marketplace-name">Barcha do'konlar</div>
        `;
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
    
    // Update active state
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
    const tbody = document.getElementById('products-tbody');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('products-table');

    if (!tbody) return;

    try {
        loadingState.style.display = 'flex';
        table.style.display = 'none';
        emptyState.style.display = 'none';

        // Load products
        products = await apiRequest('/products');

        // Load prices
        const pricesParams = currentMarketplaceId ? `?marketplace_id=${currentMarketplaceId}` : '';
        prices = await apiRequest(`/prices${pricesParams}`);

        // Combine products with prices
        const productsWithPrices = products.map(product => {
            const price = prices.find(p => p.product_id === product.id);
            return {
                ...product,
                price_data: price || null
            };
        });

        // Filter by search
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const filteredProducts = productsWithPrices.filter(p => {
            const name = (p.name_uz || p.name_ru || '').toLowerCase();
            return name.includes(searchTerm);
        });

        // Render
        tbody.innerHTML = '';
        if (filteredProducts.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        filteredProducts.forEach(product => {
            const row = createProductRow(product);
            tbody.appendChild(row);
        });

        loadingState.style.display = 'none';
        table.style.display = 'table';
    } catch (error) {
        console.error('Error loading products:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Create Product Row
function createProductRow(product) {
    const row = document.createElement('tr');
    const priceData = product.price_data;

    row.innerHTML = `
        <td>
            <div class="product-info">
                ${product.image_url ? `<img src="${product.image_url}" alt="${product.name_uz}" class="product-image">` : ''}
                <div>
                    <div class="product-name">${product.name_uz || product.name_ru || 'Nomsiz'}</div>
                    ${product.category_name_uz ? `<div class="product-category">${product.category_name_uz}</div>` : ''}
                </div>
            </div>
        </td>
        <td>
            <span class="editable-field" data-field="cost_price" data-product-id="${product.id}">
                ${priceData?.cost_price ? formatPrice(priceData.cost_price) : '-'}
            </span>
        </td>
        <td>
            <span class="editable-field" data-field="selling_price" data-product-id="${product.id}">
                ${priceData?.selling_price ? formatPrice(priceData.selling_price) : '-'}
            </span>
        </td>
        <td>
            <span class="editable-field" data-field="commission_rate" data-product-id="${product.id}">
                ${priceData?.commission_rate ? `${priceData.commission_rate}%` : '-'}
            </span>
        </td>
        <td>
            <span class="profitability ${priceData?.profitability >= 0 ? 'positive' : 'negative'}">
                ${priceData?.profitability !== null && priceData?.profitability !== undefined ? formatPrice(priceData.profitability) : '-'}
            </span>
        </td>
        <td>
            <span class="editable-field" data-field="strikethrough_price" data-product-id="${product.id}">
                ${priceData?.strikethrough_price ? formatPrice(priceData.strikethrough_price) : '-'}
            </span>
        </td>
        <td>
            <button class="btn-icon edit-price-btn" data-product-id="${product.id}" title="Tahrirlash">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
        </td>
    `;

    // Edit button click
    const editBtn = row.querySelector('.edit-price-btn');
    editBtn.addEventListener('click', () => openEditModal(product, priceData));

    return row;
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(parseFloat(price)) + ' so\'m';
}

// Open Edit Modal
function openEditModal(product, priceData) {
    const modal = document.getElementById('edit-price-modal');
    const form = document.getElementById('edit-price-form');

    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-marketplace-id').value = currentMarketplaceId || '';
    document.getElementById('edit-cost-price').value = priceData?.cost_price || '';
    document.getElementById('edit-selling-price').value = priceData?.selling_price || '';
    document.getElementById('edit-commission-rate').value = priceData?.commission_rate || '';
    document.getElementById('edit-strikethrough-price').value = priceData?.strikethrough_price || '';

    modal.classList.add('active');
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('edit-price-modal').classList.remove('active');
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
    const form = document.getElementById('edit-price-form');
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
        await apiRequest('/prices', {
            method: 'POST',
            body: JSON.stringify(priceData)
        });

        closeEditModal();
        await loadProducts();
    } catch (error) {
        console.error('Error saving price:', error);
        alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
}

// Export for global access
window.selectMarketplace = selectMarketplace;

