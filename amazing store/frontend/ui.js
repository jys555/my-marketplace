// PERFORMANCE: Pagination importlar
import { getLang, getUser, isRegistered as isUserRegistered, getProducts, getCart, getProductById, isFavorite, getOrders, getBanners, getGuestTelegramUser, getFavorites, getCategories, getSelectedCategory, getProductsPagination, setProductsLoading, getCartItems, getCartSummary, setCartItems, setCartSummary } from './state.js';
import * as api from './api.js';
import * as state from './state.js';

// XSS himoyasi uchun HTML escape funksiyasi
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
// Til sozlamalari va tarjimalar
const translations = {
    uz: {
        loading: "Ma'lumotlar yuklanmoqda...",
        error_telegram: "⚠️ Ilovani Telegram ichida oching.",
        error_server: "⚠️ Server bilan aloqada xatolik.",
        error_auth: "⚠️ Autentifikatsiya xatosi. Ilovani qayta oching.",
        guest: "Mehmon",
        home_greeting: "Salom, <strong>{name}</strong>!",
        search_placeholder: "Mahsulotlarni toping",
        categories_title: "Kategoriyalar",
        no_categories: "Kategoriyalar hali qo'shilmagan",
        products_not_loaded: "❌ Tovarlar yuklanmadi",
        no_products_yet: "Hozircha mahsulotlar yo'q.",
        product_details_not_ready: "Tovar #{id} tafsiloti hali tayyor emas.",
        added_to_favorites: "Tovar #{id} sevimlilarga qo'shildi.",
        removed_from_favorites: "Tovar #{id} sevimlilardan olib tashlandi.",
        fill_profile_title: "Profilingizni to'ldiring",
        first_name_label: "Ism (majburiy)",
        last_name_label: "Familiya (ixtiyoriy)",
        phone_label: "Telefon raqam",
        phone_placeholder: "00 000 00 00",
        save_button: "Saqlash",
        cancel_button: "Bekor qilish",
        // Navigatsiya
        nav_home: "Uy",
        nav_catalog: "Kategoriyalar",
        nav_favorites: "Sevimlilar",
        nav_cart: "Savatcha",
        nav_profile: "Profil",
        // Profil sahifasi
        profile_title: "Profil",
        profile_info: "Shaxsiy ma'lumotlar",
        profile_language: "Ilova tili",
        edit_button: "Tahrirlash",
        please_fill_fields: "Iltimos, ism va 9 xonali telefon raqamini to'ldiring.",
        profile_saved: "✅ Profilingiz muvaffaqiyatli saqlandi!",
        error_saving: "Saqlashda xatolik",
        error_auth: "⚠️ Autentifikatsiya xatosi. Ilovani qayta oching.",
        page_not_ready: "{pageName} sahifasi hali tayyor emas.",
        // Profil menyu elementlari
        my_orders: "Buyurtmalarim",
        my_points: "Ballarim",
        my_reviews: "Sharhlarim",
        settings: "Sozlamalar",
        about_us: "Biz haqimizda",
        contact_us: "Biz bilan bog'lanish",
        logout: "Chiqish",
        coming_soon: "Tez orada",
        language_uz: "O'zbekcha",
        language_ru: "Русский",
        select_language: "Tilni tanlang",
        // Sevimlilar
        favorites_title: "Sevimlilar",
        favorites_empty: "Sizda sevimlilar ro'yxati bo'sh.",
        // Buyurtmalar
        confirm_order: "Buyurtmani tasdiqlash",
        active_orders: "Faol",
        completed_orders: "Tugallangan",
        no_active_orders: "Faol buyurtmalar yo'q",
        no_active_orders_desc: "Bu erda buyurtmalar bo'ladi haydash yoki qabul qilishni kutish",
        order_number: "Buyurtma №",
        order_status: "Holati",
        order_items_count: "Mahsulotlar soni",
        order_total: "Umumiy summa",
        order_details_not_ready: "Buyurtma #{order_number} tafsilotlari hali tayyor emas.",
        no_orders_yet: "Sizda hali buyurtmalar yo'q.",
        // Savatcha
        cart_title: "Savat",
        cart_empty: "Savatchangiz bo'sh.",
        total_price: "Umumiy narx",
        item: "ta",
        payment_method: "To'lov usuli",
        cash: "Naqd pul",
        delivery_method: "Yetkazib berish usuli",
        pickup: "Olib ketish",
        delivery: "Pochta orqali",
        order_success: "✅ Buyurtmangiz qabul qilindi! Raqami: {order_number}",
        order_failed: "❌ Buyurtma yaratishda xatolik yuz berdi.",
        added_to_cart: "{name} savatchaga qo'shildi",
        buy_now: "Hozir sotib olish",
        quantity_label: "Miqdor",
        proceed_to_checkout: "Rasmiylashtirishga o'tish"
    },
    ru: {
        loading: "Загрузка данных...",
        error_telegram: "⚠️ Откройте приложение внутри Telegram.",
        error_server: "⚠️ Ошибка соединения с сервером.",
        error_auth: "⚠️ Ошибка аутентификации. Перезапустите приложение.",
        guest: "Гость",
        home_greeting: "Привет, <strong>{name}</strong>!",
        search_placeholder: "Найти товары",
        categories_title: "Категории",
        no_categories: "Категории еще не добавлены",
        products_not_loaded: "❌ Не удалось загрузить товары",
        no_products_yet: "Товаров пока нет.",
        product_details_not_ready: "Информация о товаре #{id} еще не готова.",
        added_to_favorites: "Товар #{id} добавлен в избранное.",
        removed_from_favorites: "Товар #{id} удален из избранного.",
        fill_profile_title: "Заполните свой профиль",
        first_name_label: "Имя (обязательно)",
        last_name_label: "Фамилия (необязательно)",
        phone_label: "Номер телефона",
        phone_placeholder: "00 000 00 00",
        save_button: "Сохранить",
        cancel_button: "Отмена",
        // Навигация
        nav_home: "Дом",
        nav_catalog: "Категории",
        nav_favorites: "Избранное",
        nav_cart: "Корзина",
        nav_profile: "Профиль",
        // Страница профиля
        profile_title: "Профиль",
        profile_info: "Личные данные",
        profile_language: "Язык приложения",
        edit_button: "Редактировать",
        please_fill_fields: "Пожалуйста, введите имя и 9-значный номер телефона.",
        profile_saved: "✅ Ваш профиль успешно сохранен!",
        error_saving: "Ошибка сохранения",
        page_not_ready: "Страница {pageName} еще не готова.",
        // Элементы меню профиля
        my_orders: "Мои заказы",
        my_points: "Мои баллы",
        my_reviews: "Мои отзывы",
        settings: "Настройки",
        about_us: "О нас",
        contact_us: "Связаться с нами",
        logout: "Выйти",
        coming_soon: "Скоро",
        language_uz: "O'zbekcha",
        language_ru: "Русский",
        select_language: "Выберите язык",
        // Избранное
        favorites_title: "Избранное",
        favorites_empty: "Ваш список избранного пуст.",
        // Заказы
        confirm_order: "Подтвердить заказ",
        active_orders: "Активные",
        completed_orders: "Завершённые",
        no_active_orders: "Активных заказов нет",
        no_active_orders_desc: "Здесь будут заказы на доставку или ожидающие получения",
        order_number: "Заказ №",
        order_status: "Статус",
        order_items_count: "Кол-во товаров",
        order_total: "Итоговая сумма",
        order_details_not_ready: "Детали заказа №{order_number} еще не готовы.",
        no_orders_yet: "У вас еще нет заказов.",
        // Корзина
        cart_title: "Корзина",
        cart_empty: "Ваша корзина пуста.",
        total_price: "Итоговая цена",
        item: "шт.",
        payment_method: "Способ оплаты",
        cash: "Наличными",
        delivery_method: "Способ доставки",
        pickup: "Самовывоз",
        delivery: "Доставка почтой",
        order_success: "✅ Ваш заказ принят! Номер: {order_number}",
        order_failed: "❌ Произошла ошибка при создании заказа.",
        added_to_cart: "{name} добавлен в корзину",
        buy_now: "Купить сейчас",
        quantity_label: "Количество",
        proceed_to_checkout: "Перейти к оформлению"
    }
};

