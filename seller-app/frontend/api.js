// API Configuration
const API_BASE_URL = window.location.origin; // Same origin as frontend

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Seller App API Functions

// Marketplaces
export async function getMarketplaces() {
    return apiRequest('/seller/marketplaces');
}

export async function getMarketplace(id) {
    return apiRequest(`/seller/marketplaces/${id}`);
}

export async function createMarketplace(data) {
    return apiRequest('/seller/marketplaces', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateMarketplace(id, data) {
    return apiRequest(`/seller/marketplaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// Products (Amazing Store products)
export async function getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/seller/products?${params}`);
}

export async function getProduct(id) {
    return apiRequest(`/seller/products/${id}`);
}

export async function createProduct(data) {
    return apiRequest('/seller/products', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateProduct(id, data) {
    return apiRequest(`/seller/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteProduct(id) {
    return apiRequest(`/seller/products/${id}`, {
        method: 'DELETE'
    });
}

// Prices
export async function getPrices(marketplaceId = null) {
    const params = marketplaceId ? `?marketplace_id=${marketplaceId}` : '';
    return apiRequest(`/seller/prices${params}`);
}

export async function updatePrice(productId, marketplaceId, data) {
    return apiRequest(`/seller/prices/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ marketplace_id: marketplaceId, ...data })
    });
}

// Purchases
export async function getPurchases(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/seller/purchases?${params}`);
}

export async function getPurchase(id) {
    return apiRequest(`/seller/purchases/${id}`);
}

export async function createPurchase(data) {
    return apiRequest('/seller/purchases', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function deletePurchase(id) {
    return apiRequest(`/seller/purchases/${id}`, {
        method: 'DELETE'
    });
}

// Inventory
export async function getInventory(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/seller/inventory?${params}`);
}

export async function getInventoryByProduct(productId) {
    return apiRequest(`/seller/inventory/${productId}`);
}

export async function adjustInventory(data) {
    return apiRequest('/seller/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function getInventoryMovements(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/seller/inventory/movements?${params}`);
}

// Orders
export async function getOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/seller/orders?${params}`);
}

export async function getOrder(id) {
    return apiRequest(`/seller/orders/${id}`);
}

export async function createOrder(data) {
    return apiRequest('/seller/orders', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateOrderStatus(id, status) {
    return apiRequest(`/seller/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
}

export async function getOrdersByProduct(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/seller/orders/by-product?${params}`);
}

// Analytics
export async function getDashboardData(marketplaceId = null) {
    const params = marketplaceId ? `?marketplace_id=${marketplaceId}` : '';
    return apiRequest(`/seller/analytics/dashboard${params}`);
}

export async function getDailyAnalytics(marketplaceId = null, filters = {}) {
    const params = new URLSearchParams({ ...filters, ...(marketplaceId && { marketplace_id: marketplaceId }) });
    return apiRequest(`/seller/analytics/daily?${params}`);
}

export async function getMonthlyAnalytics(marketplaceId = null, filters = {}) {
    const params = new URLSearchParams({ ...filters, ...(marketplaceId && { marketplace_id: marketplaceId }) });
    return apiRequest(`/seller/analytics/monthly?${params}`);
}

export async function getOverallAnalytics() {
    return apiRequest('/seller/analytics/overall');
}

export async function getMarketplaceComparison() {
    return apiRequest('/seller/analytics/marketplace-comparison');
}

export async function getProductAnalytics(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/seller/analytics/by-product?${params}`);
}

export async function getChartData(marketplaceId = null, filters = {}) {
    const params = new URLSearchParams({ ...filters, ...(marketplaceId && { marketplace_id: marketplaceId }) });
    return apiRequest(`/seller/analytics/chart-data?${params}`);
}

