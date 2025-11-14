// Backend URL (Railway)
const backendUrl = 'https://my-marketplace-production.up.railway.app';

// Telegram foydalanuvchisi
const WebApp = window.Telegram.WebApp;
WebApp.ready(); // Telegram Web App tayyor ekanligini bildirish
const user = WebApp.initDataUnsafe?.user;
let isRegistered = false;
let currentUserData = {}; // Foydalanuvchi ma'lumotlarini saqlash uchun

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
    product_details_not_ready: "Tovar #{id} tafsiloti hali tayyor emas.",
    added_to_favorites: "Tovar #{id} sevimlilarga qo'shildi.",
    fill_profile_title: "Profilingizni to'ldiring",
    first_name_placeholder: "Ism",
    last_name_placeholder: "Familiya",
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
    product_details_not_ready: "Информация о товаре #{id} еще не готова.",
    added_to_favorites: "Товар #{id} добавлен в избранное.",
    fill_profile_title: "Заполните свой профиль",
    first_name_placeholder: "Имя",
    last_name_placeholder: "Фамилия",
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

let currentLang = getLanguage();
let allProducts = []; // Barcha mahsulotlarni saqlash uchun
let cart = {}; // Savatcha: { product_id: quantity }

function getLanguage() {
  return localStorage.getItem('userLang') || 'uz';
}

function setLanguage(lang) {
  if (['uz', 'ru'].includes(lang)) {
    currentLang = lang;
    localStorage.setItem('userLang', lang);
    document.documentElement.lang = lang;
    rerenderCurrentPage();
  }
}

function t(key, params = {}) {
  let text = translations[currentLang][key] || key;
  for (const param in params) {
    text = text.replace(`{${param}}`, params[param]);
  }
  return text;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!user) {
    document.getElementById('loading').innerText = t('error_telegram');
  } else {
    WebApp.onEvent('mainButtonClicked', handleMainButtonClick);
    checkRegistration();
  }
});

