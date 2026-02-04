// frontend/state.js

// localStorage'dan xavfsiz o'qish (buzilgan ma'lumotlardan himoya)
function safeGetFromStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.warn(`localStorage "${key}" o'qishda xatolik, tozalanmoqda:`, e);
        localStorage.removeItem(key);
        return null;
    }
}

const initialUser = safeGetFromStorage('user');

let state = {
    lang: localStorage.getItem('userLang') || 'uz',
    user: initialUser,
    guestTelegramUser: null, // qo'shildi
    isRegistered: !!initialUser, // O'ZGARTIRILDI
    products: [],
    filteredProducts: null, // O'ZGARTIRILDI: Search uchun filter
    categories: [], // O'ZGARTIRILDI: Kategoriyalar
    selectedCategory: null, // O'ZGARTIRILDI: Tanlangan kategoriya ID
    cart: {}, // DEPRECATED: Eski cart (backward compatibility)
    cartItems: [], // YANGI: Server'dan kelgan cart items (array of objects)
    cartSummary: {
        totalItems: 0,
        totalSelectedItems: 0,
        totalAmount: 0,
    },
    favorites: [],
    orders: [],
    currentPage: 'home',
    navigationHistory: [], // Tarix stack - back button uchun
    banners: [],
    initData: null,
    // PERFORMANCE: Pagination state
    productsPagination: {
        hasMore: false,
        total: 0,
        currentOffset: 0,
        isLoading: false
    }
};

// --- Getters (Holatni olish) ---
export const getLang = () => state.lang;
export const getUser = () => state.user;
export const isRegistered = () => state.isRegistered;
// O'ZGARTIRILDI: Agar filter bo'lsa, filterlangan mahsulotlarni qaytarish
export const getProducts = () => state.filteredProducts !== null ? state.filteredProducts : state.products;
// O'ZGARTIRILDI: Filter qo'llanmasdan barcha mahsulotlarni olish (qidiruv uchun)
export const getAllProducts = () => state.products;
export const getCart = () => state.cart;
export const getFavorites = () => state.favorites;
export const getOrders = () => state.orders;
export const getCurrentPage = () => state.currentPage;
export const getBanners = () => state.banners; 
export const getProductById = (id) => state.products.find(p => p.id === id);
export const getInitData = () => state.initData;
export const getGuestTelegramUser = () => state.guestTelegramUser;
// O'ZGARTIRILDI: Kategoriya getters
export const getCategories = () => state.categories;
export const getSelectedCategory = () => state.selectedCategory;


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

// PERFORMANCE: Pagination bilan mahsulotlarni o'rnatish
export function setProducts(productsData, append = false) {
    // Backend'dan { products, pagination } formatida keladi
    if (productsData && typeof productsData === 'object' && 'products' in productsData) {
        // Yangi format (pagination bilan)
        if (append) {
            // Infinite scroll uchun - mavjud mahsulotlarga qo'shish
            state.products = [...state.products, ...productsData.products];
        } else {
            // Yangi yuklash - eski mahsulotlarni almashtirish
            state.products = productsData.products;
        }
        
        // Pagination ma'lumotlarini saqlash
        if (productsData.pagination) {
            state.productsPagination = {
                hasMore: productsData.pagination.hasMore || false,
                total: productsData.pagination.total || 0,
                currentOffset: productsData.pagination.offset + productsData.pagination.currentCount,
                isLoading: false
            };
        }
    } else {
        // Eski format (backward compatibility) - faqat array
        state.products = Array.isArray(productsData) ? productsData : [];
        state.productsPagination = {
            hasMore: false,
            total: state.products.length,
            currentOffset: state.products.length,
            isLoading: false
        };
    }
    
    state.filteredProducts = null; // Yangi mahsulotlar kelganda filtrni tozalash
}

// PERFORMANCE: Pagination getters
export const getProductsPagination = () => state.productsPagination;
export const setProductsLoading = (isLoading) => {
    state.productsPagination.isLoading = isLoading;
};

// O'ZGARTIRILDI: Qidiruv uchun filter funksiyasi
export function setFilteredProducts(products) {
    state.filteredProducts = products;
}

export function setBanners(banners) { // QO'SHILDI: Bannerlarni o'rnatish uchun setter
    state.banners = banners;
}

// O'ZGARTIRILDI: Kategoriyalar setters
export function setCategories(categories) {
    state.categories = categories;
}

export function setSelectedCategory(categoryId) {
    state.selectedCategory = categoryId;
}

export function setOrders(orders) {
    state.orders = orders;
}

export function setCurrentPage(page) {
    state.currentPage = page;
}

// Tarix stack funksiyalari
export function pushToHistory(page) {
    // Faqat har xil sahifalarni qo'shish (ketma-ket bir xil sahifani qo'shmaslik)
    if (state.navigationHistory[state.navigationHistory.length - 1] !== page) {
        state.navigationHistory.push(page);
    }
}

export function popFromHistory() {
    if (state.navigationHistory.length > 0) {
        return state.navigationHistory.pop();
    }
    return 'home';
}

export function getHistoryLength() {
    return state.navigationHistory.length;
}

export function clearHistory() {
    state.navigationHistory = [];
}

// --- NEW Cart Logic (Server-based) ---
export function setCartItems(items) {
    state.cartItems = items || [];
}

export function setCartSummary(summary) {
    state.cartSummary = summary || {
        totalItems: 0,
        totalSelectedItems: 0,
        totalAmount: 0,
    };
}

export function getCartItems() {
    return state.cartItems;
}

export function getCartSummary() {
    return state.cartSummary;
}

export function getCartItemsCount() {
    return state.cartItems.length;
}

export function updateCartItemInState(cartItemId, updates) {
    const index = state.cartItems.findIndex(item => item.id === cartItemId);
    if (index !== -1) {
        state.cartItems[index] = { ...state.cartItems[index], ...updates };
    }
}

export function removeCartItemFromState(cartItemId) {
    state.cartItems = state.cartItems.filter(item => item.id !== cartItemId);
}

export function clearCartState() {
    state.cartItems = [];
    state.cartSummary = {
        totalItems: 0,
        totalSelectedItems: 0,
        totalAmount: 0,
    };
}

// --- DEPRECATED Cart Logic (Backward compatibility) ---
export function addToCart(productId, quantity = 1) {
    // This is deprecated, but kept for backward compatibility
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
    // ⭐ DEBUG: ProductId va favorites holatini tekshirish
    console.log('🔄 toggleFavorite called:', {
        productId,
        productIdType: typeof productId,
        favoritesBefore: [...state.favorites],
        favoritesLength: state.favorites.length
    });
    
    // ⭐ CRITICAL FIX: ProductId ni number ga o'tkazish
    const numProductId = Number(productId);
    if (isNaN(numProductId)) {
        console.error('❌ toggleFavorite: Invalid productId', productId);
        return false;
    }
    
    const index = state.favorites.indexOf(numProductId);
    console.log('🔍 toggleFavorite: index found:', index);
    
    if (index > -1) {
        // Remove from favorites
        state.favorites.splice(index, 1);
        console.log('✅ toggleFavorite: Removed from favorites. New favorites:', [...state.favorites]);
        return false; // removed
    } else {
        // Add to favorites
        state.favorites.push(numProductId);
        console.log('✅ toggleFavorite: Added to favorites. New favorites:', [...state.favorites]);
        return true; // added
    }
}

export function isFavorite(productId) {
    return state.favorites.includes(productId);
}