export function t(key, params = {}) {
    let text = translations[getLang()][key] || key;
    for (const param in params) {
        text = text.replace(`{${param}}`, params[param]);
    }
    return text;
}

const main = document.getElementById('main');
const loading = document.getElementById('loading');
const navbar = document.getElementById('navbar');
const modal = document.getElementById('registerModal');

export function showLoading(message) {
    loading.innerText = message || t('loading');
    loading.classList.remove('hidden');
    main.classList.add('hidden');
    navbar.classList.add('hidden');
}

export function hideLoading() {
    loading.classList.add('hidden');
    main.classList.remove('hidden');
    navbar.classList.remove('hidden');
}

export function renderPage(pageName, attachEventListeners) {
    hideLoading();
    
    // BackButton boshqaruvi main.js dagi navigateTo() da amalga oshiriladi
    
    let content = '';
    switch (pageName) {
        case 'home':
            content = getHomeContent();
            break;
        case 'catalog':
            content = getCatalogContent(); // O'ZGARTIRILDI: Katalog sahifasi qo'shildi
            break;
        case 'profile':
            content = getProfileContent();
            break;
        case 'cart':
            content = getCartContent();
            break;
        case 'favorites':
            content = getFavoritesContent();
            break;
        default:
            content = `<h2>${t('page_not_ready', { pageName })}</h2>`;
    }
    main.innerHTML = content;
    updateNavbar(pageName);
    attachEventListeners(pageName);
    
    // CRITICAL: Badge'larni har sahifa render qilinganda yangilash
    updateCartBadges();
}

