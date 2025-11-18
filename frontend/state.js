let state = {
    lang: localStorage.getItem('userLang') || 'uz',
    user: null,
    isRegistered: false,
    products: [],
    cart: JSON.parse(localStorage.getItem('cart')) || {}, // { productId: quantity }
    favorites: JSON.parse(localStorage.getItem('favorites')) || [], // [productId]
    orders: [],
    currentPage: 'home',
    banners: [],
    initData: null, // ADDED: To store Telegram's initData
};

// --- Getters (Holatni olish) ---
export const getLang = () => state.lang;
export const getUser = () => state.user;
export const isRegistered = () => state.isRegistered;
export const getProducts = () => state.products;
export const getCart = () => state.cart;
export const getFavorites = () => state.favorites;
export const getOrders = () => state.orders;
export const getCurrentPage = () => state.currentPage;
export const getBanners = () => state.banners; 
export const getProductById = (id) => state.products.find(p => p.id === id);
export const getInitData = () => state.initData; // ADDED: Getter for initData


// --- Setters (Holatni o'zgartirish) ---

export function setInitData(data) { // ADDED: The missing function
    state.initData = data;
}

export function setLang(lang) {
    if (['uz', 'ru'].includes(lang)) {
        state.lang = lang;
        localStorage.setItem('userLang', lang);
        document.documentElement.lang = lang;
    }
}

export function setUser(userData) {
    state.user = userData;
    state.isRegistered = !!userData;
}

export function setProducts(products) {
    state.products = products;
}

export function setBanners(banners) { // QO'SHILDI: Bannerlarni o'rnatish uchun setter
    state.banners = banners;
}

export function setOrders(orders) {
    state.orders = orders;
}

export function setCurrentPage(page) {
    state.currentPage = page;
}

// --- Cart Logic (Savatcha mantig'i) ---
export function addToCart(productId, quantity = 1) {
    state.cart[productId] = (state.cart[productId] || 0) + quantity;
    saveCart();
}

export function updateCartItemQuantity(productId, quantity) {
    if (quantity > 0) {
        state.cart[productId] = quantity;
    } else {
        delete state.cart[productId];
    }
    saveCart();
}

export function clearCart() {
    state.cart = {};
    saveCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

// --- Favorites Logic (Sevimlilar mantig'i) ---
export function toggleFavorite(productId) {
    const index = state.favorites.indexOf(productId);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push(productId);
    }
    saveFavorites();
    return index === -1; // true if added, false if removed
}

export function isFavorite(productId) {
    return state.favorites.includes(productId);
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
}