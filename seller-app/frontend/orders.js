// Orders Page JavaScript
let currentMarketplaceId = null;
let currentMarketplaceName = 'AMAZING_STORE';
let orders = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadMarketplaces();
    await loadOrders();
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

    loadOrders();
}

// Load Orders
async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('orders-table');

    if (!tbody) return;

    try {
        loadingState.style.display = 'flex';
        table.style.display = 'none';
        emptyState.style.display = 'none';

        // Build query params
        const params = new URLSearchParams();
        if (currentMarketplaceId) {
            params.append('marketplace_id', currentMarketplaceId);
        }

        const statusFilter = document.getElementById('status-filter')?.value;
        if (statusFilter) {
            params.append('status', statusFilter);
        }

        const dateFrom = document.getElementById('date-from')?.value;
        const dateTo = document.getElementById('date-to')?.value;
        if (dateFrom) params.append('start_date', dateFrom);
        if (dateTo) params.append('end_date', dateTo);

        const queryString = params.toString();
        orders = await apiRequest(`/orders${queryString ? '?' + queryString : ''}`);

        if (orders.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        tbody.innerHTML = '';
        orders.forEach(order => {
            const row = createOrderRow(order);
            tbody.appendChild(row);
        });

        loadingState.style.display = 'none';
        table.style.display = 'table';
    } catch (error) {
        console.error('Error loading orders:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Create Order Row
function createOrderRow(order) {
    const row = document.createElement('tr');
    
    const statusLabels = {
        'new': 'Yangi',
        'processing': 'Jarayonda',
        'ready': 'Tayyor',
        'delivered': 'Yetkazilgan',
        'cancelled': 'Bekor qilingan'
    };

    const statusColors = {
        'new': '#3b82f6',
        'processing': '#f59e0b',
        'ready': '#10b981',
        'delivered': '#059669',
        'cancelled': '#ef4444'
    };

    const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString('uz-UZ') : 
                     order.created_at ? new Date(order.created_at).toLocaleDateString('uz-UZ') : '-';

    row.innerHTML = `
        <td>
            <div class="order-number">${order.order_number || '-'}</div>
        </td>
        <td>${orderDate}</td>
        <td>${order.marketplace_name || 'AMAZING_STORE'}</td>
        <td>
            <div>${order.customer_name || '-'}</div>
            ${order.customer_phone ? `<div class="text-muted" style="font-size: 12px;">${order.customer_phone}</div>` : ''}
        </td>
        <td><strong>${formatPrice(order.total_amount)}</strong></td>
        <td>
            <span class="status-badge" style="background: ${statusColors[order.status] || '#666'}20; color: ${statusColors[order.status] || '#666'}">
                ${statusLabels[order.status] || order.status}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon view-order-btn" data-order-id="${order.id}" title="Ko'rish">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <button class="btn-icon edit-status-btn" data-order-id="${order.id}" title="Statusni o'zgartirish">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
            </div>
        </td>
    `;

    // View button
    row.querySelector('.view-order-btn').addEventListener('click', () => viewOrder(order.id));
    // Edit status button
    row.querySelector('.edit-status-btn').addEventListener('click', () => openStatusModal(order));

    return row;
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(parseFloat(price || 0)) + ' so\'m';
}

// View Order
async function viewOrder(orderId) {
    try {
        const order = await apiRequest(`/orders/${orderId}`);
        const modal = document.getElementById('order-details-modal');
        const body = document.getElementById('order-details-body');

        body.innerHTML = `
            <div class="order-details">
                <div class="detail-row">
                    <span class="detail-label">Buyurtma raqami:</span>
                    <span class="detail-value">${order.order_number || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Sana:</span>
                    <span class="detail-value">${order.order_date ? new Date(order.order_date).toLocaleString('uz-UZ') : '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Marketplace:</span>
                    <span class="detail-value">${order.marketplace_name || 'AMAZING_STORE'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Mijoz:</span>
                    <span class="detail-value">${order.customer_name || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Telefon:</span>
                    <span class="detail-value">${order.customer_phone || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Manzil:</span>
                    <span class="detail-value">${order.customer_address || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${order.status}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Summa:</span>
                    <span class="detail-value"><strong>${formatPrice(order.total_amount)}</strong></span>
                </div>
                <div class="detail-section">
                    <h3 style="margin-bottom: 12px;">Tovarlar:</h3>
                    <div class="order-items">
                        ${order.items ? order.items.map(item => `
                            <div class="order-item">
                                <div>${item.product_name_uz || item.product_name_ru || 'Nomsiz'}</div>
                                <div class="order-item-details">
                                    <span>${item.quantity} x ${formatPrice(item.price)}</span>
                                    <strong>${formatPrice(item.quantity * item.price)}</strong>
                                </div>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
}

// Open Status Modal
function openStatusModal(order) {
    const modal = document.getElementById('status-modal');
    document.getElementById('status-order-id').value = order.id;
    document.getElementById('new-status').value = order.status;
    modal.classList.add('active');
}

// Close Status Modal
function closeStatusModal() {
    document.getElementById('status-modal').classList.remove('active');
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

    // Status form
    const statusForm = document.getElementById('status-form');
    if (statusForm) {
        statusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateOrderStatus();
        });
    }

    const cancelStatusBtn = document.getElementById('cancel-status-btn');
    const closeStatusModalBtn = document.getElementById('close-status-modal');
    const closeOrderModalBtn = document.getElementById('close-order-modal');

    if (cancelStatusBtn) cancelStatusBtn.addEventListener('click', closeStatusModal);
    if (closeStatusModalBtn) closeStatusModalBtn.addEventListener('click', closeStatusModal);
    if (closeOrderModalBtn) closeOrderModalBtn.addEventListener('click', () => {
        document.getElementById('order-details-modal').classList.remove('active');
    });

    // Filters
    const statusFilter = document.getElementById('status-filter');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');

    if (statusFilter) statusFilter.addEventListener('change', loadOrders);
    if (dateFrom) dateFrom.addEventListener('change', loadOrders);
    if (dateTo) dateTo.addEventListener('change', loadOrders);
}

// Update Order Status
async function updateOrderStatus() {
    const orderId = document.getElementById('status-order-id').value;
    const newStatus = document.getElementById('new-status').value;

    try {
        await apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        closeStatusModal();
        await loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
}

// Export for global access
window.selectMarketplace = selectMarketplace;