function getHomeContent() {
    const user = getUser();
    const rawName = isUserRegistered() ? (user.first_name || window.Telegram.WebApp.initDataUnsafe?.user?.first_name) : t('guest');
    const displayName = escapeHtml(rawName);

    // O'ZGARTIRILDI: Kategoriya filtri indikatori
    const selectedCategoryId = getSelectedCategory();
    const categories = getCategories();
    const selectedCategory = selectedCategoryId ? categories.find(c => c.id === selectedCategoryId) : null;
    
    // Bannerlarni state'dan olish
    const banners = getBanners();

    // Bannerlar mavjud bo'lsa, dinamik karusel yaratish
    const carouselHtml = banners && banners.length > 0 ? `
      <div class="carousel" id="carousel">
        ${banners.map((banner) => `
          <a href="${banner.link_url || '#'}" class="slide">
            <img src="${banner.image_url}" alt="${banner.title || 'Banner'}">
          </a>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="home-header">
        <div class="brand-container">
          <span class="brand-icon">🛒</span>
          <span class="brand-name">Amazing Store</span>
        </div>
        <div class="search-container">
          <span class="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input type="text" class="search-input" placeholder="${t('search_placeholder')}">
        </div>
        <div class="greeting-text">${t('home_greeting', { name: displayName })}</div>
      </div>
      ${carouselHtml}
      <div class="categories-section">
        <div class="categories-header" id="categories-btn">
          <span class="categories-title">${t('categories_title')}</span>
          <span class="categories-arrow">›</span>
        </div>
      </div>
      ${selectedCategory ? `
        <div class="category-filter-indicator">
          <span class="filter-icon">${selectedCategory.icon}</span>
          <span class="filter-text">${escapeHtml(selectedCategory.name)}</span>
          <button class="filter-clear-btn" id="show-all-btn">✕</button>
        </div>
      ` : ''}
      <div class="products-grid" id="products"></div>
    `;
}

// PERFORMANCE: Infinite scroll uchun append qilish
export function renderProducts(append = false) {
    const productsContainer = document.getElementById('products');
    if (!productsContainer) return;

    const products = getProducts();
    const pagination = getProductsPagination();
    
    // PERFORMANCE: Agar mahsulotlar bo'sh bo'lsa va append emas bo'lsa
    if (products.length === 0 && !append) {
        productsContainer.innerHTML = `<p>${t('no_products_yet')}</p>`;
        return;
    }
    
    // PERFORMANCE: Loading indicator'ni olib tashlash
    const existingLoader = productsContainer.querySelector('.products-loading');
    if (existingLoader) {
        existingLoader.remove();
    }

    // PERFORMANCE: Append qilish yoki to'liq almashtirish
    const productsHTML = products.map(p => {
        // Ensure price and sale_price are numbers
        const price = parseFloat(p.price) || 0;
        const salePrice = p.sale_price ? parseFloat(p.sale_price) : null;
        const hasSale = salePrice && price > salePrice && salePrice > 0;
        const salePercentage = hasSale ? Math.round(((price - salePrice) / price) * 100) : 0;
        const safeName = escapeHtml(p.name);
        const safeImage = escapeHtml(p.image) || 'https://via.placeholder.com/150';
        const displayPrice = hasSale ? salePrice : price;

        return `
          <div class="product-card" data-id="${p.id}">
            <div class="product-card-image-wrapper">
              <img src="${safeImage}" alt="${safeName}">
              <div class="like-btn ${isFavorite(p.id) ? 'liked' : ''}" data-id="${p.id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite(p.id) ? '#ff3b5c' : 'none'}" stroke="${isFavorite(p.id) ? '#ff3b5c' : '#999'}" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              ${hasSale ? `<div class="sale-badge">-${salePercentage}%</div>` : ''}
              <button class="add-to-cart-btn" data-id="${p.id}">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-badge" id="cart-badge-${p.id}"></span>
              </button>
            </div>
            <div class="product-card-info">
              <h4>${safeName}</h4>
              <p class="price-line">
                <span class="current-price">${displayPrice.toLocaleString()} so'm</span>
                ${hasSale ? `<span class="original-price">${price.toLocaleString()} so'm</span>` : ''}
              </p>
            </div>
          </div>
        `;
    }).join('');
    
    if (append) {
        // PERFORMANCE: Mavjud mahsulotlarga qo'shish (infinite scroll)
        productsContainer.insertAdjacentHTML('beforeend', productsHTML);
    } else {
        // PERFORMANCE: To'liq almashtirish (yangi yuklash)
        productsContainer.innerHTML = productsHTML;
    }
    
    // PERFORMANCE: Infinite scroll uchun loading indicator qo'shish
    if (pagination.hasMore) {
        const loaderHTML = `
            <div class="products-loading" id="products-loading">
                <div class="loading-spinner"></div>
                <p>Yuklanmoqda...</p>
            </div>
        `;
        productsContainer.insertAdjacentHTML('beforeend', loaderHTML);
    }
    
    // CRITICAL: Badge'larni yangilash (sahifa yuklanganda ham)
    updateCartBadges();
}

// PERFORMANCE: Loading indicator ko'rsatish
export function showProductsLoading() {
    const productsContainer = document.getElementById('products');
    if (!productsContainer) return;
    
    const existingLoader = productsContainer.querySelector('.products-loading');
    if (!existingLoader) {
        const loaderHTML = `
            <div class="products-loading" id="products-loading">
                <div class="loading-spinner"></div>
                <p>Yuklanmoqda...</p>
            </div>
        `;
        productsContainer.insertAdjacentHTML('beforeend', loaderHTML);
    }
}

// O'ZGARTIRILDI: Katalog (kategoriyalar) sahifasi - backend'dan olinadi
function getCatalogContent() {
    const pageHeader = `
        <div class="page-header simple-header">
            <h2 class="page-title">${t('categories_title')}</h2>
        </div>
    `;
    
    // Backend'dan olingan kategoriyalar
    const categories = getCategories();
    
    if (!categories || categories.length === 0) {
        return `
            ${pageHeader}
            <div class="empty-state">
                <p>${t('no_categories')}</p>
            </div>
        `;
    }
    
    const categoriesHtml = categories.map(cat => {
        return `
            <div class="category-card" data-id="${cat.id}" style="background: ${cat.color}15; border-left: 4px solid ${cat.color};">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${escapeHtml(cat.name)}</span>
                <span class="category-arrow">›</span>
            </div>
        `;
    }).join('');
    
    return `
        ${pageHeader}
        <div class="page-content">
            <div class="categories-grid">
                ${categoriesHtml}
            </div>
        </div>
    `;
}

function getProfileContent() {
    const user = getUser() || {};
    const { first_name = 'Guest', last_name = '', phone = '' } = user;
    const displayName = escapeHtml(`${first_name} ${last_name}`.trim());
    const displayPhone = phone ? `+${phone.replace(/\D/g, '')}` : '';

    // Header - faqat sarlavha (back tugma Telegram tomonidan boshqariladi)
    const header = `
        <div class="page-header fixed-header" id="profile-header">
            <h2 id="profile-header-title" class="page-title">${t('profile_title')}</h2>
        </div>
    `;

    const menu = `
        <div id="profile-menu" class="profile-container">
            <div class="user-card">
                <div class="user-avatar">👤</div>
                <div class="user-info">
                    <h4>${displayName}</h4>
                    <p>${displayPhone}</p>
                </div>
                <button id="edit-profile-icon" class="edit-btn">✏️</button>
            </div>

            <div class="menu-section">
                <div class="menu-item" id="menu-item-orders">
                    <span class="menu-icon">🛍️</span>
                    <span class="menu-text">${t('my_orders')}</span>
                    <span class="menu-arrow">›</span>
                </div>
                <div class="menu-item disabled-item">
                    <span class="menu-icon">💰</span>
                    <span class="menu-text">${t('my_points')}</span>
                    <span class="menu-badge">${t('coming_soon')}</span>
                </div>
                <div class="menu-item disabled-item">
                    <span class="menu-icon">⭐</span>
                    <span class="menu-text">${t('my_reviews')}</span>
                    <span class="menu-badge">${t('coming_soon')}</span>
                </div>
            </div>

            <div class="menu-section">
                <div class="menu-item disabled-item">
                    <span class="menu-icon">⚙️</span>
                    <span class="menu-text">${t('settings')}</span>
                    <span class="menu-badge">${t('coming_soon')}</span>
                </div>
                <div class="menu-item" id="menu-item-language">
                    <span class="menu-icon lang-flag-icon">
                        <img src="./assets/flags/${getLang() === 'uz' ? 'uzbekistan' : 'russia'}.svg" alt="${getLang().toUpperCase()}">
                    </span>
                    <span class="menu-text">${t('profile_language')}</span>
                    <span class="menu-value">${getLang() === 'uz' ? t('language_uz') : t('language_ru')}</span>
                    <span class="menu-arrow">›</span>
                </div>
                <div class="menu-item disabled-item" id="menu-item-about">
                    <span class="menu-icon">ℹ️</span>
                    <span class="menu-text">${t('about_us')}</span>
                    <span class="menu-badge">${t('coming_soon')}</span>
                </div>
                <div class="menu-item disabled-item" id="menu-item-contact">
                    <span class="menu-icon">✉️</span>
                    <span class="menu-text">${t('contact_us')}</span>
                    <span class="menu-badge">${t('coming_soon')}</span>
                </div>
            </div>
            
            <div class="logout-section">
                <button id="logout-btn">${t('logout')}</button>
            </div>
        </div>
    `;

    const number = phone.startsWith('+998') ? phone.slice(4) : phone;
    const editSection = `
        <div id="profile-edit-section" class="profile-subpage hidden">
             <form id="profile-form">
                <div class="floating-input">
                    <input type="text" id="firstName" value="${first_name}" placeholder=" ">
                    <label for="firstName">${t('first_name_label')}</label>
                </div>
                <div class="floating-input">
                    <input type="text" id="lastName" value="${last_name || ''}" placeholder=" ">
                    <label for="lastName">${t('last_name_label')}</label>
                </div>
                <div class="phone-floating-input">
                    <label for="phone">${t('phone_label')}</label>
                    <div class="phone-input-wrapper">
                        <span class="country-code">🇺🇿 +998</span>
                        <span class="divider">|</span>
                        <input type="tel" id="phone" value="${number}" placeholder="${t('phone_placeholder')}">
                    </div>
                </div>
                <button type="button" id="save-profile-btn">${t('save_button')}</button>
            </form>
        </div>
    `;

    const ordersSection = `
        <div id="orders-section" class="profile-subpage hidden">
            <div class="orders-tabs">
                <button class="orders-tab-button active" data-tab="active">${t('active_orders')}</button>
                <button class="orders-tab-button" data-tab="completed">${t('completed_orders')}</button>
            </div>
            <div id="orders-list"></div>
        </div>
    `;

    // Til tanlash bo'limi endi modal bo'lgani uchun bu yerdan olib tashlandi.
    // const languageSection = ...

    return `<div id="profile-page-wrapper">${header}${menu}${editSection}${ordersSection}</div>`;
}

export function renderOrders(filter = 'active') {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    const allOrders = getOrders();
    const filteredOrders = filter === 'active'
        ? allOrders.filter(o => !['completed', 'cancelled'].includes(o.status))
        : allOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="orders-empty-state">
                <img src="./assets/images/empty-box.svg" alt="Empty" class="empty-image">
                <h3>${t('no_active_orders')}</h3>
                <p>${t('no_active_orders_desc')}</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card" data-id="${order.id}">
            <h4>${t('order_number')} ${order.id}</h4>
            <p><strong>${t('order_status')}:</strong> ${order.status}</p>
            <p><strong>${t('order_items_count')}:</strong> ${order.items ? order.items.length : 0}</p>
            <p><strong>${t('order_total')}:</strong> ${Number(order.total_amount).toLocaleString()} so'm</p>
        </div>
    `).join('');
}

