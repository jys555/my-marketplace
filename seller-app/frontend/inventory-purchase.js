// Inventory Purchase Page JavaScript
let products = [];
let purchaseItems = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupEventListeners();
});

// Load Products
async function loadProducts() {
    const productsList = document.getElementById('products-list');
    const loadingState = document.getElementById('loading-state');
    const form = document.getElementById('purchase-form');

    if (!productsList) return;

    try {
        loadingState.style.display = 'flex';
        form.style.display = 'none';

        products = await apiRequest('/products');

        productsList.innerHTML = '';
        products.forEach(product => {
            const item = createProductItem(product);
            productsList.appendChild(item);
            purchaseItems[product.id] = {
                product_id: product.id,
                quantity: 0,
                purchase_price: 0,
                total_price: 0
            };
        });

        loadingState.style.display = 'none';
        form.style.display = 'block';
    } catch (error) {
        console.error('Error loading products:', error);
        loadingState.innerHTML = '<p>Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.</p>';
    }
}

// Create Product Item
function createProductItem(product) {
    const item = document.createElement('div');
    item.className = 'purchase-product-item';
    item.dataset.productId = product.id;

    item.innerHTML = `
        <div class="product-item-header">
            <div class="product-item-info">
                ${product.image_url ? `<img src="${product.image_url}" alt="${product.name_uz}" class="product-item-image">` : ''}
                <div>
                    <div class="product-item-name">${product.name_uz || product.name_ru || 'Nomsiz'}</div>
                    ${product.category_name_uz ? `<div class="product-item-category">${product.category_name_uz}</div>` : ''}
                </div>
            </div>
        </div>
        <div class="product-item-fields">
            <div class="field-group">
                <label>Miqdor</label>
                <input type="number" class="product-quantity" data-product-id="${product.id}" min="0" value="0" step="1">
            </div>
            <div class="field-group">
                <label>Narx (so'm)</label>
                <input type="number" class="product-price" data-product-id="${product.id}" min="0" value="0" step="0.01">
            </div>
            <div class="field-group">
                <label>Jami</label>
                <div class="product-total" data-product-id="${product.id}">0 so'm</div>
            </div>
        </div>
    `;

    // Add event listeners
    const quantityInput = item.querySelector('.product-quantity');
    const priceInput = item.querySelector('.product-price');

    quantityInput.addEventListener('input', () => updateProductTotal(product.id));
    priceInput.addEventListener('input', () => updateProductTotal(product.id));

    return item;
}

// Update Product Total
function updateProductTotal(productId) {
    const item = document.querySelector(`.purchase-product-item[data-product-id="${productId}"]`);
    if (!item) return;

    const quantityInput = item.querySelector('.product-quantity');
    const priceInput = item.querySelector('.product-price');
    const totalDiv = item.querySelector('.product-total');

    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const total = quantity * price;

    totalDiv.textContent = formatPrice(total);

    // Update purchaseItems
    if (purchaseItems[productId]) {
        purchaseItems[productId].quantity = quantity;
        purchaseItems[productId].purchase_price = price;
        purchaseItems[productId].total_price = total;
    }

    // Update total amount
    updateTotalAmount();
}

// Update Total Amount
function updateTotalAmount() {
    const total = Object.values(purchaseItems).reduce((sum, item) => {
        return sum + item.total_price;
    }, 0);

    document.getElementById('total-amount').textContent = formatPrice(total);
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(parseFloat(price || 0)) + ' so\'m';
}

// Setup Event Listeners
function setupEventListeners() {
    const form = document.getElementById('purchase-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await savePurchase();
        });
    }
}

// Save Purchase
async function savePurchase() {
    const purchaseDate = document.getElementById('purchase-date').value;
    const notes = document.getElementById('purchase-notes').value;

    if (!purchaseDate) {
        alert('Sana kiritilishi shart!');
        return;
    }

    // Filter items with quantity > 0
    const items = Object.values(purchaseItems).filter(item => item.quantity > 0);

    if (items.length === 0) {
        alert('Kamida bitta tovar kiritilishi kerak!');
        return;
    }

    // Validate all items have price
    const invalidItems = items.filter(item => !item.purchase_price || item.purchase_price <= 0);
    if (invalidItems.length > 0) {
        alert('Barcha tovarlar uchun narx kiritilishi kerak!');
        return;
    }

    try {
        const purchaseData = {
            purchase_date: purchaseDate,
            items: items,
            notes: notes || null
        };

        await apiRequest('/purchases', {
            method: 'POST',
            body: JSON.stringify(purchaseData)
        });

        alert('Kirim muvaffaqiyatli saqlandi!');
        window.location.href = 'inventory.html';
    } catch (error) {
        console.error('Error saving purchase:', error);
        alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
}