async function checkRegistration() {
  try {
    const res = await fetch(`${backendUrl}/api/users/check/${user.id}`);
    if (!res.ok) throw new Error('Server check failed');
    const data = await res.json();
    isRegistered = data.exists;
    if (isRegistered) {
        const userRes = await fetch(`${backendUrl}/api/users/${user.id}`);
        currentUserData = await userRes.json();

        // Foydalanuvchi Telegramda username'ni o'zgartirganini tekshirish
        if (user.username && currentUserData.username !== user.username) {
            // Serverdagi ma'lumotni yangilash
            const updateRes = await fetch(`${backendUrl}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: user.id,
                    username: user.username,
                    // Mavjud ma'lumotlarni o'zgarishsiz qoldirish uchun qayta yuboramiz
                    first_name: currentUserData.first_name,
                    last_name: currentUserData.last_name,
                    phone: currentUserData.phone
                })
            });
            if (updateRes.ok) {
                currentUserData = await updateRes.json(); // Yangilangan ma'lumotni olish
            }
        }
    }
    rerenderCurrentPage();
  } catch (err) {
    console.error("Xatolik:", err);
    document.getElementById('loading').innerText = t('error_server');
  }
}

function rerenderCurrentPage() {
    const activeBtn = document.querySelector('.navbar button.active');
    let page = 'home';
    if (activeBtn) {
        const pageName = activeBtn.getAttribute('onclick').match(/showPage\('(\w+)'\)/);
        if (pageName && pageName[1]) {
            page = pageName[1];
        }
    }
    showPage(page);
}

function showPage(pageName) {
  const protectedPages = ['profile', 'favorites', 'cart'];
  if (protectedPages.includes(pageName) && !isRegistered) {
    requireRegistration(() => showPage(pageName));
    return;
  }

  document.getElementById('loading').classList.add('hidden');
  const main = document.getElementById('main');
  main.classList.remove('hidden');
  const navbar = document.getElementById('navbar');
  navbar.classList.remove('hidden');
  
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
    default:
      content = `<h2>${t('page_not_ready', { pageName })}</h2>`;
  }
  main.innerHTML = content;

  if (pageName === 'home') {
    initCarousel();
    loadProducts();
    document.getElementById('location')?.addEventListener('click', () => {
      WebApp.openTelegramLink('https://t.me/uzrailway_bot');
    });
  } else if (pageName === 'profile') {
      document.getElementById('edit-profile-btn')?.addEventListener('click', toggleProfileEdit);
      document.getElementById('lang-uz-btn')?.addEventListener('click', () => setLanguage('uz'));
      document.getElementById('lang-ru-btn')?.addEventListener('click', () => setLanguage('ru'));
      loadOrders();
  }

  updateNavbar(pageName);
}

function updateNavbar(pageName) {
    document.querySelectorAll('.navbar button').forEach(btn => btn.classList.remove('active'));
    const activeBtn = [...document.querySelectorAll('.navbar button')].find(btn =>
        btn.getAttribute('onclick')?.includes(`showPage('${pageName}')`)
    );
    activeBtn?.classList.add('active');
}

function getHomeContent() {
  const displayName = isRegistered ? (currentUserData.first_name || user.first_name) : t('guest');
  return `
    <header class="header">
      <div class="logo">🛒 Amazing Store</div>
      <div class="user-greeting">${t('home_greeting', { name: displayName })}</div>
      <input type="text" placeholder="${t('search_placeholder')}" ${isRegistered ? '' : 'disabled'}>
      <button id="location">${t('pickup_location')}</button>
    </header>
    <div class="carousel" id="carousel">
      <img src="https://via.placeholder.com/375x150/4a90e2/ffffff?text=Banner+1" class="slide active">
      <img src="https://via.placeholder.com/375x150/50c878/ffffff?text=Banner+2" class="slide">
      <img src="https://via.placeholder.com/375x150/ff6f61/ffffff?text=Banner+3" class="slide">
    </div>
    <h3>${t('popular_products')}</h3>
    <div class="products-grid" id="products"></div>
  `;
}

function getProfileContent() {
    const { first_name = '', last_name = '', phone = '', username } = currentUserData;
    const number = phone.startsWith('+998') ? phone.slice(4) : phone;

    return `
    <div class="profile-page">
        <h2>${t('profile_title')}</h2>
        
        <div class="profile-section">
            <h3>${t('profile_info')}</h3>
            <form id="profile-form" class="disabled">
                <div class="form-group">
                    <label for="firstName">${t('first_name_placeholder')}</label>
                    <input type="text" id="firstName" value="${first_name}" disabled>
                </div>
                <div class="form-group">
                    <label for="lastName">${t('last_name_placeholder')}</label>
                    <input type="text" id="lastName" value="${last_name || ''}" disabled>
                </div>
                <div class="form-group">
                    <label for="phone">${t('phone_placeholder')}</label>
                    <div class="phone-input">
                        <span class="country-code">🇺🇿 +998</span>
                        <input type="tel" id="phone" value="${number}" placeholder="${t('phone_placeholder')}" disabled>
                    </div>
                </div>
                <div class="form-group">
                    <label>Telegram username</label>
                    <input type="text" id="username-display" value="${username ? '@' + username : '-'}" disabled>
                </div>
                <button type="button" id="edit-profile-btn">${t('edit_button')}</button>
            </form>
        </div>

        <div class="profile-section">
            <h3>${t('profile_language')}</h3>
            <div class="lang-switcher">
                <button id="lang-uz-btn" class="${currentLang === 'uz' ? 'active' : ''}">O'zbekcha</button>
                <button id="lang-ru-btn" class="${currentLang === 'ru' ? 'active' : ''}">Русский</button>
            </div>
        </div>

        <div class="profile-section">
            <h3>${t('my_orders')}</h3>
            <div class="tabs">
                <button class="tab-button active" onclick="renderOrders('current')">${t('current_orders')}</button>
                <button class="tab-button" onclick="renderOrders('all')">${t('all_orders')}</button>
            </div>
            <div id="orders-list">
                <p>${t('loading')}</p>
            </div>
        </div>
    </div>
    `;
}

function toggleProfileEdit(event) {
    const form = document.getElementById('profile-form');
    const isEditing = !form.classList.contains('disabled');
    const button = event.target;

    if (isEditing) {
        saveProfile();
    } else {
        form.classList.remove('disabled');
        form.querySelectorAll('input, select').forEach(el => {
            if (el.id !== 'username-display') { // username maydonini ochmaslik
                el.disabled = false;
            }
        });
        button.textContent = t('save_button');
    }
}

async function saveProfile() {
    const form = document.getElementById('profile-form');
    const button = document.getElementById('edit-profile-btn');

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim().replace(/\s/g, '');
    
    if (!firstName || phone.length !== 9) {
        WebApp.showAlert(t('please_fill_fields'));
        return;
    }

    const fullPhone = '+998' + phone;

    try {
        const response = await fetch(`${backendUrl}/api/users`, {
            method: 'POST', // Backend PUT/PATCHni qo'llab-quvvatlasa, shuni ishlatgan ma'qul
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: user.id,
                first_name: firstName,
                last_name: lastName,
                phone: fullPhone
            })
        });

        if (response.ok) {
            currentUserData = await response.json();
            isRegistered = true;
            WebApp.showAlert(t('profile_saved'));
            
            form.classList.add('disabled');
            form.querySelectorAll('input, select').forEach(el => el.disabled = true);
            button.textContent = t('edit_button');

        } else {
            throw new Error(t('error_saving'));
        }
    } catch (err) {
        WebApp.showAlert(`❌ ${t('error_saving')}: ${err.message}`);
    }
}

function initCarousel() {
  let startX = 0;
  let currentSlide = 0;
  const slides = document.querySelectorAll('.slide');
  if (slides.length === 0) return;

  const updateCarousel = () => {
    slides.forEach((slide, i) => {
      slide.style.transform = `translateX(${(i - currentSlide) * 100}%)`;
    });
  };
  
  const autoSlide = setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
  }, 4000);

  const carousel = document.getElementById('carousel');
  if (!carousel) return;

  carousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    clearInterval(autoSlide);
  });
  carousel.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (diff > 50) {
      currentSlide = (currentSlide + 1) % slides.length;
    } else if (diff < -50) {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    }
    updateCarousel();
  });
  
  updateCarousel();
}

async function loadProducts() {
  const productsContainer = document.getElementById('products');
  if (!productsContainer) return;
  productsContainer.innerHTML = `<p>${t('loading')}</p>`;

  try {
    const res = await fetch(`${backendUrl}/api/products?lang=${currentLang}`);
    const products = await res.json();
    allProducts = products; // Mahsulotlarni saqlab qo'yish
    
    if (products.length === 0) {
        productsContainer.innerHTML = `<p>Hozircha mahsulotlar yo'q.</p>`;
        return;
    }

    const productsHtml = products.map(p => `
      <div class="product-card" onclick="viewProduct(${p.id})">
        <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
        <div class="like-btn" onclick="event.stopPropagation(); toggleLike(${p.id}, this)">♡</div>
        <h4>${p.name}</h4>
        <p>
          <span class="price">${p.display_price} so'm</span>
          ${p.sale_price ? `<span class="old-price">${p.price} so'm</span>` : ''}
        </p>
        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id})">${t('nav_cart')}</button>
      </div>
    `).join('');

    productsContainer.innerHTML = productsHtml;
  } catch (err) {
    console.error(err);
    productsContainer.innerHTML = `<p>${t('products_not_loaded')}</p>`;
  }
}

function requireRegistration(callback) {
  if (isRegistered) {
    callback();
  } else {
    openModal();
    window.pendingAction = callback;
  }
}

function openModal() {
  const modal = document.getElementById('registerModal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${t('fill_profile_title')}</h3>
      <input type="text" id="regFirstName" placeholder="${t('first_name_placeholder')}" value="${user.first_name || ''}" required>
      <input type="text" id="regLastName" placeholder="${t('last_name_placeholder')}" value="${user.last_name || ''}">
      <div class="phone-input">
        <span class="country-code">🇺🇿 +998</span>
        <input type="tel" id="regPhone" placeholder="${t('phone_placeholder')}" required>
      </div>
      <button onclick="registerUser()">${t('save_button')}</button>
      <button onclick="closeModal()">${t('cancel_button')}</button>
    </div>
  `;
}

function closeModal() {
  document.getElementById('registerModal').classList.add('hidden');
}

async function registerUser() {
  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName = document.getElementById('regLastName').value.trim();
  const phone = document.getElementById('regPhone').value.trim().replace(/\s/g, '');

  if (!firstName || phone.length !== 9) {
    WebApp.showAlert(t('please_fill_fields'));
    return;
  }

  const fullPhone = '+998' + phone;

  try {
    const response = await fetch(`${backendUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone: fullPhone,
        username: user.username || null
      })
    });

    if (response.ok) {
      currentUserData = await response.json();
      isRegistered = true;
      closeModal();
      WebApp.showAlert(t('profile_saved'));
      if (window.pendingAction) {
        window.pendingAction();
        delete window.pendingAction;
      }
      rerenderCurrentPage();
    } else {
      throw new Error(t('error_saving'));
    }
  } catch (err) {
    WebApp.showAlert(`❌ ${t('error_saving')}: ${err.message}`);
  }
}

function viewProduct(id) {
  WebApp.showAlert(t('product_details_not_ready', { id }));
}

function toggleLike(id, element) {
    element.classList.toggle('liked');
    element.textContent = element.classList.contains('liked') ? '❤️' : '♡';
}

function addToCart(id) {
    requireRegistration(() => {
        if (cart[id]) {
            cart[id]++;
        } else {
            cart[id] = 1;
        }
        const product = allProducts.find(p => p.id === id);
        WebApp.showPopup({
            title: "✅",
            message: t('added_to_cart', { name: product.name }),
            buttons: [{ type: 'ok' }]
        });
        updateMainButton();
    });
}

let userOrders = []; // Foydalanuvchi buyurtmalarini saqlash uchun

async function loadOrders() {
    const ordersListContainer = document.getElementById('orders-list');
    if (!ordersListContainer) return;
    ordersListContainer.innerHTML = `<p>${t('loading')}</p>`;

    try {
        const res = await fetch(`${backendUrl}/api/orders/${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        userOrders = await res.json();
        renderOrders('current'); // Boshlang'ich tab
    } catch (err) {
        console.error(err);
        ordersListContainer.innerHTML = `<p>${t('error_server')}</p>`;
    }
}

function renderOrders(filter) {
    const ordersListContainer = document.getElementById('orders-list');
    if (!ordersListContainer) return;

    document.querySelectorAll('.tabs .tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tabs .tab-button[onclick="renderOrders('${filter}')"]`).classList.add('active');

    const finishedStatuses = ['xaridorga berilgan', 'bekor qilingan'];
    const ordersToRender = filter === 'current'
        ? userOrders.filter(order => !finishedStatuses.includes(order.status))
        : userOrders;

    if (ordersToRender.length === 0) {
        ordersListContainer.innerHTML = `<p>${t('no_orders_yet')}</p>`;
        return;
    }

    ordersListContainer.innerHTML = ordersToRender.map(order => `
        <div class="order-card" onclick="viewOrderDetails('${order.order_number}')">
            <div class="order-header">
                <span class="order-number">${t('order_number')} ${order.order_number}</span>
                <span class="order-status status-${order.status.replace('\'', '')}">${order.status}</span>
            </div>
            <div class="order-body">
                <span>${t('order_items_count')}: ${order.item_count}</span>
                <span>${t('order_total')}: ${new Intl.NumberFormat('uz-UZ').format(order.total_amount)} so'm</span>
            </div>
            <div class="order-footer">
                <span>${new Date(order.created_at).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

function viewOrderDetails(orderNumber) {
    WebApp.showAlert(t('order_details_not_ready', { order_number: orderNumber }));
}

function getCartContent() {
    if (Object.keys(cart).length === 0) {
        return `<h2>${t('cart_title')}</h2><p>${t('cart_empty')}</p>`;
    }

    let total = 0;
    const cartItemsHtml = Object.entries(cart).map(([id, quantity]) => {
        const product = allProducts.find(p => p.id == id);
        if (!product) return '';
        const price = parseFloat(product.sale_price || product.price);
        total += price * quantity;
        return `
            <div class="cart-item">
                <img src="${product.image || 'https://via.placeholder.com/80'}" alt="${product.name}">
                <div class="item-details">
                    <h4>${product.name}</h4>
                    <p>${new Intl.NumberFormat('uz-UZ').format(price)} so'm</p>
                </div>
                <div class="item-quantity">
                    <button onclick="updateCartItemQuantity(${id}, -1)">-</button>
                    <span>${quantity}</span>
                    <button onclick="updateCartItemQuantity(${id}, 1)">+</button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <h2>${t('cart_title')}</h2>
        <div id="cart-items">${cartItemsHtml}</div>
        <div class="cart-summary">
            <h3>${t('total_price')}: ${new Intl.NumberFormat('uz-UZ').format(total)} so'm</h3>
            <div class="order-options">
                <div class="form-group">
                    <label for="paymentMethod">${t('payment_method')}</label>
                    <select id="paymentMethod">
                        <option value="cash">${t('cash')}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="deliveryMethod">${t('delivery_method')}</label>
                    <select id="deliveryMethod">
                        <option value="pickup">${t('pickup')}</option>
                        <option value="delivery">${t('delivery')}</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

function updateCartItemQuantity(id, change) {
    if (cart[id]) {
        cart[id] += change;
        if (cart[id] <= 0) {
            delete cart[id];
        }
    }
    rerenderCurrentPage();
    updateMainButton();
}

function updateMainButton() {
    if (Object.keys(cart).length > 0) {
        let total = 0;
        let itemCount = 0;
        Object.entries(cart).forEach(([id, quantity]) => {
            const product = allProducts.find(p => p.id == id);
            if (product) {
                total += parseFloat(product.sale_price || product.price) * quantity;
                itemCount += quantity;
            }
        });
        WebApp.MainButton.setText(`${itemCount} ${t('item')} - ${new Intl.NumberFormat('uz-UZ').format(total)} so'm`);
        WebApp.MainButton.setParams({
            text_color: '#ffffff',
            color: '#24a1de'
        });
        WebApp.MainButton.show();
    } else {
        WebApp.MainButton.hide();
    }
}

function handleMainButtonClick() {
    const activeBtn = document.querySelector('.navbar button.active');
    if (activeBtn && activeBtn.getAttribute('onclick').includes('showPage(\'cart\')')) {
        createOrder();
    }
}

async function createOrder() {
    const paymentMethodEl = document.querySelector('input[name="payment-method"]:checked');
    const deliveryMethodEl = document.querySelector('input[name="delivery-method"]:checked');

    if (!paymentMethodEl || !deliveryMethodEl) {
        showAlert(t('choose_payment_delivery'));
        return;
    }

    const orderData = {
        user_id: tg.initDataUnsafe.user.id,
        user_info: tg.initDataUnsafe.user, // <-- QO'SHILGAN QATOR
        items: Object.values(cart).map(item => ({
            product_id: item.product.id,
            quantity: item.quantity
        })),
        payment_method: paymentMethodEl.value,
        delivery_method: deliveryMethodEl.value
    };

    setLoading(true);

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Order creation failed');
        }

        const newOrder = await response.json();
        
        cart = {};
        updateMainButton();
        
        showAlert(`${t('order_created_success')} #${newOrder.order_number}`, 'success');
        
        // Foydalanuvchini profil sahifasiga o'tkazish
        showPage('profile');

    } catch (error) {
        console.error('Error creating order:', error);
        showAlert(error.message, 'error');
    } finally {
        setLoading(false);
    }
}