import { getLang, getUser, isRegistered as isUserRegistered, getProducts, getCart, getProductById, isFavorite, getOrders, getBanners, getGuestTelegramUser, getFavorites } from './state.js'; // getGuestTelegramUser import qilindi
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
        first_name_placeholder: "Ism",
        last_name_placeholder: "Familiya",
        phone_label: "Telefon raqam",
        phone_placeholder: "90 123 45 67",
        save_button: "Saqlash",
        cancel_button: "Bekor qilish",
        nav_home: "🏠",
        nav_catalog: "🛍️",
        nav_favorites: "❤️",
        nav_cart: "🛒",
        nav_profile: "👤",
        profile_title: "👤 Profilim",
        profile_info: "Shaxsiy ma'lumotlar",
        profile_language: "Ilova tili",
        edit_button: "Tahrirlash",
        please_fill_fields: "Iltimos, ism va 9 xonali telefon raqamini to'ldiring.",
        profile_saved: "✅ Profilingiz muvaffaqiyatli saqlandi!",
        error_saving: "Saqlashda xatolik",
        page_not_ready: "{pageName} sahifasi hali tayyor emas.",
        favorites_title: "❤️ Sevimlilar",
        favorites_empty: "Sizda sevimlilar ro'yxati bo'sh.",
        confirm_order: "Buyurtmani tasdiqlash",
        my_orders: "Buyurtmalarim",
        current_orders: "Hozirgi",
        all_orders: "Barchasi",
        order_number: "Buyurtma №",
        order_status: "Holati",
        order_items_count: "Mahsulotlar soni",
        order_total: "Umumiy summa",
        order_details_not_ready: "Buyurtma #{order_number} tafsilotlari hali tayyor emas.",
        no_orders_yet: "Sizda hali buyurtmalar yo'q.",
        cart_title: "🛒 Savatcha",
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
        first_name_placeholder: "Имя",
        last_name_placeholder: "Фамилия",
        phone_label: "Номер телефона",
        phone_placeholder: "90 123 45 67",
        save_button: "Сохранить",
        cancel_button: "Отмена",
        nav_home: "🏠",
        nav_catalog: "🛍️",
        nav_favorites: "❤️",
        nav_cart: "🛒",
        nav_profile: "👤",
        profile_title: "👤 Мой профиль",
        profile_info: "Личные данные",
        profile_language: "Язык приложения",
        edit_button: "Редактировать",
        please_fill_fields: "Пожалуйста, введите имя и 9-значный номер телефона.",
        profile_saved: "✅ Ваш профиль успешно сохранен!",
        error_saving: "Ошибка сохранения",
        page_not_ready: "Страница {pageName} еще не готова.",
        favorites_title: "❤️ Избранное",
        favorites_empty: "Ваш список избранного пуст.",
        confirm_order: "Подтвердить заказ",
        my_orders: "Мои заказы",
        current_orders: "Текущие",
        all_orders: "Все",
        order_number: "Заказ №",
        order_status: "Статус",
        order_items_count: "Кол-во товаров",
        order_total: "Итоговая сумма",
        order_details_not_ready: "Детали заказа №{order_number} еще не готовы.",
        no_orders_yet: "У вас еще нет заказов.",
        cart_title: "🛒 Корзина",
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
    const displayName = isUserRegistered() ? (user.first_name || window.Telegram.WebApp.initDataUnsafe?.user?.first_name) : t('guest');

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

        return `
          <div class="product-card" data-id="${p.id}">
            <div class="product-card-image-wrapper">
              <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
              <div class="like-btn ${isFavorite(p.id) ? 'liked' : ''}" data-id="${p.id}">${isFavorite(p.id) ? '❤️' : '♡'}</div>
              ${hasSale ? `<div class="sale-badge">-${salePercentage}%</div>` : ''}
            </div>
            <div class="product-card-info">
              <h4>${p.name}</h4>
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
    const { first_name = '', last_name = '', phone = '', username } = user;
    const number = phone.startsWith('+998') ? phone.slice(4) : phone;

    return `
    <div class="profile-page">
        <h2>${t('profile_title')}</h2>
        <div class="profile-section">
            <h3>${t('profile_info')}</h3>
            <form id="profile-form" class="disabled">
                <div class="form-group"><label for="firstName">${t('first_name_placeholder')}</label><input type="text" id="firstName" value="${first_name}" disabled></div>
                <div class="form-group"><label for="lastName">${t('last_name_placeholder')}</label><input type="text" id="lastName" value="${last_name || ''}" disabled></div>
                <div class="form-group">
                    <label for="phone">${t('phone_label')}</label>
                    <div class="phone-input">
                        <span class="country-code">🇺🇿 +998</span>
                        <input type="tel" id="phone" value="${number}" placeholder="${t('phone_placeholder')}" disabled>
                    </div>
                </div>
                <div class="form-group"><label>Telegram username</label><input type="text" value="${username ? '@' + username : '-'}" disabled></div>
                <button type="button" id="edit-profile-btn">${t('edit_button')}</button>
            </form>
        </div>
        <div class="profile-section">
            <h3>${t('profile_language')}</h3>
            <div class="lang-switcher">
                <button id="lang-uz-btn" class="${getLang() === 'uz' ? 'active' : ''}">O'zbekcha</button>
                <button id="lang-ru-btn" class="${getLang() === 'ru' ? 'active' : ''}">Русский</button>
            </div>
        </div>
        <div class="profile-section">
            <h3>${t('my_orders')}</h3>
            <div class="tabs">
                <button class="tab-button active" data-tab="current">${t('current_orders')}</button>
                <button class="tab-button" data-tab="all">${t('all_orders')}</button>
            </div>
            <div id="orders-list"><p>${t('loading')}</p></div>
        </div>
    </div>`;
}

export function renderOrders(filter = 'current') {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    const allOrders = getOrders();
    const filteredOrders = filter === 'current'
        ? allOrders.filter(o => !['completed', 'cancelled'].includes(o.status))
        : allOrders;

    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `<p>${t('no_orders_yet')}</p>`;
        return;
    }

    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card" data-id="${order.id}">
            <h4>${t('order_number')} ${order.id}</h4>
            <p><strong>${t('order_status')}:</strong> ${order.status}</p>
            <p><strong>${t('order_items_count')}:</strong> ${order.items.length}</p>
            <p><strong>${t('order_total')}:</strong> ${order.total_price} so'm</p>
        </div>
    `).join('');
}

