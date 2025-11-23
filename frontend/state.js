// frontend/state.js
const initialUser = JSON.parse(localStorage.getItem('user'));

let state = {
    lang: localStorage.getItem('userLang') || 'uz',
    user: initialUser,
    guestTelegramUser: null, // qo'shildi
    isRegistered: !!initialUser, // O'ZGARTIRILDI
    products: [],
    cart: {},
    favorites: [],
    orders: [],
    currentPage: 'home',
    banners: [],
    initData: null,
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
export const getInitData = () => state.initData;
export const getGuestTelegramUser = () => state.guestTelegramUser;


// --- Setters (Holatni o'zgartirish) ---

export function setInitData(data) { 
    state.initData = data;
}

export function setLang(lang) {
    if (['uz', 'ru'].includes(lang)) {
        state.lang = lang;
        localStorage.setItem('userLang', lang);
        document.documentElement.lang = lang;
    }
}

// O'ZGARTIRILDI: Foydalanuvchini localStorage'ga saqlash
export function setUser(userData) {
    state.user = userData;
    state.isRegistered = !!userData;
    if (userData) {
        // Load cart and favorites from user object
        state.cart = userData.cart || {};
        state.favorites = userData.favorites || [];
        localStorage.setItem('user', JSON.stringify(userData));
        state.guestTelegramUser = null; // Ro'yxatdan o'tgandan so'ng mehmon ma'lumotini tozalash
    } else {
        // Clear user-specific data
        state.cart = {};
        state.favorites = [];
        localStorage.removeItem('user');
    }
}

// QO'SHILDI: Mehmon ma'lumotlarini o'rnatish uchun
export function setGuestTelegramUser(telegramUser) {
    state.guestTelegramUser = telegramUser;
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
}

export function updateCartItemQuantity(productId, quantity) {
    if (quantity > 0) {
        state.cart[productId] = quantity;
    } else {
        delete state.cart[productId];
    }
}

export function clearCart() {
    state.cart = {};
}

// --- Favorites Logic (Sevimlilar mantig'i) ---
export function toggleFavorite(productId) {
    const index = state.favorites.indexOf(productId);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push(productId);
    }
    return index === -1; // true if added, false if removed
}

export function isFavorite(productId) {
    return state.favorites.includes(productId);
}