// YANGI: Cart sahifasi - User screenshot style (server-based)
function getCartContent() {
    const cartItems = getCartItems();
    const summary = getCartSummary() || {};

    // Bo'sh holat
    if (cartItems.length === 0) {
        return `
            <div class="cart-page">
                <div class="cart-page-header-fixed">
                    <h2 class="cart-page-title">Savat</h2>
                </div>
                <div class="cart-empty-state">
                    <div class="cart-empty-icon">🛒</div>
                    <p class="cart-empty-text">Savatingiz bo'sh</p>
                    <p class="cart-empty-subtext">Mahsulotlarni qo'shing</p>
                    <button class="cart-empty-btn" data-page="home">Bosh sahifaga</button>
                </div>
            </div>
        `;
    }

    const itemsHtml = cartItems.map(item => {
        const safeName = escapeHtml(item.name_uz);
        const safeImage = escapeHtml(item.image_url) || 'https://via.placeholder.com/100';
        const price = item.sale_price || item.price;
        
        return `
            <div class="cart-item" data-cart-id="${item.id}" data-product-id="${item.product_id}">
                <div class="cart-item-image-wrapper">
                    <img src="${safeImage}" alt="${safeName}" class="cart-item-image">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-header">
                        <h4 class="cart-item-name">${safeName}</h4>
                        <div class="cart-item-checkbox-wrapper">
                            <input type="checkbox" class="cart-item-checkbox" id="cart-checkbox-${item.id}" data-cart-id="${item.id}" ${item.is_selected ? 'checked' : ''}>
                            <label for="cart-checkbox-${item.id}" class="cart-item-checkbox-label"></label>
                        </div>
                    </div>
                    <p class="cart-item-price">${Number(price).toLocaleString()} so'm</p>
                    <div class="cart-item-actions">
                        <button class="like-btn ${isFavorite(item.product_id) ? 'liked' : ''}" data-id="${item.product_id}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite(item.product_id) ? '#ff3b5c' : 'none'}" stroke="${isFavorite(item.product_id) ? '#ff3b5c' : '#999'}" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                        <button class="cart-item-delete-btn" data-cart-id="${item.id}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                        <div class="cart-item-quantity">
                            <button class="cart-item-qty-btn" data-cart-id="${item.id}" data-action="decrease" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                            <span class="cart-item-qty-value">${item.quantity}</span>
                            <button class="cart-item-qty-btn" data-cart-id="${item.id}" data-action="increase">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="cart-page">
            <!-- Top header: "Savat" markazda, back YO'Q -->
            <div class="cart-page-header-fixed">
                <h2 class="cart-page-title">Savat</h2>
            </div>

            <!-- Manzil paneli: header ostida, fixed -->
            <div class="cart-address-panel">
                <div class="cart-address-info">
                    <div class="cart-address-title">Mijoz manzili</div>
                    <div class="cart-address-subtitle">Manzil keyinroq aniqlanadi</div>
                </div>
                <div class="cart-address-actions">
                    <button class="cart-address-delete-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                    <div class="cart-select-all-wrapper">
                        <input type="checkbox" class="cart-select-all-checkbox" id="cart-select-all">
                        <label for="cart-select-all" class="cart-select-all-label"></label>
                    </div>
                </div>
            </div>

            <!-- Tovarlar ro'yxati: bitta katta yumaloq konteyner -->
            <div class="cart-items-container">
                <div class="cart-items-list">
                    ${itemsHtml}
                </div>
            </div>
            
            <!-- Pastki "Rasmiylashtirish" tugmasi: sticky, navbar ustida - bitta uzun ko'k tugma -->
            <div class="cart-bottom-bar">
                <button class="cart-checkout-btn" id="confirm-order-btn" ${(summary.totalItems || 0) === 0 ? 'disabled' : ''}>
                    <span class="cart-checkout-left">${(summary.totalItems || 0)} ta tovar</span>
                    <span class="cart-checkout-center">Rasmiylashtirishga o'tish</span>
                    <span class="cart-checkout-right">${Number(summary.totalAmount || 0).toLocaleString()} so'm</span>
                </button>
            </div>
        </div>
    `;
}

function getFavoritesContent() {
    const favorites = getFavorites();
    const pageHeader = `
        <div class="page-header simple-header">
            <h2 class="page-title">${t('favorites_title')}</h2>
        </div>
    `;

    if (favorites.length === 0) {
        return `${pageHeader}<div class="empty-state"><p>${t('favorites_empty')}</p></div>`;
    }
    
    const products = getProducts();
    
    // ⭐ CRITICAL FIX: Type-safe comparison - faqat number ID'larni solishtirish
    // favorites array'ida number'lar, p.id ham number bo'lishi kerak
    const favoriteProducts = products.filter(p => {
        const productId = Number(p.id);
        const isFavorite = favorites.some(favId => Number(favId) === productId);
        
        // ⭐ DEBUG: Filter tekshiruvi
        console.log(`🔍 Filter check: productId=${productId} (${typeof productId}), favorites=${JSON.stringify(favorites)}, isFavorite=${isFavorite}`);
        
        return isFavorite;
    });
    
    // ⭐ DEBUG: Filter natijasi
    console.log(`📋 getFavoritesContent: favorites=${JSON.stringify(favorites)}, totalProducts=${products.length}, favoriteProducts=${favoriteProducts.length}`);
    favoriteProducts.forEach(p => {
        console.log(`  ✅ Favorite product: id=${p.id}, name=${p.name}`);
    });

    return `
        ${pageHeader}
        <div class="page-content favorites-page">
        <div class="products-grid" id="products">
                ${favoriteProducts.map(p => {
                    // Ensure price and sale_price are numbers
                    const price = parseFloat(p.price) || 0;
                    const salePrice = p.sale_price ? parseFloat(p.sale_price) : null;
                    const hasSale = salePrice && price > salePrice && salePrice > 0;
                    const salePercentage = hasSale ? Math.round(((price - salePrice) / price) * 100) : 0;
                    const safeName = escapeHtml(p.name);
                    const safeImage = escapeHtml(p.image) || 'https://via.placeholder.com/150';
                    const displayPrice = hasSale ? salePrice : price;
                    return `
              <div class="product-card" data-id="${p.id}">
                        <div class="product-card-image-wrapper">
                          <img src="${safeImage}" alt="${safeName}">
                          <div class="like-btn liked" data-id="${p.id}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff3b5c" stroke="#ff3b5c" stroke-width="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </div>
                          ${hasSale ? `<div class="sale-badge">-${salePercentage}%</div>` : ''}
                          <button class="add-to-cart-btn" data-id="${p.id}">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="cart-badge" id="cart-badge-${p.id}"></span>
                          </button>
                        </div>
                        <div class="product-card-info">
                          <h4>${safeName}</h4>
                          <p class="price-line">
                            <span class="current-price">${displayPrice.toLocaleString()} so'm</span>
                            ${hasSale ? `<span class="original-price">${price.toLocaleString()} so'm</span>` : ''}
                          </p>
                        </div>
                      </div>
                    `;
                }).join('')}
              </div>
        </div>
    `;
}

export function renderLanguageModal() {
    const currentLang = getLang();
    const modalHtml = `
        <div class="modal-overlay" id="language-modal-overlay">
            <div class="language-modal-content">
                <h3 class="language-modal-title">${t('select_language')}</h3>
                <div class="language-options">
                    <label for="lang-ru" class="language-option">
                        <span class="radio-custom ${currentLang === 'ru' ? 'checked' : ''}"></span>
                        <span class="lang-name">Русский</span>
                        <span class="lang-flag">
                            <img src="./assets/flags/russia.svg" alt="RU">
                        </span>
                        <input type="radio" id="lang-ru" name="language" value="ru" ${currentLang === 'ru' ? 'checked' : ''}>
                    </label>
                    <label for="lang-uz" class="language-option">
                        <span class="radio-custom ${currentLang === 'uz' ? 'checked' : ''}"></span>
                        <span class="lang-name">O'zbekcha</span>
                        <span class="lang-flag">
                            <img src="./assets/flags/uzbekistan.svg" alt="UZ">
                        </span>
                        <input type="radio" id="lang-uz" name="language" value="uz" ${currentLang === 'uz' ? 'checked' : ''}>
                    </label>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function closeLanguageModal() {
    const modal = document.getElementById('language-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Profil ichki sahifalari uchun BackButton callback
let profileBackButtonCallback = null;

export function showProfileSection(sectionName, globalBackHandler = null) {
    const title = document.getElementById('profile-header-title');
    const menu = document.getElementById('profile-menu');
    const editSection = document.getElementById('profile-edit-section');
    const ordersSection = document.getElementById('orders-section');
    
    const sections = [menu, editSection, ordersSection];
    sections.forEach(s => s?.classList.add('hidden'));
    
    const WebApp = window.Telegram?.WebApp;

    if (sectionName === 'menu') {
        menu?.classList.remove('hidden');
        if (title) title.innerText = t('profile_title');
        
        // Profil menyusida - global BackButton ishlaydi (main.js da boshqariladi)
        // Ichki callback ni tozalash
        if (WebApp?.BackButton && profileBackButtonCallback) {
            WebApp.BackButton.offClick(profileBackButtonCallback);
            profileBackButtonCallback = null;
        }
    } else {
        // Ichki sahifalarda (edit, orders) - menyuga qaytarish
        if (WebApp?.BackButton) {
            // Avvalgi callback ni olib tashlash
            if (profileBackButtonCallback) {
                WebApp.BackButton.offClick(profileBackButtonCallback);
            }
            
            // Menyuga qaytaruvchi callback
            profileBackButtonCallback = () => {
                showProfileSection('menu');
            };
            WebApp.BackButton.onClick(profileBackButtonCallback);
            WebApp.BackButton.show();
        }
        
        if (sectionName === 'edit') {
            editSection?.classList.remove('hidden');
            if (title) title.innerText = t('profile_info');
        } else if (sectionName === 'orders') {
            ordersSection?.classList.remove('hidden');
            if (title) title.innerText = t('my_orders');
        }
    }
}

export function updateNavbar(pageName) {
    const navItems = [
        { page: 'home', icon: 'fas fa-home', labelKey: 'nav_home' },
        { page: 'catalog', icon: 'fas fa-bars', labelKey: 'nav_catalog' },
        { page: 'favorites', icon: 'far fa-heart', labelKey: 'nav_favorites' },
        { page: 'cart', icon: 'fas fa-shopping-cart', labelKey: 'nav_cart' },
        { page: 'profile', icon: 'fas fa-user', labelKey: 'nav_profile' }
    ];

    navbar.innerHTML = navItems.map(item => `
        <button data-page="${item.page}" class="${pageName === item.page ? 'active' : ''}">
            <span class="nav-icon">
                <i class="${item.icon}"></i>
                ${item.page === 'cart' ? '<span class="nav-cart-badge" id="nav-cart-badge"></span>' : ''}
            </span>
            <span class="nav-label">${t(item.labelKey)}</span>
        </button>
    `).join('');
}

export function initCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.slide');
    if (slides.length === 0) {
        carousel.style.display = 'none';
        return;
    }

    let currentSlide = 0;
    
    // Har 4 sekundda keyingi bannerga scroll
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        const slide = slides[currentSlide];
        if (slide) {
            carousel.scrollTo({
                left: slide.offsetLeft - 16,
                behavior: 'smooth'
            });
        }
    }, 4000);
}

export function openRegisterModal() {
    // O'ZGARTIRILDI: Ma'lumotlar endi state'dan olinadi
    const guestUser = getGuestTelegramUser();
    const firstName = guestUser?.first_name || '';
    const lastName = guestUser?.last_name || '';
    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="modal-content register-modal">
        <h3>${t('fill_profile_title')}</h3>
        <div class="floating-input">
            <input type="text" id="regFirstName" value="${firstName}" placeholder=" " required>
            <label for="regFirstName">${t('first_name_label')}</label>
        </div>
        <div class="floating-input">
            <input type="text" id="regLastName" value="${lastName}" placeholder=" ">
            <label for="regLastName">${t('last_name_label')}</label>
        </div>
        <div class="phone-floating-input">
            <label for="regPhone">${t('phone_label')}</label>
            <div class="phone-input-wrapper">
          <span class="country-code">🇺🇿 +998</span>
                <span class="divider">|</span>
          <input type="tel" id="regPhone" placeholder="${t('phone_placeholder')}" required>
            </div>
        </div>
        <button id="register-submit-btn">${t('save_button')}</button>
        <button id="register-cancel-btn">${t('cancel_button')}</button>
      </div>
    `;
}

export function closeRegisterModal() {
    modal.classList.add('hidden');
    modal.innerHTML = '';
}

// YANGI: Savatga qo'shish modali - User screenshot style
export function openCartModal(productId) {
    // CRITICAL FIX: Close any existing modal first
    closeCartModal();
    
    const product = getProductById(productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    const safeImage = escapeHtml(product.image) || 'https://via.placeholder.com/150';
    const safeName = escapeHtml(product.name);
    const displayPrice = product.sale_price && product.price > product.sale_price 
        ? product.sale_price 
        : product.price;
    
    // CRITICAL: Modal counter savatdagi quantity bilan bir xil bo'lishi kerak
    const cartItems = getCartItems();
    const existingCartItem = cartItems.find(item => item.product_id === productId);
    const initialQuantity = existingCartItem ? existingCartItem.quantity : 1;
    
    // CRITICAL: Agar tovar savatda bo'lmasa, default 1 qiymat bilan avtomatik qo'shish
    if (!existingCartItem && state.isRegistered()) {
        // Modal ochilganda default 1 qiymat avtomatik savatga qo'shiladi
        // Bu async, lekin modal ochilishi kutmaydi
        api.addToCartAPI(productId, 1).then(() => {
            const updatedCartData = api.getCartItems();
            updatedCartData.then(cartData => {
                state.setCartItems(cartData.items);
                state.setCartSummary(cartData.summary);
                updateCartBadges();
            });
        }).catch(err => {
            console.error('Auto add to cart error:', err);
        });
    }
    
    // CRITICAL FIX: Yangi modal dizayn - rasmdagidek
    // Modal navbar tugagan joydan boshlanadi, 3x4 rasm, yonida nom, pastda "Savatga" tugmasi va counter
    const modalHtml = `
      <div class="cart-modal active" id="cart-modal">
        <div class="cart-modal-top">
          <img src="${safeImage}" alt="${safeName}" class="cart-modal-image">
          <div class="cart-modal-info">
            <h3 class="cart-modal-name">${safeName}</h3>
          </div>
        </div>
        <div class="cart-modal-bottom">
          <button class="cart-modal-cart-btn" data-id="${productId}">
            Savatga
          </button>
          <div class="cart-modal-quantity">
            <button class="cart-modal-qty-btn" data-id="${productId}" data-change="-1">−</button>
            <span class="cart-modal-qty-value" id="qty-value-${productId}">${initialQuantity}</span>
            <button class="cart-modal-qty-btn" data-id="${productId}" data-change="1">+</button>
          </div>
        </div>
      </div>
    `;
    
    const overlayHtml = `<div class="cart-modal-overlay active" id="cart-modal-overlay"></div>`;
    
    // Body ga qo'shish - Overlay birinchi (navbar ostida), keyin modal (navbar ustida)
    console.log('📝 Inserting modal HTML');
    document.body.insertAdjacentHTML('beforeend', overlayHtml);
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('✅ Modal HTML inserted');
    
    // CRITICAL: Navbar pozitsiyasini yangilash (modal ochilganda)
    // Bu modalni navbar tepasida to'g'ri ko'rsatish uchun zarur
    // setTimeout ishlatamiz - DOM yangilanishini kafolatlaydi
    setTimeout(() => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            const navbarTop = navbar.offsetTop;
            const navbarHeight = navbar.offsetHeight;
            // Update CSS custom property
            document.documentElement.style.setProperty('--navbar-top', `${navbarTop}px`);
            document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);
            console.log('✅ Navbar position updated for modal:', { navbarTop, navbarHeight });
        }
    }, 50);
}

