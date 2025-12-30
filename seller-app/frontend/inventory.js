// Inventory Page JavaScript
let inventory = [];
let purchases = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadInventory();
    await loadPurchases();
    setupEventListeners();
});

// Load Inventory
async function loadInventory() {
    const tbody = document.getElementById('inventory-tbody');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('inventory-table');

    if (!tbody) return;

    try {
        loadingState.style.display = 'flex';
        table.style.display = 'none';
        emptyState.style.display = 'none';

        inventory = await apiRequest('/inventory');

        // Filter by search
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const filteredInventory = inventory.filter(inv => {
            const name = (inv.product_name_uz || inv.product_name_ru || '').toLowerCase();
            return name.includes(searchTerm);
        });

        if (filteredInventory.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Calculate monthly purchases for each product
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        tbody.innerHTML = '';
        filteredInventory.forEach(inv => {
            // Calculate monthly purchases
            const monthlyPurchases = purchases.filter(p => {
                const purchaseDate = new Date(p.purchase_date);
                return purchaseDate >= startOfMonth && purchaseDate <= endOfMonth &&
                       p.items && p.items.some(item => item.product_id === inv.product_id);
            });

            const monthlyQuantity = monthlyPurchases.reduce((sum, p) => {
                const item = p.items.find(item => item.product_id === inv.product_id);
                return sum + (item ? item.quantity : 0);
            }, 0);

            const row = createInventoryRow(inv, monthlyQuantity);
            tbody.appendChild(row);
        });

        loadingState.style.display = 'none';
        table.style.display = 'table';
    } catch (error) {
        console.error('Error loading inventory:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Load Purchases
async function loadPurchases() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startDate = startOfMonth.toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        purchases = await apiRequest(`/purchases?start_date=${startDate}&end_date=${endDate}`);
        
        // Load full details for each purchase
        for (let i = 0; i < purchases.length; i++) {
            try {
                const fullPurchase = await apiRequest(`/purchases/${purchases[i].id}`);
                purchases[i].items = fullPurchase.items || [];
            } catch (error) {
                console.error(`Error loading purchase ${purchases[i].id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error loading purchases:', error);
    }
}

// Create Inventory Row
function createInventoryRow(inv, monthlyQuantity) {
    const row = document.createElement('tr');
    const available = inv.quantity - inv.reserved_quantity;

    row.innerHTML = `
        <td>
            <div class="product-info">
                ${inv.product_image_url ? `<img src="${inv.product_image_url}" alt="${inv.product_name_uz}" class="product-image">` : ''}
                <div>
                    <div class="product-name">${inv.product_name_uz || inv.product_name_ru || 'Nomsiz'}</div>
                </div>
            </div>
        </td>
        <td>
            <span class="quantity-badge ${inv.quantity > 0 ? 'positive' : 'zero'}">
                ${inv.quantity}
            </span>
        </td>
        <td>
            <span class="quantity-badge ${inv.reserved_quantity > 0 ? 'warning' : ''}">
                ${inv.reserved_quantity}
            </span>
        </td>
        <td>
            <span class="quantity-badge ${available > 0 ? 'positive' : 'zero'}">
                ${available}
            </span>
        </td>
        <td>
            <button class="btn-link monthly-purchases-btn" data-product-id="${inv.product_id}">
                ${monthlyQuantity}
            </button>
        </td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon adjust-btn" data-product-id="${inv.product_id}" data-current-quantity="${inv.quantity}" title="Qoldiqni tuzatish">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
            </div>
        </td>
    `;

    // Adjust button
    row.querySelector('.adjust-btn').addEventListener('click', () => {
        openAdjustModal(inv.product_id, inv.quantity);
    });

    // Monthly purchases button
    const monthlyBtn = row.querySelector('.monthly-purchases-btn');
    if (monthlyQuantity > 0) {
        monthlyBtn.addEventListener('click', () => {
            viewPurchaseHistory(inv.product_id);
        });
    }

    return row;
}

// Open Adjust Modal
function openAdjustModal(productId, currentQuantity) {
    const modal = document.getElementById('adjust-modal');
    document.getElementById('adjust-product-id').value = productId;
    document.getElementById('adjust-quantity').value = currentQuantity;
    document.getElementById('adjust-notes').value = '';
    modal.classList.add('active');
}

// Close Adjust Modal
function closeAdjustModal() {
    document.getElementById('adjust-modal').classList.remove('active');
}

// View Purchase History
function viewPurchaseHistory(productId) {
    const modal = document.getElementById('purchase-history-modal');
    const list = document.getElementById('purchase-history-list');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyPurchases = purchases.filter(p => {
        const purchaseDate = new Date(p.purchase_date);
        return purchaseDate >= startOfMonth && purchaseDate <= endOfMonth &&
               p.items && p.items.some(item => item.product_id === productId);
    });

    if (monthlyPurchases.length === 0) {
        list.innerHTML = '<p class="text-muted">Bu oyda kirimlar yo\'q</p>';
    } else {
        list.innerHTML = monthlyPurchases.map(p => {
            const item = p.items.find(item => item.product_id === productId);
            return `
                <div class="purchase-history-item">
                    <div class="purchase-date">${new Date(p.purchase_date).toLocaleDateString('uz-UZ')}</div>
                    <div class="purchase-quantity">${item.quantity} dona</div>
                    <div class="purchase-price">${formatPrice(item.total_price)}</div>
                </div>
            `;
        }).join('');
    }

    modal.classList.add('active');
}

// Close Purchase History Modal
function closePurchaseHistoryModal() {
    document.getElementById('purchase-history-modal').classList.remove('active');
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(parseFloat(price || 0)) + ' so\'m';
}

// Setup Event Listeners
function setupEventListeners() {
    // Adjust form
    const adjustForm = document.getElementById('adjust-form');
    if (adjustForm) {
        adjustForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await adjustInventory();
        });
    }

    const cancelAdjustBtn = document.getElementById('cancel-adjust-btn');
    const closeAdjustModalBtn = document.getElementById('close-adjust-modal');
    const closeHistoryModalBtn = document.getElementById('close-history-modal');

    if (cancelAdjustBtn) cancelAdjustBtn.addEventListener('click', closeAdjustModal);
    if (closeAdjustModalBtn) closeAdjustModalBtn.addEventListener('click', closeAdjustModal);
    if (closeHistoryModalBtn) closeHistoryModalBtn.addEventListener('click', closePurchaseHistoryModal);

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadInventory();
            }, 300);
        });
    }
}

// Adjust Inventory
async function adjustInventory() {
    const form = document.getElementById('adjust-form');
    if (!form) return;

    // Frontend validation
    const schema = {
        'adjust-quantity': {
            validator: (value, fieldName) => window.validation.validateInteger(window.validation.validateRequired(value, fieldName), fieldName),
            fieldName: 'Quantity'
        },
        'adjust-notes': {
            validator: (value, fieldName) => window.validation.validateString(value, fieldName),
            fieldName: 'Notes'
        }
    };

    const validation = window.validation.validateForm(form, schema);
    if (!validation.valid) {
        return;
    }

    const productId = document.getElementById('adjust-product-id').value;
    const quantity = validation.data['adjust-quantity'];
    const notes = validation.data['adjust-notes'] || null;

    try {
        await apiRequest(`/inventory/${productId}/adjust`, {
            method: 'PUT',
            body: JSON.stringify({ quantity, notes })
        });

        closeAdjustModal();
        await loadInventory();
    } catch (error) {
        console.error('Error adjusting inventory:', error);
        alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
}

