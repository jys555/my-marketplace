import { getLang, getUser, isRegistered as isUserRegistered, getProducts, getCart, getProductById, isFavorite, getOrders, getBanners, getGuestTelegramUser, getFavorites } from './state.js';

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
        guest: "Mehmon",
        home_greeting: "Salom, <strong>{name}</strong>!",
        search_placeholder: "Mahsulotlarni qidirish...",
        pickup_location: "Buyerdan olib ketish mumkin",
        popular_products: "🔥 Mashhur tovarlar",
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
        nav_home: "Bosh sahifa",
        nav_catalog: "Katalog",
        nav_favorites: "Sevimlilar",
        nav_cart: "Savat",
        nav_profile: "Profil",
        // Profil sahifasi
        profile_title: "Profil",
        profile_info: "Shaxsiy ma'lumotlar",
        profile_language: "Ilova tili",
        edit_button: "Tahrirlash",
        please_fill_fields: "Iltimos, ism va 9 xonali telefon raqamini to'ldiring.",
        profile_saved: "✅ Profilingiz muvaffaqiyatli saqlandi!",
        error_saving: "Saqlashda xatolik",
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
        added_to_cart: "{name} savatchaga qo'shildi"
    },
    ru: {
        loading: "Загрузка данных...",
        error_telegram: "⚠️ Откройте приложение внутри Telegram.",
        error_server: "⚠️ Ошибка соединения с сервером.",
        guest: "Гость",
        home_greeting: "Привет, <strong>{name}</strong>!",
        search_placeholder: "Поиск продуктов...",
        pickup_location: "Доступен самовывоз",
        popular_products: "🔥 Популярные товары",
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
        nav_home: "Главная",
        nav_catalog: "Каталог",
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
        added_to_cart: "{name} добавлен в корзину"
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
    let content = '';
    switch (pageName) {
        case 'home':
            content = getHomeContent();
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
    attachEventListeners(pageName); // Event listener'larni bog'lash
}

function getHomeContent() {
    const user = getUser();
    const rawName = isUserRegistered() ? (user.first_name || window.Telegram.WebApp.initDataUnsafe?.user?.first_name) : t('guest');
    const displayName = escapeHtml(rawName);

    // QO'SHILDI: Bannerlarni state'dan olish
    const banners = getBanners();

    // O'ZGARTIRILDI: Bannerlar mavjud bo'lsa, dinamik karusel yaratish
    const carouselHtml = banners && banners.length > 0 ? `
      <div class="carousel" id="carousel">
        ${banners.map((banner, index) => `
          <a href="${banner.link_url || '#'}" class="slide ${index === 0 ? 'active' : ''}">
            <img src="${banner.image_url}" alt="${banner.title || 'Banner'}">
          </a>
        `).join('')}
      </div>
    ` : '';

    return `
      <header class="header">
        <div class="logo">🛒 Amazing Store</div>
        <div class="user-greeting">${t('home_greeting', { name: displayName })}</div>
        <input type="text" placeholder="${t('search_placeholder')}" ${isUserRegistered() ? '' : 'disabled'}>
        <button id="location-btn">${t('pickup_location')}</button>
      </header>
      ${carouselHtml}
      <h3>${t('popular_products')}</h3>
      <div class="products-grid" id="products"></div>
    `;
}

export function renderProducts() {
    const productsContainer = document.getElementById('products');
    if (!productsContainer) return;

    const products = getProducts();
    if (products.length === 0) {
        productsContainer.innerHTML = `<p>${t('no_products_yet')}</p>`;
        return;
    }

    productsContainer.innerHTML = products.map(p => {
        const hasSale = p.sale_price && p.price > p.sale_price;
        const salePercentage = hasSale ? Math.round(((p.price - p.sale_price) / p.price) * 100) : 0;
        const safeName = escapeHtml(p.name);
        const safeImage = escapeHtml(p.image) || 'https://via.placeholder.com/150';

        return `
          <div class="product-card" data-id="${p.id}">
            <div class="product-card-image-wrapper">
              <img src="${safeImage}" alt="${safeName}">
              <div class="like-btn ${isFavorite(p.id) ? 'liked' : ''}" data-id="${p.id}">${isFavorite(p.id) ? '❤️' : '♡'}</div>
              ${hasSale ? `<div class="sale-badge">-${salePercentage}%</div>` : ''}
            </div>
            <div class="product-card-info">
              <h4>${safeName}</h4>
              <div class="product-card-footer">
                <p class="price-container">
                  <span class="price">${p.display_price} so'm</span>
                  ${hasSale ? `<span class="old-price">${p.price.toLocaleString()} so'm</span>` : ''}
                </p>
                <button class="add-to-cart-btn" data-id="${p.id}">🛒</button>
              </div>
            </div>
          </div>
        `;
    }).join('');
}

function getProfileContent() {
    const user = getUser() || {};
    const { first_name = 'Guest', last_name = '', phone = '' } = user;
    const displayName = escapeHtml(`${first_name} ${last_name}`.trim());
    const displayPhone = phone ? `+${phone.replace(/\D/g, '')}` : '';

    const header = `
        <div class="page-header fixed-header" id="profile-header">
            <button id="profile-header-back-btn" class="back-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
            <h2 id="profile-header-title" class="page-title">${t('profile_title')}</h2>
            <div class="header-spacer"></div>
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

function getCartContent() {
    const cart = getCart();
    const productIds = Object.keys(cart);

    const pageHeader = `
        <div class="page-header simple-header">
            <h2 class="page-title">${t('cart_title')}</h2>
        </div>
    `;

    if (productIds.length === 0) {
        return `${pageHeader}<div class="empty-state"><p>${t('cart_empty')}</p></div>`;
    }

    let totalPrice = 0;
    const itemsHtml = productIds.map(id => {
        const product = getProductById(parseInt(id));
        if (!product) return '';
        const quantity = cart[id];
        const itemPrice = product.display_price || product.sale_price || product.price;
        totalPrice += itemPrice * quantity;
        return `
            <div class="cart-item" data-id="${id}">
                <img src="${product.image || 'https://via.placeholder.com/80'}" alt="${product.name}">
                <div class="item-details">
                    <h4>${product.name}</h4>
                    <p>${Number(itemPrice).toLocaleString()} so'm</p>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn" data-id="${id}" data-change="-1">-</button>
                    <span>${quantity}</span>
                    <button class="quantity-btn" data-id="${id}" data-change="1">+</button>
                </div>
                <div class="item-total">${(itemPrice * quantity).toLocaleString()} so'm</div>
            </div>
        `;
    }).join('');

    return `
        ${pageHeader}
        <div class="page-content">
            <div id="cart-items">${itemsHtml}</div>
            <div class="cart-summary">
                <h3>${t('total_price')}: ${totalPrice.toLocaleString()} so'm</h3>
                <div class="checkout-options">
                    <h4>${t('payment_method')}</h4>
                    <label><input type="radio" name="payment" value="cash" checked> ${t('cash')}</label>
                    <h4>${t('delivery_method')}</h4>
                    <label><input type="radio" name="delivery" value="pickup" checked> ${t('pickup')}</label>
                </div>
                <button id="confirm-order-btn">${t('confirm_order')}</button>
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
    const favoriteProducts = products.filter(p => favorites.includes(p.id));

    return `
        ${pageHeader}
        <div class="page-content">
            <div class="products-grid" id="products">
                ${favoriteProducts.map(p => {
                    const safeName = escapeHtml(p.name);
                    const safeImage = escapeHtml(p.image) || 'https://via.placeholder.com/150';
                    return `
                      <div class="product-card" data-id="${p.id}">
                        <div class="product-card-image-wrapper">
                          <img src="${safeImage}" alt="${safeName}">
                          <div class="like-btn liked" data-id="${p.id}">❤️</div>
                        </div>
                        <div class="product-card-info">
                          <h4>${safeName}</h4>
                          <div class="product-card-footer">
                            <p class="price-container">
                              <span class="price">${p.display_price} so'm</span>
                            </p>
                            <button class="add-to-cart-btn" data-id="${p.id}">🛒</button>
                          </div>
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

export function showProfileSection(sectionName) {
    const backBtn = document.getElementById('profile-header-back-btn');
    const title = document.getElementById('profile-header-title');
    const menu = document.getElementById('profile-menu');
    const editSection = document.getElementById('profile-edit-section');
    const ordersSection = document.getElementById('orders-section');
    
    const sections = [menu, editSection, ordersSection];
    sections.forEach(s => s?.classList.add('hidden'));

    // Back tugmasi har doim ko'rinadi
    backBtn?.classList.remove('hidden');
    
    if (sectionName === 'menu') {
        menu?.classList.remove('hidden');
        if (title) title.innerText = t('profile_title');
        // Asosiy menyuda back tugmasi boshqa sahifaga qaytaradi
        backBtn.dataset.action = 'navigate-home';
    } else {
        // Ichki sahifalarda back tugmasi menyuga qaytaradi
        backBtn.dataset.action = 'navigate-menu';
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
        { page: 'home', icon: 'home', label: t('nav_home') },
        { page: 'catalog', icon: 'catalog', label: t('nav_catalog') },
        { page: 'cart', icon: 'cart', label: t('nav_cart') },
        { page: 'favorites', icon: 'favorites', label: t('nav_favorites') },
        { page: 'profile', icon: 'profile', label: t('nav_profile') }
    ];

    const icons = {
        home: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
        catalog: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
        cart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
        favorites: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
        profile: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    };

    navbar.innerHTML = navItems.map(item => `
        <button data-page="${item.page}" class="${pageName === item.page ? 'active' : ''}">
            <span class="nav-icon">${icons[item.icon]}</span>
            <span class="nav-label">${item.label}</span>
        </button>
    `).join('');
}

export function initCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    let currentSlide = 0;
    const slides = carousel.querySelectorAll('.slide');

    if (slides.length === 0) {
        carousel.style.display = 'none'; // Karusel blokini yashirish
        return;
    }

    const update = () => {
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === currentSlide) {
                slide.classList.add('active');
            }
            // Transform usuli o'rniga opacity bilan almashtirish silliqroq bo'lishi mumkin
            slide.style.opacity = index === currentSlide ? '1' : '0';
        });
    };

    const autoSlide = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        update();
    }, 4000);

    update();
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