export function closeCartModal() {
    // Modal'ni olib tashlash
    const overlay = document.getElementById('cart-modal-overlay');
    const modal = document.getElementById('cart-modal');
    
    if (overlay) overlay.remove();
    if (modal) modal.remove();
}

// Cart badge'larni yangilash funksiyasi - REAL-TIME, DOIMIY KO'RINISH
export function updateCartBadges() {
    const cartItems = getCartItems();
    
    // Har bir product ID uchun umumiy quantity hisoblash
    const productQuantities = {};
    let totalItems = 0;
    
    cartItems.forEach(item => {
        const productId = item.product_id;
        const quantity = item.quantity || 1;
        
        if (!productQuantities[productId]) {
            productQuantities[productId] = 0;
        }
        productQuantities[productId] += quantity;
        totalItems += quantity;
    });
    
    // Barcha product badge'larni yangilash (real-time, doimiy ko'rinish)
    document.querySelectorAll('.cart-badge').forEach(badge => {
        const productId = badge.id.replace('cart-badge-', '');
        const quantity = productQuantities[productId] || 0;
        
        if (quantity > 0) {
            badge.textContent = quantity > 99 ? '99+' : quantity.toString();
        } else {
            badge.textContent = '';
        }
    });
    
    // Navbar savat iconida umumiy tovarlar soni (real-time, doimiy ko'rinish)
    const navCartBadge = document.getElementById('nav-cart-badge');
    if (navCartBadge) {
        if (totalItems > 0) {
            navCartBadge.textContent = totalItems > 99 ? '99+' : totalItems.toString();
        } else {
            navCartBadge.textContent = '';
        }
    }
}