function getCartContent() {
    const cart = getCart();
    const productIds = Object.keys(cart);

    if (productIds.length === 0) {
        return `<h2>${t('cart_title')}</h2><p>${t('cart_empty')}</p>`;
    }

    let totalPrice = 0;
    const itemsHtml = productIds.map(id => {
        const product = getProductById(parseInt(id));
        if (!product) return '';
        const quantity = cart[id];
        totalPrice += product.sale_price * quantity;
        return `
            <div class="cart-item" data-id="${id}">
                <img src="${product.image || 'https://via.placeholder.com/80'}" alt="${product.name}">
                <div class="item-details">
                    <h4>${product.name}</h4>
                    <p>${product.display_price} so'm</p>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn" data-id="${id}" data-change="-1">-</button>
                    <span>${quantity}</span>
                    <button class="quantity-btn" data-id="${id}" data-change="1">+</button>
                </div>
                <div class="item-total">${(product.sale_price * quantity).toLocaleString()} so'm</div>
            </div>
        `;
    }).join('');

    return `
        <h2>${t('cart_title')}</h2>
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
    `;
}

function getFavoritesContent() {
    const favorites = getFavorites();
    if (favorites.length === 0) {
        return `<h2>${t('favorites_title')}</h2><p>${t('favorites_empty')}</p>`;
    }
    const products = getProducts();
    const favoriteProducts = products.filter(p => favorites.includes(p.id));

    return `
        <h2>${t('favorites_title')}</h2>
        <div class="products-grid" id="products">
            ${favoriteProducts.map(p => `
              <div class="product-card" data-id="${p.id}">
                <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
                <div class="like-btn liked" data-id="${p.id}">❤️</div>
                <h4>${p.name}</h4>
                <p><span class="price">${p.display_price} so'm</span></p>
                <button class="add-to-cart-btn" data-id="${p.id}">${t('nav_cart')}</button>
              </div>
            `).join('')}
        </div>
    `;
}

export function updateNavbar(pageName) {
    document.querySelectorAll('.navbar button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageName);
    });
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
    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${t('fill_profile_title')}</h3>
        <input type="text" id="regFirstName" placeholder="${t('first_name_placeholder')}" value="${guestUser?.first_name || ''}" required>
        <input type="text" id="regLastName" placeholder="${t('last_name_placeholder')}" value="${guestUser?.last_name || ''}">
        <div class="phone-input">
          <span class="country-code">🇺🇿 +998</span>
          <input type="tel" id="regPhone" placeholder="${t('phone_placeholder')}" required>
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

export function toggleProfileEdit(isEditing) {
    const form = document.getElementById('profile-form');
    const button = document.getElementById('edit-profile-btn');
    form.classList.toggle('disabled', !isEditing);
    form.querySelectorAll('input').forEach(el => {
        if (!el.value.startsWith('@')) el.disabled = !isEditing;
    });
    button.textContent = isEditing ? t('save_button') : t('edit_button');
}